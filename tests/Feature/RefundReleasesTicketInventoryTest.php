<?php

namespace Tests\Feature;

use App\Enums\OrderStatusEnum;
use App\Models\Event;
use App\Models\EventLeg;
use App\Models\EventSeat;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\TicketResaleListing;
use App\Models\TicketTier;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * IMPORTANT — read before running.
 *
 * This is not a normal regression test. It documents a real gap found
 * while reading the code: RefundService (refundOrder / refundManual /
 * refundCustomAmount / etc.) has ZERO awareness of Ticket, EventSeat,
 * or TicketResaleListing — grep for "Ticket" in RefundService.php
 * returns nothing. It only touches Order, Booking (salon), and
 * voucher/refund records.
 *
 * That means today, refunding an order that contains a ticket:
 *   - does NOT void the Ticket (it stays status=valid and scannable)
 *   - does NOT release its EventSeat back to available
 *   - does NOT cancel an active TicketResaleListing on that ticket
 * ...even though the buyer got their money back.
 *
 * refundOrder() itself calls the real Stripe API directly (no
 * injectable client), so this test does not call it — that would
 * require hitting Stripe's network from a unit test. Instead it
 * reproduces exactly the DB state refundOrder() leaves behind
 * (status=Refunded, is_paid=false, refunded_at set) and asserts what
 * SHOULD then be true of the ticket/seat.
 *
 * Right now, every assertion below marked "SHOULD" will FAIL — that
 * failure IS the bug report. Once ticket/seat release logic is added
 * (likely a new method on RefundService, or an Order observer keyed
 * off status becoming Refunded), these should start passing without
 * being rewritten.
 */
class RefundReleasesTicketInventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_refunding_an_order_should_void_the_ticket_and_release_the_seat(): void
    {
        $vendor = User::factory()->create();
        $buyer = User::factory()->create();
        $venue = Venue::factory()->create();

        $event = Event::create([
            'vendor_user_id' => $vendor->id,
            'name' => 'Refund Gap Test Event',
            'description' => 'Created by RefundReleasesTicketInventoryTest',
            'type' => 'standalone',
            'status' => 'published',
            'languages' => ['English'],
        ]);

        $leg = EventLeg::create([
            'event_id' => $event->id,
            'venue_id' => $venue->id,
            'venue_name' => $venue->name,
            'address' => $venue->address,
            'city' => $venue->city,
            'event_date' => now()->addDays(20)->toDateString(),
            'capacity' => 50,
            'sequence' => 1,
            'seating_type' => 'reserved',
        ]);

        $tier = TicketTier::create([
            'event_leg_id' => $leg->id,
            'name' => 'Reserved',
            'price' => 80,
            'quantity' => 10,
            'remaining' => 9,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(19),
        ]);

        $seat = EventSeat::create([
            'event_leg_id' => $leg->id,
            'ticket_tier_id' => $tier->id,
            'row_label' => 'B',
            'seat_number' => 4,
            'label' => 'B4',
            'status' => 'sold',
        ]);

        $order = Order::create([
            'user_id' => $buyer->id,
            'vendor_user_id' => $vendor->id,
            'total_price' => 80,
            'status' => OrderStatusEnum::Paid->value,
            'is_paid' => true,
            'stripe_charge_id' => 'ch_test_refund_gap',
            'paid_at' => now(),
        ]);

        $ticket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $buyer->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'seat_id' => $seat->id,
            'code' => 'REFUND-GAP-0001',
            'status' => 'valid',
        ]);

        // --- Reproduce what refundOrder() leaves behind, without
        // --- calling the real Stripe API ---
        $order->update([
            'status' => OrderStatusEnum::Refunded->value,
            'is_paid' => false,
            'refund_amount' => 80,
            'refunded_at' => now(),
        ]);

        // SHOULD: the ticket is void once the order behind it is refunded,
        // so it can no longer be scanned at the door.
        $this->assertSame(
            'void',
            $ticket->fresh()->status,
            'GAP: refunding an order does not void its ticket(s) — the ticket is still status=valid and would scan successfully at the door despite the buyer being refunded.'
        );

        // SHOULD: the seat becomes sellable again.
        $this->assertSame(
            'available',
            $seat->fresh()->status,
            'GAP: refunding an order does not release its EventSeat — the seat stays status=sold and can never be resold even though the money was returned.'
        );

        // SHOULD: tier stock is given back.
        $this->assertSame(
            10,
            $tier->fresh()->remaining,
            'GAP: refunding an order does not restore TicketTier remaining count.'
        );
    }

    public function test_refunding_an_order_should_cancel_any_active_resale_listing(): void
    {
        $vendor = User::factory()->create();
        $seller = User::factory()->create();
        $venue = Venue::factory()->create();

        $event = Event::create([
            'vendor_user_id' => $vendor->id,
            'name' => 'Refund Resale Gap Event',
            'description' => 'Created by RefundReleasesTicketInventoryTest',
            'type' => 'standalone',
            'status' => 'published',
            'languages' => ['English'],
        ]);

        $leg = EventLeg::create([
            'event_id' => $event->id,
            'venue_id' => $venue->id,
            'venue_name' => $venue->name,
            'address' => $venue->address,
            'city' => $venue->city,
            'event_date' => now()->addDays(20)->toDateString(),
            'capacity' => 50,
            'sequence' => 1,
            'seating_type' => 'general',
        ]);

        $tier = TicketTier::create([
            'event_leg_id' => $leg->id,
            'name' => 'GA',
            'price' => 40,
            'quantity' => 10,
            'remaining' => 9,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(19),
        ]);

        $order = Order::create([
            'user_id' => $seller->id,
            'vendor_user_id' => $vendor->id,
            'total_price' => 40,
            'status' => OrderStatusEnum::Paid->value,
            'is_paid' => true,
            'stripe_charge_id' => 'ch_test_refund_resale_gap',
            'paid_at' => now(),
        ]);

        $ticket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $seller->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'REFUND-RESALE-GAP-0001',
            'status' => 'listed',
        ]);

        $listing = TicketResaleListing::create([
            'ticket_id' => $ticket->id,
            'seller_user_id' => $seller->id,
            'price' => 45,
            'commission_pct' => 10,
            'status' => 'active',
        ]);

        // Reproduce refundOrder()'s resulting DB state.
        $order->update([
            'status' => OrderStatusEnum::Refunded->value,
            'is_paid' => false,
            'refund_amount' => 40,
            'refunded_at' => now(),
        ]);

        // SHOULD: refunding the original purchase must pull its listing
        // off the resale market — right now nothing does this, so a
        // ticket that was just refunded to the platform can still be
        // sold to an unsuspecting buyer on the resale market.
        $this->assertSame(
            'cancelled',
            $listing->fresh()->status,
            'GAP: refunding an order does not cancel an active resale listing on its ticket — a refunded ticket can still be sold to someone else on the resale market.'
        );
    }
}
