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
}
