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
        ->where('owner_user_id', $request->user()->id)
        ->with([
            'ticketTier',
            'eventLeg.event.media',
            'order',
            'resaleListings' => function ($query) {
                $query->where('status', 'sold')
                    ->latest('sold_at')
                    ->with('seller')
                    ->limit(1);
            },
        ])
        ->latest()
        ->get()
        ->map(function ($ticket) {
            $lastSale = $ticket->resaleListings->first();

            return [
                ...$ticket->toArray(),
                'last_resale' => $lastSale ? [
                    'price' => $lastSale->price,
                    'sold_at' => $lastSale->sold_at,
                    'seller_name' => $lastSale->seller?->name,
                ] : null,
            ];
        });

    return Inertia::render('Tickets/Index', [
        'tickets' => $tickets,
    ]);
}

    public function show(Request $request, Ticket $ticket)
    {
        abort_unless(
            $ticket->owner_user_id === $request->user()->id,
            403
        );

        $ticket->load([
            'ticketTier',
            'eventLeg.event',
            'order',
        ]);
        $activeListing = $ticket->resaleListings()
    ->where('status', 'active')
    ->first();

        $lastSale = $ticket->resaleListings()
    ->where('status', 'sold')
    ->latest('sold_at')
    ->with('seller')
    ->first();

       return Inertia::render('Tickets/Show', [
    'ticket' => [
        ...$ticket->toArray(),

        'owner_user_id' => $ticket->owner_user_id,

        'stripe_account_active' =>
            (bool) auth()->user()->stripe_account_active,

        'last_resale' => $lastSale ? [
            'price' => $lastSale->price,
            'sold_at' => $lastSale->sold_at,
            'seller_name' => $lastSale->seller?->name,
        ] : null,

        'active_listing' => $activeListing
            ? [
                'id' => $activeListing->id,
                'price' => $activeListing->price,
            ]
            : null,
    ],
]);
    }
}
