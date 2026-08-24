<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventTicketsController extends Controller
{
    // Vendor-scoped: only tickets for events THIS vendor owns.
    // Attendance lives here as a status column rather than a separate
    // page — a ticket's scan state is just one more fact about the
    // ticket, not a distinct object worth its own view.
 public function index(Request $request)
{
    $tickets = Ticket::query()
        ->whereHas(
            'eventLeg.event',
            fn ($q) => $q->where('vendor_user_id', $request->user()->id)
        )
        ->with([
            'ticketTier',
            'eventLeg.event',
            'order.user',
        ])
        ->when(
            $request->filled('event_id'),
            fn ($q) => $q->whereHas(
                'eventLeg',
                fn ($leg) => $leg->where(
                    'event_id',
                    $request->input('event_id')
                )
            )
        )
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
                'code',
                'like',
                '%' . $request->input('search') . '%'
            )
        )
        ->latest()
        ->paginate(30)
        ->withQueryString();

    $events = \App\Models\Event::where(
        'vendor_user_id',
        $request->user()->id
    )
        ->orderBy('name')
        ->get(['id', 'name']);

    return Inertia::render('Admin/Events/Tickets', [
        'tickets' => [
            'data' => $tickets->items(),

            'links' => [
                'first' => $tickets->url(1),
                'last' => $tickets->url($tickets->lastPage()),
                'prev' => $tickets->previousPageUrl(),
                'next' => $tickets->nextPageUrl(),
            ],

            'meta' => [
                'current_page' => $tickets->currentPage(),
                'from' => $tickets->firstItem(),
                'last_page' => $tickets->lastPage(),
                'links' => $tickets->linkCollection()->toArray(),
                'path' => $tickets->path(),
                'per_page' => $tickets->perPage(),
                'to' => $tickets->lastItem(),
                'total' => $tickets->total(),
            ],
        ],

        'events' => $events,
        'filters' => $request->only([
            'event_id',
            'status',
            'search',
        ]),
    ]);
}
}