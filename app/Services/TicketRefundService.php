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
     * Unwinds a ticket's ENTIRE resale history — not just the current
     * owner. If a ticket was never resold, this refunds exactly one
     * person (the original buyer) and behaves identically to
     * refundCurrentOwner(). If it was resold, every party who paid
     * money for it and no longer holds it — the original buyer, and
     * every reseller in between — gets back exactly what THEY paid,
     * from THEIR OWN payment intent.
     *
     * Why this matters: under the deferred-payout model (see
     * TicketResaleService::completeSale() / ProcessResalePayouts), a
     * cancelled event means no reseller in the chain has been paid out
     * yet — refunding only the current owner would leave every prior
     * owner having paid full price for a ticket they no longer have
     * and were never compensated for. Refunding every hop instead
     * nets everyone to $0: each reseller's own (still-unpaid) payout
     * is simply never fired, since payoutSeller() re-checks the
     * ticket's status and skips voided tickets.
     *
     * Returns one result entry per hop, oldest first.
     */
    public function refundResaleChain(Ticket $ticket): array
    {
        $ticket->loadMissing(['order', 'resaleListings' => fn ($q) => $q->where('status', 'sold')->orderBy('sold_at')]);

        $hops = [];

        // Hop 0: the original, non-resale purchase — same source
        // resolvePayment() already uses for a never-resold ticket.
        $orderItem = OrderItem::where('order_id', $ticket->order_id)
            ->where('ticket_tier_id', $ticket->ticket_tier_id)
            ->first();

        if ($orderItem && $ticket->order) {
            $hops[] = [
                'payer_user_id' => $ticket->order->user_id,
                'amount' => (float) $orderItem->price,
                'payment_intent' => $ticket->order->payment_intent,
                'source' => 'order_item:' . $orderItem->id,
                'resale_listing_id' => null,
            ];
        }

        // Hop 1..N: every completed resale, oldest first — each is a
        // separate person who paid a separate charge to acquire the
        // ticket and (under deferred payout) has not yet been paid a
        // cent for selling it onward.
        foreach ($ticket->resaleListings as $listing) {
            $hops[] = [
                'payer_user_id' => $listing->buyer_user_id,
                'amount' => (float) $listing->price,
                'payment_intent' => $listing->stripe_payment_intent,
                'source' => 'resale_listing:' . $listing->id,
                'resale_listing_id' => $listing->id,
            ];
        }

        $results = [];

        foreach ($hops as $hop) {
            $results[] = $this->refundHop($ticket, $hop);
        }

        return $results;
    }

    /**
     * Refunds one hop of a chain — one payer, one payment intent, one
     * amount — with the same idempotency guard refundCurrentOwner()
     * uses, scoped per-hop via resale_listing_id (null for the
     * original purchase hop) rather than per-ticket, since a resold
     * ticket now legitimately has more than one Refund row.
     */
    private function refundHop(Ticket $ticket, array $hop): array
    {
        $existing = \App\Models\Refund::where('ticket_id', $ticket->id)
            ->where('resale_listing_id', $hop['resale_listing_id'])
            ->first();

        if ($existing) {
            Log::info('Chain refund hop skipped — already recorded', [
                'ticket_id' => $ticket->id,
                'source' => $hop['source'],
                'existing_refund_id' => $existing->id,
            ]);

            return [
                'status' => 'skipped',
                'reason' => 'already_refunded',
                'ticket_id' => $ticket->id,
                'source' => $hop['source'],
                'stripe_refund_id' => $existing->stripe_refund_id,
            ];
        }

        if ($hop['amount'] <= 0 || ! $hop['payment_intent']) {
            Log::warning('Chain refund hop skipped — no resolvable payment', [
                'ticket_id' => $ticket->id,
                'source' => $hop['source'],
            ]);

            return [
                'status' => 'skipped',
                'reason' => 'no_resolvable_payment',
                'ticket_id' => $ticket->id,
                'source' => $hop['source'],
            ];
        }

        try {
            \Stripe\Stripe::setApiKey(config('app.stripe_secret_key'));

            $refund = \Stripe\Refund::create([
                'payment_intent' => $hop['payment_intent'],
                'amount' => (int) round($hop['amount'] * 100),
            ]);

            Log::info('Chain refund hop issued', [
                'ticket_id' => $ticket->id,
                'payer_user_id' => $hop['payer_user_id'],
                'amount' => $hop['amount'],
                'source' => $hop['source'],
                'stripe_refund_id' => $refund->id,
            ]);

            if ($ticket->order) {
                $this->refundService->recordRefund(
                    order: $ticket->order,
                    type: 'ticket',
                    amount: $hop['amount'],
                    stripeRefundId: $refund->id,
                    reason: "Resale chain unwind ({$hop['source']})",
                    ticketId: $ticket->id,
                    resaleListingId: $hop['resale_listing_id'],
                );
            } else {
                Log::warning('Chain refund hop issued but no order to attach Refund record to', [
                    'ticket_id' => $ticket->id,
                    'source' => $hop['source'],
                    'stripe_refund_id' => $refund->id,
                ]);
            }

            return [
                'status' => 'refunded',
                'ticket_id' => $ticket->id,
                'payer_user_id' => $hop['payer_user_id'],
                'amount' => $hop['amount'],
                'source' => $hop['source'],
                'stripe_refund_id' => $refund->id,
            ];
        } catch (\Throwable $e) {
            Log::error('Chain refund hop failed', [
                'ticket_id' => $ticket->id,
                'source' => $hop['source'],
                'amount' => $hop['amount'],
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 'failed',
                'ticket_id' => $ticket->id,
                'source' => $hop['source'],
                'error' => $e->getMessage(),
            ];
        }
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
