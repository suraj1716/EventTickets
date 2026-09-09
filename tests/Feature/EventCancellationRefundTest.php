<?php

namespace Tests\Feature;

use App\Enums\OrderStatusEnum;
use App\Models\Event;
use App\Models\EventLeg;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Refund;
use App\Models\Ticket;
use App\Models\TicketResaleListing;
use App\Models\TicketTier;
use App\Models\User;
use App\Models\Venue;
use App\Services\EventCancellationService;
use App\Services\TicketRefundService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Covers the bug fixed in this session: refunds had no ticket_id, so a
 * multi-ticket order's refund couldn't be traced to a specific ticket,
 * a resold ticket's refund used the wrong (original, not resale) price
 * source in some paths, and refundCurrentOwner() had no guard against
 * refunding the same ticket twice on a retried cancellation.
 *
 * TicketRefundService::refundCurrentOwner() calls the real Stripe API
 * directly (no injectable client for the Refund::create call itself),
 * so tests here either:
 *   (a) exercise resolvePayment() directly via reflection — the part
 *       that decides resale-vs-original price/payment_intent, which
 *       needs no network call, or
 *   (b) exercise the idempotency guard directly — it returns before
 *       any Stripe call is made, so it's also safe to call for real, or
 *   (c) mock TicketRefundService itself when testing
 *       EventCancellationService's orchestration, so the orchestration
 *       logic (void-on-refunded, cancel-listing-first, leave-as-is-on-
 *       failure) is verified independently of Stripe.
 */
class EventCancellationRefundTest extends TestCase
{
    use RefreshDatabase;

    private function makeEventWithLeg(User $vendor): array
    {
        $venue = Venue::factory()->create();

        $event = Event::create([
            'vendor_user_id' => $vendor->id,
            'name' => 'Cancellation Refund Test Event',
            'description' => 'Created by EventCancellationRefundTest',
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

        return [$event, $leg];
    }

    private function makeTier(EventLeg $leg, float $price): TicketTier
    {
        return TicketTier::create([
            'event_leg_id' => $leg->id,
            'name' => 'GA',
            'price' => $price,
            'quantity' => 10,
            'remaining' => 9,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(19),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | resolvePayment() — resale-aware amount/source resolution
    |--------------------------------------------------------------------------
    */

    public function test_resolve_payment_uses_order_item_price_for_a_never_resold_ticket(): void
    {
        $vendor = User::factory()->create();
        $buyer = User::factory()->create();
        [$event, $leg] = $this->makeEventWithLeg($vendor);
        $tier = $this->makeTier($leg, 30);

        $order = Order::create([
            'user_id' => $buyer->id,
            'vendor_user_id' => $vendor->id,
            'total_price' => 30,
            'status' => OrderStatusEnum::Paid->value,
            'is_paid' => true,
            'payment_intent' => 'pi_original_purchase',
            'paid_at' => now(),
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'ticket_tier_id' => $tier->id,
            'price' => 30,
            'quantity' => 1,
        ]);

        $ticket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $buyer->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'NEVER-RESOLD-0001',
            'status' => 'valid',
            'times_resold' => 0,
        ]);

        $method = new ReflectionMethod(TicketRefundService::class, 'resolvePayment');
        $method->setAccessible(true);

        [$amount, $paymentIntentId, $source] = $method->invoke(
            app(TicketRefundService::class),
            $ticket
        );

        $this->assertSame(30.0, $amount, 'A never-resold ticket should refund the original OrderItem price.');
        $this->assertSame('pi_original_purchase', $paymentIntentId);
        $this->assertSame('order_item:' . $orderItem->id, $source);
    }

    public function test_resolve_payment_uses_resale_price_for_a_resold_ticket_not_original_price(): void
    {
        $vendor = User::factory()->create();
        $originalBuyer = User::factory()->create();
        $resaleBuyer = User::factory()->create();
        [$event, $leg] = $this->makeEventWithLeg($vendor);
        $tier = $this->makeTier($leg, 30);

        $order = Order::create([
            'user_id' => $originalBuyer->id,
            'vendor_user_id' => $vendor->id,
            'total_price' => 30,
            'status' => OrderStatusEnum::Paid->value,
            'is_paid' => true,
            'payment_intent' => 'pi_original_purchase',
            'paid_at' => now(),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'ticket_tier_id' => $tier->id,
            'price' => 30,
            'quantity' => 1,
        ]);

        $ticket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $resaleBuyer->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'RESOLD-0001',
            'status' => 'valid',
            'times_resold' => 1,
        ]);

        // Sold at a price DIFFERENT from the original $30 face value —
        // this is the crux of the bug: the refund must use $12, not $30.
        $listing = TicketResaleListing::create([
            'ticket_id' => $ticket->id,
            'seller_user_id' => $originalBuyer->id,
            'buyer_user_id' => $resaleBuyer->id,
            'price' => 12,
            'commission_pct' => 10,
            'status' => 'sold',
            'stripe_payment_intent' => 'pi_resale_purchase',
            'sold_at' => now(),
        ]);

        $method = new ReflectionMethod(TicketRefundService::class, 'resolvePayment');
        $method->setAccessible(true);

        [$amount, $paymentIntentId, $source] = $method->invoke(
            app(TicketRefundService::class),
            $ticket
        );

        $this->assertSame(
            12.0,
            $amount,
            'A resold ticket must refund what the CURRENT owner paid on resale, not the original face value.'
        );
        $this->assertSame('pi_resale_purchase', $paymentIntentId);
        $this->assertSame('resale_listing:' . $listing->id, $source);
    }

    /*
    |--------------------------------------------------------------------------
    | Idempotency guard — returns before any Stripe call, so safe to
    | exercise directly without mocking the network.
    |--------------------------------------------------------------------------
    */

    public function test_refund_current_owner_skips_and_makes_no_new_refund_row_if_one_already_exists(): void
    {
        $vendor = User::factory()->create();
        $buyer = User::factory()->create();
        [$event, $leg] = $this->makeEventWithLeg($vendor);
        $tier = $this->makeTier($leg, 30);

        $order = Order::create([
            'user_id' => $buyer->id,
            'vendor_user_id' => $vendor->id,
            'total_price' => 30,
            'status' => OrderStatusEnum::Paid->value,
            'is_paid' => true,
            'payment_intent' => 'pi_already_refunded',
            'paid_at' => now(),
        ]);

        $ticket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $buyer->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'IDEMPOTENT-0001',
            'status' => 'valid',
            'times_resold' => 0,
        ]);

        Refund::create([
            'order_id' => $order->id,
            'ticket_id' => $ticket->id,
            'type' => 'ticket',
            'amount' => 30,
            'stripe_refund_id' => 're_already_issued',
            'reason' => 'Ticket refund (order_item:1)',
        ]);

        $result = app(TicketRefundService::class)->refundCurrentOwner($ticket);

        $this->assertSame('skipped', $result['status']);
        $this->assertSame('already_refunded', $result['reason']);
        $this->assertSame('re_already_issued', $result['stripe_refund_id']);

        $this->assertSame(
            1,
            Refund::where('ticket_id', $ticket->id)->count(),
            'A ticket that already has a Refund row must not get a second one — no duplicate Stripe call should have been attempted.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | EventCancellationService orchestration — TicketRefundService mocked
    | so this covers the loop/state logic independently of Stripe.
    |--------------------------------------------------------------------------
    */

    public function test_cancel_pulls_active_resale_listing_off_market_before_attempting_refund(): void
    {
        $vendor = User::factory()->create();
        $seller = User::factory()->create();
        [$event, $leg] = $this->makeEventWithLeg($vendor);
        $tier = $this->makeTier($leg, 20);

        $order = Order::create([
            'user_id' => $seller->id,
            'vendor_user_id' => $vendor->id,
            'total_price' => 20,
            'status' => OrderStatusEnum::Paid->value,
            'is_paid' => true,
            'payment_intent' => 'pi_x',
            'paid_at' => now(),
        ]);

        $ticket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $seller->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'LISTING-PULL-0001',
            'status' => 'listed',
        ]);

        $listing = TicketResaleListing::create([
            'ticket_id' => $ticket->id,
            'seller_user_id' => $seller->id,
            'price' => 25,
            'commission_pct' => 10,
            'status' => 'active',
        ]);

        // Even if the refund attempt itself fails, the listing must
        // still come off the resale market — it can't stay purchasable
        // for an event that no longer exists.
        $this->mock(TicketRefundService::class, function ($mock) {
            $mock->shouldReceive('refundCurrentOwner')
                ->once()
                ->andReturn(['status' => 'failed', 'ticket_id' => 0, 'error' => 'simulated failure']);
        });

        app(EventCancellationService::class)->cancel($event->fresh());

        $this->assertSame(
            'cancelled',
            $listing->fresh()->status,
            'An active resale listing on a ticket under a cancelled event must be pulled off the market.'
        );
    }

    public function test_cancel_voids_ticket_when_refund_succeeds(): void
    {
        $vendor = User::factory()->create();
        $buyer = User::factory()->create();
        [$event, $leg] = $this->makeEventWithLeg($vendor);
        $tier = $this->makeTier($leg, 20);

        $order = Order::create([
            'user_id' => $buyer->id,
            'vendor_user_id' => $vendor->id,
            'total_price' => 20,
            'status' => OrderStatusEnum::Paid->value,
            'is_paid' => true,
            'payment_intent' => 'pi_x',
            'paid_at' => now(),
        ]);

        $ticket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $buyer->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'VOID-ON-SUCCESS-0001',
            'status' => 'valid',
        ]);

        $this->mock(TicketRefundService::class, function ($mock) use ($ticket) {
            $mock->shouldReceive('refundCurrentOwner')
                ->once()
                ->andReturn([
                    'status' => 'refunded',
                    'ticket_id' => $ticket->id,
                    'amount' => 20,
                    'stripe_refund_id' => 're_x',
                ]);
        });

        app(EventCancellationService::class)->cancel($event->fresh());

        $this->assertSame('void', $ticket->fresh()->status);
    }

    public function test_cancel_leaves_ticket_valid_when_refund_fails_for_manual_followup(): void
    {
        $vendor = User::factory()->create();
        $buyer = User::factory()->create();
        [$event, $leg] = $this->makeEventWithLeg($vendor);
        $tier = $this->makeTier($leg, 20);

        $order = Order::create([
            'user_id' => $buyer->id,
            'vendor_user_id' => $vendor->id,
            'total_price' => 20,
            'status' => OrderStatusEnum::Paid->value,
            'is_paid' => true,
            'payment_intent' => 'pi_x',
            'paid_at' => now(),
        ]);

        $ticket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $buyer->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'STAYS-VALID-ON-FAILURE-0001',
            'status' => 'valid',
        ]);

        $this->mock(TicketRefundService::class, function ($mock) {
            $mock->shouldReceive('refundCurrentOwner')
                ->once()
                ->andReturn(['status' => 'failed', 'ticket_id' => 0, 'error' => 'simulated failure']);
        });

        app(EventCancellationService::class)->cancel($event->fresh());

        $this->assertSame(
            'valid',
            $ticket->fresh()->status,
            'A ticket whose refund attempt failed must stay valid (not voided) so it is visibly unresolved for manual follow-up, not silently lost.'
        );
    }

    public function test_cancel_ignores_already_used_and_already_void_tickets(): void
    {
        $vendor = User::factory()->create();
        $buyer = User::factory()->create();
        [$event, $leg] = $this->makeEventWithLeg($vendor);
        $tier = $this->makeTier($leg, 20);

        $order = Order::create([
            'user_id' => $buyer->id,
            'vendor_user_id' => $vendor->id,
            'total_price' => 20,
            'status' => OrderStatusEnum::Paid->value,
            'is_paid' => true,
            'payment_intent' => 'pi_x',
            'paid_at' => now(),
        ]);

        $usedTicket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $buyer->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'ALREADY-USED-0001',
            'status' => 'used',
        ]);

        $voidTicket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $buyer->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'ALREADY-VOID-0001',
            'status' => 'void',
        ]);

        // No tickets are in ['valid','listed'], so refundCurrentOwner
        // must never be called at all.
        $this->mock(TicketRefundService::class, function ($mock) {
            $mock->shouldNotReceive('refundCurrentOwner');
        });

        app(EventCancellationService::class)->cancel($event->fresh());

        $this->assertSame('used', $usedTicket->fresh()->status);
        $this->assertSame('void', $voidTicket->fresh()->status);
    }
}
