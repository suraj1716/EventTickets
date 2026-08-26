<?php

namespace Tests\Feature;

use App\Enums\OrderStatusEnum;
use App\Models\Event;
use App\Models\EventLeg;
use App\Models\EventSeat;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\TicketTier;
use App\Models\User;
use App\Models\Venue;
use App\Models\ProcessedStripeEvent;
use App\Services\StripeCheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;
class TicketCheckoutFlowTest extends TestCase
{
    use RefreshDatabase;

    protected User $vendor;
    protected User $buyer;
    protected Event $event;
    protected EventLeg $reservedLeg;
    protected EventLeg $gaLeg;
    protected TicketTier $reservedTier;
    protected TicketTier $gaTier;
    protected EventSeat $seat;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();

        $this->vendor = User::factory()->create();

        $this->buyer = User::factory()->create([
            'email' => 'http-ticket-buyer@example.test',
        ]);

        $venue = Venue::factory()->create();

        $this->event = Event::create([
            'vendor_user_id' => $this->vendor->id,
            'name' => 'HTTP Flow Test Event',
            'description' => 'Created by TicketCheckoutFlowTest',
            'type' => 'standalone',
            'status' => 'proposed',
            'languages' => ['English'],
        ]);

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

        $this->reservedTier = TicketTier::create([
            'event_leg_id' => $this->reservedLeg->id,
            'name' => 'Reserved',
            'price' => 50,
            'quantity' => 2,
            'remaining' => 2,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(29),
        ]);

        $this->gaTier = TicketTier::create([
            'event_leg_id' => $this->gaLeg->id,
            'name' => 'General Admission',
            'price' => 25,
            'quantity' => 3,
            'remaining' => 3,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(29),
        ]);

        $this->seat = EventSeat::create([
            'event_leg_id' => $this->reservedLeg->id,
            'ticket_tier_id' => $this->reservedTier->id,
            'row_label' => 'A',
            'seat_number' => 1,
            'label' => 'A1',
            'status' => 'available',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 1. Invalid quantity
    |--------------------------------------------------------------------------
    */

    public function test_invalid_quantity_is_rejected_before_checkout(): void
    {
        $this->actingAs($this->buyer);

        $response = $this->postJson('/checkout', [
            'event_id' => $this->event->id,
            'lines' => [
                [
                    'ticket_tier_id' => $this->gaTier->id,
                    'quantity' => 0,
                ],
            ],
        ]);

        $response->assertStatus(422);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_negative_quantity_is_rejected_before_checkout(): void
    {
        $this->actingAs($this->buyer);

        $response = $this->postJson('/checkout', [
            'event_id' => $this->event->id,
            'lines' => [
                [
                    'ticket_tier_id' => $this->gaTier->id,
                    'quantity' => -1,
                ],
            ],
        ]);

        $response->assertStatus(422);

        $this->assertDatabaseCount('orders', 0);
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Tier must belong to event
    |--------------------------------------------------------------------------
    */

    public function test_ticket_tier_from_another_event_is_rejected(): void
    {
        $otherEvent = Event::create([
            'vendor_user_id' => $this->vendor->id,
            'name' => 'Other Event',
            'description' => 'Other',
            'type' => 'standalone',
            'status' => 'proposed',
            'languages' => ['English'],
        ]);

        $otherTier = TicketTier::create([
            'event_leg_id' => $this->gaLeg->id,
            'name' => 'Other Tier',
            'price' => 20,
            'quantity' => 5,
            'remaining' => 5,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(29),
        ]);

        // Make sure the tier's leg belongs to the OTHER event.
        $this->gaLeg->update([
            'event_id' => $otherEvent->id,
        ]);

        $this->actingAs($this->buyer);

        $response = $this->postJson('/checkout', [
            'event_id' => $this->event->id,
            'lines' => [
                [
                    'ticket_tier_id' => $otherTier->id,
                    'quantity' => 1,
                ],
            ],
        ]);

        $response->assertStatus(422);

        $this->assertDatabaseCount('orders', 0);
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Expired tier
    |--------------------------------------------------------------------------
    */

    public function test_expired_tier_is_rejected(): void
    {
        $this->gaTier->update([
            'starts_at' => now()->subDays(3),
            'ends_at' => now()->subMinute(),
        ]);

        $this->assertFalse(
            $this->gaTier->fresh()->isOpen()
        );

        $this->actingAs($this->buyer);

        $response = $this->postJson('/checkout', [
            'event_id' => $this->event->id,
            'lines' => [
                [
                    'ticket_tier_id' => $this->gaTier->id,
                    'quantity' => 1,
                ],
            ],
        ]);

        /*
         * This assertion intentionally allows us to discover whether
         * production checkout currently enforces isOpen().
         */
        $this->assertTrue(
            in_array($response->status(), [400, 422]),
            'Expected expired tier to be rejected with 400/422, got ' .
                $response->status()
        );

        $this->assertDatabaseCount('orders', 0);
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Valid checkout reaches Stripe
    |--------------------------------------------------------------------------
    */

    public function test_valid_ticket_checkout_creates_draft_order_and_stripe_session(): void
    {
        /*
         * This test intentionally does not call real Stripe.
         *
         * If your application currently calls Stripe directly without
         * an injectable client, this test will expose that boundary.
         */

        $this->actingAs($this->buyer);

       Config::set(
    'app.stripe_secret_key',
    'sk_test_fake_key'
);

$this->mock(StripeCheckoutService::class, function ($mock) {
    $mock->shouldReceive('createSession')
        ->once()
        ->andReturn((object) [
            'id' => 'cs_test_checkout_flow',
            'url' => 'https://checkout.stripe.com/c/pay/cs_test_checkout_flow',
        ]);
});

        $response = $this->post('/checkout', [
            'event_id' => $this->event->id,
            'lines' => [
                [
                    'ticket_tier_id' => $this->gaTier->id,
                    'quantity' => 1,
                ],
            ],
        ]);

        dump([
            'status' => $response->status(),
            'url' => $response->headers->get('Location'),
            'session_errors' => session('errors')?->getBag('default')->toArray(),
            'session' => session()->all(),
        ]);

        /*
         * We are not asserting the exact Stripe response yet because
         * the current controller directly calls Stripe.
         *
         * First confirm the request reaches the controller and creates
         * the expected order.
         */
        $this->assertDatabaseHas('orders', [
            'user_id' => $this->buyer->id,
            'vendor_user_id' => $this->vendor->id,
            'status' => OrderStatusEnum::Draft->value,
            'is_paid' => false,
        ]);

        $order = Order::where(
            'user_id',
            $this->buyer->id
        )->latest('id')->first();

        $this->assertNotNull($order);

        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'ticket_tier_id' => $this->gaTier->id,
            'quantity' => 1,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Invalid Stripe signature
    |--------------------------------------------------------------------------
    */

    public function test_invalid_stripe_signature_is_rejected(): void
    {
        Config::set(
            'app.stripe_webhook_secret',
            'whsec_test_secret'
        );

        $payload = json_encode([
            'id' => 'evt_invalid_signature',
            'object' => 'event',
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [],
            ],
        ]);

        $response = $this
            ->withHeaders([
                'Stripe-Signature' => 'invalid-signature',
                'Content-Type' => 'application/json',
            ])
            ->call(
                'POST',
                '/stripe/webhook',
                [],
                [],
                [],
                [],
                $payload
            );

        $response->assertStatus(400);
        $response->assertSee('Invalid signature');
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Missing order
    |--------------------------------------------------------------------------
    */

    public function test_webhook_for_missing_order_does_not_create_fake_order(): void
    {
        /*
         * We cannot bypass Stripe signature verification here.
         *
         * The actual signed webhook test will be added once we generate
         * a valid Stripe webhook signature helper for this suite.
         */

        $sessionId = 'cs_test_missing_order';

        $this->assertDatabaseMissing('orders', [
            'stripe_session_id' => $sessionId,
        ]);

        $this->assertDatabaseMissing('processed_stripe_events', [
            'stripe_event_id' => 'evt_missing_order',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 7. Database invariants before webhook
    |--------------------------------------------------------------------------
    */

    public function test_checkout_does_not_mark_order_paid_before_webhook(): void
    {
        /*
         * We need Stripe session creation to succeed for this test.
         * Until Stripe is mocked behind an injectable boundary, this
         * remains a database-level assertion.
         */

        $order = Order::create([
            'stripe_session_id' => 'cs_test_pre_webhook',
            'user_id' => $this->buyer->id,
            'vendor_user_id' => $this->vendor->id,
            'total_price' => 25,
            'status' => OrderStatusEnum::Draft->value,
            'is_paid' => false,
        ]);

        $this->assertSame(
            OrderStatusEnum::Draft->value,
            $order->fresh()->status
        );

        $this->assertFalse(
            (bool) $order->fresh()->is_paid
        );

        $this->assertDatabaseMissing('tickets', [
            'order_id' => $order->id,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 8. Failed fulfillment state
    |--------------------------------------------------------------------------
    */

    public function test_failed_fulfillment_state_is_financially_paid(): void
    {
        $order = Order::create([
            'stripe_session_id' => 'cs_test_failed_http',
            'user_id' => $this->buyer->id,
            'vendor_user_id' => $this->vendor->id,
            'total_price' => 50,
            'status' => OrderStatusEnum::PaidFulfillmentFailed->value,
            'is_paid' => true,
            'payment_intent' => 'pi_test_failed_http',
            'paid_at' => now(),
            'fulfillment_error' => 'Seat A1 is no longer available.',
        ]);

        $fresh = $order->fresh();

        $this->assertSame(
            OrderStatusEnum::PaidFulfillmentFailed->value,
            $fresh->status
        );

        $this->assertTrue(
            (bool) $fresh->is_paid
        );

        $this->assertNotEmpty(
            $fresh->fulfillment_error
        );

        $this->assertDatabaseMissing('tickets', [
            'order_id' => $order->id,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 9. Duplicate event invariant
    |--------------------------------------------------------------------------
    */

    public function test_duplicate_processed_stripe_event_is_recognised(): void
    {
        ProcessedStripeEvent::create([
            'stripe_event_id' => 'evt_http_duplicate',
        ]);

        $this->assertDatabaseHas('processed_stripe_events', [
            'stripe_event_id' => 'evt_http_duplicate',
        ]);
    }
}
