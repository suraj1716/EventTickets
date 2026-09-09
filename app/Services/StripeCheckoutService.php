<?php

namespace App\Services;

use Stripe\PaymentIntent;
use Stripe\Stripe;

class StripeCheckoutService
{
    public function createPaymentIntent(array $params): PaymentIntent
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        return PaymentIntent::create($params);
    }

    // Best-effort cancel — only succeeds while the PI hasn't been paid yet
    // (requires_payment_method/requires_confirmation/requires_action/
    // requires_capture). If it's already succeeded or was already canceled,
    // Stripe throws; callers should treat that as non-fatal.
    public function cancelPaymentIntent(string $paymentIntentId): PaymentIntent
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        return PaymentIntent::retrieve($paymentIntentId)->cancel();
    }
}
