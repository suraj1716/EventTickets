<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\EventWatchlistNotifier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventWatchlistAdminController extends Controller
{
    // Summary view: one row per event, with watchlist size — this is
    // the "is this worth publishing" signal from earlier in the
    // project, made visible to the vendor for the first time.
   public function index(Request $request)
{
    $events = Event::where('vendor_user_id', $request->user()->id)
        ->withCount('watchlist')
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

    // Drill-down: the actual list of emails for one event, plus a
    // manual "notify now" action — useful for a reminder blast, or
    // for notifying a second time if the event details changed after
    // the automatic publish-time notification already went out.
    public function show(Request $request, Event $event)
    {
        abort_unless($event->vendor_user_id === $request->user()->id, 403);

        $entries = $event->watchlist()
            ->latest()
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Admin/Events/WatchlistShow', [
            'event' => $event,
            'entries' => $entries,
        ]);
    }

    public function notify(Request $request, Event $event, EventWatchlistNotifier $notifier)
    {
        abort_unless($event->vendor_user_id === $request->user()->id, 403);

        $notifier->notify($event, force: true);

        return redirect()->back()->with('success', 'Notification queued for the watchlist.');
    }
}