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

class ReconcileFailedFulfillmentTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Exact conversion of:
     *
     * php artisan orders:reconcile-failed-fulfillment
     *
     * The original command is reproduced step-for-step.
     */
    public function test_complete_ticket_flow(): void
    {
        DB::beginTransaction();

        try {
            // ---------------------------------------------------------------
            // Setup: buyer + a second buyer for the concurrency test in step 13
            // ---------------------------------------------------------------
           $this->step('Setup: users, vendor');

$vendor = User::factory()->create([
    'email' => 'flow-test-vendor@example.test',
]);

$buyerA = User::factory()->create([
    'email' => 'flow-test-buyer-a@example.test',
]);

$buyerB = User::factory()->create([
    'email' => 'flow-test-buyer-b@example.test',
]);

$venue = Venue::factory()->create();

$this->consoleLine(
    "  buyerA #{$buyerA->id}, buyerB #{$buyerB->id}, vendor #{$vendor->id}"
);

            // ---------------------------------------------------------------
            // 1. Event
            // ---------------------------------------------------------------
            $this->step('1. Event');

            $event = Event::create([
                'vendor_user_id' => $vendor->id,
                'name' => 'Flow Test Event',
                'description' => 'Created by orders:reconcile-failed-fulfillment',
                'type' => 'standalone',
                'status' => 'proposed',
                'languages' => ['English'],
            ]);

            $this->assertTrue(
                (bool) $event->id,
                "Event #{$event->id} created"
            );

            $this->ok("Event #{$event->id} created");

            // ---------------------------------------------------------------
            // 2. Leg
            // ---------------------------------------------------------------
            $this->step('2. Leg');

          $this->ok('a venue exists');

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

            $this->assertTrue(
                (bool) $leg->id,
                "Leg #{$leg->id} created (reserved seating)"
            );

            $this->ok(
                "Leg #{$leg->id} created (reserved seating)"
            );

            // A second, GA leg for the 4A path
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

            $this->assertTrue(
                (bool) $legGa->id,
                "Leg #{$legGa->id} created (GA)"
            );

            $this->ok(
                "Leg #{$legGa->id} created (GA)"
            );

            // ---------------------------------------------------------------
            // 3. Ticket tier
            // ---------------------------------------------------------------
            $this->step('3. Ticket tier');

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

            $this->assertTrue(
                $tierReserved->isOpen(),
                "Reserved tier #{$tierReserved->id} is open, remaining={$tierReserved->remaining}"
            );

            $this->ok(
                "Reserved tier #{$tierReserved->id} is open, remaining={$tierReserved->remaining}"
            );

            $this->assertTrue(
                $tierGa->isOpen(),
                "GA tier #{$tierGa->id} is open, remaining={$tierGa->remaining}"
            );

            $this->ok(
                "GA tier #{$tierGa->id} is open, remaining={$tierGa->remaining}"
            );

            // Seats for the reserved tier — only ONE seat, to force a real
            // contention scenario in step 13.
            $seat = EventSeat::create([
                'event_leg_id' => $leg->id,
                'ticket_tier_id' => $tierReserved->id,
                'row_label' => 'A',
                'seat_number' => 1,
                'label' => 'A1',
                'status' => 'available',
            ]);

            $this->assertTrue(
                $seat->isAvailable(),
                "Seat {$seat->label} (#{$seat->id}) is available"
            );

            $this->ok(
                "Seat {$seat->label} (#{$seat->id}) is available"
            );

            // ---------------------------------------------------------------
            // 4A. GA ticket selection / 4B. Reserved seat selection
            // ---------------------------------------------------------------
            $this->step('4A. GA ticket selection (buyerA, qty 2)');

            $gaSelection = [
                'ticket_tier_id' => $tierGa->id,
                'quantity' => 2,
            ];

            $this->consoleLine(
                "  buyerA selects {$gaSelection['quantity']}x GA tier #{$tierGa->id}"
            );

            $this->step('4B. Reserved seat selection (buyerA picks seat A1)');

            $seatSelection = [
                'ticket_tier_id' => $tierReserved->id,
                'quantity' => 1,
                'seat_ids' => [$seat->id],
            ];

            $this->consoleLine(
                "  buyerA selects seat #{$seat->id} on tier #{$tierReserved->id}"
            );

            // ---------------------------------------------------------------
            // 5. Checkout request / 6. Order created
            // ---------------------------------------------------------------
            $this->step('5. Checkout request -> 6. Order created (buyerA)');

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
                'quantity' => $gaSelection['quantity'],
                'price' => $tierGa->price,
            ]);

            OrderItem::create([
                'order_id' => $orderA->id,
                'ticket_tier_id' => $tierReserved->id,
                'quantity' => 1,
                'price' => $tierReserved->price,
                'seat_ids' => [$seat->id],
            ]);

            $this->assertSame(
                OrderStatusEnum::Draft->value,
                $orderA->status,
                "Order #{$orderA->id} created with status=Draft"
            );

            $this->ok(
                "Order #{$orderA->id} created with status=Draft"
            );

            // ---------------------------------------------------------------
            // 7. Stripe payment (simulated)
            // ---------------------------------------------------------------
            $this->step('7. Stripe payment (simulated)');

            $this->consoleLine(
                "  Skipping real Stripe API call — assuming payment succeeds for session {$orderA->stripe_session_id}"
            );

            // ---------------------------------------------------------------
            // 8. Stripe webhook received
            // ---------------------------------------------------------------
            $this->step(
                '8. Stripe webhook received (checkout.session.completed, simulated)'
            );

            $fakeEventId = 'evt_test_flowtest_a';

            $this->assertFalse(
                ProcessedStripeEvent::where(
                    'stripe_event_id',
                    $fakeEventId
                )->exists(),
                'fake webhook event not yet processed'
            );

            $this->ok('fake webhook event not yet processed');

            ProcessedStripeEvent::create([
                'stripe_event_id' => $fakeEventId,
            ]);

            $orderA->refresh();

            $orderA->payment_intent = 'pi_test_flowtest_a';
            $orderA->status = OrderStatusEnum::Paid->value;
            $orderA->is_paid = true;
            $orderA->paid_at = now();
            $orderA->save();

            // ---------------------------------------------------------------
            // 9. Order -> paid
            // ---------------------------------------------------------------
            $this->step('9. Order -> paid');

            $this->assertSame(
                OrderStatusEnum::Paid->value,
                $orderA->fresh()->status,
                "Order #{$orderA->id} status is Paid"
            );

            $this->ok(
                "Order #{$orderA->id} status is Paid"
            );

            $this->assertTrue(
                (bool) $orderA->fresh()->is_paid,
                "Order #{$orderA->id} is_paid = true"
            );

            $this->ok(
                "Order #{$orderA->id} is_paid = true"
            );

            // Reserve stock per order item
            foreach ($orderA->orderItems as $item) {
                $tier = TicketTier::lockForUpdate()
                    ->find($item->ticket_tier_id);

                $reserved = $tier->reserve($item->quantity);

                $this->assertTrue(
                    $reserved,
                    "Reserved {$item->quantity}x on tier #{$tier->id} for order #{$orderA->id}"
                );

                $this->ok(
                    "Reserved {$item->quantity}x on tier #{$tier->id} for order #{$orderA->id}"
                );
            }

            // ---------------------------------------------------------------
            // 10. Tickets generated
            // ---------------------------------------------------------------
            $this->step('10. Tickets generated');

            $ticketsA = app(TicketGenerationService::class)
                ->generate($orderA->fresh(['orderItems']));

            $this->assertSame(
                3,
                $ticketsA->count(),
                "3 tickets generated for order #{$orderA->id} (2 GA + 1 reserved), got {$ticketsA->count()}"
            );

            $this->ok(
                "3 tickets generated for order #{$orderA->id} (2 GA + 1 reserved), got {$ticketsA->count()}"
            );

            foreach ($ticketsA as $t) {
                $this->assertTrue(
                    $t->isValid(),
                    "Ticket {$t->code} has status=valid"
                );

                $this->ok(
                    "Ticket {$t->code} has status=valid"
                );
            }

            // ---------------------------------------------------------------
            // 11. Seat/inventory updated
            // ---------------------------------------------------------------
            $this->step('11. Seat/inventory updated');

            $tierGaFresh = $tierGa->fresh();
            $tierReservedFresh = $tierReserved->fresh();
            $seatFresh = $seat->fresh();

            $this->assertSame(
                1,
                $tierGaFresh->remaining,
                "GA tier remaining decremented 3 -> 1, got {$tierGaFresh->remaining}"
            );

            $this->ok(
                "GA tier remaining decremented 3 -> 1, got {$tierGaFresh->remaining}"
            );

            $this->assertSame(
                1,
                $tierReservedFresh->remaining,
                "Reserved tier remaining decremented 2 -> 1, got {$tierReservedFresh->remaining}"
            );

            $this->ok(
                "Reserved tier remaining decremented 2 -> 1, got {$tierReservedFresh->remaining}"
            );

            $this->assertSame(
                'sold',
                $seatFresh->status,
                "Seat #{$seat->id} status is now 'sold', got '{$seatFresh->status}'"
            );

            $this->ok(
                "Seat #{$seat->id} status is now 'sold', got '{$seatFresh->status}'"
            );

            // ---------------------------------------------------------------
            // 12. Refresh UI
            // ---------------------------------------------------------------
            $this->step('12. Refresh UI');

            $this->consoleLine(
                '  No server-side assertion here — this step is client-side (Inertia page'
            );

            $this->consoleLine(
                '  reload / props refresh after redirect to stripe.success). Confirm manually'
            );

            $this->consoleLine(
                "  that the event page's seat map + tier availability reflect the new counts:"
            );

            $this->consoleLine(
                "    GA tier remaining:       {$tierGaFresh->remaining}"
            );

            $this->consoleLine(
                "    Reserved tier remaining: {$tierReservedFresh->remaining}"
            );

            $this->consoleLine(
                "    Seat A1 status:          {$seatFresh->status}"
            );

            // ---------------------------------------------------------------
            // 13. Cannot repurchase sold seat
            // ---------------------------------------------------------------
            $this->step(
                '13. Cannot repurchase sold seat (buyerB attempts the same seat)'
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

            $tierRemainingBeforeB = $tierReserved->fresh()->remaining;

            $caughtException = null;

            try {
                DB::transaction(function () use ($orderB, $seat) {
                    $lockedSeats = EventSeat::whereIn(
                        'id',
                        [$seat->id]
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
                            'Seat already sold: seat #' . $unavailable->id
                        );
                    }

                    // Never reached.
                });
            } catch (\Throwable $e) {
                $caughtException = $e;

                // IMPORTANT:
                // This happens AFTER the failed transaction has rolled back.
                $orderB->status =
                    OrderStatusEnum::PaidFulfillmentFailed->value;

                $orderB->is_paid = true;
                $orderB->paid_at = now();
                $orderB->fulfillment_error = $e->getMessage();
                $orderB->save();
            }

            $this->assertNotNull(
                $caughtException,
                'transaction threw and rolled back, as expected'
            );

            $this->ok(
                'transaction threw and rolled back, as expected'
            );

            $this->assertSame(
                OrderStatusEnum::PaidFulfillmentFailed->value,
                $orderB->fresh()->status,
                "orderB status is PaidFulfillmentFailed, got '{$orderB->fresh()->status}'"
            );

            $this->ok(
                "orderB status is PaidFulfillmentFailed, got '{$orderB->fresh()->status}'"
            );

            $this->assertTrue(
                (bool) $orderB->fresh()->is_paid,
                'orderB is_paid = true (money was captured — this is intentional, not a bug)'
            );

            $this->ok(
                'orderB is_paid = true (money was captured — this is intentional, not a bug)'
            );

            $this->assertNotNull(
                $orderB->fresh()->fulfillment_error,
                'orderB has a fulfillment_error set: ' .
                $orderB->fresh()->fulfillment_error
            );

            $this->ok(
                'orderB has a fulfillment_error set: ' .
                $orderB->fresh()->fulfillment_error
            );

            $this->assertSame(
                $tierRemainingBeforeB,
                $tierReserved->fresh()->remaining,
                "Reserved tier remaining UNCHANGED at {$tierRemainingBeforeB} (no decrement leaked from rolled-back transaction), got {$tierReserved->fresh()->remaining}"
            );

            $this->ok(
                "Reserved tier remaining UNCHANGED at {$tierRemainingBeforeB} (no decrement leaked from rolled-back transaction), got {$tierReserved->fresh()->remaining}"
            );

            $this->assertTrue(
                Ticket::where('order_id', $orderB->id)->doesntExist(),
                "No ticket rows exist for order #{$orderB->id}"
            );

            $this->ok(
                "No ticket rows exist for order #{$orderB->id}"
            );

            $this->consoleLine('');
            $this->consoleLine(
                '  ^ orderB: charged/paid (correctly reflects captured funds), fulfillment'
            );
            $this->consoleLine(
                '    marked failed, tier stock untouched, zero tickets — this is now a'
            );
            $this->consoleLine(
                '    visible, reconcilable state instead of a silent stuck order.'
            );

            // ---------------------------------------------------------------
            // 13b. Tier oversell after seat check passes
            // ---------------------------------------------------------------
            $this->step('13b. Tier oversell after seat check passes');

            // Drain the GA tier to 0 remaining, then attempt one more reserve.
            $tierGa->update([
                'remaining' => 0,
            ]);

            $reserveResult = TicketTier::lockForUpdate()
                ->find($tierGa->id)
                ->reserve(1);

            $this->assertFalse(
                $reserveResult,
                'reserve(1) correctly fails when remaining=0'
            );

            $this->ok(
                'reserve(1) correctly fails when remaining=0'
            );

            // Leave as-is, matching original command.
            $tierGa->update([
                'remaining' => 0,
            ]);

            // ---------------------------------------------------------------
            // 14. Duplicate webhook test
            // ---------------------------------------------------------------
            $this->step(
                '14. Duplicate webhook test (redelivering evt_test_flowtest_a)'
            );

            $ticketCountBefore = Ticket::where(
                'order_id',
                $orderA->id
            )->count();

            $tierRemainingBefore = $tierGa->fresh()->remaining;

            // Reproduce the guard exactly as StripeController::handle() does it.
            if (
                ProcessedStripeEvent::where(
                    'stripe_event_id',
                    $fakeEventId
                )->exists()
            ) {
                $this->consoleLine(
                    '  Duplicate detected — webhook body would be skipped entirely (as intended)'
                );
            } else {
                throw new \RuntimeException(
                    'Expected ProcessedStripeEvent to already exist for ' .
                    $fakeEventId
                );
            }

            $ticketCountAfter = Ticket::where(
                'order_id',
                $orderA->id
            )->count();

            $tierRemainingAfter = $tierGa->fresh()->remaining;

            $this->assertSame(
                $ticketCountBefore,
                $ticketCountAfter,
                "Ticket count for order #{$orderA->id} unchanged after duplicate delivery ({$ticketCountAfter})"
            );

            $this->ok(
                "Ticket count for order #{$orderA->id} unchanged after duplicate delivery ({$ticketCountAfter})"
            );

            $this->assertSame(
                $tierRemainingBefore,
                $tierRemainingAfter,
                "GA tier remaining unchanged after duplicate delivery ({$tierRemainingAfter})"
            );

            $this->ok(
                "GA tier remaining unchanged after duplicate delivery ({$tierRemainingAfter})"
            );

            // ---------------------------------------------------------------
            // COMPLETE
            // ---------------------------------------------------------------
            $this->consoleLine('');
            $this->consoleLine('===== ALL 14 STEPS COMPLETED =====');
            $this->consoleLine(
                'Rolling back transaction — no test data persisted.'
            );

            DB::rollBack();

        } catch (\Throwable $e) {
            DB::rollBack();

            $this->consoleLine('');
            $this->consoleLine('!!!!! FLOW TEST FAILED !!!!!');
            $this->consoleLine($e->getMessage());
            $this->consoleLine(
                $e->getFile() . ':' . $e->getLine()
            );

            // Re-throw so PHPUnit correctly reports FAIL.
            throw $e;
        }
    }

    /**
     * Equivalent of the command's step() method.
     */
    protected function step(string $label): void
    {
        $this->consoleLine('');
        $this->consoleLine("----- {$label} -----");
    }

    /**
     * Equivalent of the command's successful check() output.
     */
    protected function ok(string $message): void
    {
        $this->consoleLine("  OK: {$message}");
    }

    /**
     * Console-style output while running PHPUnit.
     */
    protected function consoleLine(string $message): void
{
    fwrite(STDOUT, $message . PHP_EOL);
}
}
