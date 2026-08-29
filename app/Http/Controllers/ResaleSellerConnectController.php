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
    /**
     * Start / continue Stripe Connect onboarding for ticket resale sellers.
     *
     * NOTE:
     * This currently uses Stripe's v1 Connect Account API because the
     * existing application stores acct_... IDs and the rest of the
     * application expects the v1 Account object.
     */
    public function connect(Request $request)
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        $user = Auth::user();

        try {
            if ($user->stripe_account_id) {
                $account = $this->withStripeDeprecationWarningsSuppressed(
                    fn () => Account::retrieve($user->stripe_account_id)
                );

                $detailsSubmitted = (bool) $account->details_submitted;

                $currentlyDue = [];

                if (
                    isset($account->requirements) &&
                    isset($account->requirements->currently_due)
                ) {
                    $currentlyDue = $account->requirements->currently_due;
                }

                $onboardingComplete =
                    $detailsSubmitted &&
                    empty($currentlyDue);

                if ($onboardingComplete) {
                    $active = (bool) (
                        $account->charges_enabled &&
                        $account->payouts_enabled
                    );

                    $user->stripe_account_active = $active;
                    $user->save();

                    if (
                        $active &&
                        $user->vendor &&
                        $user->vendor->status !== 'approved'
                    ) {
                        $user->vendor->status = 'approved';
                        $user->vendor->save();
                    }

                    if ($active) {
                        return redirect()
                            ->route('home')
                            ->with(
                                'success',
                                'Stripe account connected and ready.'
                            );
                    }
                }

                $onboardingLink = AccountLink::create([
                    'account' => $user->stripe_account_id,
                    'refresh_url' => route('resale.connect'),
                    'return_url' => route('resale.connect'),
                    'type' => 'account_onboarding',
                ]);

                return redirect($onboardingLink->url);
            }

            /*
             * IMPORTANT:
             *
             * Do not use:
             *
             *     $user->createStripeAccount(...)
             *
             * here.
             *
             * That method comes from SimonHamp's Payable trait and calls
             * Stripe's legacy accounts->create() API.
             *
             * The actual account-creation implementation will be isolated
             * here so it can be migrated to Accounts v2 without affecting
             * the rest of the application.
             */

            $account = $this->withStripeDeprecationWarningsSuppressed(
                fn () => Account::create([
                    'email' => $user->email,
                    'controller' => [
                        'stripe_dashboard' => ['type' => 'express'],
                        'fees'   => ['payer' => 'application'],
                        'losses' => ['payments' => 'application'],
                    ],
                    'business_profile' => [
                        'name' => $user->name,
                    ],
                ])
            );

            $user->stripe_account_id = $account->id;
            $user->stripe_account_active = false;
            $user->save();

            Log::info('Stripe Connect account created', [
                'user_id' => $user->id,
                'stripe_account_id' => $account->id,
            ]);

            $onboardingLink = AccountLink::create([
                'account' => $account->id,
                'refresh_url' => route('resale.connect'),
                'return_url' => route('resale.connect'),
                'type' => 'account_onboarding',
            ]);

            return redirect($onboardingLink->url);

        } catch (\Throwable $e) {
            Log::error('Stripe Connect error', [
                'user_id' => $user->id ?? null,
                'stripe_account_id' => $user->stripe_account_id ?? null,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return back()->with(
                'error',
                'Stripe Connect failed: ' . $e->getMessage()
            );
        }
    }

    /**
     * Lightweight JSON status check, used by the "My Listings" payout
     * summary card so it doesn't have to go through the connect()
     * redirect flow just to know where the seller stands.
     */
    public function status(Request $request)
    {
        $user = $request->user();

        if (! $user->stripe_account_id) {
            return response()->json([
                'connected' => false,
                'active' => false,
            ]);
        }

        Stripe::setApiKey(config('services.stripe.secret'));

        try {
            $account = $this->withStripeDeprecationWarningsSuppressed(
                fn () => Account::retrieve($user->stripe_account_id)
            );

            $currentlyDue = [];
            if (
                isset($account->requirements) &&
                isset($account->requirements->currently_due)
            ) {
                $currentlyDue = $account->requirements->currently_due;
            }

            return response()->json([
                'connected' => true,
                'active' => (bool) (
                    $account->charges_enabled &&
                    $account->payouts_enabled
                ),
                'details_submitted' => (bool) $account->details_submitted,
                'currently_due' => $currentlyDue,
            ]);
        } catch (\Throwable $e) {
            Log::error('Stripe status check failed', [
                'user_id' => $user->id,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'connected' => true,
                'active' => false,
                'error' => true,
            ], 500);
        }
    }

    /**
     * Stripe's v1 Account endpoints emit a PHP E_USER_WARNING nudging
     * new integrations toward Accounts v2. Laravel's default error
     * handler promotes any PHP warning into a thrown ErrorException,
     * which was making successful account creations look like failures.
     * This only swallows that specific warning text and logs it —
     * real Stripe API errors are actual exception classes and still
     * propagate normally.
     */
    private function withStripeDeprecationWarningsSuppressed(callable $callback)
    {
        set_error_handler(function (int $errno, string $errstr) {
            if ($errno === E_USER_WARNING && str_contains($errstr, 'Accounts v2')) {
                Log::info('Stripe deprecation notice (ignored): ' . $errstr);
                return true;
            }
            return false;
        }, E_USER_WARNING);

        try {
            return $callback();
        } finally {
            restore_error_handler();
        }
    }
}
