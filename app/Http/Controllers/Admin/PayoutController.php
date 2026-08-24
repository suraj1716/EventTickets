<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\VendorPayoutMail;
use App\Models\Order;
use App\Models\Payout;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class PayoutController extends Controller
{
    public function index(Request $request)
    {
        $payouts = Payout::with('vendor')
            ->withCount('orders')
            ->when($request->vendor_id, fn ($q, $v) => $q->where('vendor_id', $v))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        // Only vendors who are actually payable show up in the dropdown.
        $vendors = Vendor::eligibleForPayout()
            ->select('vendors.user_id', 'vendors.store_name')
            ->orderBy('vendors.store_name')
            ->get();

        return Inertia::render('Admin/Payouts/Index', [
            'payouts' => $payouts,
            'vendors' => $vendors,
            'filters' => $request->only(['vendor_id']),
            'flash' => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ]);
    }

    /**
     * AJAX: suggest a payout amount for a vendor + date range,
     * based on vendor_subtotal already computed by the Stripe webhook,
     * netted against any refunds recorded against each order.
     */
    public function preview(Request $request)
    {
        $request->validate([
            'vendor_id'     => 'required|exists:vendors,user_id',
            'starting_from' => 'required|date',
            'until'         => 'required|date|after_or_equal:starting_from',
        ]);

        $suggested = $this->calculateAmount(
            $request->vendor_id,
            $request->starting_from,
            $request->until
        );

        return response()->json(['suggested_amount' => round($suggested, 2)]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vendor_id'     => 'required|exists:vendors,user_id',
            'amount'        => 'required|numeric|min:0',
            'starting_from' => 'required|date',
            'until'         => 'required|date|after_or_equal:starting_from',
        ]);

        $payout = Payout::create($data);
        $payout->load('vendor.user');

        // Claim the orders this payout covers so they're never double-counted
        // in a future payout's calculateAmount() sum.
        //
        // FIX: removed whereNull('refunded_at'). That column is now only set
        // on FULLY refunded orders (see RefundService::refundCustomAmount),
        // but partially-refunded orders are still is_paid = true and should
        // still be claimed here at their netted amount — excluding them left
        // them stuck with payout_id = null forever, never reconciled into
        // any payout. Fully-refunded orders are already excluded because
        // is_paid is flipped to false when a refund completes the order.
        Order::where('vendor_user_id', $data['vendor_id'])
            ->where('is_paid', true)
            ->whereNull('payout_id')
            ->whereBetween('created_at', [$data['starting_from'], $data['until'] . ' 23:59:59'])
            ->update(['payout_id' => $payout->id, 'paid_out_at' => now()]);

        $recipient = $payout->vendor?->user?->email;

        try {
            if ($recipient) {
                Mail::to($recipient)->send(new VendorPayoutMail($payout));
            } else {
                Log::warning("Payout #{$payout->id} created but vendor has no email on file.");
            }
        } catch (\Exception $e) {
            Log::error('Payout receipt email failed: ' . $e->getMessage());
        }

        return back()->with(
            'success',
            "Payout of A\${$payout->amount} recorded" . ($recipient ? ' and receipt emailed.' : ' (no vendor email found — receipt not sent).')
        );
    }

  public function show(Payout $payout)
{
    $payout->load([
        'vendor.user',
        'orders' => fn ($q) => $q
            ->with([
                'user:id,name,email',
                'refunds',
            ])
            ->orderBy('created_at'),
    ]);

    return Inertia::render('Admin/Payouts/Invoice', [
        'payout' => $payout,
    ]);
}

    public function destroy(Payout $payout)
    {
        // Release the orders this payout had claimed so they're eligible again.
        Order::where('payout_id', $payout->id)->update(['payout_id' => null]);

        $payout->delete();

        return back()->with('success', 'Payout record deleted and its orders released.');
    }

    /**
     * Sum vendor_subtotal for this vendor's paid, not-yet-paid-out orders in
     * the window, NETTED against any refund_amount recorded on each order.
     *
     * FIX: previously this used whereNull('refunded_at') as a binary
     * exclusion. That broke in two directions once RefundService could
     * issue partial refunds:
     *   - A partial refund (refundCustomAmount) stamped refunded_at even
     *     though only a fraction of the order was refunded, causing the
     *     ENTIRE vendor_subtotal to be dropped from the payout — vendor
     *     underpaid.
     *   - A booking-fee-only refund (refundBookingFeeOnly) never stamped
     *     refunded_at at all, so the order kept its full vendor_subtotal
     *     in the payout even though money had already gone back to the
     *     customer — vendor overpaid and the refund was invisible here.
     *
     * refund_amount is now reliably populated by every refund path (see
     * RefundService), so we net it against vendor_subtotal per order
     * instead of excluding on a flag. Fully refunded orders are naturally
     * excluded because refundOrder()/refundManual()/a completed
     * refundCustomAmount() all flip is_paid to false.
     *
     * NOTE: this assumes the vendor's payout absorbs the full refund
     * amount dollar-for-dollar. If the platform fee/booking fee portion of
     * a refund should instead come out of the platform's cut rather than
     * the vendor's, this netting needs to branch by refund type — confirm
     * that business rule before relying on this for real payouts.
     */
    private function calculateAmount($vendorId, $from, $until)
    {
        return Order::where('vendor_user_id', $vendorId)
            ->where('is_paid', true)
            ->whereNull('payout_id')
            ->whereBetween('created_at', [$from, $until . ' 23:59:59'])
            ->get(['vendor_subtotal', 'refund_amount'])
            ->sum(function ($order) {
                $refunded = $order->refund_amount ?? 0;

                if ($refunded <= 0) {
                    return $order->vendor_subtotal;
                }

                return max(0, $order->vendor_subtotal - $refunded);
            });
    }
}
