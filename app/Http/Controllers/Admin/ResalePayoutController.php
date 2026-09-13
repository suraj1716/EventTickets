<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TicketResaleListing;
use App\Services\TicketResaleService;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Read-mostly visibility over Stripe Connect transfers that
 * TicketResaleService::payoutSeller() fires automatically the moment a
 * resale sells. Deliberately separate from PayoutController: that page
 * is admin-initiated, batched, manual payouts to vendors out of the
 * platform's aggregated Stripe balance. This page is a monitor over
 * transfers that already happened (or failed) one listing at a time —
 * there's nothing to "create" here, only to review and, on failure,
 * retry.
 */
class ResalePayoutController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->input('status'); // 'paid' | 'failed' | null (all)

        $listings = TicketResaleListing::query()
            ->where('status', 'sold')
            ->with(['seller:id,name,email', 'buyer:id,name,email', 'ticket:id,event_id,code'])
            ->when($status === 'paid', fn ($q) => $q->where('seller_paid_out', true))
            ->when($status === 'failed', fn ($q) => $q->where('seller_paid_out', false))
            ->orderByDesc('sold_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/ResalePayouts/Index', [
            'listings' => $listings,
            'filters' => $request->only(['status']),
            'counts' => [
                'failed' => TicketResaleListing::where('status', 'sold')
                    ->where('seller_paid_out', false)
                    ->count(),
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Manually re-fire the Stripe transfer for a listing whose automatic
     * payout failed. Safe to click repeatedly — payoutSeller() no-ops on
     * anything already marked seller_paid_out, so a retry can never
     * double-pay a seller.
     */
    public function retry(TicketResaleListing $listing, TicketResaleService $resaleService)
    {
        if ($listing->status !== 'sold') {
            return back()->with('error', 'Only sold listings can be paid out.');
        }

        if ($listing->seller_paid_out) {
            return back()->with('error', 'This seller has already been paid out.');
        }

        $resaleService->payoutSeller($listing);

        $listing->refresh();

        if ($listing->seller_paid_out) {
            return back()->with('success', "Transfer sent — seller paid A\${$listing->seller_payout_amount}.");
        }

        return back()->with('error', 'Retry failed again — check the logs for the Stripe error, and confirm the seller\'s connected account is still active.');
    }
}
