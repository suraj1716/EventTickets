<?php

namespace App\Services;

use App\Enums\OrderStatusEnum;
use App\Mail\RefundProcessedForUser;
use App\Mail\RefundProcessedForVendor;
use App\Models\Order;
use App\Models\Vendor;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Stripe\Refund;
use Stripe\Stripe;
use App\Models\VoucherUsage;
use App\Models\Refund as RefundRecord;
use Illuminate\Support\Facades\DB;

class RefundService
{
    private function getBookingFee(Order $order): float
    {
        $vendor = Vendor::find($order->vendor_user_id);
        return $vendor?->booking_fee ?? 0;
    }

    /**
     * Send both refund notification emails for a given order/refund record.
     * Centralized so every refund method (regardless of type) sends the
     * same general-purpose email, which adapts its wording based on
     * $refund->type and $refund->voucher_restored.
     */
    private function sendRefundEmails(Order $order, RefundRecord $refund): void
    {
        try {
            Mail::to($order->user)->send(new RefundProcessedForUser($order, $refund));

            if ($order->vendorUser) {
                Mail::to($order->vendorUser)->send(new RefundProcessedForVendor($order, $refund));
            }
        } catch (\Exception $e) {
            Log::error("Failed to send refund emails for Order #{$order->id}: " . $e->getMessage());
        }
    }




    /**
     * Full refund via Stripe (total - booking_fee)
     */
    public function refundOrder(Order $order): float
    {
        return DB::transaction(function () use ($order) {
            $order = Order::lockForUpdate()->findOrFail($order->id);

            Log::info("Starting full order refund for Order #{$order->id}");

            if ($this->hasRefundType($order, 'full')) {
                Log::warning("Duplicate full refund attempt blocked for Order #{$order->id}");
                return 0;
            }

            if (!$order->stripe_charge_id && !$order->payment_intent) {
                throw new \Exception("Missing Stripe charge or payment intent for Order #{$order->id}");
            }

            $alreadyRefunded = $order->refund_amount ?? 0;
            $stripeCharged = $order->stripe_amount ?? $order->total_price;

            $remaining = round(min($order->total_price, $stripeCharged) - $alreadyRefunded, 2);

            if ($remaining <= 0) {
                Log::info("Nothing left to refund for Order #{$order->id} (already refunded: {$alreadyRefunded})");
                return 0;
            }

            try {
                Stripe::setApiKey(config('app.stripe_secret_key'));

                $stripeParams = [
                    'amount' => intval(round($remaining * 100)),
                    'reason' => 'requested_by_customer',
                ];

                if ($order->stripe_charge_id) {
                    $stripeParams['charge'] = $order->stripe_charge_id;
                } else {
                    $stripeParams['payment_intent'] = $order->payment_intent;
                }

                $stripeRefund = Refund::create($stripeParams);

                // This is always a FULL refund (order->total_price fully covered),
                // so refunded_at is correctly stamped here — the order should be
                // excluded from payout calculations entirely.
                $order->update([
                    'refund_amount' => $alreadyRefunded + $remaining,
                    'refunded_at' => now(),
                    'status' => OrderStatusEnum::Refunded->value,
                    'is_paid' => false,
                ]);

                $refundRecord = $this->recordRefund($order, 'full', $remaining, $stripeRefund->id);
                $this->sendRefundEmails($order, $refundRecord);

                Log::info("Order refund successful: A\$ {$remaining} for Order #{$order->id} (total refunded now: " . ($alreadyRefunded + $remaining) . ")");

                return $remaining;
            } catch (\Exception $e) {
                Log::error("Order refund failed for Order #{$order->id}: " . $e->getMessage());
                throw $e;
            }
        });
    }

    /**
     * Refund booking fee (total - booking_fee)
     *
     * NOTE: despite the name/comment, this refunds total_price - booking_fee,
     * i.e. everything EXCEPT the booking fee — meaning the vendor still keeps
     * the booking fee portion. This still marks the order as fully closed
     * out (refunded_at set), which is correct only if your business rule is
     * "vendor keeps nothing further from this order once this runs."
     */
    public function refundExcludingBookingFee(Order $order): float
    {
        return DB::transaction(function () use ($order) {
            $order = Order::lockForUpdate()->findOrFail($order->id);

            Log::info("Starting booking fee refund for Order #{$order->id}");

            if (!$order->payment_intent) {
                Log::warning("Missing payment intent for Order #{$order->id}");
                return 0;
            }

            $booking = $order->booking()->lockForUpdate()->first();

            if (!$booking) {
                Log::warning("No booking found for Order #{$order->id}");
                return 0;
            }

            if ($booking->booking_fee_refunded || $this->hasRefundType($order, 'booking_fee')) {
                Log::warning("Duplicate booking_fee refund attempt blocked for Order #{$order->id}");
                return 0;
            }

            $bookingFee = $this->getBookingFee($order);

            if ($bookingFee <= 0) {
                Log::info("No booking fee to refund for Order #{$order->id}");
                return 0;
            }

            $refundAmount = $order->total_price - $bookingFee;

            if ($refundAmount <= 0) {
                Log::warning("Refund amount is zero or negative for Order #{$order->id}");
                return 0;
            }

            Log::info("Booking refund amount: A\$ {$refundAmount} (total: {$order->total_price} - fee: {$bookingFee})");

            try {
                Stripe::setApiKey(config('app.stripe_secret_key'));

                $stripeParams = [
                    'amount' => intval(round($refundAmount * 100)),
                    'reason' => 'requested_by_customer',
                ];

                if ($order->stripe_charge_id) {
                    $stripeParams['charge'] = $order->stripe_charge_id;
                } elseif ($order->payment_intent) {
                    $stripeParams['payment_intent'] = $order->payment_intent;
                } else {
                    throw new \Exception("No Stripe charge or payment intent for Order #{$order->id}");
                }

                $stripeRefund = Refund::create($stripeParams);

                $booking->update([
                    'booking_fee_refunded' => true,
                    'booking_fee_refund_amount' => $refundAmount,
                ]);

                $order->update([
                    'refund_amount' => ($order->refund_amount ?? 0) + $refundAmount,
                    'refunded_at' => now(),
                    'status' => OrderStatusEnum::Refunded->value,
                    'is_paid' => false,
                ]);

                $refundRecord = $this->recordRefund($order, 'booking_fee', $refundAmount, $stripeRefund->id);
                $this->sendRefundEmails($order, $refundRecord);

                Log::info("Booking fee refund successful: A\$ {$refundAmount} for Order #{$order->id}");

                return $refundAmount;
            } catch (\Exception $e) {
                Log::error("Booking fee refund failed for Order #{$order->id}: " . $e->getMessage());
                throw $e;
            }
        });
    }

    /**
     * Manual refund for cash/EFTPOS orders
     */
    public function refundManual(Order $order): float
    {
        return DB::transaction(function () use ($order) {
            $order = Order::lockForUpdate()->findOrFail($order->id);

            Log::info("Starting manual refund for Order #{$order->id}");

            if ($this->hasRefundType($order, 'full')) {
                Log::warning("Duplicate manual/full refund attempt blocked for Order #{$order->id}");
                return 0;
            }

            $bookingFee = $this->getBookingFee($order);
            $refundAmount = $order->total_price - $bookingFee;

            if ($refundAmount <= 0) {
                Log::info("No refundable amount for Order #{$order->id}");
                return 0;
            }

            $order->update([
                'refund_amount' => $refundAmount,
                'refunded_at' => now(),
                'refund_reason' => 'Manual refund (' . $order->payment_method . ')',
                'status' => OrderStatusEnum::Refunded->value,
                'is_paid' => false,
            ]);

            $booking = $order->booking()->lockForUpdate()->first();
            if ($booking && !$booking->booking_fee_refunded) {
                $booking->update([
                    'booking_fee_refunded' => true,
                    'booking_fee_refund_amount' => $bookingFee,
                ]);
            }

            $refundRecord = $this->recordRefund($order, 'full', $refundAmount, null, 'Manual refund (' . $order->payment_method . ')');
            $this->sendRefundEmails($order, $refundRecord);

            Log::info("Manual refund successful: A\$ {$refundAmount} for Order #{$order->id}");

            return $refundAmount;
        });
    }

    /**
     * Custom partial refund — repeatable by design (staged refunds), so no
     * hasRefundType guard here. Locking still prevents two simultaneous
     * clicks from double-spending the same remaining balance.
     *
     * FIX: refunded_at is now only stamped once the order is FULLY refunded.
     * Previously it was stamped on every partial refund, which caused
     * PayoutController::calculateAmount() to exclude the order's entire
     * vendor_subtotal from payout even when only a small partial amount
     * had been refunded — underpaying the vendor. refund_amount is still
     * updated on every call so the payout calc can net the actual amount.
     */
    public function refundCustomAmount(Order $order, float $amount): float
    {
        if ($amount <= 0) {
            return 0;
        }

        return DB::transaction(function () use ($order, $amount) {
            $order = Order::lockForUpdate()->findOrFail($order->id);

            $alreadyRefunded = $order->refund_amount ?? 0;
            $remainingRefundable = round($order->total_price - $alreadyRefunded, 2);

            if ($amount > $remainingRefundable) {
                Log::warning("Custom refund of {$amount} exceeds remaining refundable {$remainingRefundable} for Order #{$order->id}");
                $amount = $remainingRefundable;
            }

            if ($amount <= 0) {
                return 0;
            }

            try {
                Stripe::setApiKey(config('app.stripe_secret_key'));

                $stripeParams = [
                    'amount' => intval($amount * 100),
                    'reason' => 'requested_by_customer',
                ];

                if ($order->stripe_charge_id) {
                    $stripeParams['charge'] = $order->stripe_charge_id;
                } elseif ($order->payment_intent) {
                    $stripeParams['payment_intent'] = $order->payment_intent;
                } else {
                    throw new \Exception("No Stripe charge or payment intent for Order #{$order->id}");
                }

                $stripeRefund = Refund::create($stripeParams);

                $newRefundTotal = $alreadyRefunded + $amount;
                $isFullyRefunded = $newRefundTotal >= $order->total_price;

                $order->update([
                    'refund_amount' => $newRefundTotal,
                    // Only stamp refunded_at when the order is fully refunded.
                    // A partial refund should NOT flip this, or the payout
                    // calc will drop the whole order instead of netting it.
                    'refunded_at' => $isFullyRefunded ? now() : $order->refunded_at,
                    'status' => $isFullyRefunded ? OrderStatusEnum::Refunded->value : $order->status,
                    'is_paid' => $isFullyRefunded ? false : $order->is_paid,
                ]);

                $refundRecord = $this->recordRefund($order, 'custom', $amount, $stripeRefund->id);
                $this->sendRefundEmails($order, $refundRecord);

                return $amount;
            } catch (\Exception $e) {
                Log::error("Custom refund failed for Order #{$order->id}: " . $e->getMessage());
                throw $e;
            }
        });
    }

    /**
     * Refund ONLY the booking fee (customer visited & completed service).
     *
     * FIX: both branches below now consistently update order->refund_amount.
     * The no-Stripe-charge branch previously never touched the order at
     * all, so a booking-fee-only refund was completely invisible to
     * PayoutController::calculateAmount() — the vendor would still be paid
     * the full vendor_subtotal for an order that had actually been
     * partially refunded.
     */
    public function refundBookingFeeOnly(Order $order): float
    {
        return DB::transaction(function () use ($order) {
            $booking = $order->booking()->lockForUpdate()->first();

            if (!$booking || $booking->booking_fee_refunded) {
                return 0;
            }

            // extra guard: has this order already had a booking_fee refund recorded?
            if ($this->hasRefundType($order, 'booking_fee')) {
                Log::warning("Duplicate booking_fee refund attempt blocked for Order #{$order->id}");
                return 0;
            }

            $bookingFee = $this->getBookingFee($order);
            if ($bookingFee <= 0) {
                return 0;
            }

            if (!$order->stripe_charge_id && !$order->payment_intent) {
                $booking->update([
                    'booking_fee_refunded' => true,
                    'booking_fee_refund_amount' => $bookingFee,
                ]);

                $restored = $this->restoreVoucherAmountForOrder($order, $bookingFee);

                // FIX: this order-level update was missing entirely before,
                // so refund_amount never reflected this refund and the order
                // stayed eligible for its full vendor_subtotal in payouts.
                $order->update([
                    'refund_amount' => ($order->refund_amount ?? 0) + $bookingFee,
                ]);

                $refundRecord = $this->recordRefund($order, 'booking_fee', $bookingFee, null, 'Booking fee refunded via voucher restore (no Stripe charge)', false, $restored);
                $this->sendRefundEmails($order, $refundRecord);

                return $bookingFee;
            }

            try {
                Stripe::setApiKey(config('app.stripe_secret_key'));
                $stripeParams = ['amount' => intval(round($bookingFee * 100)), 'reason' => 'requested_by_customer'];
                $stripeParams[$order->stripe_charge_id ? 'charge' : 'payment_intent']
                    = $order->stripe_charge_id ?: $order->payment_intent;

                $stripeRefund = Refund::create($stripeParams);

                $booking->update([
                    'booking_fee_refunded' => true,
                    'booking_fee_refund_amount' => $bookingFee,
                ]);
                $order->update([
                    'refund_amount' => ($order->refund_amount ?? 0) + $bookingFee,
                ]);

                $refundRecord = $this->recordRefund($order, 'booking_fee', $bookingFee, $stripeRefund->id);
                $this->sendRefundEmails($order, $refundRecord);

                return $bookingFee;
            } catch (\Exception $e) {
                Log::error("Booking fee only refund failed for Order #{$order->id}: " . $e->getMessage());
                throw $e;
            }
        });
    }

    /**
     * Full refund including booking fee — for a genuine full cancellation.
     */
    public function refundBookingFeeAndOrder(Order $order): float
    {
        return $this->refundOrder($order); // total_price already includes booking fee, so a straight full refund covers both
    }

    public function recordRefund(
        Order $order,
        string $type,
        float $amount,
        ?string $stripeRefundId = null,
        ?string $reason = null,
        bool $isMarker = false,
        float $voucherRestored = 0
    ): RefundRecord {
        return RefundRecord::create([
            'order_id'          => $order->id,
            'type'              => $type,
            'amount'            => $amount,
            'voucher_restored'  => $voucherRestored,
            'stripe_refund_id'  => $stripeRefundId,
            'reason'            => $reason,
            'is_marker'         => $isMarker,
        ]);
    }

    public function hasRefundType(Order $order, string $type): bool
    {
        return RefundRecord::where('order_id', $order->id)->where('type', $type)->exists();
    }

    /**
     * Total amount already restored to the voucher for this order, across all
     * previous partial/full refund actions. Prevents double-restoring the same
     * voucher usage across multiple refund button clicks.
     */
    protected function alreadyRestoredForOrder(Order $order): float
    {
        return (float) RefundRecord::where('order_id', $order->id)
            ->where('voucher_restored', '>', 0)
            ->sum('voucher_restored');
    }

    public function restoreVoucherForOrder(Order $order): float
    {
        $usages = VoucherUsage::where('order_id', $order->id)->get();
        if ($usages->isEmpty()) return 0;

        $alreadyRestored = $this->alreadyRestoredForOrder($order);
        $totalRestored = 0;

        foreach ($usages as $usage) {
            $voucher = $usage->voucher;
            if (!$voucher) continue;

            $remainingRestorable = max(0, $usage->amount_used - $alreadyRestored);
            if ($remainingRestorable <= 0) continue;

            if ($voucher->type === 'gift') {
                $maxAllowed = max(0, $voucher->amount - ($voucher->remaining_amount ?? 0));
                $actuallyRestored = min($remainingRestorable, $maxAllowed);

                $voucher->remaining_amount = ($voucher->remaining_amount ?? 0) + $actuallyRestored;
                if ($voucher->remaining_amount > 0 && !$voucher->active) {
                    $voucher->active = true;
                }
            } elseif ($voucher->type === 'promo') {
                $voucher->used_count = max(0, $voucher->used_count - 1);
                $voucher->active = true;
                $actuallyRestored = $remainingRestorable;
            }

            $voucher->save();
            $totalRestored += $actuallyRestored;

            Log::info("Restored voucher #{$voucher->id} by {$actuallyRestored} (capped, ceiling-enforced) for refunded Order #{$order->id}");
        }

        return $totalRestored;
    }

    public function restoreVoucherAmountForOrder(Order $order, float $amount): float
    {
        if ($amount <= 0) return 0;

        $usage = VoucherUsage::where('order_id', $order->id)->first();
        if (!$usage || !$usage->voucher) return 0;

        $alreadyRestored = $this->alreadyRestoredForOrder($order);
        $remainingRestorable = max(0, $usage->amount_used - $alreadyRestored);
        $amount = min($amount, $remainingRestorable);
        if ($amount <= 0) return 0;

        $voucher = $usage->voucher;

        if ($voucher->type === 'gift') {
            $maxAllowed = max(0, $voucher->amount - ($voucher->remaining_amount ?? 0));
            $amount = min($amount, $maxAllowed);
            if ($amount <= 0) return 0;

            $voucher->remaining_amount = ($voucher->remaining_amount ?? 0) + $amount;
            if ($voucher->remaining_amount > 0 && !$voucher->active) {
                $voucher->active = true;
            }
        } elseif ($voucher->type === 'promo') {
            $voucher->used_count = max(0, $voucher->used_count - 1);
            $voucher->active = true;
        }

        $voucher->save();

        Log::info("Restored A\${$amount} to voucher #{$voucher->id} for Order #{$order->id} (partial, ceiling-enforced)");

        return $amount;
    }
}
