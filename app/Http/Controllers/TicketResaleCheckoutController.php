<?php

namespace App\Http\Controllers;

use App\Models\TicketResaleListing;
use App\Services\StripeCheckoutService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

            abort_if(
                $listing->stripe_payment_intent,
                422,
                'A checkout is already in progress for this listing.'
            );

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
}
