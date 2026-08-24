<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Department;
use App\Models\Event;
use App\Models\EventSeat;
use App\Models\User;
use App\Models\Venue;
use App\Models\VenueSection;
use App\Models\VenueSeat;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EventSeeder extends Seeder
{
    /** @var array<string, Venue> venue_name => Venue, so repeated venues across events aren't duplicated */
    protected array $venueCache = [];

    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Vendor
        |--------------------------------------------------------------------------
        */

        $vendorUser = User::where(
            'email',
            'shrestha.suraj.2013@gmail.com'
        )->first();

        if (! $vendorUser) {
            $this->command->error(
                'Vendor owner user not found: shrestha.suraj.2013@gmail.com'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Department
        |--------------------------------------------------------------------------
        */

        $department = Department::firstOrCreate(
            ['slug' => 'events-entertainment'],
            [
                'name' => 'Events & Entertainment',
                'meta_title' => 'Events & Entertainment',
                'meta_description' =>
                    'Live events, concerts, festivals, entertainment and experiences.',
                'active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Categories
        |--------------------------------------------------------------------------
        */

        $categoryNames = [
            'Live Music', 'Festivals', 'Concerts', 'Comedy', 'Theatre',
            'Sports', 'Workshops', 'Conferences', 'Family Events', 'Cultural Events',
        ];

        $categories = [];

        foreach ($categoryNames as $name) {
            $categories[$name] = Category::updateOrCreate(
                [
                    'name' => $name,
                    'department_id' => $department->id,
                    'parent_id' => null,
                ],
                [
                    'slug' => Str::slug($name),
                    'active' => true,
                    'created_by' => $vendorUser->id,
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Events
        |--------------------------------------------------------------------------
        |
        | seating_type on each leg is DERIVED after seats are (or aren't)
        | imported — 'reserved' venues below get a real section-based seat
        | map cloned from the Venue; 'general' venues get no EventSeat rows
        | at all, matching how Show.tsx already treats an empty seats
        | array as general admission.
        |
        */

        $events = [
            [
                'name' => 'Sydney Summer Nights',
                'type' => 'standalone',
                'category' => 'Live Music',
                'seating_type' => 'reserved',
                'venues' => [
                    ['venue_name' => 'Sydney Opera House', 'city' => 'Sydney'],
                ],
            ],
            [
                'name' => 'Australian Music Tour 2026',
                'type' => 'tour',
                'category' => 'Concerts',
                'seating_type' => 'reserved',
                'venues' => [
                    ['venue_name' => 'Qudos Bank Arena', 'city' => 'Sydney'],
                    ['venue_name' => 'John Cain Arena', 'city' => 'Melbourne'],
                    ['venue_name' => 'Brisbane Entertainment Centre', 'city' => 'Brisbane'],
                    ['venue_name' => 'Adelaide Entertainment Centre', 'city' => 'Adelaide'],
                ],
            ],
            [
                'name' => 'Comedy Across Australia',
                'type' => 'tour',
                'category' => 'Comedy',
                'seating_type' => 'reserved',
                'venues' => [
                    ['venue_name' => 'Enmore Theatre', 'city' => 'Sydney'],
                    ['venue_name' => 'Palais Theatre', 'city' => 'Melbourne'],
                    ['venue_name' => 'The Fortitude Music Hall', 'city' => 'Brisbane'],
                ],
            ],
            [
                'name' => 'Brisbane Live',
                'type' => 'standalone',
                'category' => 'Festivals',
                'seating_type' => 'general',
                'venues' => [
                    ['venue_name' => 'Brisbane Entertainment Centre', 'city' => 'Brisbane'],
                ],
            ],
            [
                'name' => 'Perth Theatre Experience',
                'type' => 'standalone',
                'category' => 'Theatre',
                'seating_type' => 'reserved',
                'venues' => [
                    ['venue_name' => 'His Majesty\'s Theatre', 'city' => 'Perth'],
                ],
            ],
            [
                'name' => 'Australian Sports Tour',
                'type' => 'tour',
                'category' => 'Sports',
                'seating_type' => 'reserved',
                'venues' => [
                    ['venue_name' => 'Accor Stadium', 'city' => 'Sydney'],
                    ['venue_name' => 'Marvel Stadium', 'city' => 'Melbourne'],
                    ['venue_name' => 'Optus Stadium', 'city' => 'Perth'],
                ],
            ],
            [
                'name' => 'Creative Skills Workshop',
                'type' => 'standalone',
                'category' => 'Workshops',
                'seating_type' => 'general',
                'venues' => [
                    ['venue_name' => 'ICC Sydney', 'city' => 'Sydney'],
                ],
            ],
            [
                'name' => 'Australian Business Summit',
                'type' => 'standalone',
                'category' => 'Conferences',
                'seating_type' => 'general',
                'venues' => [
                    ['venue_name' => 'Melbourne Convention Centre', 'city' => 'Melbourne'],
                ],
            ],
            [
                'name' => 'Australian Cultural Tour',
                'type' => 'tour',
                'category' => 'Cultural Events',
                'seating_type' => 'general',
                'venues' => [
                    ['venue_name' => 'Darling Harbour', 'city' => 'Sydney'],
                    ['venue_name' => 'Federation Square', 'city' => 'Melbourne'],
                    ['venue_name' => 'Victoria Park', 'city' => 'Brisbane'],
                ],
            ],
            [
                'name' => 'Grand Finale 2026',
                'type' => 'standalone',
                'category' => 'Family Events',
                'seating_type' => 'reserved',
                'venues' => [
                    ['venue_name' => 'Marvel Stadium', 'city' => 'Melbourne'],
                ],
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Create events
        |--------------------------------------------------------------------------
        */

        DB::transaction(function () use ($events, $categories, $vendorUser) {
            foreach ($events as $eventIndex => $eventData) {
                $event = Event::updateOrCreate(
                    [
                        'vendor_user_id' => $vendorUser->id,
                        'name' => $eventData['name'],
                    ],
                    [
                        'type' => $eventData['type'],
                        'description' =>
                            "Sample {$eventData['category']} event for testing the EventTickets platform.",
                        'status' => 'published',
                        'languages' => ['English'],
                        'watchlist_enabled' => true,
                        'published_at' => now(),
                    ]
                );

                $event->categories()->sync([
                    $categories[$eventData['category']]->id,
                ]);

                // Repeatable in dev: wipe existing legs/tiers/seats first.
                $event->legs()->each(function ($leg) {
                    $leg->ticketTiers()->delete();
                    EventSeat::where('event_leg_id', $leg->id)->delete();
                    $leg->delete();
                });

                foreach ($eventData['venues'] as $sequence => $venueData) {
                    $venue = $this->resolveVenue($venueData, $eventData['seating_type']);

                    $eventDate = Carbon::now()
                        ->addDays(7 + ($eventIndex * 3) + ($sequence * 2))
                        ->setTime(19, 0);

                    $leg = $event->legs()->create([
                        'venue_id' => $venue->id,
                        'venue_name' => $venue->name,
                        'address' => $venue->address,
                        'city' => $venue->city,
                        'latitude' => $venue->latitude,
                        'longitude' => $venue->longitude,
                        'event_date' => $eventDate,
                        'capacity' => $venue->capacity,
                        'sequence' => $sequence + 1,
                        'seating_type' => 'general', // corrected below if reserved seats are seeded
                    ]);

                    $saleStart = now()->subDay();
                    $saleEnd = $eventDate->copy()->subHours(2);

                    $tiers = collect([
                        ['name' => 'Early Bird', 'price' => 25, 'quantity' => 40],
                        ['name' => 'General Admission', 'price' => 40, 'quantity' => 100],
                        ['name' => 'VIP', 'price' => 75, 'quantity' => 60],
                    ])->map(fn ($t) => $leg->ticketTiers()->create([
                        'name' => $t['name'],
                        'price' => $t['price'],
                        'quantity' => $t['quantity'],
                        'remaining' => $t['quantity'],
                        'starts_at' => $saleStart,
                        'ends_at' => $saleEnd,
                    ]));

                    if ($eventData['seating_type'] === 'reserved') {
                        $this->seedReservedSeats($leg, $venue, $tiers);
                    }
                }
            }
        });

        $this->command?->info(
            'Events & Entertainment department, categories, venues, events, tours, ticket tiers, and reserved seats seeded successfully.'
        );
    }

    /**
     * Find or create a real Venue (with sections + seats) for the given
     * name/city, reusing the same Venue across events that repeat a name
     * (e.g. two events both at 'Brisbane Entertainment Centre').
     */
    protected function resolveVenue(array $venueData, string $seatingType): Venue
    {
        $cacheKey = $venueData['venue_name'];

        if (isset($this->venueCache[$cacheKey])) {
            return $this->venueCache[$cacheKey];
        }

        $venue = Venue::firstOrCreate(
            ['name' => $venueData['venue_name']],
            [
                'created_by_user_id' => null,
                'address' => '1 Example Street',
                'city' => $venueData['city'],
                'state' => 'AU',
                'postcode' => '0000',
                'country' => 'Australia',
                'latitude' => -33.8688,
                'longitude' => 151.2093,
                'capacity' => 0,
                'seating_type' => $seatingType,
                'is_active' => true,
            ]
        );

        // Build the section/seat template once per venue — 10 rows x 20
        // seats, split A-B / C-G / H-J to mirror the old hardcoded layout.
        if ($venue->wasRecentlyCreated) {
            $sectionDefs = [
                ['name' => 'Early Bird Rows', 'code' => 'EB', 'rows' => ['A', 'B']],
                ['name' => 'General Admission Rows', 'code' => 'GA', 'rows' => ['C', 'D', 'E', 'F', 'G']],
                ['name' => 'VIP Rows', 'code' => 'VIP', 'rows' => ['H', 'I', 'J']],
            ];

            $totalCapacity = 0;

            foreach ($sectionDefs as $i => $def) {
                $section = VenueSection::create([
                    'venue_id' => $venue->id,
                    'name' => $def['name'],
                    'code' => $def['code'],
                    'sort_order' => $i,
                    'capacity' => count($def['rows']) * 20,
                    'is_active' => true,
                ]);

                foreach ($def['rows'] as $rowLabel) {
                    for ($seatNum = 1; $seatNum <= 20; $seatNum++) {
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
            $venue->refresh();
        }

        return $this->venueCache[$cacheKey] = $venue;
    }

    /**
     * Clone the venue's section/seat template into real EventSeat rows for
     * this leg, mapping sections -> tiers by name so 'Early Bird Rows'
     * sells at the Early Bird tier, etc. — matches the pattern
     * EventSeatController::import() uses in the live admin flow.
     */
    protected function seedReservedSeats($leg, Venue $venue, $tiers): void
    {
        $venue->loadMissing('sections.seats');

        $tierByName = $tiers->keyBy('name');

        $sectionTierMap = [
            'Early Bird Rows' => $tierByName['Early Bird']->id ?? null,
            'General Admission Rows' => $tierByName['General Admission']->id ?? null,
            'VIP Rows' => $tierByName['VIP']->id ?? null,
        ];

        foreach ($venue->sections as $section) {
            $ticketTierId = $sectionTierMap[$section->name] ?? null;

            foreach ($section->seats as $venueSeat) {
                if (!$venueSeat->is_active) {
                    continue;
                }

                EventSeat::create([
                    'event_leg_id' => $leg->id,
                    'venue_seat_id' => $venueSeat->id,
                    'ticket_tier_id' => $ticketTierId,
                    'row_label' => $venueSeat->row_label,
                    'seat_number' => $venueSeat->seat_number,
                    'label' => $venueSeat->label,
                    'status' => 'available',
                ]);
            }
        }

        $leg->update(['seating_type' => 'reserved']);
    }
}
