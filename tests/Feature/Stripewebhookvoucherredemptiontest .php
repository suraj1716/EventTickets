<?php

namespace Tests\Feature;

use App\Enums\OrderStatusEnum;
use App\Models\GiftCardTemplate;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Stripe\HttpClient\ClientInterface;
use Stripe\ApiRequestor;
use Tests\TestCase;

class StripeWebhookVoucherRedemptionTest extends TestCase
{
    use RefreshDatabase;

    protected string $webhookSecret = 'whsec_test_secret';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'app.stripe_secret_key'     => 'sk_test_fake',
            'app.stripe_webhook_secret' => $this->webhookSecret,
        ]);

        Mail::fake();

        // Fake Stripe's HTTP client so paymentIntents->retrieve() never hits
        // the real network. Controller catches failures anyway, but this
        // keeps the test fast, deterministic, and gives us a realistic
        // payment_method/charge id instead of nulls.
        ApiRequestor::setHttpClient($this->fakeStripeHttpClient());
    }

    protected function tearDown(): void
    {
        ApiRequestor::setHttpClient(null);
        parent::tearDown();
    }

    /** Builds a fake Stripe HTTP client returning a canned PaymentIntent. */
    protected function fakeStripeHttpClient(): ClientInterface
    {
        return new class implements ClientInterface {
            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
            {
                $body = json_encode([
                    'id'             => 'pi_fake_123',
                    'object'         => 'payment_intent',
                    'payment_method' => ['type' => 'card'],
                    'latest_charge'  => ['id' => 'ch_fake_123'],
                ]);

                return [$body, 200, []];
            }
        };
    }

    /** Signs a payload exactly the way Stripe does, so Webhook::constructEvent() accepts it. */
    protected function stripeSignedHeaders(string $payload): array
    {
        $timestamp = time();
        $signedPayload = "{$timestamp}.{$payload}";
        $signature = hash_hmac('sha256', $signedPayload, $this->webhookSecret);

        return [
            'Stripe-Signature' => "t={$timestamp},v1={$signature}",
        ];
    }

    protected function postWebhook(array $eventPayload)
    {
        $payload = json_encode($eventPayload);

        return $this->call(
            'POST',
            route('stripe.webhook'), // adjust to your actual webhook route name
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
            'id'   => 'evt_' . uniqid(),
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => array_merge([
                    'id'             => 'cs_test_' . uniqid(),
                    'object'         => 'checkout.session',
                    'payment_intent' => 'pi_fake_123',
                    'amount_total'   => 5000,
                    'metadata'       => [],
                ], $sessionOverrides),
            ],
        ];
    }

    // ── Gift voucher redemption ─────────────────────────────────────

    public function test_gift_voucher_is_redeemed_and_balance_deducted_on_checkout_completed()
    {
        $user = User::factory()->create();

        $voucher = Voucher::create([
            'code'              => 'GIFT100',
            'type'              => 'gift',
            'amount'            => 100,
            'discount_type'     => 'fixed',
            'remaining_amount'  => 100,
            'active'            => true,
        ]);

        $order = new Order();
        $order->forceFill([
            'user_id'           => $user->id,
            'total_price'       => 50,
            'status'            => OrderStatusEnum::Draft->value ?? 'pending',
            'is_paid'           => false,
            'stripe_session_id' => 'cs_test_gift_1',
            'voucher_id'        => $voucher->id,
            'voucher_discount'  => 40,
        ])->save();

        $event = $this->checkoutSessionCompletedEvent([
            'id' => 'cs_test_gift_1',
        ]);

        $response = $this->postWebhook($event);

        $response->assertStatus(200);

        $order->refresh();
        $voucher->refresh();

        $this->assertTrue((bool) $order->is_paid);
        $this->assertEquals(OrderStatusEnum::Paid->value, $order->status);

        $this->assertEquals(60, $voucher->remaining_amount); // 100 - 40
        $this->assertTrue($voucher->active); // balance remains, still active

        $this->assertDatabaseHas('voucher_usages', [
            'voucher_id'  => $voucher->id,
            'order_id'    => $order->id,
            'user_id'     => $user->id,
            'amount_used' => 40,
        ]);
    }

    public function test_gift_voucher_deactivates_once_balance_fully_depleted()
    {
        $user = User::factory()->create();

        $voucher = Voucher::create([
            'code'             => 'GIFT40',
            'type'             => 'gift',
            'amount'           => 40,
            'discount_type'    => 'fixed',
            'remaining_amount' => 40,
            'active'           => true,
        ]);

        $order = new Order();
        $order->forceFill([
            'user_id'           => $user->id,
            'total_price'       => 40,
            'status'            => 'pending',
            'is_paid'           => false,
            'stripe_session_id' => 'cs_test_gift_2',
            'voucher_id'        => $voucher->id,
            'voucher_discount'  => 40, // exactly wipes the balance
        ])->save();

        $this->postWebhook($this->checkoutSessionCompletedEvent(['id' => 'cs_test_gift_2']));

        $voucher->refresh();

        $this->assertEquals(0, $voucher->remaining_amount);
        $this->assertFalse($voucher->active);
    }

    // ── Promo voucher redemption ────────────────────────────────────

    public function test_promo_voucher_increments_used_count_and_deactivates_at_max_uses()
    {
        $user = User::factory()->create();

        $voucher = Voucher::create([
            'code'          => 'PROMO10',
            'type'          => 'promo',
            'amount'        => 10,
            'discount_type' => 'fixed',
            'max_uses'      => 1,
            'used_count'    => 0,
            'active'        => true,
        ]);

        $order = new Order();
        $order->forceFill([
            'user_id'           => $user->id,
            'total_price'       => 30,
            'status'            => 'pending',
            'is_paid'           => false,
            'stripe_session_id' => 'cs_test_promo_1',
            'voucher_id'        => $voucher->id,
            'voucher_discount'  => 10,
        ])->save();

        $this->postWebhook($this->checkoutSessionCompletedEvent(['id' => 'cs_test_promo_1']));

        $voucher->refresh();

        $this->assertEquals(1, $voucher->used_count);
        $this->assertFalse($voucher->active); // hit max_uses
    }

    // ── Idempotency ──────────────────────────────────────────────────

    public function test_webhook_does_not_double_redeem_voucher_on_duplicate_delivery()
    {
        $user = User::factory()->create();

        $voucher = Voucher::create([
            'code'             => 'GIFT200',
            'type'             => 'gift',
            'amount'           => 200,
            'discount_type'    => 'fixed',
            'remaining_amount' => 200,
            'active'           => true,
        ]);

        $order = new Order();
        $order->forceFill([
            'user_id'           => $user->id,
            'total_price'       => 60,
            'status'            => 'pending',
            'is_paid'           => false,
            'stripe_session_id' => 'cs_test_dup_1',
            'voucher_id'        => $voucher->id,
            'voucher_discount'  => 50,
        ])->save();

        $event = $this->checkoutSessionCompletedEvent(['id' => 'cs_test_dup_1']);

        // Stripe can and does redeliver webhooks — fire it twice.
        $this->postWebhook($event);
        $this->postWebhook($event);

        $voucher->refresh();

        $this->assertEquals(150, $voucher->remaining_amount); // deducted once, not twice
        $this->assertEquals(1, VoucherUsage::where('order_id', $order->id)->count());
    }

    // ── Gift card shop purchase (order created lazily by the webhook) ─

    public function test_fulfills_gift_card_shop_order_and_activates_vouchers()
    {
        $buyer = User::factory()->create();

        $template = GiftCardTemplate::create([
            'title'      => 'Deluxe Gift Card',
            'amount'     => 150,
            'active'     => true,
            'sort_order' => 1,
        ]);

        $sessionId = 'cs_test_giftshop_1';

        // Vouchers already exist (created at checkout-session-creation time)
        // but sit inactive until payment is confirmed.
        $voucher1 = Voucher::create([
            'code'                   => 'GCARD001',
            'type'                   => 'gift',
            'amount'                 => 75,
            'discount_type'          => 'fixed',
            'remaining_amount'       => 75,
            'gift_card_template_id'  => $template->id,
            'stripe_session_id'      => $sessionId,
            'active'                 => false,
        ]);

        $voucher2 = Voucher::create([
            'code'                   => 'GCARD002',
            'type'                   => 'gift',
            'amount'                 => 75,
            'discount_type'          => 'fixed',
            'remaining_amount'       => 75,
            'gift_card_template_id'  => $template->id,
            'stripe_session_id'      => $sessionId,
            'active'                 => false,
        ]);

        $event = $this->checkoutSessionCompletedEvent([
            'id'           => $sessionId,
            'amount_total' => 15000,
            'metadata'     => [
                'voucher_ids'            => "{$voucher1->id},{$voucher2->id}",
                'gift_card_template_id'  => (string) $template->id,
                'purchased_by'           => (string) $buyer->id,
                'quantity'               => '2',
            ],
        ]);

        $response = $this->postWebhook($event);

        $response->assertStatus(200);

        $this->assertDatabaseHas('orders', [
            'stripe_session_id' => $sessionId,
            'user_id'           => $buyer->id,
            'is_paid'           => true,
        ]);

        $order = Order::where('stripe_session_id', $sessionId)->first();

        $this->assertDatabaseHas('order_items', [
            'order_id'              => $order->id,
            'gift_card_template_id' => $template->id,
            'quantity'              => 2,
        ]);

        $voucher1->refresh();
        $voucher2->refresh();

        $this->assertTrue($voucher1->active);
        $this->assertTrue($voucher2->active);
    }

    public function test_gift_card_fulfillment_is_idempotent_on_duplicate_webhook()
    {
        $buyer = User::factory()->create();

        $template = GiftCardTemplate::create([
            'title'  => 'Standard Gift Card',
            'amount' => 50,
            'active' => true,
        ]);

        $sessionId = 'cs_test_giftshop_dup';

        $voucher = Voucher::create([
            'code'                  => 'GCARDDUP',
            'type'                  => 'gift',
            'amount'                => 50,
            'discount_type'         => 'fixed',
            'remaining_amount'      => 50,
            'gift_card_template_id' => $template->id,
            'stripe_session_id'     => $sessionId,
            'active'                => false,
        ]);

        $event = $this->checkoutSessionCompletedEvent([
            'id'           => $sessionId,
            'amount_total' => 5000,
            'metadata'     => [
                'voucher_ids'           => (string) $voucher->id,
                'gift_card_template_id' => (string) $template->id,
                'purchased_by'          => (string) $buyer->id,
                'quantity'              => '1',
            ],
        ]);

        $this->postWebhook($event);
        $this->postWebhook($event);

        $this->assertEquals(1, Order::where('stripe_session_id', $sessionId)->count());
        $this->assertEquals(1, OrderItem::where('gift_card_template_id', $template->id)->count());
    }
}
