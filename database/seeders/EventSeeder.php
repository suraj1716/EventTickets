<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Department;
use App\Models\Event;
use App\Models\EventMedia;
use App\Models\EventSeat;
use App\Models\User;
use App\Models\Venue;
use App\Models\VenueSection;
use App\Models\VenueSeat;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EventSeeder extends Seeder
{
    /**
     * Pexels API key. Add PEXELS_API_KEY=... to your .env
     * (free tier: https://www.pexels.com/api/)
     */
    protected string $pexelsKey;

    public function __construct()
    {
        $this->pexelsKey = (string) env('PEXELS_API_KEY', '');
    }

    /**
     * Category => search query used to pull a relevant
     * photo + video from Pexels, instead of random
     * Picsum placeholders.
     */
    protected array $categoryQueries = [
        'Live Music' => 'live concert crowd stage lights',
        'Concerts' => 'concert stage lights crowd',
        'Festivals' => 'music festival crowd outdoor',
        'Comedy' => 'comedy stand up stage microphone',
        'Theatre' => 'theatre stage performance audience',
        'Sports' => 'stadium sports crowd game',
        'Workshops' => 'workshop people learning event',
        'Conferences' => 'conference business event audience',
        'Family Events' => 'family event festival fun outdoor',
        'Cultural Events' => 'cultural festival celebration event',
    ];

    /**
     * Download a category-matched photo + video from Pexels and
     * save them to:
     *
     * storage/app/public/events/{event_id}/{slug}.jpg
     * storage/app/public/events/{event_id}/{slug}.mp4
     *
     * Then create event_media records (image position 0, video position 1).
     * Keeps the "2 media items per event" rule.
     */
    protected function downloadEventMedia(Event $event, string $category): void
    {
        if (empty($this->pexelsKey)) {
            $this->command?->warn(
                "PEXELS_API_KEY not set — skipping media for '{$event->name}'."
            );

            return;
        }

        $query = $this->categoryQueries[$category] ?? 'live event crowd';
        $slug = Str::slug($event->name);

        $this->downloadEventPhoto($event, $slug, $query);
        $this->downloadEventVideo($event, $slug, $query);
    }

    protected function downloadEventPhoto(Event $event, string $slug, string $query): void
    {
        $path = "events/{$event->id}/{$slug}.jpg";

        if ($event->media()->where('path', $path)->exists()) {
            return;
        }

        try {
            $search = Http::withHeaders([
                'Authorization' => $this->pexelsKey,
            ])->timeout(10)->get('https://api.pexels.com/v1/search', [
                'query' => $query,
                'orientation' => 'landscape',
                'per_page' => 1,
            ]);

            if (! $search->successful()) {
                $this->command?->warn(
                    "Pexels photo search failed for '{$event->name}' — skipped."
                );

                return;
            }

            $photo = $search->json('photos.0');

            if (! $photo) {
                $this->command?->warn(
                    "No Pexels photo found for '{$event->name}' ({$query})."
                );

                return;
            }

            $imageUrl = $photo['src']['large'] ?? $photo['src']['medium'] ?? null;

            if (! $imageUrl) {
                return;
            }

            $response = Http::timeout(15)->get($imageUrl);

            if (! $response->successful()) {
                $this->command?->warn(
                    "Could not download photo for '{$event->name}' — skipped."
                );

                return;
            }

            Storage::disk('public')->put($path, $response->body());

            $event->media()->create([
                'type' => 'image',
                'path' => $path,
                'mime_type' => 'image/jpeg',
                'size' => Storage::disk('public')->size($path),
                'position' => 0,
            ]);

            $this->command?->info("Photo added for '{$event->name}'.");
        } catch (\Exception $e) {
            $this->command?->warn(
                "Photo download failed for '{$event->name}': " . $e->getMessage()
            );
        }
    }

    protected function downloadEventVideo(Event $event, string $slug, string $query): void
    {
        $path = "events/{$event->id}/{$slug}.mp4";

        if ($event->media()->where('path', $path)->exists()) {
            return;
        }

        try {
            $search = Http::withHeaders([
                'Authorization' => $this->pexelsKey,
            ])->timeout(10)->get('https://api.pexels.com/videos/search', [
                'query' => $query,
                'orientation' => 'landscape',
                'per_page' => 1,
            ]);

            if (! $search->successful()) {
                $this->command?->warn(
                    "Pexels video search failed for '{$event->name}' — skipped."
                );

                return;
            }

            $video = $search->json('videos.0');

            if (! $video) {
                $this->command?->warn(
                    "No Pexels video found for '{$event->name}' ({$query})."
                );

                return;
            }

            // Pick the smallest usable mp4 file to keep the seed fast/light.
            $files = collect($video['video_files'] ?? [])
                ->where('file_type', 'video/mp4')
                ->filter(fn ($f) => ! empty($f['link']))
                ->sortBy(fn ($f) => $f['width'] ?? 9999)
                ->values();

            $file = $files->first(fn ($f) => ($f['width'] ?? 0) >= 480 && ($f['width'] ?? 0) <= 960)
                ?? $files->first();

            if (! $file) {
                return;
            }

            $response = Http::timeout(30)->get($file['link']);

            if (! $response->successful()) {
                $this->command?->warn(
                    "Could not download video for '{$event->name}' — skipped."
                );

                return;
            }

            Storage::disk('public')->put($path, $response->body());

            $event->media()->create([
                'type' => 'video',
                'path' => $path,
                'mime_type' => 'video/mp4',
                'size' => Storage::disk('public')->size($path),
                'position' => 1,
            ]);

            $this->command?->info("Video added for '{$event->name}'.");
        } catch (\Exception $e) {
            $this->command?->warn(
                "Video download failed for '{$event->name}': " . $e->getMessage()
            );
        }
    }

    /**
     * Venue cache:
     *
     * venue name => Venue model
     *
     * Prevents repeated venues from being duplicated.
     */
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
        | Create events
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

                       'status' => $eventIndex >= 6 ? 'proposed' : 'published',

                        'languages' => ['English'],

                        'watchlist_enabled' => $eventIndex >= 6,
                        'published_at' => $eventIndex >= 6 ? null : now(),
                    ]
                );

                /*
                |--------------------------------------------------------------------------
                | Event Media (1 photo + 1 video, category-matched via Pexels)
                |--------------------------------------------------------------------------
                */

                $this->downloadEventMedia($event, $eventData['category']);

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
                |
                | Makes the seeder repeatable in development.
                |
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
            }
        });

        $this->command?->info(
            'Events & Entertainment department, categories, venues, events, tours, ticket tiers, reserved seats, and event media seeded successfully.'
        );
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

            foreach (
                $sectionDefs
                as $i => $definition
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

                foreach (
                    $definition['rows']
                    as $rowLabel
                ) {
                    for (
                        $seatNumber = 1;
                        $seatNumber <= 20;
                        $seatNumber++
                    ) {
                        VenueSeat::create([
                            'venue_id' => $venue->id,

                            'venue_section_id' =>
                                $section->id,

                            'row_label' =>
                                $rowLabel,

                            'seat_number' =>
                                $seatNumber,

                            'label' =>
                                "{$rowLabel}{$seatNumber}",

                            'is_active' => true,
                        ]);

                        $totalCapacity++;
                    }
                }
            }

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

        foreach ($venue->sections as $section) {
            $ticketTierId =
                $sectionTierMap[$section->name]
                ?? null;

            foreach ($section->seats as $venueSeat) {
                if (! $venueSeat->is_active) {
                    continue;
                }

                EventSeat::create([
                    'event_leg_id' =>
                        $leg->id,

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
                ]);
            }
        }

        $leg->update([
            'seating_type' => 'reserved',
        ]);
    }
}
