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
     * Cancels the event and refunds every ticket's CURRENT owner, one
     * ticket at a time, each for exactly what that owner paid —
     * TicketRefundService already enforces that per-ticket scoping, this
     * just calls it in a loop and handles the event/ticket/listing state
     * around it.
     *
     * There is no buyer-initiated path to this — cancellation is
     * organizer/admin only (enforce that in the controller, same as
     * VenueController::destroy's ownership check). A buyer's only
     * self-service option stays resale (TicketResaleController).
     *
     * Each ticket's refund is isolated in its own try/catch, same
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
                TicketResaleListing::where('ticket_id', $ticket->id)
                    ->where('status', 'active')
                    ->update([
                        'status' => 'cancelled',
                        'cancelled_at' => now(),
                    ]);

                $result = $this->refunds->refundCurrentOwner($ticket);

                if ($result['status'] === 'refunded') {
                    $ticket->update(['status' => 'void']);
                    $results['refunded'][] = $result;
                } elseif ($result['status'] === 'skipped') {
                    // Nothing resolvable to refund (e.g. free/comp ticket) —
                    // still void it, since the event is cancelled either way.
                    $ticket->update(['status' => 'void']);
                    $results['skipped'][] = $result;
                } else {
                    // Refund attempt failed — leave the ticket as-is
                    // (not voided) so it's visibly unresolved for manual
                    // follow-up rather than silently lost.
                    $results['failed'][] = $result;
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
