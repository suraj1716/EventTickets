<?php

namespace App\Http\Controllers;

use App\Models\TicketResaleListing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Stripe;

class TicketResaleCheckoutController extends Controller
{
    // Creates a Stripe Checkout Session for ONE resale listing.
    // Deliberately a separate, minimal flow from the main cart
    // checkout (TicketCheckoutController) — a resale purchase is
    // always exactly one ticket, one price, no cart involved.
    public function store(Request $request, TicketResaleListing $listing)
    {
      if ($listing->seller_user_id === $request->user()->id) {
    return back()->withErrors([
        'resale' => 'You cannot buy your own resale listing.',
    ]);
}

        // Lock the listing and stamp a placeholder session id BEFORE
        // calling Stripe. Without this, two buyers hitting store() for
        // the same listing concurrently both pass the status==active
        // check (nothing flips it until the webhook fires later), so
        // both get charged by Stripe for a ticket only one of them can
        // actually receive. completeSale()'s idempotency check stops
        // the double FULFILLMENT, but not the double CHARGE.
        DB::transaction(function () use ($listing) {
            $listing = TicketResaleListing::where('id', $listing->id)->lockForUpdate()->firstOrFail();

            abort_unless($listing->status === 'active', 422, 'This listing is no longer available.');

            abort_if(
                $listing->stripe_session_id,
                422,
                'A checkout is already in progress for this listing.'
            );

            $listing->update(['stripe_session_id' => 'pending']);
        });

        Stripe::setApiKey(config('app.stripe_secret_key'));

        try {
            $session = StripeSession::create([
            'mode' => 'payment',
            'payment_method_types' => ['card'],
            'customer_email' => $request->user()->email,
            'line_items' => [[
                'price_data' => [
                    'currency' => 'aud',
                    'unit_amount' => (int) round($listing->price * 100),
                    'product_data' => [
                        'name' => 'Resale ticket transfer',
                    ],
                ],
                'quantity' => 1,
            ]],
            // resale_listing_id is how StripeController::handle()
            // branches checkout.session.completed to resale
            // fulfillment instead of a normal order — same
            // metadata-based routing already used for gift card
            // purchases in that webhook.
            'metadata' => [
                'resale_listing_id' => $listing->id,
                'buyer_user_id' => $request->user()->id,
            ],
            'success_url' => route('stripe.success') . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('resale.index'),
            ]);
        } catch (\Exception $e) {
            // Stripe call failed — release the lock so the buyer (or
            // someone else) can retry instead of the listing being
            // stuck on 'pending' forever.
            $listing->update(['stripe_session_id' => null]);
            throw $e;
        }

        $listing->update(['stripe_session_id' => $session->id]);

        return \Inertia\Inertia::location($session->url);
    }
}
