<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketResaleListing;
use App\Services\TicketResaleService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketResaleController extends Controller
{
    // Public marketplace — active listings across all events, or
    // filtered to one event leg. No auth required to BROWSE; buying
    // requires login (see TicketResaleCheckoutController).
    public function index(Request $request)
    {
        $listings = TicketResaleListing::query()
            ->where('status', 'active')
            ->with(['ticket.ticketTier', 'ticket.eventLeg.event', 'seller'])
            ->when(
                $request->filled('event_leg_id'),
                fn($q) => $q->whereHas('ticket', fn($t) => $t->where('event_leg_id', $request->input('event_leg_id')))
            )
            ->latest()
            ->paginate(20)
            ->withQueryString();

       return Inertia::render('Resale/Index', [
    'listings' => [
        'data' => $listings->items(),
        'links' => [
            'prev' => $listings->previousPageUrl(),
            'next' => $listings->nextPageUrl(),
        ],
        'meta' => [
            'current_page' => $listings->currentPage(),
            'last_page' => $listings->lastPage(),
            'total' => $listings->total(),
        ],
    ],
]);
    }

    // Seller lists one of their own tickets for resale.
    public function store(Request $request, Ticket $ticket, TicketResaleService $resale)
    {
        $seller = $request->user();

        abort_unless(
            $seller->stripe_account_active,
            422,
            'Set up payouts before listing a ticket — we need somewhere to send your money once it sells.'
        );

        $data = $request->validate([
            'price' => ['required', 'numeric', 'min:0.01'],
        ]);

        $listing = $resale->listTicket($ticket, $seller, (float) $data['price']);

        return redirect()->back()->with('success', "Ticket listed for resale at \${$listing->price}.");
    }

    // Seller cancels their own active listing.
    public function destroy(Request $request, TicketResaleListing $listing, TicketResaleService $resale)
    {
        $resale->cancelListing($listing, $request->user());

        return redirect()->back()->with('success', 'Resale listing cancelled.');
    }

    // "My listings" — a seller's own resale activity.
    public function mine(Request $request)
    {
        $listings = TicketResaleListing::query()
            ->where('seller_user_id', $request->user()->id)
            ->with(['ticket.ticketTier', 'ticket.eventLeg.event', 'buyer'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Resale/Mine', [
            'listings' => $listings,
        ]);
    }
}
