<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventLeg;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\TicketResaleListing;
use App\Models\TicketTier;
use App\Models\User;
use App\Models\Venue;
use App\Services\StripeCheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Covers the "press buy, then cancel, now every buy attempt 422s
 * forever" bug fixed in this session.
 *
 * Root cause: store() stamps stripe_payment_intent as a lock BEFORE
 * calling Stripe, and previously nothing released it on a buyer-
 * initiated cancel or an abandoned checkout — only a Stripe API
 * exception cleared it. Fixed with (a) a new cancel() endpoint the
 * frontend now calls, and (b) a 15-minute staleness fallback in
 * store() itself as a safety net for abandons with no explicit cancel.
 */
class TicketResaleCheckoutLockTest extends TestCase
{
    use RefreshDatabase;

    private function makeListing(array $overrides = []): array
    {
        $vendor = User::factory()->create();
        $seller = User::factory()->create();
        $buyer = User::factory()->create();
        $venue = Venue::factory()->create();

        $event = Event::create([
            'vendor_user_id' => $vendor->id,
            'name' => 'Resale Lock Test Event',
            'description' => 'Created by TicketResaleCheckoutLockTest',
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
            'price' => 20,
            'quantity' => 10,
            'remaining' => 9,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(19),
        ]);

        $order = \App\Models\Order::create([
            'user_id' => $seller->id,
            'vendor_user_id' => $vendor->id,
            'total_price' => 20,
            'status' => \App\Enums\OrderStatusEnum::Paid->value,
            'is_paid' => true,
            'payment_intent' => 'pi_original_purchase_for_resale_lock_test',
            'paid_at' => now(),
        ]);

        $ticket = Ticket::create([
            'order_id' => $order->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'owner_user_id' => $seller->id,
            'code' => 'RESALE-LOCK-0001',
            'status' => 'listed',
        ]);

        $listing = TicketResaleListing::create(array_merge([
            'ticket_id' => $ticket->id,
            'seller_user_id' => $seller->id,
            'price' => 20,
            'commission_pct' => 10,
            'status' => 'active',
        ], $overrides));

        return [$listing, $buyer];
    }

  private function fakePaymentIntent(string $piId): \Stripe\PaymentIntent
{
    return \Stripe\PaymentIntent::constructFrom([
        'id' => $piId,
        'client_secret' => $piId . '_secret',
    ]);
}

private function mockCreatePaymentIntent(string $piId = 'pi_test_resale'): void
{
    $this->mock(StripeCheckoutService::class, function ($mock) use ($piId) {
        $mock->shouldReceive('createPaymentIntent')
            ->andReturn($this->fakePaymentIntent($piId));
    });
}

    public function test_first_checkout_locks_the_listing_and_returns_a_client_secret(): void
    {
        [$listing, $buyer] = $this->makeListing();
        $this->mockCreatePaymentIntent('pi_first_checkout');
        $this->actingAs($buyer);

        $response = $this->postJson(route('resale.checkout', $listing->id));

        $response->assertOk();
        $response->assertJsonPath('clientSecret', 'pi_first_checkout_secret');
        $this->assertSame('pi_first_checkout', $listing->fresh()->stripe_payment_intent);
    }

    public function test_second_checkout_while_lock_is_fresh_is_rejected(): void
    {
        [$listing, $buyer] = $this->makeListing([
            'stripe_payment_intent' => 'pi_in_progress',
        ]);
        $this->actingAs($buyer);

        $response = $this->postJson(route('resale.checkout', $listing->id));

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'A checkout is already in progress for this listing.');
        $this->assertSame(
            'pi_in_progress',
            $listing->fresh()->stripe_payment_intent,
            'A blocked checkout attempt must not disturb the existing lock.'
        );
    }

    public function test_cancel_releases_the_lock_so_checkout_immediately_succeeds_again(): void
    {
        [$listing, $buyer] = $this->makeListing([
            'stripe_payment_intent' => 'pi_abandoned',
        ]);
        $this->actingAs($buyer);

        $this->mock(StripeCheckoutService::class, function ($mock) {
    $mock->shouldReceive('cancelPaymentIntent')
        ->once()
        ->with('pi_abandoned');
    $mock->shouldReceive('createPaymentIntent')
        ->andReturn($this->fakePaymentIntent('pi_retry'));
});

        $cancelResponse = $this->postJson(route('resale.checkout.cancel', $listing->id));
        $cancelResponse->assertOk();
        $this->assertNull(
            $listing->fresh()->stripe_payment_intent,
            'cancel() must clear the lock immediately, not after any staleness delay.'
        );

        // Retry right away — this is the exact scenario from the bug
        // report ("press buy, then cancel, now every buy button press
        // gives the same error").
        $retryResponse = $this->postJson(route('resale.checkout', $listing->id));
        $retryResponse->assertOk();
        $this->assertSame('pi_retry', $listing->fresh()->stripe_payment_intent);
    }

    public function test_cancel_on_a_listing_with_no_active_checkout_is_a_harmless_noop(): void
    {
        [$listing, $buyer] = $this->makeListing([
            'stripe_payment_intent' => null,
        ]);
        $this->actingAs($buyer);

        $this->mock(StripeCheckoutService::class, function ($mock) {
            $mock->shouldNotReceive('cancelPaymentIntent');
        });

        $response = $this->postJson(route('resale.checkout.cancel', $listing->id));

        $response->assertOk();
        $this->assertSame('active', $listing->fresh()->status);
        $this->assertNull($listing->fresh()->stripe_payment_intent);
    }

    public function test_cancel_never_touches_a_listing_that_has_already_sold(): void
    {
        [$listing, $buyer] = $this->makeListing([
            'status' => 'sold',
            'stripe_payment_intent' => 'pi_completed_sale',
        ]);
        $this->actingAs($buyer);

        $this->mock(StripeCheckoutService::class, function ($mock) {
            $mock->shouldNotReceive('cancelPaymentIntent');
        });

        $response = $this->postJson(route('resale.checkout.cancel', $listing->id));

        $response->assertOk();
        $this->assertSame(
            'pi_completed_sale',
            $listing->fresh()->stripe_payment_intent,
            'A completed sale\'s payment intent is the payment record — cancel() must never clear it.'
        );
        $this->assertSame('sold', $listing->fresh()->status);
    }

    public function test_stale_lock_older_than_fifteen_minutes_allows_a_fresh_checkout_without_explicit_cancel(): void
    {
        [$listing, $buyer] = $this->makeListing([
            'stripe_payment_intent' => 'pi_stale',
        ]);

        // Eloquent's save()/saveQuietly() would auto-touch updated_at
        // back to "now" regardless of what we set — use the raw query
        // builder, which does not auto-manage timestamps, to actually
        // backdate the row.
        \Illuminate\Support\Facades\DB::table('ticket_resale_listings')
            ->where('id', $listing->id)
            ->update(['updated_at' => now()->subMinutes(20)]);

        $this->mockCreatePaymentIntent('pi_after_staleness');
        $this->actingAs($buyer);

        $response = $this->postJson(route('resale.checkout', $listing->id));

        $response->assertOk();
        $this->assertSame('pi_after_staleness', $listing->fresh()->stripe_payment_intent);
    }

    public function test_lock_younger_than_fifteen_minutes_is_still_blocked(): void
    {
        [$listing, $buyer] = $this->makeListing([
            'stripe_payment_intent' => 'pi_recent',
        ]);

        \Illuminate\Support\Facades\DB::table('ticket_resale_listings')
            ->where('id', $listing->id)
            ->update(['updated_at' => now()->subMinutes(5)]);

        $this->actingAs($buyer);

        $response = $this->postJson(route('resale.checkout', $listing->id));

        $response->assertStatus(422);
        $this->assertSame('pi_recent', $listing->fresh()->stripe_payment_intent);
    }

    public function test_seller_cannot_buy_their_own_listing(): void
    {
        [$listing, $buyer] = $this->makeListing();
        $seller = $listing->seller;

        $this->actingAs($seller);

        $response = $this->postJson(route('resale.checkout', $listing->id));

        $response->assertStatus(422);
        $response->assertJsonPath('resale', 'You cannot buy your own resale listing.');
    }
}
