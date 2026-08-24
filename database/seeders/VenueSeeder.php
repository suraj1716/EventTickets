<?php

namespace Database\Seeders;

use App\Models\Venue;
use App\Models\VenueSection;
use App\Models\VenueSeat;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VenueSeeder extends Seeder
{
    public function run(): void
    {
        $venues = [
            [
                'name' => 'Seven Hills Arena',
                'city' => 'Sydney',
                'state' => 'NSW',
                'sections' => [
                    ['name' => 'Front Row', 'code' => 'FR', 'rows' => ['A'], 'seats_per_row' => 10],
                    ['name' => 'Main Floor', 'code' => 'MF', 'rows' => ['B', 'C', 'D', 'E'], 'seats_per_row' => 12],
                ],
            ],
            [
                'name' => 'Brisbane Entertainment Centre',
                'city' => 'Brisbane',
                'state' => 'QLD',
                'sections' => [
                    ['name' => 'Floor', 'code' => 'FL', 'rows' => ['A', 'B'], 'seats_per_row' => 14],
                    ['name' => 'Lower Bowl', 'code' => 'LB', 'rows' => ['C', 'D', 'E', 'F'], 'seats_per_row' => 16],
                    ['name' => 'Upper Bowl', 'code' => 'UB', 'rows' => ['G', 'H', 'I'], 'seats_per_row' => 18],
                ],
            ],
            [
                'name' => 'Melbourne Sound Hall',
                'city' => 'Melbourne',
                'state' => 'VIC',
                'sections' => [
                    ['name' => 'VIP', 'code' => 'VIP', 'rows' => ['A'], 'seats_per_row' => 8],
                    ['name' => 'General', 'code' => 'GEN', 'rows' => ['B', 'C', 'D'], 'seats_per_row' => 15],
                ],
            ],
            [
                'name' => 'Perth Riverside Pavilion',
                'city' => 'Perth',
                'state' => 'WA',
                'sections' => [
                    ['name' => 'Reserved', 'code' => 'RES', 'rows' => ['A', 'B', 'C'], 'seats_per_row' => 10],
                ],
            ],
            [
                'name' => 'Adelaide Oval Live',
                'city' => 'Adelaide',
                'state' => 'SA',
                'sections' => [
                    ['name' => 'Pitch Side', 'code' => 'PS', 'rows' => ['A'], 'seats_per_row' => 6],
                    ['name' => 'Grandstand', 'code' => 'GS', 'rows' => ['B', 'C', 'D', 'E', 'F'], 'seats_per_row' => 20],
                ],
            ],
            [
                'name' => 'Gold Coast Live House',
                'city' => 'Gold Coast',
                'state' => 'QLD',
                'sections' => [
                    ['name' => 'Standing Front', 'code' => 'SF', 'rows' => ['A', 'B'], 'seats_per_row' => 12],
                    ['name' => 'Balcony', 'code' => 'BAL', 'rows' => ['C', 'D'], 'seats_per_row' => 10],
                ],
            ],
        ];

        foreach ($venues as $sortOrder => $venueData) {
            DB::transaction(function () use ($venueData, $sortOrder) {
                $venue = Venue::create([
                    'name' => $venueData['name'],
                    'address' => '1 Example Street',
                    'city' => $venueData['city'],
                    'state' => $venueData['state'],
                    'postcode' => '2000',
                    'country' => 'Australia',
                    'latitude' => -33.8688,
                    'longitude' => 151.2093,
                    'capacity' => 0, // updated below
                    'seating_type' => 'reserved',
                    'is_active' => true,
                ]);

                $totalCapacity = 0;

                foreach ($venueData['sections'] as $i => $sectionData) {
                    $section = VenueSection::create([
                        'venue_id' => $venue->id,
                        'name' => $sectionData['name'],
                        'code' => $sectionData['code'],
                        'sort_order' => $i,
                        'capacity' => count($sectionData['rows']) * $sectionData['seats_per_row'],
                        'is_active' => true,
                    ]);

                    foreach ($sectionData['rows'] as $rowLabel) {
                        for ($seatNum = 1; $seatNum <= $sectionData['seats_per_row']; $seatNum++) {
                            VenueSeat::create([
                                'venue_id' => $venue->id,
                                'venue_section_id' => $section->id,
                                'row_label' => $rowLabel,
                                'seat_number' => $seatNum,
                                'label' => "{$rowLabel}{$seatNum}",
                                'is_active' => true,
                            ]);
                            $totalCapacity++;
                        }
                    }
                }

                $venue->update(['capacity' => $totalCapacity]);

                $this->command?->info("Created venue '{$venue->name}' with {$totalCapacity} seats.");
            });
        }
    }
}
