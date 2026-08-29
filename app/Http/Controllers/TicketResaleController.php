<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketResaleListing;
use App\Services\TicketResaleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Stripe\Account;
use Stripe\Payout;
use Stripe\Stripe;

class TicketResaleController extends Controller
{
    // Public marketplace — active listings across all events, or
    // filtered to one event leg. No auth required to BROWSE; buying
    // requires login (see TicketResaleCheckoutController).
    public function index(Request $request)
    {
        $listings = TicketResaleListing::query()
            ->where('status', 'active')
            ->with([
                'ticket.ticketTier',
                'ticket.eventLeg.event.media',
                'seller',
            ])
            ->when(
                $request->filled('event_leg_id'),
                fn($q) => $q->whereHas(
                    'ticket',
                    fn($t) => $t->where(
                        'event_leg_id',
                        $request->input('event_leg_id')
                    )
                )
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

    // "My listings" — a seller's own resale activity, plus a payout
    // summary (gross sales, platform fee, net payout, and Stripe's
    // next scheduled payout) so this page doubles as their payout
    // status page.
    public function mine(Request $request)
    {
        $user = $request->user();

        $listings = TicketResaleListing::query()
            ->where('seller_user_id', $user->id)
            ->with(['ticket.ticketTier', 'ticket.eventLeg.event', 'buyer'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $sold = TicketResaleListing::query()
            ->where('seller_user_id', $user->id)
            ->where('status', 'sold');

        $grossSales = (float) (clone $sold)->sum('price');
        $platformFee = (float) (clone $sold)->sum('commission_amount');
        $totalPayout = (float) (clone $sold)->sum('seller_payout_amount');
        $paidOut = (float) (clone $sold)->where('seller_paid_out', true)->sum('seller_payout_amount');
        $pending = (float) (clone $sold)->where('seller_paid_out', false)->sum('seller_payout_amount');

        $schedule = null;

        if ($user->stripe_account_id) {
            Stripe::setApiKey(config('services.stripe.secret'));

            try {
                $account = Account::retrieve($user->stripe_account_id);

                $nextPayout = Payout::all(
                    ['status' => 'pending', 'limit' => 1],
                    ['stripe_account' => $user->stripe_account_id]
                )->first();

                $schedule = [
                    'interval' => $account->settings->payouts->schedule->interval ?? null,
                    'next_payout_date' => $nextPayout ? date('Y-m-d', $nextPayout->arrival_date) : null,
                    'next_payout_amount' => $nextPayout ? $nextPayout->amount / 100 : null,
                ];
            } catch (\Throwable $e) {
                Log::error('Stripe payout schedule fetch failed', [
                    'user_id' => $user->id,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        return Inertia::render('Resale/Mine', [
            'listings' => $listings,
            'payoutSummary' => [
                'stripe_account_active' => (bool) $user->stripe_account_active,
                'total_sold' => (clone $sold)->count(),
                'gross_sales' => $grossSales,
                'platform_fee' => $platformFee,
                'total_payout_amount' => $totalPayout,
                'paid_out_amount' => $paidOut,
                'pending_amount' => $pending,
                'progress_pct' => $totalPayout > 0 ? round(($paidOut / $totalPayout) * 100) : 0,
                'schedule' => $schedule,
            ],
        ]);
    }
}
