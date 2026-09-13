<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Ticket;
use App\Models\TicketResaleListing;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EventCancellationService
{
    public function __construct(
        private readonly TicketRefundService $refunds
    ) {
    }

    /**
     * Cancels the event and unwinds every ticket's ENTIRE resale chain —
     * not just the current owner. See
     * TicketRefundService::refundResaleChain() for why: under the
     * deferred-payout model, nobody in a ticket's resale history has
     * been paid out yet by the time an event can still be cancelled, so
     * refunding only the current owner would leave every earlier
     * reseller having paid full price for a ticket they no longer hold
     * and were never compensated for selling. Each hop nets to $0
     * instead — refunded what they paid, and their own (still-unpaid)
     * resale payout simply never fires once the ticket is void.
     *
     * There is no buyer-initiated path to this — cancellation is
     * organizer/admin only (enforce that in the controller, same as
     * VenueController::destroy's ownership check). A buyer's only
     * self-service option stays resale (TicketResaleController).
     *
     * Each ticket's chain is isolated in its own try/catch, same
     * resilience pattern as PayoutVendors::processPayout — one failed
     * Stripe call must not stop the rest of the event's ticket-holders
     * from getting refunded, and must not roll back tickets already
     * refunded before it.
     */
    public function cancel(Event $event): array
    {
        DB::transaction(function () use ($event) {
            $event->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);
        });

        $ticketIds = Ticket::whereHas('eventLeg', function ($q) use ($event) {
            $q->where('event_id', $event->id);
        })
            ->whereIn('status', ['valid', 'listed'])
            ->pluck('id');

        Log::info('Event cancellation started', [
            'event_id' => $event->id,
            'ticket_count' => $ticketIds->count(),
        ]);

        $results = ['refunded' => [], 'skipped' => [], 'failed' => []];

        foreach ($ticketIds as $ticketId) {
            try {
                $ticket = Ticket::with(['order', 'resaleListings'])->find($ticketId);

                if (! $ticket) {
                    continue;
                }

                // Pull it off the resale market first — it can't still be
                // for sale once the event under it no longer exists.
                // Note: this only touches an 'active' (still-listed, not
                // yet sold) listing. A 'sold' listing is left as-is — it's
                // an accurate record of a completed sale — and is instead
                // blocked from ever paying out by the ticket going void
                // below (see payoutSeller()'s own status check).
                TicketResaleListing::where('ticket_id', $ticket->id)
                    ->where('status', 'active')
                    ->update([
                        'status' => 'cancelled',
                        'cancelled_at' => now(),
                    ]);

                $hopResults = $this->refunds->refundResaleChain($ticket);

                // A ticket that was never resold and never charged
                // anything (free/comp) unwinds to zero hops — treat that
                // the same as "all skipped", not a failure.
                $anyFailed = collect($hopResults)->contains(fn ($r) => $r['status'] === 'failed');

                if ($anyFailed) {
                    // At least one hop's Stripe call failed — leave the
                    // ticket as-is (not voided) so it's visibly unresolved
                    // for manual follow-up rather than silently lost, even
                    // though other hops on this same ticket may have gone
                    // through fine (those are already recorded and won't
                    // be retried thanks to the per-hop idempotency guard).
                    $results['failed'] = array_merge($results['failed'], $hopResults);
                } else {
                    $ticket->update([
                        'status' => 'void',
                        'voided_at' => now(),
                        'void_reason' => 'event_cancelled',
                    ]);

                    foreach ($hopResults as $result) {
                        $results[$result['status'] === 'refunded' ? 'refunded' : 'skipped'][] = $result;
                    }
                }
            } catch (\Throwable $e) {
                Log::error('Event cancellation: ticket handling failed', [
                    'event_id' => $event->id,
                    'ticket_id' => $ticketId,
                    'error' => $e->getMessage(),
                ]);

                $results['failed'][] = [
                    'status' => 'failed',
                    'ticket_id' => $ticketId,
                    'error' => $e->getMessage(),
                ];
            }
        }

        Log::info('Event cancellation finished', [
            'event_id' => $event->id,
            'refunded' => count($results['refunded']),
            'skipped' => count($results['skipped']),
            'failed' => count($results['failed']),
        ]);

        return $results;
    }
}
