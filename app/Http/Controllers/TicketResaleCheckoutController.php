<?php

namespace App\Http\Controllers;

use App\Models\TicketResaleListing;
use App\Services\StripeCheckoutService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TicketResaleCheckoutController extends Controller
{
    // Creates a PaymentIntent for ONE resale listing — same
    // StripeCheckoutService/PaymentIntent engine as the main cart
    // checkout (TicketCheckoutController/CartController), so the
    // buyer pays on an embedded <Elements><PaymentElement/></Elements>
    // form on our own page instead of being redirected to
    // checkout.stripe.com. Deliberately still a separate, minimal
    // flow from the cart — a resale purchase is always exactly one
    // ticket, one price, no cart involved.
    public function store(Request $request, TicketResaleListing $listing, StripeCheckoutService $stripeCheckoutService)
    {
        if ($listing->seller_user_id === $request->user()->id) {
            return response()->json([
                'resale' => 'You cannot buy your own resale listing.',
            ], 422);
        }

        // Lock the listing and stamp a placeholder payment intent id
        // BEFORE calling Stripe. Without this, two buyers hitting
        // store() for the same listing concurrently both pass the
        // status==active check (nothing flips it until the webhook
        // fires later), so both get charged by Stripe for a ticket
        // only one of them can actually receive. completeSale()'s
        // idempotency check stops the double FULFILLMENT, but not the
        // double CHARGE.
        DB::transaction(function () use ($listing) {
            $listing = TicketResaleListing::where('id', $listing->id)->lockForUpdate()->firstOrFail();

            abort_unless($listing->status === 'active', 422, 'This listing is no longer available.');

            // A lock is only a real "checkout in progress" while it's
            // fresh. If stripe_payment_intent was stamped more than 15
            // minutes ago and the listing never sold, the buyer almost
            // certainly abandoned the page (closed tab, declined card,
            // network drop) — nothing else ever clears this column, so
            // without a staleness window an abandoned attempt locks the
            // listing out for every future buyer forever.
            $lockIsStale = $listing->stripe_payment_intent
                && $listing->updated_at
                && $listing->updated_at->lt(now()->subMinutes(15));

            if ($listing->stripe_payment_intent && !$lockIsStale) {
                abort(422, 'A checkout is already in progress for this listing.');
            }

            $listing->update(['stripe_payment_intent' => 'pending']);
        });

        try {
            $paymentIntent = $stripeCheckoutService->createPaymentIntent([
                'amount' => (int) round($listing->price * 100),
                'currency' => 'aud',
                'receipt_email' => $request->user()->email,
                'payment_method_types' => ['card'],
                // resale_listing_id is how StripeController::handle()
                // branches payment_intent.succeeded to resale
                // fulfillment instead of the normal Order-based path —
                // same metadata-based routing already used for gift
                // card purchases in that webhook.
                'metadata' => [
                    'resale_listing_id' => $listing->id,
                    'buyer_user_id' => $request->user()->id,
                ],
            ]);
        } catch (\Exception $e) {
            // Stripe call failed — release the lock so the buyer (or
            // someone else) can retry instead of the listing being
            // stuck on 'pending' forever.
            $listing->update(['stripe_payment_intent' => null]);
            throw $e;
        }

        $listing->update(['stripe_payment_intent' => $paymentIntent->id]);

        return response()->json([
            'clientSecret' => $paymentIntent->client_secret,
            'stripeKey' => config('services.stripe.key'),
        ]);
    }

    // Releases the checkout lock when the buyer explicitly cancels out of
    // the payment form, so the listing is immediately purchasable again —
    // without this, only the 15-minute staleness fallback in store() would
    // eventually free it, which is a bad experience for a deliberate cancel.
    public function cancel(Request $request, TicketResaleListing $listing, StripeCheckoutService $stripeCheckoutService)
    {
        DB::transaction(function () use ($listing, $stripeCheckoutService) {
            $listing = TicketResaleListing::where('id', $listing->id)->lockForUpdate()->firstOrFail();

            // Already sold/cancelled, or no in-progress checkout to cancel —
            // nothing to do, and we must never touch a listing that's already
            // sold (a completed sale's stripe_payment_intent must stay intact
            // as the payment record).
            if ($listing->status !== 'active' || !$listing->stripe_payment_intent) {
                return;
            }

            $piId = $listing->stripe_payment_intent;

            $listing->update(['stripe_payment_intent' => null]);

            if ($piId && $piId !== 'pending') {
                try {
                    $stripeCheckoutService->cancelPaymentIntent($piId);
                } catch (\Exception $e) {
                    // Non-fatal — the listing lock is already released above,
                    // which is what actually unblocks the buyer. A PI left
                    // in 'requires_payment_method' on Stripe's side with no
                    // further action taken is harmless.
                    Log::warning("Failed to cancel Stripe PaymentIntent {$piId}: " . $e->getMessage());
                }
            }
        });

        return response()->json(['status' => 'cancelled']);
    }
}
