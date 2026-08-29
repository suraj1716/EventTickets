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
        $events = Event::where(
                'vendor_user_id',
                $request->user()->id
            )
            ->with([
                'media',
                'legs.ticketTiers',
                'artists',
                'categories',
            ])
            ->withCount('watchlist')
            ->when(
                $request->filled('status'),
                fn ($q) => $q->where(
                    'status',
                    $request->input('status')
                )
            )
            ->when(
                $request->filled('search'),
                fn ($q) => $q->where(
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
                    'last' => $events->url(
                        $events->lastPage()
                    ),
                    'prev' => $events->previousPageUrl(),
                    'next' => $events->nextPageUrl(),
                ],

                'meta' => [
                    'current_page' => $events->currentPage(),

                    'from' => $events->firstItem(),

                    'last_page' => $events->lastPage(),

                    'links' => collect(
                        range(1, $events->lastPage())
                    )
                        ->map(fn ($page) => [
                            'url' =>
                                $page === $events->currentPage()
                                    ? null
                                    : $events->url($page),

                            'label' => (string) $page,

                            'active' =>
                                $page === $events->currentPage(),
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
            'categories' => \App\Models\Category::orderBy('name')
                ->get(),

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

    public function edit(
        Request $request,
        Event $event
    ) {
        $this->authorizeVendorOwnsEvent(
            $request,
            $event
        );

        return Inertia::render('Admin/Events/Form', [
            'event' => $event->load([
                'legs.ticketTiers',
                'artists',
                'categories',
                'media',
            ]),

            'categories' =>
                \App\Models\Category::orderBy('name')->get(),

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

        $event = DB::transaction(function () use (
            $data,
            $request
        ) {
            $event = Event::create([
                'vendor_user_id' =>
                    $request->user()->id,

                'name' =>
                    $data['name'],

                'description' =>
                    $data['description'] ?? null,

                'type' =>
                    $data['type'],

                'status' =>
                    $data['status'] ?? 'draft',

                'languages' =>
                    $data['languages'] ?? [],
            ]);

            /*
             * Categories
             */
            $event->categories()->sync(
                $data['category_ids'] ?? []
            );

            /*
             * Artists
             */
            $this->syncArtists(
                $event,
                $data['artists'] ?? []
            );

            /*
             * Legs + ticket tiers
             */
            $this->syncLegs(
                $event,
                $data['legs']
            );

            return $event;
        });

        /*
         * Media needs the event ID.
         */
        $this->handleMediaUpload(
            $request,
            $event
        );

        return redirect()
            ->route(
                'admin.events.edit',
                $event
            )
            ->with(
                'success',
                "Event \"{$event->name}\" saved."
            );
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

        DB::transaction(function () use (
            $data,
            $event
        ) {
            $event->update([
                'name' =>
                    $data['name'],

                'description' =>
                    $data['description'] ?? null,

                'type' =>
                    $data['type'],

                'status' =>
                    $data['status'] ?? $event->status,

                'languages' =>
                    $data['languages'] ?? [],
            ]);

            /*
             * Categories
             */
            $event->categories()->sync(
                $data['category_ids'] ?? []
            );

            /*
             * Artists
             */
            $this->syncArtists(
                $event,
                $data['artists'] ?? []
            );

            /*
             * Legs + ticket tiers
             */
            $this->syncLegs(
                $event,
                $data['legs']
            );
        });

        /*
         * Delete selected media and upload new media.
         */
        $this->handleMediaUpload(
            $request,
            $event
        );

        return redirect()
            ->back()
            ->with(
                'success',
                'Event updated.'
            );
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
            /*
             * Event
             */
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'type' => [
                'required',
                'in:standalone,tour',
            ],

           'status' => [
    'required',
    $event
        ? 'in:draft,proposed,published'
        : 'in:draft,proposed',
],

            'languages' => [
                'nullable',
                'array',
            ],

            'languages.*' => [
                'string',
            ],

            /*
             * Categories
             */
            'category_ids' => [
                'nullable',
                'array',
            ],

            'category_ids.*' => [
                'integer',
                'exists:categories,id',
            ],

            /*
             * Artists
             */
            'artists' => [
                'nullable',
                'array',
            ],

            'artists.*' => [
                'string',
                'max:255',
            ],

            /*
             * Event legs
             */
            'legs' => [
                'required',
                'array',
                'min:1',
            ],

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

            'legs.*.latitude' => [
                'nullable',
                'numeric',
            ],

            'legs.*.longitude' => [
                'nullable',
                'numeric',
            ],

            'legs.*.event_date' => [
                'required',
                'date',
            ],

            'legs.*.capacity' => [
                'required',
                'integer',
                'min:1',
            ],

            /*
             * Ticket tiers
             */
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

            /*
             * Event media
             *
             * Maximum 2 new files in one request.
             */
            'media' => [
                'sometimes',
                'array',
                'max:2',
            ],

            'media.*' => [
                'file',

                function (
                    $attribute,
                    $file,
                    $fail
                ) {
                    $mimeType =
                        $file->getMimeType();

                    $isImage =
                        str_starts_with(
                            $mimeType,
                            'image/'
                        );

                    $isVideo =
                        str_starts_with(
                            $mimeType,
                            'video/'
                        );

                    /*
                     * Must be image or video.
                     */
                    if (
                        !$isImage &&
                        !$isVideo
                    ) {
                        $fail(
                            'Each file must be an image or a video.'
                        );

                        return;
                    }

                    /*
                     * Size limits.
                     *
                     * Images: 5 MB
                     * Videos: 50 MB
                     */
                    $maxKb = $isImage
                        ? 5120
                        : 51200;

                    if (
                        $file->getSize() / 1024
                        > $maxKb
                    ) {
                        $fail(
                            $isImage
                                ? 'Images must be 5MB or smaller.'
                                : 'Videos must be 50MB or smaller.'
                        );

                        return;
                    }

                    /*
                     * Allowed image MIME types.
                     */
                    $okImage = in_array(
                        $mimeType,
                        [
                            'image/jpeg',
                            'image/png',
                            'image/webp',
                        ],
                        true
                    );

                    /*
                     * Allowed video MIME types.
                     */
                    $okVideo = in_array(
                        $mimeType,
                        [
                            'video/mp4',
                            'video/webm',
                            'video/quicktime',
                        ],
                        true
                    );

                    if (
                        $isImage &&
                        !$okImage
                    ) {
                        $fail(
                            'Images must be JPG, PNG, or WEBP.'
                        );
                    }

                    if (
                        $isVideo &&
                        !$okVideo
                    ) {
                        $fail(
                            'Videos must be MP4, WEBM, or MOV.'
                        );
                    }
                },
            ],

            /*
             * Existing media selected for deletion.
             */
            'remove_media_ids' => [
                'sometimes',
                'array',
            ],

            'remove_media_ids.*' => [
                'integer',
                'exists:event_media,id',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Maximum 2 media files TOTAL
        |--------------------------------------------------------------------------
        |
        | Laravel's "max:2" above only limits the number of NEW
        | files being uploaded in this request.
        |
        | We also need to account for media already attached
        | to the event.
        |
        */

        if ($event) {
            $existingCount = $event
                ->media()
                ->count();

            $removeIds =
                $data['remove_media_ids'] ?? [];

            $removedExistingCount = empty($removeIds)
                ? 0
                : $event
                    ->media()
                    ->whereIn(
                        'id',
                        $removeIds
                    )
                    ->count();

            $remainingExistingCount =
                $existingCount
                - $removedExistingCount;

            $newMediaCount =
                isset($data['media'])
                    ? count($data['media'])
                    : 0;

            if (
                $remainingExistingCount
                + $newMediaCount
                > 2
            ) {
                throw ValidationException::withMessages([
                    'media' =>
                        'An event can have a maximum of 2 media files.',
                ]);
            }
        } else {
            /*
             * Create:
             * maximum 2 uploaded files.
             */
            $newMediaCount =
                isset($data['media'])
                    ? count($data['media'])
                    : 0;

            if ($newMediaCount > 2) {
                throw ValidationException::withMessages([
                    'media' =>
                        'An event can have a maximum of 2 media files.',
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
        /*
         * --------------------------------------------------------------
         * Remove existing media
         * --------------------------------------------------------------
         */

        if ($request->filled('remove_media_ids')) {
            $event
                ->media()
                ->whereIn(
                    'id',
                    $request->input(
                        'remove_media_ids'
                    )
                )
                ->get()
                ->each(
                    function (
                        EventMedia $media
                    ) {
                        /*
                         * Delete physical file.
                         */
                        Storage::disk('public')->delete(
                            $media->path
                        );

                        /*
                         * Delete database record.
                         */
                        $media->delete();
                    }
                );
        }

        /*
         * --------------------------------------------------------------
         * Upload new media
         * --------------------------------------------------------------
         */

        if (!$request->hasFile('media')) {
            return;
        }

        /*
         * Safety check:
         *
         * Never allow more than 2 media records.
         */
        $currentCount = $event
            ->media()
            ->count();

        $newFiles = $request->file('media');

        if (!is_array($newFiles)) {
            $newFiles = [$newFiles];
        }

        if (
            $currentCount + count($newFiles)
            > 2
        ) {
            throw ValidationException::withMessages([
                'media' =>
                    'An event can have a maximum of 2 media files.',
            ]);
        }

        /*
         * Start position after existing media.
         */
        $position = (int) $event
            ->media()
            ->max('position') + 1;

        foreach (
            $newFiles as $file
        ) {
            $mimeType =
                $file->getMimeType();

            $isVideo =
                str_starts_with(
                    $mimeType,
                    'video/'
                );

            /*
             * Store:
             *
             * storage/app/public/events/{event_id}/
             */
            $path = $file->store(
                "events/{$event->id}",
                'public'
            );

            /*
             * Create media record.
             */
            $event->media()->create([
                'type' =>
                    $isVideo
                        ? 'video'
                        : 'image',

                'path' =>
                    $path,

                'mime_type' =>
                    $mimeType,

                'size' =>
                    $file->getSize(),

                'position' =>
                    $position++,
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Publish
    |--------------------------------------------------------------------------
    */

    public function publish(
        Request $request,
        Event $event
    ) {
        $this->authorizeVendorOwnsEvent(
            $request,
            $event
        );

        /*
         * Every leg must have at least
         * one ticket tier.
         */
        if (
            $event
                ->legs()
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

    public function destroy(
        Request $request,
        Event $event
    ) {
        $this->authorizeVendorOwnsEvent(
            $request,
            $event
        );

        /*
         * Load media before deleting event.
         */
        $event->load('media');

        foreach (
            $event->media as $media
        ) {
            Storage::disk('public')->delete(
                $media->path
            );
        }

        $event->delete();

        return redirect()
            ->back()
            ->with(
                'success',
                'Event deleted.'
            );
    }

    /*
    |--------------------------------------------------------------------------
    | Artists
    |--------------------------------------------------------------------------
    */

    protected function syncArtists(
        Event $event,
        array $names
    ): void {
        $ids = collect($names)
            ->map(
                function (
                    string $name
                ) {
                    return \App\Models\Artist::firstOrCreate([
                        'name' => $name,
                    ])->id;
                }
            );

        $event->artists()->sync($ids);
    }

    /*
    |--------------------------------------------------------------------------
    | Event legs
    |--------------------------------------------------------------------------
    */

    protected function syncLegs(
        Event $event,
        array $legs
    ): void {
        /*
         * Existing leg IDs.
         */
        $existingLegIds = $event
            ->legs()
            ->pluck('id')
            ->all();

        /*
         * Incoming leg IDs.
         */
        $incomingLegIds = collect($legs)
            ->pluck('id')
            ->filter()
            ->all();

        /*
         * Delete removed legs.
         */
        $legIdsToDelete = array_diff(
            $existingLegIds,
            $incomingLegIds
        );

        if (
            !empty($legIdsToDelete)
        ) {
            EventLeg::whereIn(
                'id',
                $legIdsToDelete
            )->each(
                function (
                    EventLeg $leg
                ) {
                    /*
                     * Delete ticket tiers first.
                     */
                    $leg
                        ->ticketTiers()
                        ->delete();

                    /*
                     * Delete leg.
                     */
                    $leg->delete();
                }
            );
        }

        /*
         * Create / update legs.
         */
        foreach (
            $legs as $sequence => $legData
        ) {
            $legId =
                $legData['id'] ?? null;

            $leg = $legId
                ? $event
                    ->legs()
                    ->find($legId)
                : null;

            $attributes = [
                'venue_id' =>
                    $legData['venue_id'] ?? null,

                'venue_name' =>
                    $legData['venue_name'],

                'address' =>
                    $legData['address'] ?? null,

                'city' =>
                    $legData['city'] ?? null,

                'latitude' =>
                    $legData['latitude'] ?? null,

                'longitude' =>
                    $legData['longitude'] ?? null,

                'event_date' =>
                    $legData['event_date'],

                'capacity' =>
                    $legData['capacity'],

                'sequence' =>
                    $sequence + 1,
            ];

            /*
             * Update existing leg.
             */
            if ($leg) {
                $leg->update(
                    $attributes
                );
            }

            /*
             * Create new leg.
             */
            else {
                $leg = $event
                    ->legs()
                    ->create(
                        $attributes
                    );
            }

            /*
             * Sync ticket tiers.
             */
            $this->syncTiers(
                $leg,
                $legData['tiers']
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Ticket tiers
    |--------------------------------------------------------------------------
    */

    protected function syncTiers(
        EventLeg $leg,
        array $tiers
    ): void {
        /*
         * Existing tier IDs.
         */
        $existingTierIds = $leg
            ->ticketTiers()
            ->pluck('id')
            ->all();

        /*
         * Incoming tier IDs.
         */
        $incomingTierIds = collect($tiers)
            ->pluck('id')
            ->filter()
            ->all();

        /*
         * Delete removed tiers.
         */
        $tierIdsToDelete = array_diff(
            $existingTierIds,
            $incomingTierIds
        );

        if (
            !empty($tierIdsToDelete)
        ) {
            TicketTier::whereIn(
                'id',
                $tierIdsToDelete
            )->delete();
        }

        /*
         * Create / update tiers.
         */
        foreach (
            $tiers as $tierData
        ) {
            $tierId =
                $tierData['id'] ?? null;

            $tier = $tierId
                ? $leg
                    ->ticketTiers()
                    ->find($tierId)
                : null;

            /*
             * Existing tier.
             */
            if ($tier) {
                /*
                 * Adjust remaining by
                 * quantity difference.
                 */
                $quantityDelta =
                    $tierData['quantity']
                    - $tier->quantity;

                $tier->update([
                    'name' =>
                        $tierData['name'],

                    'price' =>
                        $tierData['price'],

                    'quantity' =>
                        $tierData['quantity'],

                    'remaining' =>
                        max(
                            0,
                            $tier->remaining
                            + $quantityDelta
                        ),

                    'starts_at' =>
                        $tierData['starts_at'],

                    'ends_at' =>
                        $tierData['ends_at'],
                ]);
            }

            /*
             * New tier.
             */
            else {
                $leg
                    ->ticketTiers()
                    ->create([
                        'name' =>
                            $tierData['name'],

                        'price' =>
                            $tierData['price'],

                        'quantity' =>
                            $tierData['quantity'],

                        'remaining' =>
                            $tierData['quantity'],

                        'starts_at' =>
                            $tierData['starts_at'],

                        'ends_at' =>
                            $tierData['ends_at'],
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
            $event->vendor_user_id ===
                $request->user()->id,
            403
        );
    }
}
