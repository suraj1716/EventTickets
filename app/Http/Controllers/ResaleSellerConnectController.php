<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Stripe\Account;
use Stripe\AccountLink;
use Stripe\Stripe;

class ResaleSellerConnectController extends Controller
{
     public function connect(Request $request)
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        $user = Auth::user();

        // Step 1: Create Stripe Account if it doesn't exist
       if (!$user->stripe_account_id) {
    try {
        $user->createStripeAccount(['type' => 'express']);
        $user->refresh();
    } catch (\Exception $e) {
        Log::error('Stripe account creation failed: ' . $e->getMessage());
        return back()->with('error', 'Stripe account creation failed: ' . $e->getMessage());
    }
}

        // Step 2: Check if onboarding is completed
        if ($user->stripe_account_id) {
            $account = \Stripe\Account::retrieve($user->stripe_account_id);

            if ($account->details_submitted && empty($account->requirements->currently_due)) {
                // ✅ Onboarding complete
                if (!$user->stripe_account_active && $user->charges_enabled) {
                    $user->stripe_account_active = true;
                    $user->save();
                }

                // Optionally approve vendor if linked
                if ($user->vendor && $user->vendor->status !== 'approved') {
                    $user->vendor->status = 'approved';
                    $user->vendor->save();
                }

                return redirect()->route('home')->with('success', 'Stripe onboarding complete and account active!');
            }

            // Step 3: Onboarding not complete → redirect to Stripe onboarding
            $onboardingLink = \Stripe\AccountLink::create([
                'account' => $user->stripe_account_id,
                'refresh_url' => route('stripe.connect'),
                'return_url' => route('stripe.connect'),
                'type' => 'account_onboarding',
            ]);

            return redirect($onboardingLink->url);
        }

        abort(500, 'Unexpected error. Please try again.');
    }
}
