<?php

namespace App\Services;

use Stripe\Checkout\Session;
use Stripe\Stripe;

class StripeCheckoutService
{
    public function createSession(array $params): Session
    {
        Stripe::setApiKey(config('app.stripe_secret_key'));

        return Session::create($params);
    }
}
