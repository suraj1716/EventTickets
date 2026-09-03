<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventLeg;
use App\Models\EventSeat;
use App\Models\Venue;
use App\Models\VenueSection;
use App\Models\VenueSeat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class VenueSeatController extends Controller
{
    public function index(Venue $venue)
    {
        abort_unless(
            $venue->created_by_user_id === request()->user()->id
                || request()->user()->hasRole('Admin'),
            403
        );

        $venue->load([
            'sections' => function ($query) {
                $query
                    ->with('seats')
                    ->orderBy('sort_order')
                    ->orderBy('name');
            },
        ]);

        return Inertia::render(
            'Admin/Venues/Seats',
            [
                'venue' => $venue,
            ]
        );
    }

    public function storeSection(
        Request $request,
        Venue $venue
    ) {
        abort_unless(
            $venue->created_by_user_id === $request->user()->id
                || $request->user()->hasRole('Admin'),
            403
        );

        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
            ],
            'code' => [
                'nullable',
                'string',
                'max:50',
            ],
            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],
        ]);

        $section = $venue->sections()->create([
            'name' => $data['name'],
            'code' => $data['code'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return back()->with(
            'success',
            "Section {$section->name} created."
        );
    }

    public function generateRow(
        Request $request,
        VenueSection $venueSection
    ) {
        $venue = $venueSection->venue;

        abort_unless(
            $venue->created_by_user_id === $request->user()->id
                || $request->user()->hasRole('Admin'),
            403
        );

        $data = $request->validate([
            'row_label' => ['required', 'string', 'max:20'],
            'seats' => ['required', 'integer', 'min:1', 'max:500'],
            'start_seat' => ['nullable', 'integer', 'min:1'],
            'seat_type' => ['nullable', 'string', 'max:50'],
        ]);

        $rowLabel = strtoupper(trim($data['row_label']));
        $startSeat = $data['start_seat'] ?? 1;
        $seatType = $data['seat_type'] ?? 'standard';

        DB::transaction(function () use (
            $venue,
            $venueSection,
            $data,
            $rowLabel,
            $startSeat,
            $seatType
        ) {
          $existingSortOrder = VenueSeat::where('venue_section_id', $venueSection->id)
    ->where('row_label', $rowLabel)
    ->value('sort_order');

$nextSortOrder = $existingSortOrder ?? (
    (VenueSeat::where('venue_id', $venue->id)->max('sort_order') ?? -1) + 1
);

            $legs = EventLeg::where('venue_id', $venue->id)->get();

            $defaultTierByLeg = $legs->mapWithKeys(function ($leg) {
                $tierId = EventSeat::where('event_leg_id', $leg->id)
                    ->whereNotNull('ticket_tier_id')
                    ->value('ticket_tier_id');

                return [$leg->id => $tierId];
            });

            for ($i = 0; $i < $data['seats']; $i++) {
                $seatNumber = $startSeat + $i;

                $venueSeat = VenueSeat::updateOrCreate(
                    [
                        'venue_id' => $venue->id,
                        'venue_section_id' => $venueSection->id,
                        'row_label' => $rowLabel,
                        'seat_number' => $seatNumber,
                    ],
                    [
                        'label' => "{$rowLabel}-{$seatNumber}",
                        'seat_type' => $seatType,
                        'is_active' => true,
                        'sort_order' => $nextSortOrder,
                    ]
                );

                foreach ($legs as $leg) {
                    EventSeat::updateOrCreate(
                        [
                            'event_leg_id' => $leg->id,
                            'row_label' => $venueSeat->row_label,
                            'seat_number' => $venueSeat->seat_number,
                        ],
                        [
                            'venue_seat_id' => $venueSeat->id,
                            'ticket_tier_id' => $defaultTierByLeg[$leg->id] ?? null,
                            'label' => $venueSeat->label,
                            'status' => 'available',
                            'sort_order' => $nextSortOrder,
                        ]
                    );
                }
            }
        });

        return back()->with('success', "Row {$rowLabel} generated successfully.");
    }


public function reorderRows(
    Request $request,
    VenueSection $venueSection
) {
    $venue = $venueSection->venue;

    abort_unless(
        $venue->created_by_user_id === $request->user()->id
            || $request->user()->hasRole('Admin'),
        403
    );

    $data = $request->validate([
        'row_labels' => ['required', 'array', 'min:1'],
        'row_labels.*' => ['string'],
    ]);

    DB::transaction(function () use ($venueSection, $data) {
        // Reuse this section's own existing sort_order values as slots,
        // just reassign which row occupies each slot. This keeps every
        // value inside the numeric band this section already owns, so
        // it never collides with another section's rows.
        $slots = VenueSeat::where('venue_section_id', $venueSection->id)
            ->select('row_label', DB::raw('MIN(sort_order) as slot'))
            ->groupBy('row_label')
            ->orderBy('slot')
            ->pluck('slot')
            ->values();

        foreach ($data['row_labels'] as $index => $rowLabel) {
            $slot = $slots[$index];

            VenueSeat::where('venue_section_id', $venueSection->id)
                ->where('row_label', $rowLabel)
                ->update(['sort_order' => $slot]);

            EventSeat::whereHas('venueSeat', function ($q) use ($venueSection, $rowLabel) {
                $q->where('venue_section_id', $venueSection->id)->where('row_label', $rowLabel);
            })->update(['sort_order' => $slot]);
        }
    });

    return back()->with('success', 'Row order updated.');
}
public function destroyRow(
    Request $request,
    VenueSection $venueSection
) {
    $venue = $venueSection->venue;

    abort_unless(
        $venue->created_by_user_id === $request->user()->id
            || $request->user()->hasRole('Admin'),
        403
    );

    $data = $request->validate([
        'row_label' => ['required', 'string', 'max:20'],
    ]);

    DB::transaction(function () use ($venueSection, $data) {
        $seatIds = VenueSeat::where('venue_section_id', $venueSection->id)
            ->where('row_label', $data['row_label'])
            ->pluck('id');

        EventSeat::whereIn('venue_seat_id', $seatIds)->delete();

        VenueSeat::whereIn('id', $seatIds)->delete();
    });

    return back()->with('success', "Row {$data['row_label']} deleted.");
}

    public function storeSeat(
        Request $request,
        VenueSection $venueSection
    ) {
        $venue = $venueSection->venue;

        abort_unless(
            $venue->created_by_user_id === $request->user()->id
                || $request->user()->hasRole('Admin'),
            403
        );

        $data = $request->validate([
            'row_label' => ['required', 'string', 'max:20'],
            'seat_number' => ['required', 'integer', 'min:1'],
            'label' => ['nullable', 'string', 'max:50'],
            'seat_type' => ['nullable', 'string', 'max:50'],
        ]);

        DB::transaction(function () use ($venue, $venueSection, $data) {
            $venueSeat = VenueSeat::create([
                'venue_id' => $venue->id,
                'venue_section_id' => $venueSection->id,
                'row_label' => $data['row_label'],
                'seat_number' => $data['seat_number'],
                'label' => $data['label']
                    ?: $data['row_label'] . '-' . $data['seat_number'],
                'seat_type' => $data['seat_type'] ?? 'standard',
                'is_active' => true,
            ]);

            $legs = EventLeg::where('venue_id', $venue->id)->get();

            foreach ($legs as $leg) {
                $defaultTierId = EventSeat::where('event_leg_id', $leg->id)
                    ->whereNotNull('ticket_tier_id')
                    ->value('ticket_tier_id');

                EventSeat::updateOrCreate(
                    [
                        'event_leg_id' => $leg->id,
                        'venue_seat_id' => $venueSeat->id,
                    ],
                    [
                        'ticket_tier_id' => $defaultTierId,
                        'row_label' => $venueSeat->row_label,
                        'seat_number' => $venueSeat->seat_number,
                        'label' => $venueSeat->label,
                        'status' => 'available',
                    ]
                );
            }
        });

        return back()->with('success', 'Seat created successfully.');
    }
    public function destroySection(
        Venue $venue,
        VenueSection $section
    ) {
        abort_unless(
            $section->venue_id === $venue->id,
            404
        );

        abort_unless(
            $venue->created_by_user_id === request()->user()->id
                || request()->user()->hasRole('Admin'),
            403
        );

        DB::transaction(function () use ($section) {
            $section->seats()->delete();
            $section->delete();
        });

        return back()->with(
            'success',
            'Section deleted successfully.'
        );
    }

   public function destroySeat(VenueSeat $venueSeat)
{
    abort_unless(
        $venueSeat->venue->created_by_user_id === request()->user()->id
            || request()->user()->hasRole('Admin'),
        403
    );

    DB::transaction(function () use ($venueSeat) {
        $venueSeat->eventSeats()->delete();
        $venueSeat->delete();
    });

    return back()->with('success', 'Seat deleted successfully.');
}


    // app/Http/Controllers/Admin/VenueSeatController.php
    public function toggleAisle(VenueSeat $venueSeat)
    {
        abort_unless(
            $venueSeat->venue->created_by_user_id === request()->user()->id
                || request()->user()->hasRole('Admin'),
            403
        );

        $venueSeat->update([
            'aisle_after' => ! $venueSeat->aisle_after,
        ]);

        return back();
    }
}
