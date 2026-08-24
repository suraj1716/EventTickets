<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Category;
use App\Models\Department;

class EventSearchController extends Controller
{
    // Homepage / browse page. 'Events/Index' doesn't exist as a .tsx yet —
    // build it whenever you're ready, this controller is already correct
    // for it.
    public function index(Request $request)
    {
        $events = Event::query()
            ->where('status', 'published')
            ->with([
                'legs.ticketTiers',
                'legs.seats',
                'artists',
                'categories',
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

            ->latest()
            ->paginate(20)
            ->withQueryString();

        $departments = Department::query()
            ->where('active', true)
            ->with([
                'categories' => fn($q) =>
                $q->where('active', true)
                    ->whereNull('parent_id')
                    ->orderBy('name'),
            ])
            ->orderBy('name')
            ->get();

        $categories = Category::query()
            ->where('active', true)
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'slug',
                'department_id',
            ]);

        return Inertia::render('Events/Index', [
            'events' => [
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
            ],

            'departments' => $departments,
            'categories' => $categories,

            'filters' => $request->only([
                'search',
                'department',
                'category',
            ]),
        ]);
    }


    // EventSearchController.php — add this method

    public function comingSoon(Request $request)
    {
        $events = Event::query()
            ->where('status', 'proposed')
            ->with(['legs', 'artists', 'categories'])
            ->withCount('watchlist')

            ->when(
                $request->filled('search'),
                fn($q) => $q->where('name', 'like', '%' . $request->input('search') . '%')
            )

            ->when(
                $request->filled('category'),
                function ($q) use ($request) {
                    $q->whereHas(
                        'categories',
                        fn($categoryQuery) => $categoryQuery->where('categories.id', $request->input('category'))
                    );
                }
            )

            ->orderByDesc('watchlist_count')
            ->paginate(20)
            ->withQueryString();

        $categories = Category::query()
            ->where('active', true)
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'department_id']);

        return Inertia::render('Events/ComingSoon', [
            'events' => [
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
            ],
            'categories' => $categories,
            'filters' => $request->only(['search', 'category']),
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

        $event->load([
            'categories',
            'artists',
            'legs.ticketTiers',
            'legs.seats',
        ])->loadCount('watchlist');   // <-- add this

        $relatedEvents = Event::query()
            ->where('id', '!=', $event->id)
            ->where('status', 'published')
            ->with(['legs.ticketTiers'])
            ->latest()
            ->take(6)
            ->get();

        return Inertia::render('Events/Show', [
            'event' => $event,
            'relatedEvents' => $relatedEvents,
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
