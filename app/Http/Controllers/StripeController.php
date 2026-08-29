<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatusEnum;
use App\Enums\VendorStatusEnum;
use App\Http\Resources\OrderViewResource;
use App\Mail\CheckoutCompleted;
use App\Mail\GiftVoucherRecipientMail;
use App\Mail\NewOrderMail;
use App\Mail\RefundProcessedForUser;
use App\Mail\RefundProcessedForVendor;
use App\Models\CartItem;
use App\Models\GiftCardTemplate;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Stripe\Account;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Stripe;
use Stripe\StripeClient;
use Stripe\Webhook;
use UnexpectedValueException;
use Stripe\Checkout\Session as StripeSession;

class StripeController extends Controller
{





    public function failure()
    {
        return response()->json(['message' => 'Payment failed.']);
    }



    public function handle(Request $request)
    {
        $stripe = new StripeClient(config('app.stripe_secret_key'));
        $endpointSecret = config('app.stripe_webhook_secret');
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $event = null;

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
        } catch (UnexpectedValueException $e) {
            return response('Invalid payload', 400);
        } catch (SignatureVerificationException $e) {
            Log::warning('Stripe webhook signature mismatch: ' . $e->getMessage());
            return response('Invalid signature', 400);
        }


        switch ($event->type) {
            case 'charge.updated':
                try {
                    $charge = $event->data->object;

                    $transactionId = $charge['balance_transaction'] ?? null;
                    $paymentIntent = $charge['payment_intent'] ?? null;
                    $chargeId      = $charge['id'] ?? null;

                    if (!$transactionId || !$paymentIntent) {
                        Log::warning('Missing transactionId or paymentIntent in charge.updated event.');
                        break;
                    }

                    $balanceTransaction = $stripe->balanceTransactions->retrieve($transactionId);
                    $totalAmount = $balanceTransaction['amount'];
                    $stripeFee = 0;

                    foreach ($balanceTransaction['fee_details'] as $feeDetail) {
                        if ($feeDetail['type'] === 'stripe_fee') {
                            $stripeFee = $feeDetail['amount'];
                        }
                    }

                    $platformFeePercent = config('app.platform_fee_pct');

                    $orders = Order::query()
                        ->where('payment_intent', $paymentIntent)
                        ->with(['user', 'vendorUser.Vendor', 'orderItems.product'])
                        ->get();

                    if ($orders->isEmpty()) {
                        Log::warning("No orders found for payment_intent: $paymentIntent");
                        break;
                    }

                    foreach ($orders as $order) {
                        $vendorShare = $order->total_price * 100 / $totalAmount;
                        $orderOnlinePaymentCommissionCents = $vendorShare * $stripeFee;
                        $orderOnlinePaymentCommission = $orderOnlinePaymentCommissionCents / 100;
                        $orderWebsitePaymentCommission = (($order->total_price - $orderOnlinePaymentCommission) / 100) * $platformFeePercent;

                        $order->online_payment_comission = $orderOnlinePaymentCommission;
                        $order->website_payment_comission = $orderWebsitePaymentCommission;
                        $order->vendor_subtotal = $order->total_price - $orderOnlinePaymentCommission - $orderWebsitePaymentCommission;
                        $order->stripe_charge_id = $chargeId;
                        $order->fees_calculated_at = now();

                        Log::info('SENDING NewOrderMail', [
                            'order_id' => $order->id,
                            'to_email' => $order->vendorUser->email,
                            'to_user_id' => $order->vendorUser->id,
                            'buyer_email' => $order->user?->email,
                            'buyer_id' => $order->user_id,
                        ]);

                        if (!$order->vendor_notified_at && $order->vendorUser) {
                            Mail::to($order->vendorUser)->queue(new NewOrderMail($order));
                            $order->vendor_notified_at = now();
                        }

                        $order->save();
                        // Vendor "new order" email now that fees are known
                    }
                } catch (\Exception $e) {
                    Log::error('charge.updated handler failed: ' . $e->getMessage());
                }
                break;

            case 'checkout.session.completed':
                if (\App\Models\ProcessedStripeEvent::where('stripe_event_id', $event->id)->exists()) {
                    Log::info("Stripe event {$event->id} already processed — skipping");
                    break;
                }
                \App\Models\ProcessedStripeEvent::create(['stripe_event_id' => $event->id]);

                $session = $event->data->object;
                $paymentIntent = $session['payment_intent'];
                $paymentMethodType = null;
                $chargeId = null;

                try {
                    $paymentIntentObj = $stripe->paymentIntents->retrieve($paymentIntent, [
                        'expand' => ['payment_method', 'latest_charge'],
                    ]);
                    $paymentMethodType = $paymentIntentObj->payment_method->type ?? null;
                    $chargeId          = $paymentIntentObj->latest_charge->id ?? null;
                } catch (\Exception $e) {
                    Log::warning('Could not retrieve payment method type: ' . $e->getMessage());
                }

                // ── Gift-card-shop purchases: no Order row exists yet, create it now ──
                $metadata = $session->metadata ? $session->metadata->toArray() : [];
                Log::info('checkout.session.completed metadata', ['metadata' => $metadata]);

                if (!empty($metadata['voucher_ids']) && !empty($metadata['gift_card_template_id'])) {
                    $this->fulfillGiftCardOrder($session);
                } else {
                    Log::warning('Gift card fulfillment skipped — metadata missing', ['metadata' => $metadata]);
                }

                // ── Ticket resale purchases — unchanged, returns early ──
                if (!empty($metadata['resale_listing_id'])) {
                    try {
                        $listing = \App\Models\TicketResaleListing::findOrFail($metadata['resale_listing_id']);
                        $buyer = \App\Models\User::findOrFail($metadata['buyer_user_id']);

                        app(\App\Services\TicketResaleService::class)->completeSale(
                            $listing,
                            $buyer,
                            $session->id,
                            $paymentIntent,
                        );

                        Log::info('Resale ticket transfer completed via webhook', [
                            'listing_id' => $listing->id,
                            'session_id' => $session->id,
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Resale fulfillment failed: ' . $e->getMessage(), [
                            'session_id' => $session->id,
                            'metadata' => $metadata,
                        ]);
                    }

                    break;
                }

                $orders = Order::with('orderItems')
                    ->where('stripe_session_id', $session['id'])
                    ->get();

                $productsToDeleteFromCart = [];
                $userId = null;
                $fulfillmentFailures = [];
                $successfulOrderIds = [];

                foreach ($orders as $order) {
                    try {
                        DB::transaction(function () use (
                            $order,
                            $paymentIntent,
                            $paymentMethodType,
                            $session,
                            $chargeId,
                            &$productsToDeleteFromCart,
                            &$userId,
                            &$successfulOrderIds
                        ) {
                            // ---- 1. Validate seat availability BEFORE any money/status/stock change ----
                            $seatIds = $order->orderItems
                                ->flatMap(fn($item) => $item->seat_ids ?? [])
                                ->filter()
                                ->unique()
                                ->values();

                            if ($seatIds->isNotEmpty()) {
                                $lockedSeats = \App\Models\EventSeat::whereIn('id', $seatIds)
                                    ->lockForUpdate()
                                    ->get();

                                $unavailable = $lockedSeats->firstWhere('status', '!=', 'available');

                                if ($unavailable) {
                                    Log::error('Seat already unavailable at payment confirmation', [
                                        'order_id' => $order->id,
                                        'seat_id' => $unavailable->id,
                                        'seat_status' => $unavailable->status,
                                    ]);

                                    $order->status = \App\Enums\OrderStatusEnum::PaidFulfillmentFailed->value;
                                    $order->is_paid = true; // money was actually captured
                                    $order->payment_intent = $paymentIntent;
                                    $order->paid_at = now();
                                    $order->fulfillment_error = 'Seat already sold: seat #' . $unavailable->id;
                                    $order->save();

                                    throw new \RuntimeException(
                                        'Seat ' . $unavailable->id . ' is no longer available.'
                                    );
                                }
                            }

                            // ---- 2. Reserve tier stock (locked) — safe now that seats are confirmed ----
                            foreach ($order->orderItems as $orderItem) {
                                if ($orderItem->ticket_tier_id) {
                                    $tier = \App\Models\TicketTier::lockForUpdate()->find($orderItem->ticket_tier_id);

                                    if (! $tier || ! $tier->reserve($orderItem->quantity)) {
                                        Log::error('Ticket tier oversold on payment confirmation', [
                                            'order_id' => $order->id,
                                            'ticket_tier_id' => $orderItem->ticket_tier_id,
                                        ]);

                                        $order->status = \App\Enums\OrderStatusEnum::PaidFulfillmentFailed->value;
                                        $order->is_paid = true;
                                        $order->payment_intent = $paymentIntent;
                                        $order->paid_at = now();
                                        $order->fulfillment_error = 'Ticket tier oversold at payment confirmation';
                                        $order->save();

                                        throw new \RuntimeException(
                                            "Ticket tier {$tier->id} is sold out."
                                        );
                                    }
                                }
                            }

                            // ---- 3. Everything validated — safe to mark Paid ----
                            $order->payment_intent   = $paymentIntent;
                            $order->payment_method   = $paymentMethodType;
                            $order->stripe_amount    = $session['amount_total'] / 100;
                            $order->stripe_charge_id = $chargeId;
                            $order->status           = OrderStatusEnum::Paid->value;
                            $order->is_paid          = true;
                            $order->paid_at          = now();
                            $order->save();

                            // Redeem voucher only now that payment is confirmed
                            if ($order->voucher_id && $order->voucher_discount > 0) {
                                $orderVoucher = Voucher::lockForUpdate()->find($order->voucher_id);
                                if ($orderVoucher) {
                                    $alreadyRedeemed = VoucherUsage::where('order_id', $order->id)
                                        ->where('voucher_id', $orderVoucher->id)
                                        ->exists();

                                    if (!$alreadyRedeemed) {
                                        VoucherUsage::create([
                                            'voucher_id'  => $orderVoucher->id,
                                            'user_id'     => $order->user_id,
                                            'order_id'    => $order->id,
                                            'amount_used' => $order->voucher_discount,
                                        ]);

                                        if ($orderVoucher->type === 'gift') {
                                            $orderVoucher->remaining_amount = max(0, ($orderVoucher->remaining_amount ?? 0) - $order->voucher_discount);
                                            if ($orderVoucher->remaining_amount <= 0) {
                                                $orderVoucher->remaining_amount = 0;
                                                $orderVoucher->active = false;
                                            }
                                        } elseif ($orderVoucher->type === 'promo') {
                                            $orderVoucher->used_count += 1;
                                            if ($orderVoucher->max_uses && $orderVoucher->used_count >= $orderVoucher->max_uses) {
                                                $orderVoucher->active = false;
                                            }
                                        }

                                        $orderVoucher->save();
                                    }
                                }
                            }

                            $userId = $order->user_id;

                            $productsToDeleteFromCart = array_merge(
                                $productsToDeleteFromCart,
                                $order->orderItems->pluck('product_id')->toArray()
                            );

                            foreach ($order->orderItems as $orderItem) {
                                $options = $orderItem->variation_type_option_ids;
                                $product = $orderItem->product;

                                if ($orderItem->ticket_tier_id) {
                                    continue; // reserved above; tickets generated below
                                }

                                if (! $product) {
                                    continue; // gift-card / non-product line items have no stock to decrement
                                }

                                if ($options) {
                                    // ... variation stock decrement (unchanged)
                                } elseif ($product->quantity !== null) {
                                    $product->quantity -= $orderItem->quantity;
                                    $product->save();
                                }
                            }

                            // ---- 4. Generate tickets — inside the same transaction, so a failure here
                            // rolls back the Paid status + tier reserve + voucher redemption together ----
                            if ($order->orderItems->contains(fn($item) => $item->ticket_tier_id !== null)) {
                                try {
                                    app(\App\Services\TicketGenerationService::class)->generate($order);
                                } catch (\Throwable $e) {
                                    Log::error('Ticket generation failed after payment confirmed', [
                                        'order_id' => $order->id,
                                        'error' => $e->getMessage(),
                                    ]);
                                    throw $e;
                                }
                            }

                            $successfulOrderIds[] = $order->id;
                        });
                    } catch (\Throwable $e) {
                        $order->refresh();

                        $order->status =
                            OrderStatusEnum::PaidFulfillmentFailed->value;

                        $order->is_paid = true;
                        $order->payment_intent = $paymentIntent;
                        $order->paid_at = now();
                        $order->fulfillment_error = $e->getMessage();
                        $order->save();

                        $fulfillmentFailures[] = $order->id;

                        Log::critical(
                            'Order paid but fulfillment failed',
                            [
                                'order_id' => $order->id,
                                'session_id' => $session->id,
                                'error' => $e->getMessage(),
                            ]
                        );

                        continue;
                    }
                }

                if (! empty($fulfillmentFailures)) {
                    Log::critical('Orders paid but fulfillment failed — needs manual review/refund', [
                        'order_ids' => $fulfillmentFailures,
                        'session_id' => $session->id,
                    ]);
                    // TODO: Slack/email alert to admin — this is captured-money/no-product until resolved
                }

                // Everything below only concerns orders that actually completed fulfillment
                $orders = $orders->whereIn('id', $successfulOrderIds);

                if ($orders->isNotEmpty()) {
                    Log::info('SENDING CheckoutCompleted', [
                        'to_email' => $orders->first()->user?->email,
                        'to_user_id' => $orders->first()->user_id,
                        'order_ids' => $orders->pluck('id'),
                    ]);
                    Mail::to($orders->first()->user)->queue(new CheckoutCompleted($orders));
                }

                // Gift card vouchers purchased via gift card shop — activate now that payment is confirmed
                if (!empty($metadata['voucher_ids'])) {
                    $ids = explode(',', $metadata['voucher_ids']);
                    $vouchers = Voucher::whereIn('id', $ids)
                        ->where('stripe_session_id', $session->id)
                        ->where('active', false)
                        ->get();

                    Voucher::whereIn('id', $vouchers->pluck('id'))->update(['active' => true]);

                    Log::info('Gift card vouchers activated', ['ids' => $ids]);

                    $buyer = User::find($session->metadata->purchased_by ?? null);

                    foreach ($vouchers as $voucher) {
                        if (!empty($voucher->gifted_to_email) && !$voucher->sent_at) {
                            try {
                                Mail::to($voucher->gifted_to_email)
                                    ->send(new GiftVoucherRecipientMail($voucher->fresh(), $buyer?->name));

                                $voucher->update(['sent_at' => now()]);
                            } catch (\Exception $e) {
                                Log::error("Failed to send gift voucher email for voucher #{$voucher->id}: " . $e->getMessage());
                            }
                        }
                    }
                }

                // ── Clear cart items — only for orders that actually fulfilled ──
                $productIds = $orders
                    ->flatMap(fn($order) => $order->orderItems->pluck('product_id'))
                    ->filter()->unique()->values();

                if ($productIds->isNotEmpty()) {
                    CartItem::where('user_id', $userId)
                        ->whereIn('product_id', $productIds)
                        ->where('saved_for_later', false)
                        ->delete();
                }

                $ticketTierIds = $orders
                    ->flatMap(fn($order) => $order->orderItems->pluck('ticket_tier_id'))
                    ->filter()->unique()->values();

                if ($ticketTierIds->isNotEmpty()) {
                    CartItem::where('user_id', $userId)
                        ->whereIn('ticket_tier_id', $ticketTierIds)
                        ->where('saved_for_later', false)
                        ->delete();
                }

                $isFullyVoucherCovered =
                    ((int) ($session['amount_total'] ?? 0)) === 0
                    && ($session['payment_status'] ?? null) === 'no_payment_required';

                if ($isFullyVoucherCovered && $orders->isNotEmpty()) {
                    Log::info('Fully voucher-covered order — sending order emails', [
                        'session_id' => $session->id,
                        'orders' => $orders->pluck('id')->toArray(),
                    ]);

                    try {
                        Mail::to($orders->first()->user)->send(new CheckoutCompleted($orders));
                    } catch (\Exception $e) {
                        Log::error("Failed to send checkout completed email for voucher order: " . $e->getMessage());
                    }
                }

                break;

            case 'refund.created':
                $refund = $event->data->object;
                $paymentIntent = $refund['payment_intent'] ?? null;

                if (!$paymentIntent) {
                    Log::warning('Refund event missing payment_intent');
                    break;
                }

                // If RefundService already recorded this exact Stripe refund
                // (any of its methods — refundOrder, refundExcludingBookingFee,
                // refundManual, refundCustomAmount, refundBookingFeeOnly), this
                // webhook is just an echo of our own action. Skip it entirely so
                // we don't clobber the already-correct order/refund fields or
                // double-send the refund emails.
                $alreadyRecorded = \App\Models\Refund::where('stripe_refund_id', $refund['id'])->exists();
                if ($alreadyRecorded) {
                    Log::info("Refund {$refund['id']} already processed by app — webhook skipped");
                    break;
                }

                // Fallback path: a refund that happened OUTSIDE the app
                // (e.g. manually via the Stripe Dashboard). Handle it minimally.
                $order = Order::where('payment_intent', $paymentIntent)
                    ->with(['user', 'vendorUser'])
                    ->first();

                if (!$order) {
                    Log::warning("No order found for payment_intent: $paymentIntent");
                    break;
                }

                if ($order->refunded_at) {
                    Log::info("Refund already processed for Order ID {$order->id}");
                    break;
                }

                $order->refund_id     = $refund['id'];
                $order->refund_amount = $refund['amount'] / 100;
                $order->refunded_at   = now();
                $order->refund_reason = $order->refund_reason ?? 'Refund via Stripe Dashboard';
                $order->save();

                try {
                    $refundRecord = app(\App\Services\RefundService::class)->recordRefund(
                        $order,
                        'full',
                        $order->refund_amount,
                        $refund['id'],
                        'Refund via Stripe Dashboard'
                    );

                    Mail::to($order->user)->send(new RefundProcessedForUser($order, $refundRecord));
                    if ($order->vendorUser) {
                        Mail::to($order->vendorUser)->send(new RefundProcessedForVendor($order, $refundRecord));
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to send refund emails: " . $e->getMessage());
                }

                break;

            case 'account.updated':
                try {
                    $account = $event->data->object;

                    $user = User::where('stripe_account_id', $account->id)->first();

                    if (!$user) {
                        Log::warning('account.updated received for unknown stripe_account_id', ['account_id' => $account->id]);
                        break;
                    }

                    $isActive = (bool) ($account->charges_enabled && $account->payouts_enabled);

                    if ($user->stripe_account_active !== $isActive) {
                        $user->stripe_account_active = $isActive;
                        $user->save();

                        Log::info('Stripe account status synced', [
                            'user_id' => $user->id,
                            'stripe_account_active' => $isActive,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('account.updated handler failed: ' . $e->getMessage());
                }
                break;

            default:
                break;
        }

        return response('', 200);
    }

    public function success(Request $request)
    {
        $user = Auth::user();
        $session_id = $request->get('session_id');

        if (!$session_id) {
            abort(404);
        }

        $orders = Order::where('stripe_session_id', $session_id)
            ->with('vendor', 'orderItems.product')
            ->get();

        if ($orders->count() === 0) {
            // Fallback: webhook may not have fired yet, or this is a gift-card-only
            // checkout whose Order row is created lazily via fulfillGiftCardOrder().
            Stripe::setApiKey(config('app.stripe_secret_key'));

            try {
                $stripeSession = StripeSession::retrieve($session_id);
            } catch (\Exception $e) {
                Log::error("Could not retrieve Stripe session {$session_id}: " . $e->getMessage());
                abort(404);
            }

            if ($stripeSession->payment_status !== 'paid') {
                abort(404);
            }

            // Resale ticket purchases don't create an Order row � the webhook
            // (see resale_listing_id branch above) handles ownership transfer
            // directly via TicketResaleService. Redirect straight to the
            // buyer's ticket instead of falling through to gift-card logic.
            if (!empty($stripeSession->metadata['resale_listing_id'])) {
                $listing = \App\Models\TicketResaleListing::find(
                    $stripeSession->metadata['resale_listing_id']
                );

                if ($listing && $listing->ticket_id) {
                    return redirect()
                        ->route('tickets.show', $listing->ticket_id)
                        ->with('success', 'Ticket purchased! It is now in your account.');
                }

                return redirect()
                    ->route('resale.index')
                    ->with('success', 'Purchase complete! Check your tickets shortly.');
            }

            $order = $this->fulfillGiftCardOrder($stripeSession);

            if (!$order) {
                abort(404);
            }

            $orders = Order::where('stripe_session_id', $session_id)
                ->with('vendor', 'orderItems.product')
                ->get();
        }

        foreach ($orders as $order) {
            if ($order->user_id !== $user->id) {
                abort(403);
            }
        }

        // ── Clear cart items for this checkout ──────────────────────────────

        // Product cart items
        $productIds = $orders
            ->flatMap(fn($order) => $order->orderItems->pluck('product_id'))
            ->filter()
            ->unique()
            ->values();

        if ($productIds->isNotEmpty()) {
            CartItem::where('user_id', $user->id)
                ->whereIn('product_id', $productIds)
                ->where('saved_for_later', false)
                ->delete();
        }

        // Ticket cart items
        $ticketTierIds = $orders
            ->flatMap(fn($order) => $order->orderItems->pluck('ticket_tier_id'))
            ->filter()
            ->unique()
            ->values();

        if ($ticketTierIds->isNotEmpty()) {
            CartItem::whereIn('user_id', $orders->pluck('user_id')->unique())
                ->whereIn('ticket_tier_id', $ticketTierIds)
                ->where('saved_for_later', false)
                ->delete();
        }

        // ✅ Referral logic (unchanged)
        if ($user->referred_by && !$user->has_received_referral_bonus) {
            $totalSpent = $user->orders()
                ->where(function ($q) {
                    $q->where('status', 'Paid')
                        ->orWhere('payment_status', 'paid');
                })
                ->sum('total_price');

            if ($totalSpent >= 100) {
                Voucher::create([
                    'code' => strtoupper(Str::random(10)),
                    'type' => 'gift',
                    'amount' => 30,
                    'discount_type' => 'fixed',
                    'remaining_amount' => 30,
                    'max_uses' => 1,
                    'used_count' => 0,
                    'user_id' => $user->referred_by,
                    'active' => true,
                    'expires_at' => now()->addDays(365),
                ]);

                Voucher::create([
                    'code' => strtoupper(Str::random(10)),
                    'type' => 'gift',
                    'amount' => 30,
                    'discount_type' => 'fixed',
                    'remaining_amount' => 30,
                    'max_uses' => 1,
                    'used_count' => 0,
                    'user_id' => $user->id,
                    'active' => true,
                    'expires_at' => now()->addDays(365),
                ]);

                $user->update(['has_received_referral_bonus' => true]);
            }
        }

        // ✅ Voucher generation for "voucher" products (unchanged)
        foreach ($orders as $order) {
            foreach ($order->orderItems as $item) {
                if ($item->product && $item->product->product_type === 'voucher') {
                    Voucher::create([
                        'code' => strtoupper(Str::random(12)),
                        'type' => 'gift',
                        'amount' => $item->price,
                        'discount_type' => 'fixed',
                        'remaining_amount' => $item->price,
                        'max_uses' => 1,
                        'used_count' => 0,
                        'user_id' => $user->id,
                        'product_id' => $item->product_id,
                        'active' => true,
                        'expires_at' => now()->addDays(365),
                    ]);
                }
            }
        }

        return Inertia::render('Stripe/Success', [
            'orders' => OrderViewResource::collection($orders)->collection->toArray()
        ]);
    }

    private function fulfillGiftCardOrder(StripeSession $session): ?Order
    {
        // Idempotency guard — webhook and success() fallback can both call this
        $existing = Order::where('stripe_session_id', $session->id)->first();
        if ($existing) {
            return $existing;
        }

        $vouchers = Voucher::where('stripe_session_id', $session->id)->get();
        if ($vouchers->isEmpty()) {
            Log::warning("No vouchers found for Stripe session {$session->id}");
            return null;
        }

        $template = GiftCardTemplate::find($session->metadata->gift_card_template_id);
        $userId   = $session->metadata->purchased_by;
        $qty      = (int) ($session->metadata->quantity ?? $vouchers->count());
        $total    = $vouchers->sum('amount');

        return DB::transaction(function () use ($vouchers, $template, $userId, $qty, $total, $session) {
            $order = Order::create([
                'user_id'           => $userId,
                'vendor_user_id'    => $template?->vendor_user_id,
                'payment_method'    => 'card',
                'total_price'       => $total,
                'status'            => OrderStatusEnum::Paid->value,
                'is_paid'            => true,
                'payment_intent'    => $session->payment_intent,
                'stripe_charge_id'  => $session->payment_intent,
                'stripe_session_id' => $session->id,
            ]);

            OrderItem::create([
                'order_id'              => $order->id,
                'product_id'            => null,
                'gift_card_template_id' => $template?->id,
                'quantity'   => $qty,
                'price'      => $template?->amount ?? ($total / max($qty, 1)),
            ]);

            // $vouchers->each(fn($v) => $v->update([
            //     'active'   => true,
            // ]));

            Log::info("Gift card order #{$order->id} created for Stripe session {$session->id}");

            return $order;
        });
    }



    // connect from userprofile
    // public function connect()
    // {
    //     $user = Auth::user();
    //     if (!$user->getStripeAccountId()) {
    //         $user->createStripeAccount(['type' => 'express']);
    //     }

    //     if (!$user->isStripeAccountActive()) {
    //         return redirect($user->getstripeAccountLink());
    //     }

    //     return back()->with('success', 'Your account is already connected');
    // }


    // connect from admin dash board
    public function connect(Request $request)
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        $user = Auth::user();

        // Step 1: Create Stripe Account if it doesn't exist
        if (!$user->stripe_account_id) {
            @$user->createStripeAccount(['type' => 'express']);
            $user->refresh();
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
