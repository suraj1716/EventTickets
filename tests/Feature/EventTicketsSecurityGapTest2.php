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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Stripe\ApiRequestor;
use Stripe\HttpClient\ClientInterface;
use Tests\TestCase;

class EventTicketsSecurityGapTest2 extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Vendor', 'guard_name' => 'web']);

        config(['app.stripe_secret_key' => 'sk_test_fake']);
    }

    /*
    |--------------------------------------------------------------------------
    | 1. A Vendor must not be able to scan/void another vendor's ticket
    |--------------------------------------------------------------------------
    |
    | CURRENT GAP:
    | Route middleware only checks role:Admin|Vendor. TicketScanController
    | never checks that the scanning Vendor actually owns the event the
    | ticket belongs to.
    |
    */

    public function test_vendor_cannot_scan_a_ticket_belonging_to_another_vendors_event(): void
    {
        $vendorA = User::factory()->create();
        $vendorB = User::factory()->create();
        $vendorA->assignRole('Vendor');
        $vendorB->assignRole('Vendor');

        $ticket = $this->makeTicketOwnedBy($vendorB, $vendorB);

        $response = $this
            ->actingAs($vendorA)
            ->post(route('staff.scan.store'), ['code' => $ticket->code]);

        $response->assertStatus(403);

        $ticket->refresh();
        $this->assertSame('valid', $ticket->status);
        $this->assertNull($ticket->scanned_at);
    }

    public function test_vendor_can_scan_their_own_events_ticket(): void
    {
        $vendor = User::factory()->create();
        $vendor->assignRole('Vendor');

        $ticket = $this->makeTicketOwnedBy($vendor, $vendor);

        $response = $this
            ->actingAs($vendor)
            ->post(route('staff.scan.store'), ['code' => $ticket->code]);

        $response->assertOk();

        $ticket->refresh();
        $this->assertSame('used', $ticket->status);
    }

    public function test_admin_can_scan_any_vendors_ticket(): void
    {
        $vendor = User::factory()->create();
        $admin = User::factory()->create();
        $vendor->assignRole('Vendor');
        $admin->assignRole('Admin');

        $ticket = $this->makeTicketOwnedBy($vendor, $vendor);

        $response = $this
            ->actingAs($admin)
            ->post(route('staff.scan.store'), ['code' => $ticket->code]);

        $response->assertOk();
    }

    /*
    |--------------------------------------------------------------------------
    | 2. A resale listing must not be checkable-out twice concurrently
    |--------------------------------------------------------------------------
    |
    | CURRENT GAP:
    | TicketResaleCheckoutController::store() only checked status=='active'
    | before calling Stripe. Nothing marked the listing as "checkout in
    | progress", so two buyers hitting store() before the webhook fires
    | could both be charged for the same ticket.
    |
    */

    public function test_second_buyer_cannot_start_checkout_while_first_ones_is_in_progress(): void
    {
        ApiRequestor::setHttpClient($this->fakeStripeCheckoutHttpClient());

        $seller = User::factory()->create([
            'stripe_account_active' => true,
            'stripe_account_id' => 'acct_test_seller',
        ]);
        $buyerA = User::factory()->create();
        $buyerB = User::factory()->create();

        $ticket = $this->makeTicketOwnedBy($seller, $seller);

        $listing = TicketResaleListing::create([
            'ticket_id' => $ticket->id,
            'seller_user_id' => $seller->id,
            'price' => 100,
            'commission_pct' => 10,
            'status' => 'active',
        ]);

        // Buyer A starts checkout — succeeds, listing is now locked.
        // Send the X-Inertia header so Inertia::location() behaves the
        // way it does for a real SPA visit (409 + X-Inertia-Location)
        // instead of falling back to a plain 302 redirect.
        $this->actingAs($buyerA)
            ->withHeaders(['X-Inertia' => 'true'])
            ->post(route('resale.checkout', $listing))
            ->assertStatus(409);

        $listing->refresh();
        $this->assertNotNull($listing->stripe_session_id);
        $this->assertSame('active', $listing->status); // unchanged until webhook fires

        // Buyer B tries the same listing before the webhook ever arrives.
        $response = $this->actingAs($buyerB)
            ->post(route('resale.checkout', $listing));

        $response->assertStatus(422);

        ApiRequestor::setHttpClient(null);
    }

    /** Fakes Stripe's HTTP transport so Checkout\Session::create() never hits the real network. */
    protected function fakeStripeCheckoutHttpClient(): ClientInterface
    {
        return new class implements ClientInterface {
            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
            {
                $body = json_encode([
                    'id' => 'cs_test_' . uniqid(),
                    'object' => 'checkout.session',
                    'url' => 'https://checkout.stripe.com/pay/cs_test_fake',
                ]);

                return [$body, 200, []];
            }
        };
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

    protected function makeTicketOwnedBy(User $owner, User $vendor): Ticket
    {
        $event = $this->makeEvent($vendor, 'Gap Test Event ' . uniqid(), 'published');

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
            'name' => 'Gap Test Tier',
            'price' => 100,
            'quantity' => 10,
            'remaining' => 10,
            'starts_at' => now()->subHour(),
            'ends_at' => now()->addDays(29),
        ]);

        $order = Order::create([
            'user_id' => $owner->id,
            'vendor_user_id' => $vendor->id,
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
            'code' => 'GAP-' . strtoupper(substr(md5(uniqid()), 0, 10)),
            'status' => 'valid',
            'times_resold' => 0,
        ]);
    }
}
