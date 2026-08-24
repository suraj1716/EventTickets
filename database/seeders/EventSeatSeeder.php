<?php

namespace Database\Seeders;

use App\Models\EventLeg;
use App\Models\EventSeat;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EventSeatSeeder extends Seeder
{
    public function run(): void
    {
        $legs = EventLeg::whereNotNull('venue_id')
            ->with(['venue.sections.seats', 'ticketTiers'])
            ->get();

        foreach ($legs as $eventLeg) {
            $this->seedLeg($eventLeg);
        }
    }

    protected function seedLeg(EventLeg $eventLeg): void
    {
        if (!$eventLeg->venue) {
            $this->command?->warn("Leg {$eventLeg->id}: no venue — skipped.");
            return;
        }

        if ($eventLeg->ticketTiers->isEmpty()) {
            $this->command?->warn("Leg {$eventLeg->id}: no ticket tiers — skipped.");
            return;
        }

        $hasUnavailableSeats = $eventLeg->seats()
            ->where('status', '!=', 'available')
            ->exists();

        if ($hasUnavailableSeats) {
            $this->command?->warn("Leg {$eventLeg->id}: has held/sold seats — skipped.");
            return;
        }

        $venueSeats = $eventLeg->venue->sections
            ->flatMap(fn ($section) => $section->seats)
            ->where('is_active', true);

        if ($venueSeats->isEmpty()) {
            $this->command?->warn("Leg {$eventLeg->id}: venue has no active seats — skipped.");
            return;
        }

        // Round-robin: section 0 -> tier 0, section 1 -> tier 1, wrapping
        // if there are more sections than tiers.
        $tierIds = $eventLeg->ticketTiers->pluck('id')->values();
        $sectionIds = $eventLeg->venue->sections->pluck('id')->values();

        $sectionAssignments = collect();
        foreach ($sectionIds as $i => $sectionId) {
            $sectionAssignments->put($sectionId, $tierIds[$i % $tierIds->count()]);
        }

        DB::transaction(function () use ($eventLeg, $venueSeats, $sectionAssignments) {
            EventSeat::where('event_leg_id', $eventLeg->id)->delete();

            foreach ($venueSeats as $venueSeat) {
                EventSeat::create([
                    'event_leg_id'   => $eventLeg->id,
                    'venue_seat_id'  => $venueSeat->id,
                    'ticket_tier_id' => $sectionAssignments->get($venueSeat->venue_section_id),
                    'row_label'      => $venueSeat->row_label,
                    'seat_number'    => $venueSeat->seat_number,
                    'label'          => $venueSeat->label,
                    'status'         => 'available',
                ]);
            }

            $eventLeg->update(['seating_type' => 'reserved']);
        });

        $priced = $venueSeats->filter(
            fn ($seat) => $sectionAssignments->has($seat->venue_section_id)
        )->count();

        $this->command?->info(
            "Leg {$eventLeg->id} ({$eventLeg->venue->name}): seeded {$venueSeats->count()} seats ({$priced} priced)."
        );
    }
}
