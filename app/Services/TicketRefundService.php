<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Models\Ticket;
use Illuminate\Support\Facades\Log;

class TicketRefundService
{
    public function __construct(
        private readonly RefundService $refundService
    ) {
    }

    /**
     * Refunds the CURRENT owner of a ticket the exact amount THEY paid —
     * not the original face value, not the full order. If the ticket was
     * resold, the current owner paid the resale price (TicketResaleListing),
     * not whatever the original buyer paid at checkout. If it was never
     * resold, the current owner IS the original buyer and their price
     * comes from the OrderItem it was purchased under.
     *
     * Deliberately narrow: this refunds one ticket's worth, to one person,
     * for one amount. It does not touch the rest of the order, does not
     * cancel the ticket, and does not decide policy (call this from
     * whatever event-cancellation flow already knows it should refund).
     */
    public function refundCurrentOwner(Ticket $ticket): array
    {
        $ticket->loadMissing(['order', 'resaleListings']);

        $ownerUserId = $ticket->owner_user_id;

        // Idempotency guard: if we already recorded a refund for this
        // ticket (e.g. a previous run partially succeeded, or this is
        // being retried), don't call Stripe again. Without this, a retry
        // of event cancellation would attempt a second refund on an
        // already-refunded charge for every ticket that succeeded last
        // time — Stripe rejects it, but only after a wasted API call and
        // a confusing "failed" result for a ticket that was actually
        // already refunded correctly.
        $existing = \App\Models\Refund::where('ticket_id', $ticket->id)->first();

        if ($existing) {
            Log::info('Refund skipped — already recorded for this ticket', [
                'ticket_id' => $ticket->id,
                'existing_refund_id' => $existing->id,
                'stripe_refund_id' => $existing->stripe_refund_id,
            ]);

            return [
                'status' => 'skipped',
                'reason' => 'already_refunded',
                'ticket_id' => $ticket->id,
                'stripe_refund_id' => $existing->stripe_refund_id,
            ];
        }

        [$amount, $paymentIntentId, $source] = $this->resolvePayment($ticket);

        if ($amount === null || $amount <= 0 || ! $paymentIntentId) {
            Log::warning('Refund skipped — no resolvable payment for ticket', [
                'ticket_id' => $ticket->id,
                'owner_user_id' => $ownerUserId,
            ]);

            return [
                'status' => 'skipped',
                'reason' => 'no_resolvable_payment',
                'ticket_id' => $ticket->id,
            ];
        }

        try {
            \Stripe\Stripe::setApiKey(config('app.stripe_secret_key'));

            $refund = \Stripe\Refund::create([
                'payment_intent' => $paymentIntentId,
                'amount' => (int) round($amount * 100),
            ]);

            Log::info('Ticket refund issued', [
                'ticket_id' => $ticket->id,
                'owner_user_id' => $ownerUserId,
                'amount' => $amount,
                'source' => $source,
                'stripe_refund_id' => $refund->id,
            ]);

            if ($ticket->order) {
                $this->refundService->recordRefund(
                    order: $ticket->order,
                    type: 'ticket',
                    amount: $amount,
                    stripeRefundId: $refund->id,
                    reason: "Ticket refund ({$source})",
                    ticketId: $ticket->id,
                );
            } else {
                Log::warning('Ticket refund issued but no order to attach Refund record to', [
                    'ticket_id' => $ticket->id,
                    'stripe_refund_id' => $refund->id,
                ]);
            }

            return [
                'status' => 'refunded',
                'ticket_id' => $ticket->id,
                'owner_user_id' => $ownerUserId,
                'amount' => $amount,
                'source' => $source,
                'stripe_refund_id' => $refund->id,
            ];
        } catch (\Throwable $e) {
            Log::error('Ticket refund failed', [
                'ticket_id' => $ticket->id,
                'owner_user_id' => $ownerUserId,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 'failed',
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Returns [amount, stripe_payment_intent_id, source] for whoever
     * currently owns this ticket.
     *
     * - Resold ticket (times_resold > 0): pull the most recent 'sold'
     *   resale listing — its `price` and `stripe_payment_intent` are
     *   exactly what the current owner paid and how they paid it.
     * - Never resold: pull the OrderItem this ticket's tier was bought
     *   under. `price` there is per-unit (confirmed against
     *   CartController — total = quantity * price), so it's already the
     *   right amount for one ticket, not the whole line.
     */
    private function resolvePayment(Ticket $ticket): array
    {
        if ($ticket->times_resold > 0) {
            $listing = $ticket->resaleListings()
                ->where('status', 'sold')
                ->latest('sold_at')
                ->first();

            if ($listing) {
                return [
                    (float) $listing->price,
                    $listing->stripe_payment_intent,
                    'resale_listing:' . $listing->id,
                ];
            }

            Log::warning('Ticket marked resold but no sold listing found', [
                'ticket_id' => $ticket->id,
            ]);
        }

        $orderItem = OrderItem::where('order_id', $ticket->order_id)
            ->where('ticket_tier_id', $ticket->ticket_tier_id)
            ->first();

        if (! $orderItem || ! $ticket->order) {
            return [null, null, null];
        }

        return [
            (float) $orderItem->price,
            $ticket->order->payment_intent,
            'order_item:' . $orderItem->id,
        ];
    }
}
