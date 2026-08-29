<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\EventWatchlistNotifier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventWatchlistAdminController extends Controller
{
    public function index(Request $request)
    {
        $events = Event::where('vendor_user_id', $request->user()->id)
            ->withCount([
                'watchlist as watchlist_count' => fn ($query) =>
                    $query->whereNotNull('verified_at'),
            ])
            ->having('watchlist_count', '>', 0)
            ->orderByDesc('watchlist_count')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('Admin/Events/Watchlist', [
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
        ]);
    }

    public function show(Request $request, Event $event)
    {
        abort_unless(
            $event->vendor_user_id === $request->user()->id,
            403
        );

        $entries = $event->watchlist()
            ->whereNotNull('verified_at')
            ->latest()
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Admin/Events/WatchlistShow', [
            'event' => $event,

            'entries' => [
                'data' => $entries->items(),

                'links' => [
                    'first' => $entries->url(1),
                    'last' => $entries->url($entries->lastPage()),
                    'prev' => $entries->previousPageUrl(),
                    'next' => $entries->nextPageUrl(),
                ],

                'meta' => [
                    'current_page' => $entries->currentPage(),
                    'from' => $entries->firstItem(),
                    'last_page' => $entries->lastPage(),
                    'links' => $entries->linkCollection()->toArray(),
                    'path' => $entries->path(),
                    'per_page' => $entries->perPage(),
                    'to' => $entries->lastItem(),
                    'total' => $entries->total(),
                ],
            ],
        ]);
    }

    public function notify(
        Request $request,
        Event $event,
        EventWatchlistNotifier $notifier
    ) {
        abort_unless(
            $event->vendor_user_id === $request->user()->id,
            403
        );

        $count = $notifier->notify($event, force: true);

        return redirect()->back()->with(
            'success',
            $count === 0
                ? 'No verified watchers are currently on this watchlist.'
                : "Reminder queued for {$count} verified "
                    . ($count === 1 ? 'watcher.' : 'watchers.')
        );
    }
}
