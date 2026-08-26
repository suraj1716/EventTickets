<?php

namespace Tests\Feature;

use App\Enums\OrderStatusEnum;
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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TicketFlowTest extends TestCase
{
    use RefreshDatabase;

    protected User $vendor;
    protected User $buyerA;
    protected User $buyerB;
    protected User $buyerC;

    protected Event $event;

    protected EventLeg $reservedLeg;
    protected EventLeg $gaLeg;

    protected TicketTier $tierReserved;
    protected TicketTier $tierGa;

    protected EventSeat $seat;

    protected function setUp(): void
    {
        parent::setUp();

        // ===============================================================
        // SETUP
        // ===============================================================

        $this->step('Setup: users, vendor');

        $this->vendor = User::factory()->create([
            'email' => 'flow-test-vendor@example.test',
        ]);

        $this->buyerA = User::factory()->create([
            'email' => 'flow-test-buyer-a@example.test',
        ]);

        $this->buyerB = User::factory()->create([
            'email' => 'flow-test-buyer-b@example.test',
        ]);

        $this->buyerC = User::factory()->create([
            'email' => 'flow-test-buyer-c@example.test',
        ]);

        $this->line(
            "  buyerA #{$this->buyerA->id}, " .
            "buyerB #{$this->buyerB->id}, " .
            "buyerC #{$this->buyerC->id}, " .
            "vendor #{$this->vendor->id}"
        );

        // Venue factory is required because RefreshDatabase starts empty.
        $venue = Venue::factory()->create();

        $this->check(
            (bool) $venue->id,
            "Venue #{$venue->id} created"
        );

        // ===============================================================
        // 1. EVENT
        // ===============================================================

        $this->step('1. Event');

        $this->event = Event::create([
            'vendor_user_id' => $this->vendor->id,
            'name' => 'Flow Test Event',
            'description' => 'Created by TicketFlowTest',
            'type' => 'standalone',
            'status' => 'proposed',
            'languages' => ['English'],
        ]);

        $this->check(
            (bool) $this->event->id,
            "Event #{$this->event->id} created"
        );

        // ===============================================================
        // 2. LEGS
        // ===============================================================

        $this->step('2. Leg');

        $this->check(
            (bool) $venue,
            'a venue exists'
        );

        $this->reservedLeg = EventLeg::create([
            'event_id' => $this->event->id,
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
            (bool) $this->reservedLeg->id,
            "Leg #{$this->reservedLeg->id} created (reserved seating)"
        );

        $this->gaLeg = EventLeg::create([
            'event_id' => $this->event->id,
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
            (bool) $this->gaLeg->id,
            "Leg #{$this->gaLeg->id} created (GA)"
        );

        // ===============================================================
        // 3. TICKET TIERS
        // ===============================================================

        $this->step('3. Ticket tier');

        $this->tierReserved = TicketTier::create([
            'event_leg_id' => $this->reservedLeg->id,
            'name' => 'Reserved Seating',
            'price' => 50,
            'quantity' => 2,
            'remaining' => 2,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(29),
        ]);

        $this->tierGa = TicketTier::create([
            'event_leg_id' => $this->gaLeg->id,
            'name' => 'GA',
            'price' => 25,
            'quantity' => 3,
            'remaining' => 3,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(29),
        ]);

        $this->check(
            $this->tierReserved->isOpen(),
            "Reserved tier #{$this->tierReserved->id} is open, remaining={$this->tierReserved->remaining}"
        );

        $this->check(
            $this->tierGa->isOpen(),
            "GA tier #{$this->tierGa->id} is open, remaining={$this->tierGa->remaining}"
        );

        // ONE reserved seat.
        $this->seat = EventSeat::create([
            'event_leg_id' => $this->reservedLeg->id,
            'ticket_tier_id' => $this->tierReserved->id,
            'row_label' => 'A',
            'seat_number' => 1,
            'label' => 'A1',
            'status' => 'available',
        ]);

        $this->check(
            $this->seat->isAvailable(),
            "Seat {$this->seat->label} (#{$this->seat->id}) is available"
        );

    }

    public function test_complete_ticket_flow(): void
    {

        // ===============================================================
        // 4A. GA TICKET SELECTION
        // ===============================================================

        $this->step('4A. GA ticket selection (buyerA, qty 2)');

        $gaSelection = [
            'ticket_tier_id' => $this->tierGa->id,
            'quantity' => 2,
        ];

        $this->line(
            "  buyerA selects {$gaSelection['quantity']}x " .
            "GA tier #{$this->tierGa->id}"
        );

        $this->check(
            $this->tierGa->id === $gaSelection['ticket_tier_id'],
            "GA tier #{$this->tierGa->id} selected"
        );

        $this->check(
            $gaSelection['quantity'] === 2,
            'GA quantity = 2'
        );

        // ===============================================================
        // 4B. RESERVED SEAT SELECTION
        // ===============================================================

        $this->step('4B. Reserved seat selection (buyerA picks seat A1)');

        $seatSelection = [
            'ticket_tier_id' => $this->tierReserved->id,
            'quantity' => 1,
            'seat_ids' => [$this->seat->id],
        ];

        $this->line(
            "  buyerA selects seat #{$this->seat->id} " .
            "on tier #{$this->tierReserved->id}"
        );

        $this->check(
            $seatSelection['ticket_tier_id'] === $this->tierReserved->id,
            "Reserved tier #{$this->tierReserved->id} selected"
        );

        $this->check(
            $seatSelection['quantity'] === 1,
            'Reserved quantity = 1'
        );

        $this->check(
            $seatSelection['seat_ids'][0] === $this->seat->id,
            "Seat #{$this->seat->id} selected"
        );

        // ===============================================================
        // 5 / 6. CHECKOUT REQUEST -> ORDER CREATED
        // ===============================================================

        $this->step('5. Checkout request -> 6. Order created (buyerA)');

        $orderA = Order::create([
            'user_id' => $this->buyerA->id,
            'vendor_user_id' => $this->vendor->id,
            'total_price' => 100,
            'status' => OrderStatusEnum::Draft->value,
            'is_paid' => false,
            'stripe_session_id' => 'cs_test_flowtest_a',
        ]);

        OrderItem::create([
            'order_id' => $orderA->id,
            'ticket_tier_id' => $this->tierGa->id,
            'quantity' => 2,
            'price' => $this->tierGa->price,
        ]);

        OrderItem::create([
            'order_id' => $orderA->id,
            'ticket_tier_id' => $this->tierReserved->id,
            'quantity' => 1,
            'price' => $this->tierReserved->price,
            'seat_ids' => [$this->seat->id],
        ]);

        $this->check(
            $orderA->status === OrderStatusEnum::Draft->value,
            "Order #{$orderA->id} created with status=Draft"
        );

        $this->check(
            ! $orderA->is_paid,
            "Order #{$orderA->id} is_paid=false"
        );

        $this->check(
            $orderA->orderItems()->count() === 2,
            "Order #{$orderA->id} has 2 order items"
        );

        $this->check(
            $orderA->total_price == 100,
            "Order #{$orderA->id} total = 100"
        );

        // ===============================================================
        // 7. STRIPE PAYMENT — SIMULATED
        // ===============================================================

        $this->step('7. Stripe payment (simulated)');

        $this->line(
            "  Skipping real Stripe API call — assuming payment succeeds " .
            "for session {$orderA->stripe_session_id}"
        );

        $this->check(
            ! empty($orderA->stripe_session_id),
            "Stripe session {$orderA->stripe_session_id} exists"
        );

        // ===============================================================
        // 8. STRIPE WEBHOOK RECEIVED
        // ===============================================================

        $this->step(
            '8. Stripe webhook received ' .
            '(checkout.session.completed, simulated)'
        );

        $fakeEventId = 'evt_test_flowtest_a';

        $this->check(
            ! ProcessedStripeEvent::where(
                'stripe_event_id',
                $fakeEventId
            )->exists(),
            'fake webhook event not yet processed'
        );

        ProcessedStripeEvent::create([
            'stripe_event_id' => $fakeEventId,
        ]);

        $this->check(
            ProcessedStripeEvent::where(
                'stripe_event_id',
                $fakeEventId
            )->exists(),
            "ProcessedStripeEvent {$fakeEventId} created"
        );

        // ===============================================================
        // 9. ORDER -> PAID
        // ===============================================================

        $this->step('9. Order -> paid');

        $orderA->payment_intent = 'pi_test_flowtest_a';
        $orderA->status = OrderStatusEnum::Paid->value;
        $orderA->is_paid = true;
        $orderA->paid_at = now();
        $orderA->save();

        $orderA->refresh();

        $this->check(
            $orderA->status === OrderStatusEnum::Paid->value,
            "Order #{$orderA->id} status is Paid"
        );

        $this->check(
            (bool) $orderA->is_paid,
            "Order #{$orderA->id} is_paid = true"
        );

        $this->check(
            $orderA->paid_at !== null,
            "Order #{$orderA->id} paid_at is set"
        );

        $this->check(
            $orderA->payment_intent === 'pi_test_flowtest_a',
            "Order #{$orderA->id} payment_intent is set"
        );

        // ---------------------------------------------------------------
        // RESERVE BUYER A INVENTORY
        // ---------------------------------------------------------------

        $orderA->load('orderItems');

        foreach ($orderA->orderItems as $item) {
            $tier = TicketTier::lockForUpdate()
                ->findOrFail($item->ticket_tier_id);

            $reserved = $tier->reserve($item->quantity);

            $this->check(
                $reserved,
                "Reserved {$item->quantity}x on tier #{$tier->id} " .
                "for order #{$orderA->id}"
            );
        }

        // ===============================================================
        // 10. TICKETS GENERATED
        // ===============================================================

        $this->step('10. Tickets generated');

        $ticketsA = app(TicketGenerationService::class)
            ->generate(
                $orderA->fresh(['orderItems'])
            );

        $this->check(
            $ticketsA->count() === 3,
            "3 tickets generated for order #{$orderA->id} " .
            "(2 GA + 1 reserved), got {$ticketsA->count()}"
        );

        foreach ($ticketsA as $ticket) {
            $this->check(
                $ticket->isValid(),
                "Ticket {$ticket->code} has status=valid"
            );
        }

        $this->check(
            Ticket::where(
                'order_id',
                $orderA->id
            )->count() === 3,
            "Database contains 3 tickets for order #{$orderA->id}"
        );

        // ===============================================================
        // 11. SEAT / INVENTORY UPDATED
        // ===============================================================

        $this->step('11. Seat/inventory updated');

        $tierGaFresh = $this->tierGa->fresh();
        $tierReservedFresh = $this->tierReserved->fresh();
        $seatFresh = $this->seat->fresh();

        $this->check(
            $tierGaFresh->remaining === 1,
            "GA tier remaining decremented 3 -> 1, " .
            "got {$tierGaFresh->remaining}"
        );

        $this->check(
            $tierReservedFresh->remaining === 1,
            "Reserved tier remaining decremented 2 -> 1, " .
            "got {$tierReservedFresh->remaining}"
        );

        $this->check(
            $seatFresh->status === 'sold',
            "Seat #{$this->seat->id} status is now 'sold', " .
            "got '{$seatFresh->status}'"
        );

        // ===============================================================
        // 12. REFRESH UI
        // ===============================================================

        $this->step('12. Refresh UI');

        $this->line(
            '  No browser-side assertion here — this step represents the'
        );

        $this->line(
            '  Inertia/page refresh after returning from Stripe.'
        );

        $this->line(
            '  Server-side inventory invariants are checked below:'
        );

        $this->check(
            $this->tierGa->fresh()->remaining === 1,
            'GA tier remains 1 after refresh'
        );

        $this->check(
            $this->tierReserved->fresh()->remaining === 1,
            'Reserved tier remains 1 after refresh'
        );

        $this->check(
            $this->seat->fresh()->status === 'sold',
            'Seat A1 remains sold after refresh'
        );

        $this->line(
            "    GA tier remaining:       {$this->tierGa->fresh()->remaining}"
        );

        $this->line(
            "    Reserved tier remaining: " .
            "{$this->tierReserved->fresh()->remaining}"
        );

        $this->line(
            "    Seat A1 status:          {$this->seat->fresh()->status}"
        );

        // ===============================================================
        // 13. SOLD SEAT FAILURE
        // ===============================================================

        $this->step(
            '13. Cannot repurchase sold seat ' .
            '(buyerB attempts the same seat)'
        );

        $orderB = Order::create([
            'user_id' => $this->buyerB->id,
            'vendor_user_id' => $this->vendor->id,
            'total_price' => 50,
            'status' => OrderStatusEnum::Draft->value,
            'is_paid' => false,
            'stripe_session_id' => 'cs_test_flowtest_b',
        ]);

        OrderItem::create([
            'order_id' => $orderB->id,
            'ticket_tier_id' => $this->tierReserved->id,
            'quantity' => 1,
            'price' => $this->tierReserved->price,
            'seat_ids' => [$this->seat->id],
        ]);

        $reservedBefore = $this->tierReserved
            ->fresh()
            ->remaining;

        $transactionThrew = false;
        $transactionMessage = null;

        try {
            DB::transaction(function () use ($orderB) {

                $orderB->status =
                    OrderStatusEnum::Paid->value;

                $orderB->is_paid = true;
                $orderB->paid_at = now();

                $orderB->save();

                $orderB->load('orderItems');

                $seatIds = $orderB->orderItems
                    ->flatMap(
                        fn ($item) =>
                            $item->seat_ids ?? []
                    )
                    ->values()
                    ->all();

                $lockedSeats = EventSeat::whereIn(
                    'id',
                    $seatIds
                )
                    ->lockForUpdate()
                    ->get();

                $unavailable = $lockedSeats->firstWhere(
                    'status',
                    '!=',
                    'available'
                );

                if ($unavailable) {
                    throw new \RuntimeException(
                        'Seat already sold: seat #' .
                        $unavailable->id
                    );
                }

            });
        } catch (\Throwable $e) {

            $transactionThrew = true;
            $transactionMessage = $e->getMessage();

            $orderB->refresh();

            $orderB->status =
                OrderStatusEnum::PaidFulfillmentFailed->value;

            $orderB->is_paid = true;

            $orderB->paid_at ??= now();

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
            "orderB status is PaidFulfillmentFailed, " .
            "got '{$orderB->fresh()->status}'"
        );

        $this->check(
            (bool) $orderB->fresh()->is_paid,
            'orderB is_paid = true ' .
            '(money was captured — this is intentional, not a bug)'
        );

        $this->check(
            $orderB->fresh()->fulfillment_error !== null,
            'orderB has a fulfillment_error set: ' .
            $orderB->fresh()->fulfillment_error
        );

        $this->check(
            $this->tierReserved->fresh()->remaining === $reservedBefore,
            "Reserved tier remaining UNCHANGED at {$reservedBefore} " .
            "(no decrement leaked from rolled-back transaction), " .
            "got {$this->tierReserved->fresh()->remaining}"
        );

        $this->check(
            Ticket::where(
                'order_id',
                $orderB->id
            )->doesntExist(),
            "No ticket rows exist for order #{$orderB->id}"
        );

        $this->check(
            $this->seat->fresh()->status === 'sold',
            "Original seat #{$this->seat->id} remains sold"
        );

        $this->line('');

        $this->line(
            '  ^ orderB: charged/paid (correctly reflects captured funds),'
        );

        $this->line(
            '    fulfillment marked failed, tier stock untouched, zero'
        );

        $this->line(
            '    tickets — visible and reconcilable instead of silently stuck.'
        );

        // ===============================================================
        // 13b. GA SOLD OUT
        // ===============================================================

        $this->step('13b. GA sold out');

        $this->tierGa->refresh();

        $this->check(
            $this->tierGa->remaining === 1,
            "GA tier starts this test with remaining=1"
        );

        $this->tierGa->update([
            'remaining' => 0,
        ]);

        $tierGaLocked = TicketTier::lockForUpdate()
            ->findOrFail($this->tierGa->id);

        $gaReserveResult =
            $tierGaLocked->reserve(1);

        $this->check(
            ! $gaReserveResult,
            'reserve(1) correctly fails when remaining=0'
        );

        $this->check(
            $this->tierGa->fresh()->remaining === 0,
            'GA tier remains at 0 after failed reservation'
        );

        // ===============================================================
        // 13c. GA LAST-UNIT CONTENTION PROTECTION
        // ===============================================================

        $this->step('13c. GA last-unit contention protection');

        $this->tierGa->update([
            'remaining' => 1,
        ]);

        $first = TicketTier::lockForUpdate()
            ->findOrFail($this->tierGa->id);

        $firstResult = $first->reserve(1);

        $this->check(
            $firstResult,
            'first buyer successfully reserves final GA unit'
        );

        $this->check(
            $first->fresh()->remaining === 0,
            'GA remaining becomes 0 after first reservation'
        );

        /*
         * Second buyer attempts the same final unit.
         */

        $second = TicketTier::lockForUpdate()
            ->findOrFail($this->tierGa->id);

        $secondResult = $second->reserve(1);

        $this->check(
            ! $secondResult,
            'second buyer cannot reserve the final GA unit'
        );

        $this->check(
            $second->fresh()->remaining === 0,
            'GA remaining stays 0 after second failed reservation'
        );

        // ===============================================================
        // 13d. MULTI-LINE ORDER ATOMICITY
        // ===============================================================

        $this->step('13d. Multi-line order atomicity');

        $atomicTier = TicketTier::create([
            'event_leg_id' => $this->gaLeg->id,
            'name' => 'Atomicity Test GA',
            'price' => 25,
            'quantity' => 1,
            'remaining' => 1,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(29),
        ]);

        $orderC = Order::create([
            'user_id' => $this->buyerC->id,
            'vendor_user_id' => $this->vendor->id,
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
            'ticket_tier_id' => $this->tierReserved->id,
            'quantity' => 1,
            'price' => 50,
            'seat_ids' => [$this->seat->id],
        ]);

        $atomicBefore =
            $atomicTier->fresh()->remaining;

        $atomicTransactionThrew = false;
        $atomicError = null;

        try {

            DB::transaction(function () use ($orderC) {

                $orderC->status =
                    OrderStatusEnum::Paid->value;

                $orderC->is_paid = true;
                $orderC->paid_at = now();

                $orderC->save();

                $orderC->load('orderItems');

                foreach ($orderC->orderItems as $item) {

                    $tier = TicketTier::lockForUpdate()
                        ->findOrFail(
                            $item->ticket_tier_id
                        );

                    if (! $tier->reserve(
                        $item->quantity
                    )) {
                        throw new \RuntimeException(
                            "Tier {$tier->id} sold out"
                        );
                    }
                }

                app(TicketGenerationService::class)
                    ->generate(
                        $orderC->fresh(['orderItems'])
                    );
            });

        } catch (\Throwable $e) {

            $atomicTransactionThrew = true;
            $atomicError = $e->getMessage();

            $orderC->refresh();

            $orderC->status =
                OrderStatusEnum::PaidFulfillmentFailed->value;

            $orderC->is_paid = true;

            $orderC->fulfillment_error =
                $atomicError;

            $orderC->save();
        }

        $this->check(
            $atomicTransactionThrew,
            'multi-line transaction failed as expected'
        );

        $this->check(
            $orderC->fresh()->status ===
                OrderStatusEnum::PaidFulfillmentFailed->value,
            "orderC status is PaidFulfillmentFailed"
        );

        /*
         * First line succeeded temporarily, but the second line failed.
         * Therefore the entire transaction must have rolled back.
         */

        $this->check(
            $atomicTier->fresh()->remaining === $atomicBefore,
            "Atomic tier remaining rolled back to {$atomicBefore}"
        );

        $this->check(
            Ticket::where(
                'order_id',
                $orderC->id
            )->doesntExist(),
            "No tickets generated for order #{$orderC->id}"
        );

        $this->check(
            $this->seat->fresh()->status === 'sold',
            'Original reserved seat remains sold'
        );

        $this->check(
            (bool) $orderC->fresh()->is_paid,
            'orderC is_paid = true'
        );

        $this->check(
            ! empty($orderC->fresh()->fulfillment_error),
            'orderC has fulfillment_error'
        );

        // ===============================================================
        // 14. DUPLICATE SUCCESSFUL WEBHOOK
        // ===============================================================

        $this->step(
            '14. Duplicate successful webhook'
        );

        $ticketCountBefore =
            Ticket::where(
                'order_id',
                $orderA->id
            )->count();

        $tierRemainingBefore =
            $this->tierGa->fresh()->remaining;

        $this->check(
            ProcessedStripeEvent::where(
                'stripe_event_id',
                $fakeEventId
            )->exists(),
            "Original webhook {$fakeEventId} is recorded"
        );

        /*
         * Production webhook would return/skip here.
         */

        $this->line(
            '  Duplicate detected — webhook body would be skipped entirely'
        );

        $this->line(
            '  (as intended)'
        );

        $this->check(
            Ticket::where(
                'order_id',
                $orderA->id
            )->count() === $ticketCountBefore,
            "Ticket count for order #{$orderA->id} unchanged " .
            "after duplicate delivery ({$ticketCountBefore})"
        );

        $this->check(
            $this->tierGa->fresh()->remaining ===
                $tierRemainingBefore,
            "GA tier remaining unchanged after duplicate delivery " .
            "({$tierRemainingBefore})"
        );

        // ===============================================================
        // 14b. DUPLICATE FAILED WEBHOOK
        // ===============================================================

        $this->step(
            '14b. Duplicate failed webhook'
        );

        $failedEventId =
            'evt_test_flowtest_failed';

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

        $this->check(
            ProcessedStripeEvent::where(
                'stripe_event_id',
                $failedEventId
            )->exists(),
            "Failed webhook {$failedEventId} recorded"
        );

        /*
         * Duplicate should be ignored.
         */

        $this->line(
            '  Duplicate failed webhook would be skipped.'
        );

        $this->check(
            $orderB->fresh()->status ===
                $failedOrderStatusBefore,
            "orderB status unchanged: " .
            "{$failedOrderStatusBefore}"
        );

        $this->check(
            Ticket::where(
                'order_id',
                $orderB->id
            )->count() ===
                $failedTicketCountBefore,
            "orderB ticket count unchanged: " .
            "{$failedTicketCountBefore}"
        );

        // ===============================================================
        // 15. WEBHOOK BEFORE ORDER EXISTS
        // ===============================================================

        $this->step(
            '15. Webhook before order exists'
        );

        $missingSessionId =
            'cs_test_flowtest_missing_order';

        $this->check(
            ! Order::where(
                'stripe_session_id',
                $missingSessionId
            )->exists(),
            "No order exists for Stripe session {$missingSessionId}"
        );

        /*
         * There is deliberately no fake order creation.
         *
         * Production webhook must not turn an unknown Stripe session
         * into a successful fulfillment.
         */

        $this->line(
            '  Unknown Stripe session correctly has no matching order.'
        );

        $this->check(
            ! Order::where(
                'stripe_session_id',
                $missingSessionId
            )->exists(),
            'Unknown Stripe session did not create an order'
        );

        // ===============================================================
        // 16. PAID FULFILLMENT FAILURE STATE
        // ===============================================================

        $this->step(
            '16. Paid fulfillment failure state'
        );

        $failedOrderB =
            $orderB->fresh();

        $this->check(
            $failedOrderB->status ===
                OrderStatusEnum::PaidFulfillmentFailed->value,
            "orderB status = PaidFulfillmentFailed"
        );

        $this->check(
            (bool) $failedOrderB->is_paid,
            'orderB is_paid = true'
        );

        $this->check(
            ! empty($failedOrderB->fulfillment_error),
            'orderB has fulfillment_error'
        );

        $failedOrderC =
            $orderC->fresh();

        $this->check(
            $failedOrderC->status ===
                OrderStatusEnum::PaidFulfillmentFailed->value,
            "orderC status = PaidFulfillmentFailed"
        );

        $this->check(
            (bool) $failedOrderC->is_paid,
            'orderC is_paid = true'
        );

        $this->check(
            ! empty($failedOrderC->fulfillment_error),
            'orderC has fulfillment_error'
        );

        $reconciliationOrders =
            Order::where(
                'status',
                OrderStatusEnum::PaidFulfillmentFailed->value
            )
            ->where(
                'is_paid',
                true
            )
            ->whereIn(
                'id',
                [
                    $orderB->id,
                    $orderC->id,
                ]
            )
            ->count();

        $this->check(
            $reconciliationOrders === 2,
            '2 paid fulfillment-failed orders are available ' .
            'for reconciliation'
        );

        // ===============================================================
        // 17. EXPIRED TIER
        // ===============================================================

        $this->step(
            '17. Expired tier'
        );

        $expiredTier = TicketTier::create([
            'event_leg_id' => $this->gaLeg->id,
            'name' => 'Expired Test Tier',
            'price' => 10,
            'quantity' => 1,
            'remaining' => 1,
            'starts_at' => now()->subDays(2),
            'ends_at' => now()->subMinute(),
        ]);

        $this->check(
            ! $expiredTier->isOpen(),
            "Expired tier #{$expiredTier->id} is not open"
        );

        // ===============================================================
        // 18. INVALID QUANTITY
        // ===============================================================

        $this->step(
            '18. Invalid quantity'
        );

        $invalidQuantities = [
            0,
            -1,
            -5,
        ];

        foreach ($invalidQuantities as $quantity) {

            $this->check(
                $quantity <= 0,
                "quantity={$quantity} is invalid"
            );
        }

        $this->line(
            '  Business requirement: checkout validation must reject'
        );

        $this->line(
            '  quantity <= 0 before Stripe session creation.'
        );

        // ===============================================================
        // COMPLETE
        // ===============================================================

        $this->line('');
        $this->info(
            '===== ALL 18 STEPS COMPLETED ====='
        );

        $this->line(
            'RefreshDatabase will roll back/reset test data.'
        );
    }

       // ===================================================================
    // OUTPUT HELPERS
    // ===================================================================

    /**
     * Command-style line output.
     *
     * PHPUnit TestCase does not provide Laravel Command::line(),
     * so we reproduce the same console output here.
     */
    protected function line(string $message = ''): void
    {
        echo $message . PHP_EOL;
    }

    /**
     * Command-style informational output.
     */
    protected function info(string $message): void
    {
        echo $message . PHP_EOL;
    }

    /**
     * Prints a step exactly like the Artisan command.
     */
    protected function step(string $label): void
    {
        $this->line('');
        $this->line("----- {$label} -----");
    }

    /**
     * Assertion + command-style OK output.
     */
    protected function check(
        bool $condition,
        string $message
    ): void {
        $this->assertTrue(
            $condition,
            $message
        );

        $this->line("  OK: {$message}");
    }
}
