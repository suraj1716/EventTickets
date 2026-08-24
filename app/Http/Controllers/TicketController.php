<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $tickets = Ticket::query()
            ->whereHas('order', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->with([
                'ticketTier',
                'eventLeg.event',
                'order',
            ])
            ->latest()
            ->get();

        return Inertia::render('Tickets/Index', [
            'tickets' => $tickets,
        ]);
    }

    public function show(Request $request, Ticket $ticket)
    {
        abort_unless(
            $ticket->order?->user_id === $request->user()->id,
            403
        );

        $ticket->load([
            'ticketTier',
            'eventLeg.event',
            'order',
        ]);

        return Inertia::render('Tickets/Show', [
            'ticket' => $ticket,
        ]);
    }
}