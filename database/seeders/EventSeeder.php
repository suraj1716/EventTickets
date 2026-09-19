<?php

namespace Database\Seeders;

use App\Enums\SponsorTierEnum;
use App\Models\Category;
use App\Models\Department;
use App\Models\Event;
use App\Models\EventSeat;
use App\Models\EventSponsor;
use App\Models\User;
use App\Models\Venue;
use App\Models\VenueSection;
use App\Models\VenueSeat;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EventSeeder extends Seeder
{
    /**
     * Venue cache:
     *
     * venue name => Venue model
     */
    protected array $venueCache = [];

    /**
     * Real, publicly-reachable Pexels photo IDs (verified — not guessed),
     * used as stand-in sponsor "logos". EventSponsor::getLogoUrlAttribute()
     * passes through any path starting with "http" untouched, so storing
     * the full Pexels URL directly in logo_path needs no download/upload —
     * same trick as the R2 event-media reference below, just against an
     * external host instead of our own disk.
     */
    protected const SPONSOR_LOGO_PHOTO_IDS = [
        2014422, 2880507, 1367179, 1367105, 1292115,
        794079, 640809, 1000559, 708921, 774861,
        881583, 1126956, 850804, 815996, 323244,
        908884, 364382, 950758, 971267, 235986,
        417074, 417173, 346885,
    ];

    protected const SPONSOR_NAME_POOL = [
        'Nimbus Digital', 'Harbor & Vine', 'Kestrel Media', 'Bluepeak Group',
        'Northlight Studios', 'Copperline Co.', 'Vantage Collective',
        'Solace Brands', 'Ironwood Partners', 'Everline Audio',
        'Cedar & Co.', 'Skyward Labs', 'Meridian Foods', 'Loom Coffee',
        'Granite Athletics', 'Wavecrest Beverages', 'Pinelight Group',
        'Circuit & Sons', 'Horizon Telecom', 'Amber Road Brewing',
    ];

    protected function sponsorLogoUrl(int $photoId): string
    {
        return "https://images.pexels.com/photos/{$photoId}/pexels-photo-{$photoId}.jpeg?auto=compress&cs=tinysrgb&w=400";
    }

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
            'Live Music',
            'Festivals',
            'Concerts',
            'Comedy',
            'Theatre',
            'Sports',
            'Workshops',
            'Conferences',
            'Family Events',
            'Cultural Events',
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
        */

        $events = [
            [
                'name' => 'Sydney Summer Nights',
                'type' => 'standalone',
                'category' => 'Live Music',
                'seating_type' => 'reserved',
                'venues' => [
                    [
                        'venue_name' => 'Sydney Opera House',
                        'city' => 'Sydney',
                    ],
                ],
            ],

            [
                'name' => 'Australian Music Tour 2026',
                'type' => 'tour',
                'category' => 'Concerts',
                'seating_type' => 'reserved',
                'venues' => [
                    [
                        'venue_name' => 'Qudos Bank Arena',
                        'city' => 'Sydney',
                    ],
                    [
                        'venue_name' => 'John Cain Arena',
                        'city' => 'Melbourne',
                    ],
                    [
                        'venue_name' => 'Brisbane Entertainment Centre',
                        'city' => 'Brisbane',
                    ],
                    [
                        'venue_name' => 'Adelaide Entertainment Centre',
                        'city' => 'Adelaide',
                    ],
                ],
            ],

            [
                'name' => 'Comedy Across Australia',
                'type' => 'tour',
                'category' => 'Comedy',
                'seating_type' => 'reserved',
                'venues' => [
                    [
                        'venue_name' => 'Enmore Theatre',
                        'city' => 'Sydney',
                    ],
                    [
                        'venue_name' => 'Palais Theatre',
                        'city' => 'Melbourne',
                    ],
                    [
                        'venue_name' => 'The Fortitude Music Hall',
                        'city' => 'Brisbane',
                    ],
                ],
            ],

            [
                'name' => 'Brisbane Live',
                'type' => 'standalone',
                'category' => 'Festivals',
                'seating_type' => 'general',
                'venues' => [
                    [
                        'venue_name' => 'Brisbane Entertainment Centre',
                        'city' => 'Brisbane',
                    ],
                ],
            ],

            [
                'name' => 'Perth Theatre Experience',
                'type' => 'standalone',
                'category' => 'Theatre',
                'seating_type' => 'reserved',
                'venues' => [
                    [
                        'venue_name' => "His Majesty's Theatre",
                        'city' => 'Perth',
                    ],
                ],
            ],

            [
                'name' => 'Australian Sports Tour',
                'type' => 'tour',
                'category' => 'Sports',
                'seating_type' => 'reserved',
                'venues' => [
                    [
                        'venue_name' => 'Accor Stadium',
                        'city' => 'Sydney',
                    ],
                    [
                        'venue_name' => 'Marvel Stadium',
                        'city' => 'Melbourne',
                    ],
                    [
                        'venue_name' => 'Optus Stadium',
                        'city' => 'Perth',
                    ],
                ],
            ],

            [
                'name' => 'Creative Skills Workshop',
                'type' => 'standalone',
                'category' => 'Workshops',
                'seating_type' => 'general',
                'venues' => [
                    [
                        'venue_name' => 'ICC Sydney',
                        'city' => 'Sydney',
                    ],
                ],
            ],

            [
                'name' => 'Australian Business Summit',
                'type' => 'standalone',
                'category' => 'Conferences',
                'seating_type' => 'general',
                'venues' => [
                    [
                        'venue_name' => 'Melbourne Convention Centre',
                        'city' => 'Melbourne',
                    ],
                ],
            ],

            [
                'name' => 'Australian Cultural Tour',
                'type' => 'tour',
                'category' => 'Cultural Events',
                'seating_type' => 'general',
                'venues' => [
                    [
                        'venue_name' => 'Darling Harbour',
                        'city' => 'Sydney',
                    ],
                    [
                        'venue_name' => 'Federation Square',
                        'city' => 'Melbourne',
                    ],
                    [
                        'venue_name' => 'Victoria Park',
                        'city' => 'Brisbane',
                    ],
                ],
            ],

            [
                'name' => 'Grand Finale 2026',
                'type' => 'standalone',
                'category' => 'Family Events',
                'seating_type' => 'reserved',
                'venues' => [
                    [
                        'venue_name' => 'Marvel Stadium',
                        'city' => 'Melbourne',
                    ],
                ],
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Create Events
        |--------------------------------------------------------------------------
        */

        DB::transaction(function () use (
            $events,
            $categories,
            $vendorUser
        ) {
            foreach ($events as $eventIndex => $eventData) {

                /*
                |--------------------------------------------------------------------------
                | Event
                |--------------------------------------------------------------------------
                */

                $event = Event::updateOrCreate(
                    [
                        'vendor_user_id' => $vendorUser->id,
                        'name' => $eventData['name'],
                    ],
                    [
                        'type' => $eventData['type'],

                        'description' =>
                            "Sample {$eventData['category']} event for testing the EventTickets platform.",

                        'policy' => $this->samplePolicyText(
                            $eventData['name']
                        ),

                        'status' => $eventIndex >= 6
                            ? 'proposed'
                            : 'published',

                        'languages' => ['English'],

                        'watchlist_enabled' => $eventIndex >= 6,

                        'published_at' => $eventIndex >= 6
                            ? null
                            : now(),
                    ]
                );

                /*
                |--------------------------------------------------------------------------
                | Event Media
                |--------------------------------------------------------------------------
                |
                | IMPORTANT:
                |
                | The media already exists in R2.
                |
                | We ONLY create the database reference.
                |
                | R2 path:
                |
                | events/{event_id}/{slug}/photo.jpg
                |
                | No download.
                | No upload.
                | No file_get_contents().
                | No Storage::disk('r2').
                |
                */

                $this->referenceEventMedia($event);

                /*
                |--------------------------------------------------------------------------
                | Sponsors
                |--------------------------------------------------------------------------
                |
                | Random 3-6 sponsors per event, logo image borrowed from
                | Pexels by URL (no download — same "reference, don't
                | fetch" approach as referenceEventMedia() above; the URL
                | is stored as-is in logo_path and EventSponsor resolves
                | any path starting with "http" straight through).
                |
                | Re-seedable: existing sponsors for this event are wiped
                | first so re-running the seeder doesn't pile up
                | duplicates or leave stale tiers/positions behind.
                |
                */

                $this->seedSponsors($event);

                /*
                |--------------------------------------------------------------------------
                | Categories
                |--------------------------------------------------------------------------
                */

                $event->categories()->sync([
                    $categories[$eventData['category']]->id,
                ]);

                /*
                |--------------------------------------------------------------------------
                | Remove Existing Legs / Tiers / Seats
                |--------------------------------------------------------------------------
                */

                $event->legs()->each(function ($leg) {

                    $leg->ticketTiers()->delete();

                    EventSeat::where(
                        'event_leg_id',
                        $leg->id
                    )->delete();

                    $leg->delete();
                });

                /*
                |--------------------------------------------------------------------------
                | Event Legs
                |--------------------------------------------------------------------------
                */

                foreach (
                    $eventData['venues']
                    as $sequence => $venueData
                ) {

                    $venue = $this->resolveVenue(
                        $venueData,
                        $eventData['seating_type']
                    );

                    $eventDate = Carbon::now()
                        ->addDays(
                            7
                            + ($eventIndex * 3)
                            + ($sequence * 2)
                        )
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

                        'seating_type' => 'general',
                    ]);

                    /*
                    |--------------------------------------------------------------------------
                    | Ticket Sale Window
                    |--------------------------------------------------------------------------
                    */

                    $saleStart = now()->subDay();

                    $saleEnd = $eventDate
                        ->copy()
                        ->subHours(2);

                    /*
                    |--------------------------------------------------------------------------
                    | Ticket Tiers
                    |--------------------------------------------------------------------------
                    */

                    $tiers = collect([
                        [
                            'name' => 'Early Bird',
                            'price' => 25,
                            'quantity' => 40,
                        ],
                        [
                            'name' => 'General Admission',
                            'price' => 40,
                            'quantity' => 100,
                        ],
                        [
                            'name' => 'VIP',
                            'price' => 75,
                            'quantity' => 60,
                        ],
                    ])->map(
                        fn ($tier) => $leg->ticketTiers()->create([
                            'name' => $tier['name'],

                            'price' => $tier['price'],

                            'quantity' => $tier['quantity'],

                            'remaining' => $tier['quantity'],

                            'starts_at' => $saleStart,

                            'ends_at' => $saleEnd,
                        ])
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | Reserved Seats
                    |--------------------------------------------------------------------------
                    */

                    if (
                        $eventData['seating_type']
                        === 'reserved'
                    ) {
                        $this->seedReservedSeats(
                            $leg,
                            $venue,
                            $tiers
                        );
                    }
                }

                $this->command?->info(
                    "Event seeded: {$event->name}"
                );
            }
        });

        $this->command?->info(
            'Events, tours, categories, venues, ticket tiers, reserved seats, sponsors, policies, and R2 media references seeded successfully.'
        );
    }

    /**
     * Reference media that already exists in R2.
     *
     * NO R2 request is made here.
     *
     * IMPORTANT: this looks up the real file in R2 by slug rather than
     * constructing the path from $event->id. Event IDs are NOT stable —
     * a delete + reseed cycle assigns new auto-incrementing IDs (Postgres
     * doesn't reset the sequence on DELETE, only on TRUNCATE ... RESTART
     * IDENTITY), so a formula-based "events/{id}/{slug}.jpg" path will
     * silently point at the wrong (or a nonexistent) R2 object as soon
     * as IDs drift from whatever they were when the files were uploaded.
     * The R2 files themselves are the ground truth; find them by slug,
     * whatever folder they actually live in.
     */
    protected ?array $r2EventFiles = null;

    protected function referenceEventMedia(
        Event $event
    ): void {
        $slug = Str::slug($event->name);

        $disk = strtolower(config('media-library.disk_name', 'public'));

        // Cache the file listing across all events in this seeder run —
        // one Storage call instead of one per event.
        if ($this->r2EventFiles === null) {
            $this->r2EventFiles = Storage::disk($disk)->allFiles('events');
        }

        $photoPath = collect($this->r2EventFiles)->first(
            fn ($path) => Str::endsWith($path, "/{$slug}.jpg")
        );

        if (! $photoPath) {
            $this->command?->warn(
                "No R2 file found for event '{$event->name}' (slug: {$slug}) — skipping media reference."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Avoid duplicate media records
        |--------------------------------------------------------------------------
        */

        if (
            $event->media()
                ->where('path', $photoPath)
                ->exists()
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Create database reference only
        |--------------------------------------------------------------------------
        */

        $event->media()->create([
            'type' => 'image',

            'path' => $photoPath,

            'mime_type' => 'image/jpeg',

            'position' => 0,
        ]);

        $this->command?->info(
            "Media reference created: {$photoPath}"
        );
    }

    /**
     * Seed 1 Platinum + 1-2 Gold + 2-3 Other sponsors for an event, each
     * with a Pexels-hosted "logo" and a made-up name/website. Wipes any
     * sponsors already on this event first so re-running the seeder
     * replaces them cleanly instead of accumulating duplicates.
     */
    protected function seedSponsors(Event $event): void
    {
        $event->sponsors()->delete();

        $photoIds = self::SPONSOR_LOGO_PHOTO_IDS;
        $names = self::SPONSOR_NAME_POOL;
        shuffle($photoIds);
        shuffle($names);

               $plan = [
            [SponsorTierEnum::PLATINUM, random_int(1, 1)],
            [SponsorTierEnum::GOLD, random_int(1, 2)],
            [SponsorTierEnum::OTHER, random_int(2, 3)],
        ];

        $cursor = 0;
        $position = 0;

        foreach ($plan as [$tier, $count]) {
            for ($i = 0; $i < $count; $i++) {
                $photoId = $photoIds[$cursor % count($photoIds)];
                $name = $names[$cursor % count($names)];
                $cursor++;

                EventSponsor::create([
                    'event_id' => $event->id,
                    'name' => $name,
                    'logo_path' => $this->sponsorLogoUrl($photoId),
                    'tier' => $tier->value,
                    'website_url' => 'https://example.com/' . Str::slug($name),
                    'position' => $position++,
                ]);
            }
        }
    }

    /**
     * Generic placeholder policy text — same "sample data" spirit as the
     * event description above, long enough to exercise the buyer-side
     * clamp/expand UI.
     */
    protected function samplePolicyText(string $eventName): string
    {
        return <<<POLICY
        Entry: Doors open 60 minutes before the advertised start time. A valid ticket (digital or printed) and photo ID are required for entry to {$eventName}.

        Refunds: Tickets are non-refundable except where the event is cancelled or rescheduled by the organizer, in which case ticket holders will be offered a full refund or transfer to the new date.

        Age restrictions: Some sections of this event may be restricted to patrons 18+. Check the ticket tier description before purchasing.

        Re-entry: Re-entry is not permitted once you have left the venue, unless otherwise stated at the gate.

        Prohibited items: Outside food and drink, professional cameras, and any item deemed a safety risk by venue staff are not permitted inside the venue.

        Accessibility: Accessible seating and companion tickets are available on request — contact the organizer ahead of the event date.

        This is placeholder policy text generated for testing purposes only.
        POLICY;
    }

    /**
     * Find or create a Venue.
     */
    protected function resolveVenue(
        array $venueData,
        string $seatingType
    ): Venue {
        $cacheKey = $venueData['venue_name'];

        if (isset($this->venueCache[$cacheKey])) {
            return $this->venueCache[$cacheKey];
        }

        $venue = Venue::firstOrCreate(
            [
                'name' => $venueData['venue_name'],
            ],
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

        /*
        |--------------------------------------------------------------------------
        | Build Venue Sections + Seats
        |--------------------------------------------------------------------------
        */

        if ($venue->wasRecentlyCreated) {

            $sectionDefs = [
                [
                    'name' => 'Early Bird Rows',
                    'code' => 'EB',
                    'rows' => ['A', 'B'],
                ],

                [
                    'name' => 'General Admission Rows',
                    'code' => 'GA',
                    'rows' => [
                        'C',
                        'D',
                        'E',
                        'F',
                        'G',
                    ],
                ],

                [
                    'name' => 'VIP Rows',
                    'code' => 'VIP',
                    'rows' => [
                        'H',
                        'I',
                        'J',
                    ],
                ],
            ];

            $totalCapacity = 0;

            $now = now();

            foreach (
                $sectionDefs as $i => $definition
            ) {

                $section = VenueSection::create([
                    'venue_id' => $venue->id,

                    'name' => $definition['name'],

                    'code' => $definition['code'],

                    'sort_order' => $i,

                    'capacity' =>
                        count($definition['rows'])
                        * 20,

                    'is_active' => true,
                ]);

                /*
                |--------------------------------------------------------------------------
                | Build seats in memory
                |--------------------------------------------------------------------------
                */

                $seatRows = [];

                foreach (
                    $definition['rows']
                    as $rowLabel
                ) {

                    for (
                        $seatNumber = 1;
                        $seatNumber <= 20;
                        $seatNumber++
                    ) {

                        $seatRows[] = [
                            'venue_id' => $venue->id,

                            'venue_section_id' =>
                                $section->id,

                            'row_label' => $rowLabel,

                            'seat_number' => $seatNumber,

                            'label' =>
                                "{$rowLabel}{$seatNumber}",

                            'is_active' => true,

                            'created_at' => $now,

                            'updated_at' => $now,
                        ];

                        $totalCapacity++;
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Bulk insert seats
                |--------------------------------------------------------------------------
                */

                foreach (
                    array_chunk($seatRows, 500)
                    as $chunk
                ) {
                    VenueSeat::insert($chunk);
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Update Venue Capacity
            |--------------------------------------------------------------------------
            */

            $venue->update([
                'capacity' => $totalCapacity,
            ]);

            $venue->refresh();
        }

        return $this->venueCache[$cacheKey] = $venue;
    }

    /**
     * Clone venue seat template into EventSeat rows.
     */
    protected function seedReservedSeats(
        $leg,
        Venue $venue,
        $tiers
    ): void {
        $venue->loadMissing(
            'sections.seats'
        );

        $tierByName = $tiers->keyBy('name');

        $sectionTierMap = [
            'Early Bird Rows' =>
                $tierByName['Early Bird']->id ?? null,

            'General Admission Rows' =>
                $tierByName['General Admission']->id ?? null,

            'VIP Rows' =>
                $tierByName['VIP']->id ?? null,
        ];

        $now = now();

        $seatRows = [];

        foreach ($venue->sections as $section) {

            $ticketTierId =
                $sectionTierMap[$section->name]
                ?? null;

            foreach ($section->seats as $venueSeat) {

                if (! $venueSeat->is_active) {
                    continue;
                }

                $seatRows[] = [
                    'event_leg_id' => $leg->id,

                    'venue_seat_id' =>
                        $venueSeat->id,

                    'ticket_tier_id' =>
                        $ticketTierId,

                    'row_label' =>
                        $venueSeat->row_label,

                    'seat_number' =>
                        $venueSeat->seat_number,

                    'label' =>
                        $venueSeat->label,

                    'status' => 'available',

                    'created_at' => $now,

                    'updated_at' => $now,
                ];
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Bulk insert Event Seats
        |--------------------------------------------------------------------------
        */

        foreach (
            array_chunk($seatRows, 500)
            as $chunk
        ) {
            EventSeat::insert($chunk);
        }

        $leg->update([
            'seating_type' => 'reserved',
        ]);
    }
}
