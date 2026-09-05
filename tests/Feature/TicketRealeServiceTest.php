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
use App\Services\TicketResaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * TicketResaleService has zero test coverage anywhere in the suite,
 * despite being the one place a fraud/double-spend bug would be most
 * expensive: reusing a QR code after resale, or a buyer paying for a
 * listing that already sold. These tests exercise that service
 * directly (not through HTTP) since the resale HTTP controllers are a
 * thin wrapper around it.
 */
class TicketResaleServiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $seller;
    protected User $otherUser;
    protected User $buyer;
    protected Ticket $ticket;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Config::set('app.resale_commission_pct', 10);

        $this->seller = User::factory()->create();
        $this->otherUser = User::factory()->create();
        $this->buyer = User::factory()->create();

        $vendor = User::factory()->create();
        $venue = Venue::factory()->create();

        $event = Event::create([
            'vendor_user_id' => $vendor->id,
            'name' => 'Resale Test Event',
            'description' => 'Created by TicketResaleServiceTest',
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
            'event_date' => now()->addDays(30)->toDateString(),
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
            'ends_at' => now()->addDays(29),
        ]);

        $order = Order::create([
            'user_id' => $this->seller->id,
            'vendor_user_id' => $vendor->id,
            'total_price' => 40,
            'status' => 'paid',
            'is_paid' => true,
        ]);

        $this->ticket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $this->seller->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'ORIG-CODE-0001',
            'status' => 'valid',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 1. Only the owner can list their own ticket
    |--------------------------------------------------------------------------
    */
    public function test_non_owner_cannot_list_ticket_for_resale(): void
    {
        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        app(TicketResaleService::class)->listTicket(
            $this->ticket,
            $this->otherUser,
            50.00
        );

        $this->assertDatabaseCount('ticket_resale_listings', 0);
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Only a valid, unscanned ticket can be listed
    |--------------------------------------------------------------------------
    */
    public function test_used_ticket_cannot_be_listed_for_resale(): void
    {
        $this->ticket->update(['status' => 'used']);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        app(TicketResaleService::class)->listTicket(
            $this->ticket,
            $this->seller,
            50.00
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Listing locks the ticket (status -> listed) so the seller can't
    |    scan / screenshot the old code at the door while it's for sale
    |--------------------------------------------------------------------------
    */
    public function test_listing_a_ticket_locks_its_status_and_creates_active_listing(): void
    {
        $listing = app(TicketResaleService::class)->listTicket(
            $this->ticket,
            $this->seller,
            55.00
        );

        $this->assertSame('active', $listing->status);
        $this->assertSame(10.0, (float) $listing->commission_pct);
        $this->assertSame('listed', $this->ticket->fresh()->status);
    }

    /*
    |--------------------------------------------------------------------------
    | 4. A ticket cannot be listed twice while a listing is already active
    |--------------------------------------------------------------------------
    */
    public function test_cannot_create_a_second_active_listing_for_the_same_ticket(): void
    {
        app(TicketResaleService::class)->listTicket($this->ticket, $this->seller, 55.00);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        app(TicketResaleService::class)->listTicket(
            $this->ticket->fresh(),
            $this->seller,
            60.00
        );

        $this->assertDatabaseCount('ticket_resale_listings', 1);
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Cancelling restores the ticket to valid/scannable
    |--------------------------------------------------------------------------
    */
    public function test_cancelling_a_listing_restores_ticket_to_valid(): void
    {
        $listing = app(TicketResaleService::class)->listTicket($this->ticket, $this->seller, 55.00);

        app(TicketResaleService::class)->cancelListing($listing, $this->seller);

        $this->assertSame('valid', $this->ticket->fresh()->status);
        $this->assertSame('cancelled', $listing->fresh()->status);
        $this->assertNotNull($listing->fresh()->cancelled_at);
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Only the seller who created the listing can cancel it
    |--------------------------------------------------------------------------
    */
    public function test_non_seller_cannot_cancel_listing(): void
    {
        $listing = app(TicketResaleService::class)->listTicket($this->ticket, $this->seller, 55.00);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        app(TicketResaleService::class)->cancelListing($listing, $this->otherUser);

        $this->assertSame('active', $listing->fresh()->status);
    }

    /*
    |--------------------------------------------------------------------------
    | 7. Completing a sale: ownership transfers, code rotates, commission
    |    math is correct, old code is permanently dead
    |--------------------------------------------------------------------------
    */
    public function test_completing_sale_transfers_ownership_and_rotates_code(): void
    {
        $listing = app(TicketResaleService::class)->listTicket($this->ticket, $this->seller, 100.00);

        $oldCode = $this->ticket->fresh()->code;

        $updatedTicket = app(TicketResaleService::class)->completeSale(
            $listing,
            $this->buyer,
            'cs_test_resale_sale',
            'pi_test_resale_sale'
        );

        $listing->refresh();

        $this->assertSame($this->buyer->id, $updatedTicket->owner_user_id);
        $this->assertSame('valid', $updatedTicket->status);
        $this->assertNotSame($oldCode, $updatedTicket->code);
        $this->assertSame(1, $updatedTicket->times_resold);

        $this->assertSame('sold', $listing->status);
        $this->assertSame($this->buyer->id, $listing->buyer_user_id);
        $this->assertEquals(10.00, (float) $listing->commission_amount);
        $this->assertEquals(90.00, (float) $listing->seller_payout_amount);
        $this->assertNotNull($listing->sold_at);

        // The OLD code must never again resolve to a valid ticket —
        // this is the entire anti-fraud point of resale.
        $this->assertDatabaseMissing('tickets', [
            'code' => $oldCode,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 8. Duplicate webhook delivery must not transfer the ticket twice or
    |    double-rotate the code
    |--------------------------------------------------------------------------
    */
    public function test_completing_sale_twice_is_idempotent(): void
    {
        $listing = app(TicketResaleService::class)->listTicket($this->ticket, $this->seller, 100.00);

        $first = app(TicketResaleService::class)->completeSale(
            $listing,
            $this->buyer,
            'cs_test_dup',
            'pi_test_dup'
        );

        $codeAfterFirst = $first->fresh()->code;

        $second = app(TicketResaleService::class)->completeSale(
            $listing->fresh(),
            $this->buyer,
            'cs_test_dup',
            'pi_test_dup'
        );

        $this->assertSame($codeAfterFirst, $second->fresh()->code);
        $this->assertSame(1, $second->fresh()->times_resold);
        $this->assertDatabaseCount('tickets', 1);
    }

    /*
    |--------------------------------------------------------------------------
    | 9. A cancelled listing cannot be bought
    |--------------------------------------------------------------------------
    */
    public function test_cannot_complete_sale_on_a_cancelled_listing(): void
    {
        $listing = app(TicketResaleService::class)->listTicket($this->ticket, $this->seller, 100.00);
        app(TicketResaleService::class)->cancelListing($listing, $this->seller);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        app(TicketResaleService::class)->completeSale(
            $listing->fresh(),
            $this->buyer,
            'cs_test_cancelled',
            'pi_test_cancelled'
        );
    }
}
