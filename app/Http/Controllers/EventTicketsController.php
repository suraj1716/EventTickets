<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventTicketsController extends Controller
{
    // Vendor-scoped for vendors/staff (only tickets for events THIS vendor
    // owns); Admins manage the whole marketplace and see every vendor's
    // tickets by default, same pattern as Admin/Events and Admin/Orders.
    // Attendance lives here as a status column rather than a separate
    // page — a ticket's scan state is just one more fact about the
    // ticket, not a distinct object worth its own view.
 public function index(Request $request)
{
    $user = $request->user();

    $tickets = Ticket::query()
        ->when(
            !$user->isAdmin(),
            fn ($q) => $q->whereHas(
                'eventLeg.event',
                fn ($eq) => $eq->where('vendor_user_id', $user->actingVendorId())
            )
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

    $events = \App\Models\Event::query()
        ->when(
            !$user->isAdmin(),
            fn ($q) => $q->where('vendor_user_id', $user->actingVendorId())
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
        'flash' => ['success' => session('success'), 'error' => session('error')],
    ]);
}

    /**
     * Shared ownership guard for all three write actions below — same
     * check TicketScanController uses. Admins bypass it; a Vendor/Staff
     * account may only act on tickets for events they act for.
     */
    private function authorizeTicketAccess(Request $request, Ticket $ticket): void
    {
        if ($request->user()->isAdmin()) {
            return;
        }

        abort_unless(
            $ticket->eventLeg?->event?->vendor_user_id === $request->user()->actingVendorId(),
            403,
            'This ticket belongs to a different event.'
        );
    }

    public function undoScan(Request $request, Ticket $ticket)
    {
        $ticket->load('eventLeg.event');
        $this->authorizeTicketAccess($request, $ticket);

        if (! $ticket->undoScan()) {
            return back()->withErrors(['error' => 'Only a scanned ticket can be undone.']);
        }

        return back()->with('success', "Ticket {$ticket->code} reverted to valid.");
    }

    public function checkIn(Request $request, Ticket $ticket)
    {
        $ticket->load('eventLeg.event');
        $this->authorizeTicketAccess($request, $ticket);

        if (! $ticket->checkInManually($request->user()->id)) {
            return back()->withErrors(['error' => 'This ticket cannot be checked in (already used or void).']);
        }

        return back()->with('success', "Ticket {$ticket->code} checked in manually.");
    }

    public function void(Request $request, Ticket $ticket)
    {
        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $ticket->load('eventLeg.event');
        $this->authorizeTicketAccess($request, $ticket);

        if (! $ticket->voidTicket($request->user()->id, $data['reason'] ?? null)) {
            return back()->withErrors(['error' => 'This ticket is already void.']);
        }

        return back()->with('success', "Ticket {$ticket->code} voided.");
    }

    public function unvoid(Request $request, Ticket $ticket)
    {
        $ticket->load('eventLeg.event');
        $this->authorizeTicketAccess($request, $ticket);

        if (! $ticket->unvoidTicket()) {
            return back()->withErrors(['error' => 'Only a void ticket can be unvoided.']);
        }

        return back()->with('success', "Ticket {$ticket->code} unvoided — reverted to valid.");
    }
}
