<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
            'row_label' => [
                'required',
                'string',
                'max:20',
            ],

            'seats' => [
                'required',
                'integer',
                'min:1',
                'max:500',
            ],

            'start_seat' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'seat_type' => [
                'nullable',
                'string',
                'max:50',
            ],
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
            for ($i = 0; $i < $data['seats']; $i++) {
                $seatNumber = $startSeat + $i;

                VenueSeat::updateOrCreate(
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
                    ]
                );
            }
        });

        return back()->with(
            'success',
            "Row {$rowLabel} generated successfully."
        );
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
            'row_label' => [
                'required',
                'string',
                'max:20',
            ],
            'seat_number' => [
                'required',
                'integer',
                'min:1',
            ],
            'label' => [
                'nullable',
                'string',
                'max:50',
            ],
            'seat_type' => [
                'nullable',
                'string',
                'max:50',
            ],
        ]);

        VenueSeat::create([
            'venue_id' => $venue->id,
            'venue_section_id' => $venueSection->id,
            'row_label' => $data['row_label'],
            'seat_number' => $data['seat_number'],
            'label' => $data['label']
                ?: $data['row_label'] . '-' . $data['seat_number'],
            'seat_type' => $data['seat_type'] ?? 'standard',
            'is_active' => true,
        ]);

        return back()->with(
            'success',
            'Seat created successfully.'
        );
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

    public function destroySeat(
        Venue $venue,
        VenueSeat $seat
    ) {
        abort_unless(
            $seat->venue_id === $venue->id,
            404
        );

        abort_unless(
            $venue->created_by_user_id === request()->user()->id
                || request()->user()->hasRole('Admin'),
            403
        );

        $seat->delete();

        return back()->with(
            'success',
            'Seat deleted successfully.'
        );
    }
}
