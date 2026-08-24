<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventLeg;
use App\Models\TicketTier;
use App\Models\Venue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $events = Event::where('vendor_user_id', $request->user()->id)
            ->with(['legs.ticketTiers', 'artists', 'categories'])
            ->withCount('watchlist')
            ->when(
                $request->filled('status'),
                fn($q) => $q->where('status', $request->input('status'))
            )
            ->when(
                $request->filled('search'),
                fn($q) => $q->where('name', 'like', '%' . $request->input('search') . '%')
            )
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return \Inertia\Inertia::render('Admin/Events/Index', [
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

                    'links' => collect(range(1, $events->lastPage()))
                        ->map(fn($page) => [
                            'url' => $page === $events->currentPage()
                                ? null
                                : $events->url($page),
                            'label' => (string) $page,
                            'active' => $page === $events->currentPage(),
                        ])
                        ->values()
                        ->all(),

                    'path' => $events->path(),
                    'per_page' => $events->perPage(),
                    'to' => $events->lastItem(),
                    'total' => $events->total(),
                ],
            ],
        ]);
    }

    public function create(Request $request)
    {
        return \Inertia\Inertia::render('Admin/Events/Form', [
            'categories' => \App\Models\Category::orderBy('name')->get(),
            'venues' => Venue::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function edit(Request $request, Event $event)
    {
        $this->authorizeVendorOwnsEvent($request, $event);

        return \Inertia\Inertia::render('Admin/Events/Form', [
            'event' => $event->load(['legs.ticketTiers', 'artists', 'categories']),
            'categories' => \App\Models\Category::orderBy('name')->get(),
            'venues' => Venue::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateEvent($request);

        $event = DB::transaction(function () use ($data, $request) {
            $event = Event::create([
                'vendor_user_id' => $request->user()->id,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'type' => $data['type'],
                'status' => $data['status'] ?? 'draft',
                'languages' => $data['languages'] ?? [],
            ]);

            $event->categories()->sync($data['category_ids'] ?? []);
            $this->syncArtists($event, $data['artists'] ?? []);
            $this->syncLegs($event, $data['legs']);

            return $event;
        });

        // Redirect straight to the edit page (not back()) so the frontend
        // has the new event's id available immediately — this is what
        // Form.tsx's create-then-publish flow depends on.
        return redirect()
            ->route('admin.events.edit', $event)
            ->with('success', "Event \"{$event->name}\" saved.");
    }

    public function update(Request $request, Event $event)
    {
        $this->authorizeVendorOwnsEvent($request, $event);

        $data = $this->validateEvent($request);

        DB::transaction(function () use ($data, $event) {
            $event->update([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'type' => $data['type'],
                'status' => $data['status'] ?? $event->status,
                'languages' => $data['languages'] ?? [],
            ]);

            $event->categories()->sync($data['category_ids'] ?? []);
            $this->syncArtists($event, $data['artists'] ?? []);
            $this->syncLegs($event, $data['legs']);
        });

        return redirect()->back()->with('success', 'Event updated.');
    }

    protected function validateEvent(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:standalone,tour'],
            'status' => ['required', 'in:draft,proposed'],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['string'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'artists' => ['nullable', 'array'],
            'artists.*' => ['string', 'max:255'],

            'legs' => ['required', 'array', 'min:1'],
            // present + belongs to THIS event when editing an existing leg;
            // absent/null for a brand-new leg being added in this save.
            'legs.*.id' => ['nullable', 'integer', 'exists:event_legs,id'],
            'legs.*.venue_id' => ['nullable', 'integer', 'exists:venues,id'],
            'legs.*.venue_name' => ['required', 'string', 'max:255'],
            'legs.*.address' => ['nullable', 'string', 'max:255'],
            'legs.*.city' => ['nullable', 'string', 'max:255'],
            'legs.*.latitude' => ['nullable', 'numeric'],
            'legs.*.longitude' => ['nullable', 'numeric'],
            'legs.*.event_date' => ['required', 'date'],
            'legs.*.capacity' => ['required', 'integer', 'min:1'],

            'legs.*.tiers' => ['required', 'array', 'min:1'],
            'legs.*.tiers.*.id' => ['nullable', 'integer', 'exists:ticket_tiers,id'],
            'legs.*.tiers.*.name' => ['required', 'string', 'max:255'],
            'legs.*.tiers.*.price' => ['required', 'numeric', 'min:0'],
            'legs.*.tiers.*.quantity' => ['required', 'integer', 'min:1'],
            'legs.*.tiers.*.starts_at' => ['required', 'date'],
            'legs.*.tiers.*.ends_at' => [
                'required',
                'date',
                'after:legs.*.tiers.*.starts_at',
            ],
        ]);
    }

    public function publish(Request $request, Event $event)
    {
        $this->authorizeVendorOwnsEvent($request, $event);

        if ($event->legs()->doesntHave('ticketTiers')->exists()) {
            return redirect()->back()->withErrors([
                'event' => 'Every location needs at least one ticket tier before publishing.',
            ]);
        }

        $event->publish();

        app(\App\Services\EventWatchlistNotifier::class)->notify($event);

        return redirect()->back()->with('success', 'Event published and watchlist notified.');
    }

    public function destroy(Request $request, Event $event)
    {
        $this->authorizeVendorOwnsEvent($request, $event);
        $event->delete();

        return redirect()->back()->with('success', 'Event deleted.');
    }

    protected function syncArtists(Event $event, array $names): void
    {
        $ids = collect($names)->map(function (string $name) {
            return \App\Models\Artist::firstOrCreate(['name' => $name])->id;
        });

        $event->artists()->sync($ids);
    }

    /**
     * Diff-based sync: legs/tiers present in the payload with an `id`
     * are UPDATED IN PLACE (same row, same id) — this is what preserves
     * an already-imported EventSeat map (event_seats.event_leg_id is a
     * cascadeOnDelete FK, so recreating a leg wipes its seats) and any
     * sold Ticket/OrderItem rows referencing a ticket_tier_id.
     *
     * A leg/tier with no `id` (or an id not present in this event) is
     * treated as newly added. A leg/tier that existed before but is
     * missing from this payload is treated as removed by the vendor and
     * deleted — same as the old behavior, just scoped to what actually
     * changed instead of everything.
     *
     * Deleting a tier that still has sold tickets against it will hit
     * the same FK constraint it always would have — that's a real
     * business rule (don't let a vendor delete a tier once it's sold),
     * not something to silently swallow here. Catch it explicitly if
     * you want a friendlier error than a raw FK violation.
     */
    protected function syncLegs(Event $event, array $legs): void
    {
        $existingLegIds = $event->legs()->pluck('id')->all();
        $incomingLegIds = collect($legs)->pluck('id')->filter()->all();

        // Legs removed by the vendor in this save.
        $legIdsToDelete = array_diff($existingLegIds, $incomingLegIds);
        if (!empty($legIdsToDelete)) {
            EventLeg::whereIn('id', $legIdsToDelete)->each(function (EventLeg $leg) {
                $leg->ticketTiers()->delete(); // cascades to that leg's EventSeat rows too
                $leg->delete();
            });
        }

        foreach ($legs as $sequence => $legData) {
            $legId = $legData['id'] ?? null;
            $leg = $legId ? $event->legs()->find($legId) : null;

            $attributes = [
                'venue_id' => $legData['venue_id'] ?? null,
                'venue_name' => $legData['venue_name'],
                'address' => $legData['address'] ?? null,
                'city' => $legData['city'] ?? null,
                'latitude' => $legData['latitude'] ?? null,
                'longitude' => $legData['longitude'] ?? null,
                'event_date' => $legData['event_date'],
                'capacity' => $legData['capacity'],
                'sequence' => $sequence + 1,
            ];

            if ($leg) {
                $leg->update($attributes);
            } else {
                $leg = $event->legs()->create($attributes);
            }

            $this->syncTiers($leg, $legData['tiers']);
        }
    }

    protected function syncTiers(EventLeg $leg, array $tiers): void
    {
        $existingTierIds = $leg->ticketTiers()->pluck('id')->all();
        $incomingTierIds = collect($tiers)->pluck('id')->filter()->all();

        $tierIdsToDelete = array_diff($existingTierIds, $incomingTierIds);
        if (!empty($tierIdsToDelete)) {
            TicketTier::whereIn('id', $tierIdsToDelete)->delete();
        }

        foreach ($tiers as $tierData) {
            $tierId = $tierData['id'] ?? null;
            $tier = $tierId ? $leg->ticketTiers()->find($tierId) : null;

            if ($tier) {
                // Only adjust `remaining` by the delta if quantity changed,
                // so editing name/price/dates doesn't silently reset how
                // many tickets have already sold against this tier.
                $quantityDelta = $tierData['quantity'] - $tier->quantity;

                $tier->update([
                    'name' => $tierData['name'],
                    'price' => $tierData['price'],
                    'quantity' => $tierData['quantity'],
                    'remaining' => max(0, $tier->remaining + $quantityDelta),
                    'starts_at' => $tierData['starts_at'],
                    'ends_at' => $tierData['ends_at'],
                ]);
            } else {
                $leg->ticketTiers()->create([
                    'name' => $tierData['name'],
                    'price' => $tierData['price'],
                    'quantity' => $tierData['quantity'],
                    'remaining' => $tierData['quantity'],
                    'starts_at' => $tierData['starts_at'],
                    'ends_at' => $tierData['ends_at'],
                ]);
            }
        }
    }

    protected function authorizeVendorOwnsEvent(Request $request, Event $event): void
    {
        abort_unless($event->vendor_user_id === $request->user()->id, 403);
    }
}
