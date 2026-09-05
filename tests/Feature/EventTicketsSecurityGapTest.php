<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventLeg;
use App\Models\EventSeat;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\TicketResaleListing;
use App\Models\TicketTier;
use App\Models\User;
use App\Models\Venue;
use App\Services\CartService;
use App\Services\TicketResaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EventTicketsSecurityGapTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        // The application uses Spatie roles. Create the roles locally so
        // this test does not depend on the production database seeders.
        Role::firstOrCreate([
            'name' => 'Admin',
            'guard_name' => 'web',
        ]);

        Role::firstOrCreate([
            'name' => 'Vendor',
            'guard_name' => 'web',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 1. Resale listing must require an active Stripe Connect account
    |--------------------------------------------------------------------------
    |
    | CURRENT GAP:
    | TicketResaleController::store() already checks this, but
    | TicketResaleService::listTicket() does not.
    |
    | This test intentionally calls the service directly because services
    | may be reused by jobs, commands, webhooks, admin actions, etc.
    |
    | EXPECTED RESULT:
    | This test SHOULD PASS once listTicket() itself rejects sellers whose
    | Stripe Connect account is not active.
    |
    */

    public function test_resale_service_rejects_listing_without_active_stripe_connect_account(): void
    {
        $seller = User::factory()->create([
            'stripe_account_id' => null,
            'stripe_account_active' => false,
        ]);

        $ticket = $this->makeTicketOwnedBy($seller);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        app(TicketResaleService::class)->listTicket(
            $ticket,
            $seller,
            100.00
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Unpublished/proposed events must never leak through public routes
    |--------------------------------------------------------------------------
    |
    | This is a positive regression test. It verifies:
    |
    |   /events        => published only
    |   /events/{slug} => published/proposed only according to current
    |                      controller contract
    |
    | Because the current show() deliberately allows "proposed" for the
    | coming-soon/watchlist flow, we test that DRAFT/unpublished statuses
    | are blocked while proposed remains accessible.
    |
    */

    public function test_unpublished_events_do_not_appear_in_public_search_or_show(): void
    {
        $vendor = User::factory()->create();

        $published = $this->makeEvent($vendor, 'Published Public Event', 'published');
        $proposed = $this->makeEvent($vendor, 'Proposed Coming Soon Event', 'proposed');
        $draft = $this->makeEvent($vendor, 'Draft Private Event', 'draft');
        $cancelled = $this->makeEvent($vendor, 'Cancelled Private Event', 'cancelled');

        $response = $this->get(route('events.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('events.data', fn ($events) =>
                collect($events)->pluck('id')->contains($published->id)
            )
            ->where('events.data', fn ($events) =>
                ! collect($events)->pluck('id')->contains($draft->id)
            )
            ->where('events.data', fn ($events) =>
                ! collect($events)->pluck('id')->contains($cancelled->id)
            )
        );

        // Proposed is deliberately supported by show() for coming-soon /
        // watchlist behaviour.
        $this->get(route('events.show', $proposed))
            ->assertOk();

        // Draft/unpublished event must not be publicly viewable.
        $this->get(route('events.show', $draft))
            ->assertNotFound();

        $this->get(route('events.show', $cancelled))
            ->assertNotFound();
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Two buyers must not be able to hold the same reserved seat
    |--------------------------------------------------------------------------
    |
    | CURRENT GAP:
    | CartService::setTicketCartItems() only checks status='available'.
    | It does not hold/lock the seat.
    |
    | This test intentionally expects the second buyer to be rejected.
    | With the current implementation it will fail because both buyers
    | can add the same seat to their cart.
    |
    */

    public function test_reserved_seat_cannot_be_added_to_two_buyers_carts(): void
    {
        $vendor = User::factory()->create();
        $buyerA = User::factory()->create();
        $buyerB = User::factory()->create();

        $event = $this->makeEvent($vendor, 'Seat Contention Event', 'published');

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
            'quantity' => 1,
            'remaining' => 1,
            'starts_at' => now()->subHour(),
            'ends_at' => now()->addDays(29),
        ]);

        $seat = EventSeat::create([
            'event_leg_id' => $leg->id,
            'ticket_tier_id' => $tier->id,
            'row_label' => 'B',
            'seat_number' => 4,
            'label' => 'B4',
            'status' => 'available',
        ]);

        // Buyer A gets the seat first.
        $this->actingAs($buyerA);

        app(CartService::class)->setTicketCartItems([
            [
                'ticket_tier_id' => $tier->id,
                'quantity' => 1,
                'seat_ids' => [$seat->id],
            ],
        ]);

        $this->assertDatabaseHas('cart_items', [
            'user_id' => $buyerA->id,
            'ticket_tier_id' => $tier->id,
        ]);

        // Buyer B should NOT be able to add the same seat.
        $this->actingAs($buyerB);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        app(CartService::class)->setTicketCartItems([
            [
                'ticket_tier_id' => $tier->id,
                'quantity' => 1,
                'seat_ids' => [$seat->id],
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Resale checkout must reject own listing and dead listing
    |--------------------------------------------------------------------------
    |
    | Both checks already exist in TicketResaleCheckoutController. These
    | tests make sure they remain protected.
    |
    */

    public function test_seller_cannot_buy_their_own_resale_listing(): void
    {
        $seller = User::factory()->create([
            'stripe_account_active' => true,
            'stripe_account_id' => 'acct_test_seller',
        ]);

        $ticket = $this->makeTicketOwnedBy($seller);

        $listing = TicketResaleListing::create([
            'ticket_id' => $ticket->id,
            'seller_user_id' => $seller->id,
            'price' => 100,
            'commission_pct' => 10,
            'status' => 'active',
        ]);

        $response = $this
            ->actingAs($seller)
            ->post(route('resale.checkout', $listing));

        $response->assertSessionHasErrors('resale');

        $this->assertDatabaseHas('ticket_resale_listings', [
            'id' => $listing->id,
            'status' => 'active',
        ]);
    }

    public function test_buyer_cannot_checkout_a_resale_listing_that_is_no_longer_active(): void
    {
        $seller = User::factory()->create([
            'stripe_account_active' => true,
            'stripe_account_id' => 'acct_test_seller',
        ]);

        $buyer = User::factory()->create();

        $ticket = $this->makeTicketOwnedBy($seller);

        $listing = TicketResaleListing::create([
            'ticket_id' => $ticket->id,
            'seller_user_id' => $seller->id,
            'buyer_user_id' => $buyer->id,
            'price' => 100,
            'commission_pct' => 10,
            'status' => 'sold',
            'seller_payout_amount' => 90,
            'commission_amount' => 10,
            'sold_at' => now(),
        ]);

        $response = $this
            ->actingAs($buyer)
            ->post(route('resale.checkout', $listing));

        $response->assertStatus(422);
        $response->assertSee('This listing is no longer available.');
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Admin must be able to manage any vendor's event seats
    |--------------------------------------------------------------------------
    |
    | CURRENT GAP:
    | routes/events.php permits Admin|Vendor, but
    | EventSeatController::authorizeEventLeg() only allows the event owner.
    |
    | EXPECTED RESULT:
    | Admin should receive 200. With the current controller this test
    | should fail with 403, exposing the authorization contradiction.
    |
    */

    public function test_admin_can_manage_another_vendors_event_seats(): void
    {
        $vendor = User::factory()->create();
        $admin = User::factory()->create();

        $vendor->assignRole('Vendor');
        $admin->assignRole('Admin');

        $event = $this->makeEvent($vendor, 'Vendor Seat Admin Event', 'proposed');

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

        $response = $this
            ->actingAs($admin)
            ->get(route('admin.event-legs.seats.index', $leg));

        $response->assertOk();
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    protected function makeEvent(User $vendor, string $name, string $status): Event
    {
        return Event::create([
            'vendor_user_id' => $vendor->id,
            'name' => $name,
            'description' => 'Security gap test event',
            'type' => 'standalone',
            'status' => $status,
            'languages' => ['English'],
        ]);
    }

    protected function makeTicketOwnedBy(User $owner): Ticket
    {
        $event = $this->makeEvent($owner, 'Resale Test Event', 'published');

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
            'seating_type' => 'general',
        ]);

        $tier = TicketTier::create([
            'event_leg_id' => $leg->id,
            'name' => 'Resale Test Tier',
            'price' => 100,
            'quantity' => 10,
            'remaining' => 10,
            'starts_at' => now()->subHour(),
            'ends_at' => now()->addDays(29),
        ]);

        $order = Order::create([
            'user_id' => $owner->id,
            'vendor_user_id' => $owner->id,
            'total_price' => 100,
            'status' => 'Paid',
            'is_paid' => true,
            'payment_method' => 'test',
        ]);

        return Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $owner->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'TEST-' . strtoupper(substr(md5(uniqid()), 0, 10)),
            'status' => 'valid',
            'times_resold' => 0,
        ]);
    }
}
