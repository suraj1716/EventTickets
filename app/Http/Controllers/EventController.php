<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventLeg;
use App\Models\EventMedia;
use App\Models\TicketTier;
use App\Models\Venue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class EventController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Event index
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        $events = Event::where('vendor_user_id', $request->user()->id)
            ->with(['media', 'legs.ticketTiers', 'artists', 'categories'])
            ->withCount('watchlist')
            ->when(
                $request->filled('status'),
                fn($q) => $q->where('status', $request->input('status'))
            )
            ->when(
                $request->filled('search'),
                fn($q) => $q->where(
                    'name',
                    'like',
                    '%' . $request->input('search') . '%'
                )
            )
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Events/Index', [
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

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    public function create(Request $request)
    {
        return Inertia::render('Admin/Events/Form', [
            'categories' => \App\Models\Category::orderBy('name')->get(),
            'venues' => Venue::where('is_active', true)
                ->orderBy('name')
                ->get(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Edit
    |--------------------------------------------------------------------------
    */

    public function edit(Request $request, Event $event)
    {
        $this->authorizeVendorOwnsEvent($request, $event);

        return Inertia::render('Admin/Events/Form', [
            'event' => $event->load([
                'legs.ticketTiers' => function ($query) {
                    $query->withCount([
                        'tickets as sold_count' => fn($q) => $q->whereIn('status', ['valid', 'used']),
                    ]);
                },
                'artists',
                'categories',
                'media',
            ]),
            'categories' => \App\Models\Category::orderBy('name')->get(),
            'venues' => Venue::where('is_active', true)
                ->orderBy('name')
                ->get(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Store
    |--------------------------------------------------------------------------
    */

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

        $this->handleMediaUpload($request, $event);

        return redirect()
            ->route('admin.events.edit', $event)
            ->with('success', "Event \"{$event->name}\" saved.");
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        Event $event
    ) {
        $this->authorizeVendorOwnsEvent(
            $request,
            $event
        );

        $data = $this->validateEvent(
            $request,
            $event
        );

        $this->assertLegAndTierEditsAreSafe($event, $data['legs']);

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

        $this->handleMediaUpload($request, $event);

        return redirect()->back()->with('success', 'Event updated.');
    }

    /*
    |--------------------------------------------------------------------------
    | Sold-ticket protection
    |--------------------------------------------------------------------------
    |
    | syncLegs()/syncTiers() below delete any leg/tier missing from the
    | incoming payload, and ticket_tiers.id cascadeOnDelete()s into the
    | tickets table (see 2026_08_10_000006_create_tickets_table.php).
    | Without this guard, removing a leg or tier — or shrinking its
    | capacity/quantity — after tickets have sold would silently delete
    | those buyers' tickets. This runs BEFORE syncLegs() touches anything.
    */
    protected function assertLegAndTierEditsAreSafe(
        Event $event,
        array $incomingLegs
    ): void {
        $event->load('legs.ticketTiers');

        // Sold/issued ticket counts, keyed by leg id and by tier id.
        // 'void' tickets are refunded/cancelled — they don't block edits.
        $soldByLeg = \App\Models\Ticket::whereIn(
            'event_leg_id',
            $event->legs->pluck('id')
        )
            ->whereIn('status', ['valid', 'used'])
            ->selectRaw('event_leg_id, ticket_tier_id, COUNT(*) as total')
            ->groupBy('event_leg_id', 'ticket_tier_id')
            ->get();

        $soldPerLeg = $soldByLeg
            ->groupBy('event_leg_id')
            ->map(fn($rows) => $rows->sum('total'));

        $soldPerTier = $soldByLeg->keyBy('ticket_tier_id')
            ->map(fn($row) => $row->total);

        $incomingLegIds = collect($incomingLegs)->pluck('id')->filter()->all();

        foreach ($event->legs as $leg) {
            $legSoldCount = (int) ($soldPerLeg[$leg->id] ?? 0);

            // Leg removed entirely.
            if (!in_array($leg->id, $incomingLegIds, true)) {
                if ($legSoldCount > 0) {
                    throw ValidationException::withMessages([
                        'legs' => "\"{$leg->venue_name}\" has {$legSoldCount} sold ticket(s) and can't be removed.",
                    ]);
                }
                continue;
            }

            $incomingLeg = collect($incomingLegs)->firstWhere('id', $leg->id);

            // Venue swapped after tickets sold — the seats/venue those
            // tickets refer to would no longer make sense.
            if (
                $legSoldCount > 0
                && (int) ($incomingLeg['venue_id'] ?? 0) !== (int) $leg->venue_id
            ) {
                throw ValidationException::withMessages([
                    'legs' => "\"{$leg->venue_name}\" has sold tickets and its venue can't be changed.",
                ]);
            }

            // Capacity dropped below tickets already sold.
            if ($legSoldCount > 0 && (int) $incomingLeg['capacity'] < $legSoldCount) {
                throw ValidationException::withMessages([
                    'legs' => "\"{$leg->venue_name}\" has {$legSoldCount} sold ticket(s) — capacity can't go below that.",
                ]);
            }

            $incomingTierIds = collect($incomingLeg['tiers'])->pluck('id')->filter()->all();

            foreach ($leg->ticketTiers as $tier) {
                $tierSoldCount = (int) ($soldPerTier[$tier->id] ?? 0);

                // Tier removed entirely.
                if (!in_array($tier->id, $incomingTierIds, true)) {
                    if ($tierSoldCount > 0) {
                        throw ValidationException::withMessages([
                            'legs' => "Tier \"{$tier->name}\" has {$tierSoldCount} sold ticket(s) and can't be removed.",
                        ]);
                    }
                    continue;
                }

                $incomingTier = collect($incomingLeg['tiers'])->firstWhere('id', $tier->id);

                // Once a tier has sold tickets, it's frozen entirely.
                // Changing price after some buyers already paid a
                // different price is unfair to those customers, so name,
                // price, quantity, and the sale window all get locked —
                // not just quantity.
                if ($tierSoldCount > 0) {
                    $changed =
                        $incomingTier['name'] !== $tier->name
                        || (float) $incomingTier['price'] !== (float) $tier->price
                        || (int) $incomingTier['quantity'] !== (int) $tier->quantity
                        || \Illuminate\Support\Carbon::parse($incomingTier['starts_at'])->ne($tier->starts_at)
                        || \Illuminate\Support\Carbon::parse($incomingTier['ends_at'])->ne($tier->ends_at);

                    if ($changed) {
                        throw ValidationException::withMessages([
                            'legs' => "Tier \"{$tier->name}\" has {$tierSoldCount} sold ticket(s) and can no longer be edited.",
                        ]);
                    }
                }
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    protected function validateEvent(
        Request $request,
        ?Event $event = null
    ): array {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:standalone,tour'],
            'status' => [
                'required',
                $event
                    ? 'in:draft,proposed,published'
                    : 'in:draft,proposed',
            ],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['string'],

            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => [
                'integer',
                'exists:categories,id',
            ],

            'artists' => ['nullable', 'array'],
            'artists.*' => ['string', 'max:255'],

            'legs' => ['required', 'array', 'min:1'],
            'legs.*.id' => [
                'nullable',
                'integer',
                'exists:event_legs,id',
            ],
            'legs.*.venue_id' => [
                'nullable',
                'integer',
                'exists:venues,id',
            ],
            'legs.*.venue_name' => [
                'required',
                'string',
                'max:255',
            ],
            'legs.*.address' => [
                'nullable',
                'string',
                'max:255',
            ],
            'legs.*.city' => [
                'nullable',
                'string',
                'max:255',
            ],
            'legs.*.latitude' => ['nullable', 'numeric'],
            'legs.*.longitude' => ['nullable', 'numeric'],
            'legs.*.event_date' => ['required', 'date'],
            'legs.*.capacity' => ['required', 'integer', 'min:1'],

            'legs.*.tiers' => [
                'required',
                'array',
                'min:1',
            ],
            'legs.*.tiers.*.id' => [
                'nullable',
                'integer',
                'exists:ticket_tiers,id',
            ],
            'legs.*.tiers.*.name' => [
                'required',
                'string',
                'max:255',
            ],
            'legs.*.tiers.*.price' => [
                'required',
                'numeric',
                'min:0',
            ],
            'legs.*.tiers.*.quantity' => [
                'required',
                'integer',
                'min:1',
            ],
            'legs.*.tiers.*.starts_at' => [
                'required',
                'date',
            ],
            'legs.*.tiers.*.ends_at' => [
                'required',
                'date',
                'after:legs.*.tiers.*.starts_at',
            ],

            'media' => [
                'sometimes',
                'array',
                'max:2',
            ],
            'media.*' => [
                'file',
                function ($attribute, $file, $fail) {
                    $mimeType = $file->getMimeType();
                    $isImage = str_starts_with($mimeType, 'image/');
                    $isVideo = str_starts_with($mimeType, 'video/');

                    if (!$isImage && !$isVideo) {
                        $fail('Each file must be an image or a video.');
                        return;
                    }

                    $maxKb = $isImage ? 5120 : 51200;

                    if ($file->getSize() / 1024 > $maxKb) {
                        $fail(
                            $isImage
                                ? 'Images must be 5MB or smaller.'
                                : 'Videos must be 50MB or smaller.'
                        );
                        return;
                    }

                    $okImage = in_array(
                        $mimeType,
                        ['image/jpeg', 'image/png', 'image/webp'],
                        true
                    );

                    $okVideo = in_array(
                        $mimeType,
                        ['video/mp4', 'video/webm', 'video/quicktime'],
                        true
                    );

                    if ($isImage && !$okImage) {
                        $fail('Images must be JPG, PNG, or WEBP.');
                    }

                    if ($isVideo && !$okVideo) {
                        $fail('Videos must be MP4, WEBM, or MOV.');
                    }
                },
            ],

            'remove_media_ids' => [
                'sometimes',
                'array',
            ],
            'remove_media_ids.*' => [
                'integer',
                'exists:event_media,id',
            ],
        ]);

        foreach ($data['legs'] as $legIndex => $legData) {
            $capacity = (int) $legData['capacity'];

            // Reserved-seating legs get their capacity from the seat map
            // (see EventSeatController::import/destroySeat/destroy) — the
            // form must not be able to override it.
            if (($legData['id'] ?? null)) {
                $existingLeg = EventLeg::find($legData['id']);

                if (
                    $existingLeg && $existingLeg->seating_type === 'reserved'
                    && $capacity !== $existingLeg->capacity
                ) {
                    $capacity = $existingLeg->capacity;
                    $data['legs'][$legIndex]['capacity'] = $capacity;
                }
            }

            $totalTierQuantity = collect($legData['tiers'])
                ->sum(fn($tier) => (int) $tier['quantity']);

            if ($totalTierQuantity > $capacity) {
                throw ValidationException::withMessages([
                    "legs.{$legIndex}.capacity" =>
                    "Total ticket quantity ({$totalTierQuantity}) exceeds venue capacity ({$capacity}) for this leg.",
                ]);
            }
        }



        /*
        |--------------------------------------------------------------------------
        | Maximum 2 media files TOTAL
        |--------------------------------------------------------------------------
        */

        if ($event) {
            $existingCount = $event->media()->count();
            $removeIds = $data['remove_media_ids'] ?? [];

            $removedExistingCount = empty($removeIds)
                ? 0
                : $event->media()
                ->whereIn('id', $removeIds)
                ->count();

            $remainingExistingCount =
                $existingCount - $removedExistingCount;

            $newMediaCount = isset($data['media'])
                ? count($data['media'])
                : 0;

            if ($remainingExistingCount + $newMediaCount > 2) {
                throw ValidationException::withMessages([
                    'media' => 'An event can have a maximum of 2 media files.',
                ]);
            }
        } else {
            $newMediaCount = isset($data['media'])
                ? count($data['media'])
                : 0;

            if ($newMediaCount > 2) {
                throw ValidationException::withMessages([
                    'media' => 'An event can have a maximum of 2 media files.',
                ]);
            }
        }

        return $data;
    }

    /*
    |--------------------------------------------------------------------------
    | Media upload / deletion
    |--------------------------------------------------------------------------
    */

    protected function handleMediaUpload(
        Request $request,
        Event $event
    ): void {
        if ($request->filled('remove_media_ids')) {
            $event->media()
                ->whereIn('id', $request->input('remove_media_ids'))
                ->get()
                ->each(function (EventMedia $media) {
                    Storage::disk('public')->delete($media->path);
                    $media->delete();
                });
        }

        if (!$request->hasFile('media')) {
            return;
        }

        $currentCount = $event->media()->count();
        $newFiles = $request->file('media');

        if (!is_array($newFiles)) {
            $newFiles = [$newFiles];
        }

        if ($currentCount + count($newFiles) > 2) {
            throw ValidationException::withMessages([
                'media' => 'An event can have a maximum of 2 media files.',
            ]);
        }

        $position = (int) $event->media()->max('position') + 1;

        foreach ($newFiles as $file) {
            $mimeType = $file->getMimeType();
            $isVideo = str_starts_with($mimeType, 'video/');

            $path = $file->store(
                "events/{$event->id}",
                'public'
            );

            $event->media()->create([
                'type' => $isVideo ? 'video' : 'image',
                'path' => $path,
                'mime_type' => $mimeType,
                'size' => $file->getSize(),
                'position' => $position++,
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Publish
    |--------------------------------------------------------------------------
    */

    public function publish(Request $request, Event $event)
    {
        $this->authorizeVendorOwnsEvent($request, $event);

        if (
            $event->legs()
            ->doesntHave('ticketTiers')
            ->exists()
        ) {
            return redirect()
                ->back()
                ->withErrors([
                    'event' =>
                    'Every location needs at least one ticket tier before publishing.',
                ]);
        }

        $event->publish();

        return redirect()
            ->back()
            ->with(
                'success',
                'Event published. Verified watchlist subscribers have been notified.'
            );
    }

    /*
    |--------------------------------------------------------------------------
    | Destroy
    |--------------------------------------------------------------------------
    */

    public function destroy(Request $request, Event $event)
    {
        $this->authorizeVendorOwnsEvent($request, $event);

        $event->load('media');

        foreach ($event->media as $media) {
            Storage::disk('public')->delete($media->path);
        }

        $event->delete();

        return redirect()
            ->back()
            ->with('success', 'Event deleted.');
    }

    /*
    |--------------------------------------------------------------------------
    | Artists
    |--------------------------------------------------------------------------
    */

    protected function syncArtists(Event $event, array $names): void
    {
        $ids = collect($names)
            ->map(
                fn(string $name) =>
                \App\Models\Artist::firstOrCreate([
                    'name' => $name,
                ])->id
            );

        $event->artists()->sync($ids);
    }

    /*
    |--------------------------------------------------------------------------
    | Event legs
    |--------------------------------------------------------------------------
    */

    protected function syncLegs(Event $event, array $legs): void
    {
        $existingLegIds = $event->legs()->pluck('id')->all();

        $incomingLegIds = collect($legs)
            ->pluck('id')
            ->filter()
            ->all();

        $legIdsToDelete = array_diff(
            $existingLegIds,
            $incomingLegIds
        );

        if (!empty($legIdsToDelete)) {
            EventLeg::whereIn('id', $legIdsToDelete)
                ->each(function (EventLeg $leg) {
                    $leg->ticketTiers()->delete();
                    $leg->delete();
                });
        }

        foreach ($legs as $sequence => $legData) {
            $legId = $legData['id'] ?? null;

            $leg = $legId
                ? $event->legs()->find($legId)
                : null;

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

    /*
    |--------------------------------------------------------------------------
    | Ticket tiers
    |--------------------------------------------------------------------------
    */

    protected function syncTiers(EventLeg $leg, array $tiers): void
    {
        $existingTierIds = $leg->ticketTiers()->pluck('id')->all();

        $incomingTierIds = collect($tiers)
            ->pluck('id')
            ->filter()
            ->all();

        $tierIdsToDelete = array_diff(
            $existingTierIds,
            $incomingTierIds
        );

        if (!empty($tierIdsToDelete)) {
            TicketTier::whereIn('id', $tierIdsToDelete)->delete();
        }

        foreach ($tiers as $tierData) {
            $tierId = $tierData['id'] ?? null;

            $tier = $tierId
                ? $leg->ticketTiers()->find($tierId)
                : null;

            if ($tier) {
                $quantityDelta =
                    $tierData['quantity'] - $tier->quantity;

                $tier->update([
                    'name' => $tierData['name'],
                    'price' => $tierData['price'],
                    'quantity' => $tierData['quantity'],
                    'remaining' => max(
                        0,
                        $tier->remaining + $quantityDelta
                    ),
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

    /*
    |--------------------------------------------------------------------------
    | Authorization
    |--------------------------------------------------------------------------
    */

    protected function authorizeVendorOwnsEvent(
        Request $request,
        Event $event
    ): void {
        abort_unless(
            $event->vendor_user_id === $request->user()->id,
            403
        );
    }
}
