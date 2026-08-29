<?php

namespace App\Http\Controllers;

use App\Models\TicketResaleListing;
use Illuminate\Http\Request;
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
        abort_unless($listing->status === 'active', 422, 'This listing is no longer available.');

      if ($listing->seller_user_id === $request->user()->id) {
    return back()->withErrors([
        'resale' => 'You cannot buy your own resale listing.',
    ]);
}

        Stripe::setApiKey(config('app.stripe_secret_key'));

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

        return \Inertia\Inertia::location($session->url);
    }
}
