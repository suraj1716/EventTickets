<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class EventSearchController extends Controller
{
    // Homepage / browse page. `categories` (the filter sidebar) stays as
    // a normal eager prop — it's small, cached below, and needed
    // immediately for the page to feel interactive. 'events' is the
    // heavy, relation-loaded, paginated query — wrapped in
    // Inertia::defer() so the initial response ships the page shell
    // (navbar, filters, empty grid) immediately, and the event query
    // itself only runs when Inertia's follow-up request for deferred
    // props comes in. See Events/Index.tsx for the matching <Deferred>
    // + skeleton-card fallback on the frontend.
    public function index(Request $request)
    {
        // Events/Index.tsx destructures { events, filters, categories,
        // filteredVendor } — it never reads a `departments` prop. The old
        // code still ran a full Department::with('categories') query
        // (the single most expensive query on this page, ~4.4s against a
        // remote DB) and shipped the result to a page that throws it
        // away. Dropped entirely.
        //
        // The remaining sidebar list (flat, active, top-level categories)
        // is identical for every visitor and only changes when an admin
        // edits a category, so it's cached for 10 minutes instead of
        // queried on every request. Bust with
        // Cache::forget('events.browse-categories') from a Category
        // observer/admin save action if near-real-time freshness matters.
        $categories = Cache::remember(
            'events.browse-categories',
            now()->addMinutes(10),
            fn() => Category::query()
                ->where('active', true)
                ->whereNull('parent_id')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'department_id'])
        );

        return Inertia::render('Events/Index', [
            // "Load more" pagination instead of numbered pages: the
            // frontend requests offset/limit directly (10 on first load,
            // +5 per click) and appends results client-side, so this
            // returns a plain slice + has_more flag rather than a full
            // Laravel paginator shape.
            'events' => Inertia::defer(function () use ($request) {
                // Column-restricted eager loads: EventCard (Index.tsx)
                // only ever reads leg.event_date/city, tier.price,
                // artist.name, category.name, media[].url (built from
                // type/path/thumb_path) and vendor.store_name — not the
                // full row for every related model. Cuts what Postgres
                // has to read/sort and what gets serialized over the
                // wire for every event on every page load.
                $query = Event::query()
                    ->where('status', 'published')
                    ->with([
                        'legs:id,event_id,city,event_date,sequence',
                        'legs.ticketTiers:id,event_leg_id,price',
                        'artists:id,name,slug',
                        'categories:id,name,slug',
                        'media:id,event_id,type,path,thumb_path,position',
                        'vendor:user_id,store_name',
                    ])
                    ->withCount('watchlist')

                    ->when(
                        $request->filled('search'),
                        fn($q) => $q->where(
                            'name',
                            'like',
                            '%' . $request->input('search') . '%'
                        )
                    )

                    ->when(
                        $request->filled('category'),
                        function ($q) use ($request) {
                            $q->whereHas(
                                'categories',
                                fn($categoryQuery) =>
                                $categoryQuery->where(
                                    'categories.id',
                                    $request->input('category')
                                )
                            );
                        }
                    )

                    ->when(
                        $request->filled('department'),
                        function ($q) use ($request) {
                            $q->whereHas(
                                'categories',
                                fn($categoryQuery) =>
                                $categoryQuery->where(
                                    'department_id',
                                    $request->input('department')
                                )
                            );
                        }
                    )

                    // "Browse this organizer's events" — the events-page
                    // equivalent of Eventbrite's /o/organizer-name, but as
                    // a filter on the same page rather than a separate
                    // storefront template. See Event::vendor().
                    ->when(
                        $request->filled('vendor'),
                        fn($q) => $q->where(
                            'vendor_user_id',
                            $request->input('vendor')
                        )
                    );

                // Sort dropdown was previously decorative — the query
                // always used ->latest() (created_at) no matter which
                // option was selected. Wired up for real now:
                match ($request->input('sort', 'date')) {
                    // Nearest upcoming date first. withMin() only looks at
                    // legs that haven't happened yet, so a mid-tour event
                    // sorts by its NEXT stop, not a leg that already
                    // passed — and an event with no remaining legs sorts
                    // to the bottom (NULL, which Postgres puts last on
                    // ASC by default) instead of jumping to the top.
                    'date' => $query
                        ->withMin(
                            ['legs as next_event_date' => fn($q) => $q->where('event_date', '>=', now()->toDateString())],
                            'event_date'
                        )
                        ->orderBy('next_event_date'),

                    'trending' => $query->orderByDesc('watchlist_count'),

                    'price_low' => $query
                        ->withMin('ticketTiers as min_price', 'price')
                        ->orderBy('min_price'),

                    default => $query->latest(),
                };

                $offset = max(0, (int) $request->input('offset', 0));
                $limit = min(50, max(1, (int) $request->input('limit', 10)));

                // Count against a clone taken BEFORE skip/take — count()
                // on the live query would otherwise be thrown off by
                // those. withCount/withMin add subquery select columns,
                // not joins, so they don't affect the row count here.
                $total = (clone $query)->count();

                $events = $query->skip($offset)->take($limit)->get();

                return [
                    'data' => $events,
                    'total' => $total,
                    'has_more' => ($offset + $events->count()) < $total,
                ];
            }),

            'categories' => $categories,

            'filters' => $request->only([
                'search',
                'department',
                'category',
                'sort',
                'vendor',
            ]),

            'filteredVendor' => $request->filled('vendor')
                ? \App\Models\Vendor::where('user_id', $request->input('vendor'))
                ->value('store_name')
                : null,
        ]);
    }


    // `categories` (the filter chips) stays a normal eager prop — small,
    // needed immediately so the hero renders interactive, and now
    // cached under the SAME key index() uses above (identical query:
    // active, top-level categories) so this page shares that cache
    // entry instead of re-querying it on every request. `events` is the
    // heavy, relation-loaded, paginated query — wrapped in
    // Inertia::defer() so the page shell (hero, search box, category
    // chips) ships immediately and the event query only runs on
    // Inertia's follow-up request for deferred props. Same pattern as
    // index() above and TicketResaleController::index() — see
    // Events/ComingSoon.tsx for the matching <Deferred> + skeleton
    // fallback.
    //
    // The remaining cost is the query itself: orderByDesc('watchlist_count')
    // forces Postgres to evaluate the withCount('watchlist') subquery for
    // every 'proposed' event before it can sort and limit — a real,
    // unavoidable-without-denormalizing cost that grows with the number of
    // proposed events. The event_watchlist_event_id_verified_at_index
    // migration lets that subquery run as a pure index lookup per row
    // instead of a heap scan, and relation eager-loads are now
    // column-restricted (mirrors index() above) to cut what gets
    // hydrated/serialized for the 20 rows that make it into the response.
    // If proposed-event volume grows large enough that per-row subquery
    // evaluation itself becomes the bottleneck, the next step is
    // denormalizing watchlist_count onto the events table (incremented
    // in EventWatchlistController on verify) so this can sort on an
    // indexed column directly instead of a live subquery.
    public function comingSoon(Request $request)
    {
        $categories = Cache::remember(
            'events.browse-categories',
            now()->addMinutes(10),
            fn() => Category::query()
                ->where('active', true)
                ->whereNull('parent_id')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'department_id'])
        );

        return Inertia::render('Events/ComingSoon', [
            'events' => Inertia::defer(function () use ($request) {
                $events = Event::query()
                    ->where('status', 'proposed')
                    ->select(['id', 'name', 'slug', 'type', 'status'])
                    ->with([
                        'legs:id,event_id,city,event_date,sequence',
                        'artists:id,name,slug',
                        'categories:id,name,slug',
                        'media:id,event_id,type,path,thumb_path,position',   // already here below
                    ])
                    ->withCount('watchlist')

                    ->when(
                        $request->filled('search'),
                        fn($q) => $q->where(
                            'name',
                            'like',
                            '%' . $request->input('search') . '%'
                        )
                    )

                    ->when(
                        $request->filled('category'),
                        function ($q) use ($request) {
                            $q->whereHas(
                                'categories',
                                fn($categoryQuery) =>
                                $categoryQuery->where(
                                    'categories.id',
                                    $request->input('category')
                                )
                            );
                        }
                    )

                    ->orderByDesc('watchlist_count')
                    ->paginate(20)
                    ->withQueryString();

                return [
                    'data' => $events->items(),

                    'links' => [
                        'first' => $events->url(1),
                        'last' => $events->url($events->lastPage()),
                        'prev' => $events->previousPageUrl(),
                        'next' => $events->nextPageUrl(),
                    ],

                    'meta' => [
                        'current_page' => $events->currentPage(),
                        'from' => $events->firstItem(),
                        'last_page' => $events->lastPage(),
                        'links' => $events->linkCollection()->toArray(),
                        'path' => $events->path(),
                        'per_page' => $events->perPage(),
                        'to' => $events->lastItem(),
                        'total' => $events->total(),
                    ],
                ];
            }),

            'categories' => $categories,

            'filters' => $request->only([
                'search',
                'category'
            ]),
        ]);
    }


    // Single event page — this is what resources/js/Pages/Events/Show.tsx
    // (already built) renders against. status is 'published' or 'proposed'
    // (watchlist-only) — Show.tsx already branches on that.
    public function show(Event $event)
    {
        abort_unless(
            in_array($event->status, ['published', 'proposed']),
            404
        );

        /*
    |--------------------------------------------------------------------------
    | Lightweight event shell
    |--------------------------------------------------------------------------
    |
    | Keep only what the hero needs immediately.
    |
    */
        $event->load([
            'categories:id,name,slug',
            'artists:id,name,slug',
            'media:id,event_id,type,path,thumb_path,position',
            'vendor:user_id,store_name',
        ])->loadCount('watchlist');

        return Inertia::render('Events/Show', [
            'event' => $event,

            /*
        |--------------------------------------------------------------------------
        | Heavy event data
        |--------------------------------------------------------------------------
        |
        | Loaded by Inertia after the initial page shell.
        |
        */
            'eventDetails' => Inertia::defer(function () use ($event) {
                $event->load([
                    'legs:id,event_id,venue_name,address,city,event_date,sequence',
                    'legs.ticketTiers:id,event_leg_id,name,price,remaining,starts_at,ends_at',
                    'legs.seats:id,event_leg_id,venue_seat_id,ticket_tier_id,label,row_label,seat_number,sort_order,status',
                    'legs.seats.venueSeat:id,aisle_after',
                    'products.media',
                    'products.variationTypes.options',
                    'products.variations',
                ]);

                $products = $event->products
                    ->where('status', 'published')
                    ->map(fn($product) => [
                        'id' => $product->id,
                        'event_id' => $product->event_id,
                        'title' => $product->title,
                        'slug' => $product->slug,
                        'description' => $product->description,
                        'price' => $product->price,
                        'status' => $product->status,
                        'highlight' => $product->highlight,
                        'quantity' => $product->quantity,

                        'image_url' => $product->getFirstMediaUrl('images') ?: null,

                        'variation_types' => $product->variationTypes->map(
                            fn($type) => [
                                'id' => $type->id,
                                'name' => $type->name,
                                'options' => $type->options->map(
                                    fn($option) => [
                                        'id' => $option->id,
                                        'name' => $option->name,
                                    ]
                                ),
                            ]
                        ),
                    ])
                    ->values();

                $relatedEvents = Event::query()
                    ->where('id', '!=', $event->id)
                    ->where('status', 'published')
                    ->select([
                        'id',
                        'name',
                        'slug',
                        'type',
                    ])
                    ->with([
                        'legs:id,event_id,venue_name,city,event_date,sequence',
                        'media:id,event_id,type,path,thumb_path,position',
                    ])
                    ->latest()
                    ->take(6)
                    ->get();

                return [
                    'legs' => $event->legs,
                    'products' => $products,
                    'relatedEvents' => $relatedEvents,
                ];
            }),
        ]);
    }

    protected function applyLocationFilter($query, Request $request): void
    {
        if ($request->filled(['lat', 'lng'])) {
            $lat = (float) $request->input('lat');
            $lng = (float) $request->input('lng');
            $radiusKm = (float) $request->input('radius_km', 25);

            // Haversine distance filter against event_legs
            $query->whereHas('legs', function ($leg) use ($lat, $lng, $radiusKm) {
                $leg->selectRaw(
                    '*, (6371 * acos(cos(radians(?)) * cos(radians(latitude)) *
                        cos(radians(longitude) - radians(?)) + sin(radians(?)) *
                        sin(radians(latitude)))) AS distance_km',
                    [$lat, $lng, $lat]
                )->havingRaw('distance_km <= ?', [$radiusKm]);
            });
        } elseif ($request->filled('city')) {
            $query->whereHas('legs', fn($leg) => $leg->where('city', $request->input('city')));
        }
    }

    protected function applyGenreFilter($query, Request $request): void
    {
        if ($request->filled('category_ids')) {
            $ids = (array) $request->input('category_ids');
            $query->whereHas('categories', fn($c) => $c->whereIn('categories.id', $ids));
        }
    }

    protected function applyLanguageFilter($query, Request $request): void
    {
        if ($request->filled('languages')) {
            $languages = (array) $request->input('languages');
            $query->where(function ($q) use ($languages) {
                foreach ($languages as $lang) {
                    $q->orWhereJsonContains('languages', $lang);
                }
            });
        }
    }

    protected function applyArtistFilter($query, Request $request): void
    {
        if ($request->filled('artist')) {
            $term = $request->input('artist');
            $query->whereHas('artists', fn($a) => $a->where('name', 'like', "%{$term}%"));
        }
    }

    protected function applyDateRangeFilter($query, Request $request): void
    {
        if ($request->filled('date_from') || $request->filled('date_to')) {
            $query->whereHas('legs', function ($leg) use ($request) {
                if ($request->filled('date_from')) {
                    $leg->where('event_date', '>=', $request->input('date_from'));
                }
                if ($request->filled('date_to')) {
                    $leg->where('event_date', '<=', $request->input('date_to'));
                }
            });
        }
    }

    protected function applyPriceRangeFilter($query, Request $request): void
    {
        if ($request->filled('price_min') || $request->filled('price_max')) {
            $query->whereHas('legs.ticketTiers', function ($tier) use ($request) {
                if ($request->filled('price_min')) {
                    $tier->where('price', '>=', $request->input('price_min'));
                }
                if ($request->filled('price_max')) {
                    $tier->where('price', '<=', $request->input('price_max'));
                }
            });
        }
    }

    protected function applyTypeFilter($query, Request $request): void
    {
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }
    }

    protected function applySort($query, Request $request): void
    {
        match ($request->input('sort', 'date')) {
            'trending' => $query->orderByDesc('watchlist_count'),
            'price_low' => $query->orderBy(
                fn($q) => $q->selectRaw('min(price)')->from('ticket_tiers')
                    ->join('event_legs', 'event_legs.id', '=', 'ticket_tiers.event_leg_id')
                    ->whereColumn('event_legs.event_id', 'events.id')
            ),
            default => $query->orderBy(
                fn($q) => $q->selectRaw('min(event_date)')->from('event_legs')
                    ->whereColumn('event_legs.event_id', 'events.id')
            ),
        };
    }
}
