<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventLeg;
use App\Models\EventSeat;
use App\Models\TicketTier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventSeatController extends Controller
{
    public function index(EventLeg $eventLeg)
    {
        $this->authorizeEventLeg($eventLeg);

        return response()->json(
            $eventLeg->seats()
                ->with([
                    'ticketTier',
                    'venueSeat.section',
                ])
                ->orderBy('row_label')
                ->orderBy('seat_number')
                ->get()
        );
    }

    /**
     * Renders the seat-management page: the event leg (with its ticket
     * tiers, for the per-section assignment dropdowns), the venue's
     * seating template (sections + seats), and the leg's current real
     * seat inventory.
     */
   public function edit(EventLeg $eventLeg)
{
    $this->authorizeEventLeg($eventLeg);

    $eventLeg->load([
        'ticketTiers',
        'venue.sections.seats',
    ]);

    return \Inertia\Inertia::render('Admin/Events/Seats', [
        'eventLeg' => [
            'id' => $eventLeg->id,
            'venue_id' => $eventLeg->venue_id,
            'venue_name' => $eventLeg->venue_name,
            'seating_type' => $eventLeg->seating_type,
            'ticket_tiers' => $eventLeg->ticketTiers->map(fn ($tier) => [
                'id' => $tier->id,
                'name' => $tier->name,
                'price' => $tier->price,
            ])->values(),
        ],

        'venue' => $eventLeg->venue,

        'seats' => $eventLeg->seats()
            ->with([
                'ticketTier',
                'venueSeat.section',
            ])
            ->get(),
    ]);
}

    /**
     * Delete ALL event seat inventory for this leg (used when clearing
     * a mistaken import, not for removing one seat — see destroySeat()
     * for that). Blocked once anything has sold/is held.
     */
    public function destroy(EventLeg $eventLeg)
    {
        $this->authorizeEventLeg($eventLeg);

        $this->assertNoSoldOrHeldSeats($eventLeg);

        DB::transaction(function () use ($eventLeg) {
            $eventLeg->seats()->delete();

            $eventLeg->update([
                'seating_type' => 'general',
            ]);
        });

        return back()->with(
            'success',
            'Event seat inventory removed.'
        );
    }

    /**
     * Delete ONE seat. Distinct route/method from destroy() above —
     * they were previously conflated: the frontend called this with a
     * {seat} id but the only registered route was the bulk-delete
     * `/event-legs/{eventLeg}/seats` with no {seat} segment, so
     * clicking a single seat's delete button was silently wiping the
     * entire seat map instead.
     */
    public function destroySeat(EventLeg $eventLeg, EventSeat $seat)
    {
        $this->authorizeEventLeg($eventLeg);

        abort_unless(
            $seat->event_leg_id === $eventLeg->id,
            404
        );

        abort_unless(
            $seat->status === 'available',
            422,
            'Cannot remove a seat that is held or sold.'
        );

        $seat->delete();

        return back()->with('success', "Seat {$seat->label} removed.");
    }

    /**
     * Clone the venue's seat TEMPLATE (VenueSection -> VenueSeat) into
     * real, sellable per-leg inventory (EventSeat), assigning a ticket
     * tier PER SECTION rather than one flat tier for the whole venue —
     * "Front Row" and "Main Floor" are the same physical seats every
     * time, but what they SELL for is this event's decision, not the
     * venue's.
     *
     * Payload shape:
     *   {
     *     "section_assignments": {
     *       "<venue_section_id>": <ticket_tier_id>,
     *       ...
     *     }
     *   }
     *
     * A section can be omitted from the map entirely — its seats will
     * still be imported (so the full physical layout is always
     * visible on the chart) but with ticket_tier_id = null, which the
     * buyer-facing seat chart already treats as unsellable/greyed out.
     * That's a deliberate, safe default: an unpriced section shouldn't
     * silently become sellable at $0 or at some other section's price.
     */
    public function import(Request $request, EventLeg $eventLeg)
    {
        $this->authorizeEventLeg($eventLeg);

        abort_unless(
            $eventLeg->venue_id,
            422,
            'This event leg does not have a venue.'
        );

        $this->assertNoSoldOrHeldSeats($eventLeg);

        $eventLeg->load(['venue.sections.seats', 'ticketTiers']);

        abort_unless(
            $eventLeg->venue,
            422,
            'Venue could not be found.'
        );

        $venueSeats = $eventLeg->venue
            ->sections
            ->flatMap(fn ($section) => $section->seats)
            ->where('is_active', true);

        abort_unless(
            $venueSeats->count() > 0,
            422,
            'This venue has no active seats configured.'
        );

        $data = $request->validate([
            'section_assignments' => ['nullable', 'array'],
            'section_assignments.*' => [
                'nullable',
                'integer',
                'exists:ticket_tiers,id',
            ],
        ]);

        $sectionAssignments = collect($data['section_assignments'] ?? [])
            ->mapWithKeys(fn ($tierId, $sectionId) => [(int) $sectionId => (int) $tierId]);

        // Every tier referenced must actually belong to THIS event leg —
        // otherwise a vendor could point a section at a tier (and price)
        // that belongs to a completely different event.
        $validTierIds = $eventLeg->ticketTiers->pluck('id')->all();
        foreach ($sectionAssignments as $sectionId => $tierId) {
            abort_unless(
                in_array($tierId, $validTierIds, true),
                422,
                "Ticket tier {$tierId} does not belong to this event's location."
            );
        }

        // Every section referenced must actually belong to THIS venue —
        // guards against a stale/forged section id from another venue.
        $validSectionIds = $eventLeg->venue->sections->pluck('id')->all();
        foreach ($sectionAssignments->keys() as $sectionId) {
            abort_unless(
                in_array($sectionId, $validSectionIds, true),
                422,
                "Section {$sectionId} does not belong to this venue."
            );
        }

        DB::transaction(function () use ($eventLeg, $venueSeats, $sectionAssignments) {
            EventSeat::where('event_leg_id', $eventLeg->id)->delete();

            foreach ($venueSeats as $venueSeat) {
              EventSeat::create([
    'event_leg_id' => $eventLeg->id,
    'venue_seat_id' => $venueSeat->id,
    'ticket_tier_id' => $sectionAssignments->get($venueSeat->venue_section_id),
    'row_label' => $venueSeat->row_label,
    'sort_order' => $venueSeat->sort_order,
    'seat_number' => $venueSeat->seat_number,
    'label' => $venueSeat->label,
    'status' => 'available',
]);
            }

            $eventLeg->update([
                'seating_type' => 'reserved',
            ]);
        });

        $unassignedCount = $venueSeats
            ->reject(fn ($seat) => $sectionAssignments->has($seat->venue_section_id))
            ->count();

        $message = $venueSeats->count() . ' venue seats imported.';
        if ($unassignedCount > 0) {
            $message .= " {$unassignedCount} have no price yet — assign a tier to their section to make them sellable.";
        }

        return back()->with('success', $message);
    }

    private function assertNoSoldOrHeldSeats(EventLeg $eventLeg): void
    {
        $hasUnavailableSeats = $eventLeg
            ->seats()
            ->where('status', '!=', 'available')
            ->exists();

        abort_if(
            $hasUnavailableSeats,
            422,
            'Cannot regenerate seats because some seats are already held or sold.'
        );
    }

    private function authorizeEventLeg(EventLeg $eventLeg): void
    {
        abort_unless(
            $eventLeg->event &&
            $eventLeg->event->vendor_user_id === request()->user()->id,
            403
        );
    }
}
