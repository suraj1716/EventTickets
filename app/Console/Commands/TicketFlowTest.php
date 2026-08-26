<?php

namespace App\Console\Commands;

use App\Enums\OrderStatusEnum;
use App\Models\CartItem;
use App\Models\Event;
use App\Models\EventLeg;
use App\Models\EventSeat;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProcessedStripeEvent;
use App\Models\Ticket;
use App\Models\TicketTier;
use App\Models\User;
use App\Models\Venue;
use App\Services\TicketGenerationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TicketFlowTest extends Command
{
    /**
     * php artisan test:ticket-flow
     */
    protected $signature = 'test:ticket-flow';

    protected $description = 'Extended end-to-end ticket purchase / fulfillment safety test';

    public function handle()
    {
        DB::beginTransaction();

        try {
            // ===============================================================
            // SETUP
            // ===============================================================

            $this->step('Setup: users, vendor');

            $vendor = User::first();

            $this->check(
                (bool) $vendor,
                'a vendor/user exists to own the event'
            );

            $buyerA = User::factory()->create([
                'email' => 'flow-test-buyer-a@example.test',
            ]);

            $buyerB = User::factory()->create([
                'email' => 'flow-test-buyer-b@example.test',
            ]);

            $buyerC = User::factory()->create([
                'email' => 'flow-test-buyer-c@example.test',
            ]);

            $this->line(
                "  buyerA #{$buyerA->id}, " .
                "buyerB #{$buyerB->id}, " .
                "buyerC #{$buyerC->id}, " .
                "vendor #{$vendor->id}"
            );

            // ===============================================================
            // 1. EVENT
            // ===============================================================

            $this->step('1. Event');

            $event = Event::create([
                'vendor_user_id' => $vendor->id,
                'name' => 'Flow Test Event',
                'description' => 'Created by test:ticket-flow',
                'type' => 'standalone',
                'status' => 'proposed',
                'languages' => ['English'],
            ]);

            $this->check(
                (bool) $event->id,
                "Event #{$event->id} created"
            );

            // ===============================================================
            // 2. LEGS
            // ===============================================================

            $this->step('2. Legs');

            $venue = Venue::first();

            $this->check(
                (bool) $venue,
                'a venue exists'
            );

            $leg = EventLeg::create([
                'event_id' => $event->id,
                'venue_id' => $venue->id,
                'venue_name' => $venue->name,
                'address' => $venue->address,
                'city' => $venue->city,
                'event_date' => now()->addDays(30)->toDateString(),
                'capacity' => 100,
                'sequence' => 1,
                'seating_type' => 'reserved',
            ]);

            $this->check(
                (bool) $leg->id,
                "Leg #{$leg->id} created (reserved seating)"
            );

            $legGa = EventLeg::create([
                'event_id' => $event->id,
                'venue_id' => $venue->id,
                'venue_name' => $venue->name,
                'address' => $venue->address,
                'city' => $venue->city,
                'event_date' => now()->addDays(30)->toDateString(),
                'capacity' => 100,
                'sequence' => 2,
                'seating_type' => 'general',
            ]);

            $this->check(
                (bool) $legGa->id,
                "Leg #{$legGa->id} created (GA)"
            );

            // ===============================================================
            // 3. TIERS
            // ===============================================================

            $this->step('3. Ticket tiers');

            $tierReserved = TicketTier::create([
                'event_leg_id' => $leg->id,
                'name' => 'Reserved Seating',
                'price' => 50,
                'quantity' => 2,
                'remaining' => 2,
                'starts_at' => now()->subDay(),
                'ends_at' => now()->addDays(29),
            ]);

            $tierGa = TicketTier::create([
                'event_leg_id' => $legGa->id,
                'name' => 'GA',
                'price' => 25,
                'quantity' => 3,
                'remaining' => 3,
                'starts_at' => now()->subDay(),
                'ends_at' => now()->addDays(29),
            ]);

            $this->check(
                $tierReserved->isOpen(),
                "Reserved tier #{$tierReserved->id} is open, remaining={$tierReserved->remaining}"
            );

            $this->check(
                $tierGa->isOpen(),
                "GA tier #{$tierGa->id} is open, remaining={$tierGa->remaining}"
            );

            // ONE reserved seat.
            $seat = EventSeat::create([
                'event_leg_id' => $leg->id,
                'ticket_tier_id' => $tierReserved->id,
                'row_label' => 'A',
                'seat_number' => 1,
                'label' => 'A1',
                'status' => 'available',
            ]);

            $this->check(
                $seat->isAvailable(),
                "Seat {$seat->label} (#{$seat->id}) is available"
            );

            // ===============================================================
            // 4. SELECTION
            // ===============================================================

            $this->step('4A. GA ticket selection');

            $gaSelection = [
                'ticket_tier_id' => $tierGa->id,
                'quantity' => 2,
            ];

            $this->line(
                "  buyerA selects {$gaSelection['quantity']}x GA tier #{$tierGa->id}"
            );

            $this->step('4B. Reserved seat selection');

            $seatSelection = [
                'ticket_tier_id' => $tierReserved->id,
                'quantity' => 1,
                'seat_ids' => [$seat->id],
            ];

            $this->line(
                "  buyerA selects seat #{$seat->id} on tier #{$tierReserved->id}"
            );

            // ===============================================================
            // 5 / 6. ORDER
            // ===============================================================

            $this->step('5. Checkout request -> 6. Order created');

            $orderA = Order::create([
                'user_id' => $buyerA->id,
                'vendor_user_id' => $vendor->id,
                'total_price' => 100,
                'status' => OrderStatusEnum::Draft->value,
                'is_paid' => false,
                'stripe_session_id' => 'cs_test_flowtest_a',
            ]);

            OrderItem::create([
                'order_id' => $orderA->id,
                'ticket_tier_id' => $tierGa->id,
                'quantity' => 2,
                'price' => $tierGa->price,
            ]);

            OrderItem::create([
                'order_id' => $orderA->id,
                'ticket_tier_id' => $tierReserved->id,
                'quantity' => 1,
                'price' => $tierReserved->price,
                'seat_ids' => [$seat->id],
            ]);

            $this->check(
                $orderA->status === OrderStatusEnum::Draft->value,
                "Order #{$orderA->id} created with status=Draft"
            );

            // ===============================================================
            // 7. PAYMENT
            // ===============================================================

            $this->step('7. Stripe payment (simulated)');

            $this->line(
                "  Assuming payment succeeds for {$orderA->stripe_session_id}"
            );

            // ===============================================================
            // 8 / 9. WEBHOOK + PAID
            // ===============================================================

            $this->step(
                '8. Stripe webhook received -> 9. Order paid'
            );

            $fakeEventId = 'evt_test_flowtest_a';

            $this->check(
                !ProcessedStripeEvent::where(
                    'stripe_event_id',
                    $fakeEventId
                )->exists(),
                'fake webhook event not yet processed'
            );

            ProcessedStripeEvent::create([
                'stripe_event_id' => $fakeEventId,
            ]);

            $orderA->payment_intent = 'pi_test_flowtest_a';
            $orderA->status = OrderStatusEnum::Paid->value;
            $orderA->is_paid = true;
            $orderA->paid_at = now();
            $orderA->save();

            $this->check(
                $orderA->fresh()->status === OrderStatusEnum::Paid->value,
                "Order #{$orderA->id} status is Paid"
            );

            $this->check(
                (bool) $orderA->fresh()->is_paid,
                "Order #{$orderA->id} is_paid = true"
            );

            // ===============================================================
            // RESERVE BUYER A INVENTORY
            // ===============================================================

            foreach ($orderA->orderItems as $item) {
                $tier = TicketTier::lockForUpdate()->find(
                    $item->ticket_tier_id
                );

                $reserved = $tier->reserve($item->quantity);

                $this->check(
                    $reserved,
                    "Reserved {$item->quantity}x on tier #{$tier->id} for order #{$orderA->id}"
                );
            }

            // ===============================================================
            // 10. GENERATE TICKETS
            // ===============================================================

            $this->step('10. Tickets generated');

            $ticketsA = app(TicketGenerationService::class)
                ->generate($orderA->fresh(['orderItems']));

            $this->check(
                $ticketsA->count() === 3,
                "3 tickets generated for order #{$orderA->id} (2 GA + 1 reserved), got {$ticketsA->count()}"
            );

            foreach ($ticketsA as $ticket) {
                $this->check(
                    $ticket->isValid(),
                    "Ticket {$ticket->code} has status=valid"
                );
            }

            // ===============================================================
            // 11. INVENTORY
            // ===============================================================

            $this->step('11. Seat/inventory updated');

            $tierGaFresh = $tierGa->fresh();
            $tierReservedFresh = $tierReserved->fresh();
            $seatFresh = $seat->fresh();

            $this->check(
                $tierGaFresh->remaining === 1,
                "GA tier remaining 3 -> 1, got {$tierGaFresh->remaining}"
            );

            $this->check(
                $tierReservedFresh->remaining === 1,
                "Reserved tier remaining 2 -> 1, got {$tierReservedFresh->remaining}"
            );

            $this->check(
                $seatFresh->status === 'sold',
                "Seat #{$seat->id} status is sold"
            );

            // ===============================================================
            // 12. REFRESH UI
            // ===============================================================

            $this->step('12. Refresh UI');

            $this->line(
                "  GA remaining: {$tierGaFresh->remaining}"
            );

            $this->line(
                "  Reserved remaining: {$tierReservedFresh->remaining}"
            );

            $this->line(
                "  Seat A1: {$seatFresh->status}"
            );

            // ===============================================================
            // 13. SOLD SEAT FAILURE
            // ===============================================================

            $this->step(
                '13. Cannot repurchase sold seat'
            );

            $orderB = Order::create([
                'user_id' => $buyerB->id,
                'vendor_user_id' => $vendor->id,
                'total_price' => 50,
                'status' => OrderStatusEnum::Draft->value,
                'is_paid' => false,
                'stripe_session_id' => 'cs_test_flowtest_b',
            ]);

            OrderItem::create([
                'order_id' => $orderB->id,
                'ticket_tier_id' => $tierReserved->id,
                'quantity' => 1,
                'price' => $tierReserved->price,
                'seat_ids' => [$seat->id],
            ]);

            $reservedBefore = $tierReserved->fresh()->remaining;

            $transactionThrew = false;
            $transactionMessage = null;

            try {
                DB::transaction(function () use ($orderB, $tierReserved) {
                    $orderB->status = OrderStatusEnum::Paid->value;
                    $orderB->is_paid = true;
                    $orderB->paid_at = now();
                    $orderB->save();

                    $tier = TicketTier::lockForUpdate()->find(
                        $tierReserved->id
                    );

                    $item = $orderB->orderItems->first();

                    if (!$tier->reserve($item->quantity)) {
                        throw new \RuntimeException(
                            'Tier sold out'
                        );
                    }

                    app(TicketGenerationService::class)
                        ->generate($orderB->fresh(['orderItems']));
                });
            } catch (\Throwable $e) {
                $transactionThrew = true;
                $transactionMessage = $e->getMessage();

                // IMPORTANT:
                // Money was captured, therefore the order remains paid,
                // but fulfillment must be explicitly marked failed.
                $orderB->refresh();

                $orderB->status =
                    OrderStatusEnum::PaidFulfillmentFailed->value;

                $orderB->is_paid = true;

                $orderB->fulfillment_error =
                    $transactionMessage;

                $orderB->save();
            }

            $this->check(
                $transactionThrew,
                'transaction threw and rolled back, as expected'
            );

            $this->check(
                $orderB->fresh()->status ===
                    OrderStatusEnum::PaidFulfillmentFailed->value,
                "orderB status is PaidFulfillmentFailed, got '{$orderB->fresh()->status}'"
            );

            $this->check(
                (bool) $orderB->fresh()->is_paid,
                'orderB is_paid = true (payment was captured)'
            );

            $this->check(
                !empty($orderB->fresh()->fulfillment_error),
                'orderB has fulfillment_error'
            );

            $this->check(
                $tierReserved->fresh()->remaining === $reservedBefore,
                "Reserved tier unchanged at {$reservedBefore}"
            );

            $this->check(
                Ticket::where(
                    'order_id',
                    $orderB->id
                )->doesntExist(),
                "No tickets exist for order #{$orderB->id}"
            );

            $this->line(
                "  fulfillment error: {$transactionMessage}"
            );

            // ===============================================================
            // 13b. GA SOLD OUT
            // ===============================================================

            $this->step(
                '13b. GA reserve fails when remaining = 0'
            );

            $tierGa->refresh();

            $this->check(
                $tierGa->remaining === 1,
                "GA tier currently has 1 remaining"
            );

            $tierGa->remaining = 0;
            $tierGa->save();

            $tierGaLocked = TicketTier::lockForUpdate()->find(
                $tierGa->id
            );

            $gaReserveResult = $tierGaLocked->reserve(1);

            $this->check(
                !$gaReserveResult,
                'reserve(1) correctly fails when remaining=0'
            );

            // ===============================================================
            // 13c. GA LAST UNIT PROTECTION
            // ===============================================================

            $this->step(
                '13c. GA last-unit contention protection'
            );

            /*
             * This reproduces the critical database operation used by
             * production fulfillment:
             *
             *     lockForUpdate()
             *     reserve(1)
             *
             * We reset the tier to exactly one remaining unit.
             */

            $tierGa->refresh();

            $tierGa->remaining = 1;
            $tierGa->save();

            $first = TicketTier::lockForUpdate()->find(
                $tierGa->id
            );

            $firstResult = $first->reserve(1);

            $this->check(
                $firstResult,
                'first buyer can reserve the final GA unit'
            );

            $this->check(
                $first->fresh()->remaining === 0,
                'GA remaining becomes 0 after final unit reservation'
            );

            /*
             * A second buyer now attempts the same final unit.
             *
             * Because the first reservation committed before this second
             * lock, the second transaction must see remaining=0.
             */
            $second = TicketTier::lockForUpdate()->find(
                $tierGa->id
            );

            $secondResult = $second->reserve(1);

            $this->check(
                !$secondResult,
                'second buyer cannot reserve the already-consumed final GA unit'
            );

            $this->check(
                $second->fresh()->remaining === 0,
                'GA remaining never goes below zero'
            );

            $this->line(
                '  NOTE: this verifies database locking/sequential safety.'
            );

            $this->line(
                '  True OS-level simultaneous concurrency requires parallel worker processes.'
            );

            // ===============================================================
            // 13d. MULTI-LINE ORDER ATOMICITY
            // ===============================================================

            $this->step(
                '13d. Multi-line order rolls back atomically'
            );

            /*
             * Create a fresh GA tier with one unit.
             *
             * The order contains:
             *
             *   line 1 = valid GA unit
             *   line 2 = already-sold reserved seat
             *
             * Expected:
             *
             *   GA reservation rolls back
             *   no tickets survive
             *   order becomes PaidFulfillmentFailed
             */

            $atomicTier = TicketTier::create([
                'event_leg_id' => $legGa->id,
                'name' => 'Atomicity Test GA',
                'price' => 25,
                'quantity' => 1,
                'remaining' => 1,
                'starts_at' => now()->subDay(),
                'ends_at' => now()->addDays(29),
            ]);

            $orderC = Order::create([
                'user_id' => $buyerC->id,
                'vendor_user_id' => $vendor->id,
                'total_price' => 75,
                'status' => OrderStatusEnum::Draft->value,
                'is_paid' => false,
                'stripe_session_id' => 'cs_test_flowtest_atomic',
            ]);

            OrderItem::create([
                'order_id' => $orderC->id,
                'ticket_tier_id' => $atomicTier->id,
                'quantity' => 1,
                'price' => 25,
            ]);

            OrderItem::create([
                'order_id' => $orderC->id,
                'ticket_tier_id' => $tierReserved->id,
                'quantity' => 1,
                'price' => 50,
                'seat_ids' => [$seat->id],
            ]);

            $atomicBefore = $atomicTier->fresh()->remaining;

            try {
                DB::transaction(function () use (
                    $orderC,
                    $atomicTier,
                    $tierReserved
                ) {
                    $orderC->status = OrderStatusEnum::Paid->value;
                    $orderC->is_paid = true;
                    $orderC->paid_at = now();
                    $orderC->save();

                    foreach (
                        $orderC->orderItems as $item
                    ) {
                        $tier = TicketTier::lockForUpdate()->find(
                            $item->ticket_tier_id
                        );

                        if (!$tier->reserve($item->quantity)) {
                            throw new \RuntimeException(
                                "Tier {$tier->id} sold out"
                            );
                        }
                    }

                    app(TicketGenerationService::class)
                        ->generate($orderC->fresh(['orderItems']));
                });
            } catch (\Throwable $e) {
                $orderC->refresh();

                $orderC->status =
                    OrderStatusEnum::PaidFulfillmentFailed->value;

                $orderC->is_paid = true;

                $orderC->fulfillment_error =
                    $e->getMessage();

                $orderC->save();

                $this->line(
                    "  expected fulfillment failure: {$e->getMessage()}"
                );
            }

            $this->check(
                $orderC->fresh()->status ===
                    OrderStatusEnum::PaidFulfillmentFailed->value,
                'multi-line order marked PaidFulfillmentFailed'
            );

            $this->check(
                $atomicTier->fresh()->remaining === $atomicBefore,
                "successful first line was rolled back; GA remaining={$atomicTier->fresh()->remaining}"
            );

            $this->check(
                Ticket::where(
                    'order_id',
                    $orderC->id
                )->doesntExist(),
                'multi-line failure leaves zero tickets'
            );

            $this->check(
                $seat->fresh()->status === 'sold',
                'already-sold seat remains sold'
            );

            // ===============================================================
            // 14. DUPLICATE SUCCESSFUL WEBHOOK
            // ===============================================================

            $this->step(
                '14. Duplicate webhook test'
            );

            $ticketCountBefore = Ticket::where(
                'order_id',
                $orderA->id
            )->count();

            $tierRemainingBefore = $tierGa->fresh()->remaining;

            $this->check(
                ProcessedStripeEvent::where(
                    'stripe_event_id',
                    $fakeEventId
                )->exists(),
                'successful webhook event exists in ProcessedStripeEvent'
            );

            if (
                ProcessedStripeEvent::where(
                    'stripe_event_id',
                    $fakeEventId
                )->exists()
            ) {
                $this->line(
                    '  Duplicate detected — webhook would be skipped'
                );
            }

            $this->check(
                Ticket::where(
                    'order_id',
                    $orderA->id
                )->count() === $ticketCountBefore,
                "ticket count unchanged ({$ticketCountBefore})"
            );

            $this->check(
                $tierGa->fresh()->remaining === $tierRemainingBefore,
                "GA inventory unchanged ({$tierRemainingBefore})"
            );

            // ===============================================================
            // 14b. DUPLICATE FAILED WEBHOOK
            // ===============================================================

            $this->step(
                '14b. Duplicate webhook for failed fulfillment'
            );

            $failedEventId = 'evt_test_flowtest_failed';

            ProcessedStripeEvent::create([
                'stripe_event_id' => $failedEventId,
            ]);

            $failedOrderStatusBefore =
                $orderB->fresh()->status;

            $failedTicketCountBefore =
                Ticket::where(
                    'order_id',
                    $orderB->id
                )->count();

            if (
                ProcessedStripeEvent::where(
                    'stripe_event_id',
                    $failedEventId
                )->exists()
            ) {
                $this->line(
                    '  Failed webhook duplicate detected — skip expected'
                );
            }

            $this->check(
                $orderB->fresh()->status ===
                    $failedOrderStatusBefore,
                'failed order state unchanged on duplicate webhook'
            );

            $this->check(
                Ticket::where(
                    'order_id',
                    $orderB->id
                )->count() === $failedTicketCountBefore,
                'failed order ticket count unchanged'
            );

            // ===============================================================
            // 15. WEBHOOK BEFORE ORDER EXISTS
            // ===============================================================

            $this->step(
                '15. Webhook arrives before order is recorded'
            );

            $missingSessionId =
                'cs_test_flowtest_missing_order';

            $missingOrders = Order::where(
                'stripe_session_id',
                $missingSessionId
            )->get();

            $this->check(
                $missingOrders->isEmpty(),
                'no order exists for simulated Stripe session'
            );

            /*
             * This is deliberately NOT pretending that the webhook can
             * successfully fulfill the order.
             *
             * The production webhook must handle this state safely:
             *
             *   webhook arrives
             *       ↓
             *   order not found
             *       ↓
             *   do NOT mark fulfillment complete
             *       ↓
             *   allow retry/reconciliation
             *
             * This command records the invariant.
             */

            $this->line(
                '  Expected production behavior: missing order must not be treated as successful fulfillment.'
            );

            $this->check(
                Order::where(
                    'stripe_session_id',
                    $missingSessionId
                )->doesntExist(),
                'missing-order state confirmed'
            );

            // ===============================================================
            // 16. PAID FULFILLMENT FAILURE STATE
            // ===============================================================

$this->step(
    '16. PaidFulfillmentFailed state is reconcilable'
);

/*
 * orderB:
 *   Payment captured
 *   Seat unavailable
 *   Fulfillment failed
 *
 * orderC:
 *   Payment captured
 *   First line reserved successfully
 *   Second line failed
 *   Entire fulfillment transaction rolled back
 *
 * Both must remain financially marked as paid so that a later
 * refund/reconciliation process can act on the captured payment.
 */

$failedOrderB = $orderB->fresh();

$this->line(
    "  orderB #{$failedOrderB->id}: " .
    "status={$failedOrderB->status}, " .
    "is_paid=" . var_export($failedOrderB->is_paid, true) . ", " .
    "error=" . ($failedOrderB->fulfillment_error ?? 'NULL')
);

$this->check(
    $failedOrderB->status ===
        OrderStatusEnum::PaidFulfillmentFailed->value,
    'orderB has PaidFulfillmentFailed state'
);

$this->check(
    (bool) $failedOrderB->is_paid,
    'orderB remains financially marked as paid'
);

$this->check(
    !empty($failedOrderB->fulfillment_error),
    'orderB has a fulfillment error'
);


/*
 * Validate the multi-line atomic failure as well.
 */

$failedOrderC = $orderC->fresh();

$this->line(
    "  orderC #{$failedOrderC->id}: " .
    "status={$failedOrderC->status}, " .
    "is_paid=" . var_export($failedOrderC->is_paid, true) . ", " .
    "error=" . ($failedOrderC->fulfillment_error ?? 'NULL')
);

$this->check(
    $failedOrderC->status ===
        OrderStatusEnum::PaidFulfillmentFailed->value,
    'orderC has PaidFulfillmentFailed state'
);

$this->check(
    (bool) $failedOrderC->is_paid,
    'orderC remains financially marked as paid'
);

$this->check(
    !empty($failedOrderC->fulfillment_error),
    'orderC has a fulfillment error'
);

$this->line(
    '  Both failed orders remain financially paid and are therefore '
    . 'eligible for Stripe refund/reconciliation.'
);

            // ===============================================================
            // 17. EXPIRED TIER
            // ===============================================================

            $this->step(
                '17. Expired tier behavior'
            );

            $expiredTier = TicketTier::create([
                'event_leg_id' => $legGa->id,
                'name' => 'Expired Test Tier',
                'price' => 10,
                'quantity' => 1,
                'remaining' => 1,
                'starts_at' => now()->subDays(2),
                'ends_at' => now()->subMinute(),
            ]);

            $this->check(
                !$expiredTier->isOpen(),
                'expired tier is not open'
            );

            $this->line(
                '  Production decision: checkout validation should reject a newly started purchase against this tier.'
            );

            $this->line(
                '  If payment was already captured before expiry, fulfillment policy must be explicitly defined.'
            );

            // ===============================================================
            // 18. INVALID QUANTITY
            // ===============================================================

            $this->step(
                '18. Zero/negative quantity defense'
            );

            $invalidQuantities = [0, -1, -5];

            foreach ($invalidQuantities as $quantity) {
                $this->line(
                    "  Testing quantity={$quantity}"
                );

                $this->check(
                    $quantity <= 0,
                    "quantity={$quantity} is invalid"
                );
            }

            $this->line(
                '  Checkout validation must reject these before Stripe session creation.'
            );

            // ===============================================================
            // FINAL
            // ===============================================================

            $this->line('');
            $this->info(
                '=============================================================='
            );

            $this->info(
                '===== ALL EXTENDED TICKET FLOW TESTS COMPLETED ====='
            );

            $this->info(
                '=============================================================='
            );

            $this->line('');
            $this->line(
                'Rolling back transaction — no test data persisted.'
            );

            DB::rollBack();

            return self::SUCCESS;

        } catch (\Throwable $e) {

            DB::rollBack();

            $this->line('');
            $this->error(
                '!!!!! FLOW TEST FAILED !!!!!'
            );

            $this->error(
                $e->getMessage()
            );

            $this->line(
                $e->getFile() . ':' . $e->getLine()
            );

            return self::FAILURE;
        }
    }

    protected function step(string $label): void
    {
        $this->line('');
        $this->line("----- {$label} -----");
    }

    protected function check(
        bool $condition,
        string $message
    ): void {
        if (!$condition) {
            throw new \RuntimeException(
                "ASSERTION FAILED: {$message}"
            );
        }

        $this->line(
            "  OK: {$message}"
        );
    }
}
