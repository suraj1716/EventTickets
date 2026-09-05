<?php

namespace Tests\Feature;

use App\Enums\OrderStatusEnum;
use App\Models\Event;
use App\Models\EventLeg;
use App\Models\EventSeat;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Ticket;
use App\Models\TicketTier;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Stripe\ApiRequestor;
use Stripe\HttpClient\ClientInterface;
use Tests\TestCase;

/**
 * CartService::setTicketCartItems() marks a buyer's selected seats as
 * 'reserved' the moment they're added to the cart (see EventTicketsSecurityGapTest,
 * gap #3), so a second buyer's concurrent request can't grab the same seat.
 *
 * StripeController::handle()'s checkout.session.completed branch validates
 * seat availability again right before generating tickets, as defence in
 * depth. That check used to treat ANY status other than 'available' as
 * "seat is gone" — which, after the cart-hold fix landed, meant a buyer's
 * own successfully-held ('reserved') seat looked identical to a seat
 * someone else already bought, and their own payment was rejected as a
 * fulfillment failure.
 *
 * These tests guard both directions: the buyer's own reserved seat must
 * go through, and a seat actually sold/blocked out from under them must
 * still be rejected.
 */
class TicketPurchaseSeatFulfillmentTest extends TestCase
{
    use RefreshDatabase;

    protected string $webhookSecret = 'whsec_test_secret';

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Mail::fake();

        config([
            'app.stripe_secret_key' => 'sk_test_fake',
            'app.stripe_webhook_secret' => $this->webhookSecret,
        ]);

        ApiRequestor::setHttpClient($this->fakeStripeHttpClient());
    }

    protected function tearDown(): void
    {
        ApiRequestor::setHttpClient(null);
        parent::tearDown();
    }

    protected function fakeStripeHttpClient(): ClientInterface
    {
        return new class implements ClientInterface {
            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
            {
                $body = json_encode([
                    'id' => 'pi_fake_123',
                    'object' => 'payment_intent',
                    'payment_method' => ['type' => 'card'],
                    'latest_charge' => ['id' => 'ch_fake_123'],
                ]);

                return [$body, 200, []];
            }
        };
    }

    protected function stripeSignedHeaders(string $payload): array
    {
        $timestamp = time();
        $signedPayload = "{$timestamp}.{$payload}";
        $signature = hash_hmac('sha256', $signedPayload, $this->webhookSecret);

        return ['Stripe-Signature' => "t={$timestamp},v1={$signature}"];
    }

    protected function postWebhook(array $eventPayload)
    {
        $payload = json_encode($eventPayload);

        return $this->call(
            'POST',
            route('stripe.webhook'),
            [],
            [],
            [],
            $this->transformHeadersToServerVars($this->stripeSignedHeaders($payload)),
            $payload
        );
    }

    protected function checkoutSessionCompletedEvent(array $sessionOverrides = []): array
    {
        return [
            'id' => 'evt_' . uniqid(),
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => array_merge([
                    'id' => 'cs_test_' . uniqid(),
                    'object' => 'checkout.session',
                    'payment_intent' => 'pi_fake_123',
                    'amount_total' => 8000,
                    'metadata' => [],
                ], $sessionOverrides),
            ],
        ];
    }

    /** Builds a draft order + reserved-seating order item, exactly as CartController::checkout() would just before redirecting to Stripe. */
    protected function makeDraftOrderWithSeat(User $buyer, string $seatStatus, string $stripeSessionId): array
    {
        $vendor = User::factory()->create();

        $event = Event::create([
            'vendor_user_id' => $vendor->id,
            'name' => 'Seat Fulfillment Test Event',
            'description' => 'test',
            'type' => 'standalone',
            'status' => 'published',
            'languages' => ['English'],
        ]);

        $venue = Venue::factory()->create();

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

        $tier = TicketTier::create([
            'event_leg_id' => $leg->id,
            'name' => 'Reserved',
            'price' => 80,
            'quantity' => 10,
            'remaining' => 10,
            'starts_at' => now()->subHour(),
            'ends_at' => now()->addDays(29),
        ]);

        $seat = EventSeat::create([
            'event_leg_id' => $leg->id,
            'ticket_tier_id' => $tier->id,
            'row_label' => 'A',
            'seat_number' => 1,
            'label' => 'A1',
            'status' => $seatStatus,
        ]);

        $order = Order::create([
            'user_id' => $buyer->id,
            'vendor_user_id' => $vendor->id,
            'total_price' => 80,
            'status' => OrderStatusEnum::Draft->value ?? 'pending',
            'is_paid' => false,
            'stripe_session_id' => $stripeSessionId,
            'payment_method' => 'card',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'ticket_tier_id' => $tier->id,
            'quantity' => 1,
            'price' => 80,
            'seat_ids' => [$seat->id],
        ]);

        return [$order, $seat];
    }

    public function test_payment_succeeds_for_a_seat_the_buyer_themself_reserved_via_cart(): void
    {
        $buyer = User::factory()->create();
        $sessionId = 'cs_test_own_reserved';

        [$order, $seat] = $this->makeDraftOrderWithSeat($buyer, 'reserved', $sessionId);

        $response = $this->postWebhook($this->checkoutSessionCompletedEvent(['id' => $sessionId]));

        $response->assertStatus(200);

        $order->refresh();
        $this->assertTrue((bool) $order->is_paid);
        $this->assertEquals(OrderStatusEnum::Paid->value, $order->status);

        $seat->refresh();
        $this->assertSame('sold', $seat->status);

        $this->assertDatabaseHas('tickets', [
            'order_id' => $order->id,
            'seat_id' => $seat->id,
            'status' => 'valid',
        ]);
    }

    public function test_payment_still_fails_fulfillment_if_seat_was_actually_sold_out_from_under_the_buyer(): void
    {
        $buyer = User::factory()->create();
        $sessionId = 'cs_test_actually_sold';

        [$order, $seat] = $this->makeDraftOrderWithSeat($buyer, 'sold', $sessionId);

        $response = $this->postWebhook($this->checkoutSessionCompletedEvent(['id' => $sessionId]));

        $response->assertStatus(200);

        $order->refresh();
        $this->assertEquals(OrderStatusEnum::PaidFulfillmentFailed->value ?? 'paid_fulfillment_failed', $order->status);
        $this->assertTrue((bool) $order->is_paid); // money was captured
        $this->assertNotNull($order->fulfillment_error);

        $this->assertDatabaseMissing('tickets', ['order_id' => $order->id]);
    }
}
