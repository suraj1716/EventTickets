<?php

namespace Tests\Feature;

use App\Enums\RolesEnum;
use App\Models\Event;
use App\Models\EventLeg;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\TicketTier;
use App\Models\User;
use App\Models\Venue;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * TicketScanController has no test file at all. This exercises all
 * four outcomes a door-staff member can hit when scanning a code, plus
 * confirms a used ticket's scanned_at timestamp isn't clobbered by a
 * second scan attempt.
 */
class TicketScanControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $doorStaff;
    protected Ticket $validTicket;
    protected Ticket $voidTicket;
    protected Ticket $usedTicket;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $vendor = User::factory()->create();
        $this->doorStaff = User::factory()->create();
        $this->doorStaff->assignRole(RolesEnum::Vendor->value);

        $venue = Venue::factory()->create();

        $event = Event::create([
            'vendor_user_id' => $vendor->id,
            'name' => 'Scan Test Event',
            'description' => 'Created by TicketScanControllerTest',
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
            'event_date' => now()->addDays(10)->toDateString(),
            'capacity' => 100,
            'sequence' => 1,
            'seating_type' => 'general',
        ]);

        $tier = TicketTier::create([
            'event_leg_id' => $leg->id,
            'name' => 'GA',
            'price' => 30,
            'quantity' => 10,
            'remaining' => 7,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(9),
        ]);

        $buyer = User::factory()->create();

        $order = Order::create([
            'user_id' => $buyer->id,
            'vendor_user_id' => $vendor->id,
            'total_price' => 90,
            'status' => 'paid',
            'is_paid' => true,
        ]);

        $this->validTicket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $buyer->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'VALID-CODE-0001',
            'status' => 'valid',
        ]);

        $this->voidTicket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $buyer->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'VOID-CODE-0002',
            'status' => 'void',
        ]);

        $this->usedTicket = Ticket::create([
            'order_id' => $order->id,
            'owner_user_id' => $buyer->id,
            'ticket_tier_id' => $tier->id,
            'event_leg_id' => $leg->id,
            'code' => 'USED-CODE-0003',
            'status' => 'used',
            'scanned_at' => now()->subHour(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 1. Unknown code
    |--------------------------------------------------------------------------
    */
    public function test_scanning_an_unknown_code_returns_not_found(): void
    {
        $this->actingAs($this->doorStaff);

        $response = $this->post(route('staff.scan.store'), [
            'code' => 'THIS-CODE-DOES-NOT-EXIST',
        ]);

        $response->assertInertia(
            fn ($page) => $page->where('result.status', 'not_found')
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Void ticket
    |--------------------------------------------------------------------------
    */
    public function test_scanning_a_void_ticket_returns_void(): void
    {
        $this->actingAs($this->doorStaff);

        $response = $this->post(route('staff.scan.store'), [
            'code' => $this->voidTicket->code,
        ]);

        $response->assertInertia(
            fn ($page) => $page->where('result.status', 'void')
        );

        // A void scan attempt must not flip the ticket to used.
        $this->assertSame('void', $this->voidTicket->fresh()->status);
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Already-used ticket — reports already_scanned, does not overwrite
    |    the original scanned_at
    |--------------------------------------------------------------------------
    */
    public function test_scanning_an_already_used_ticket_returns_already_scanned(): void
    {
        $originalScannedAt = $this->usedTicket->scanned_at;

        $this->actingAs($this->doorStaff);

        $response = $this->post(route('staff.scan.store'), [
            'code' => $this->usedTicket->code,
        ]);

        $response->assertInertia(
            fn ($page) => $page->where('result.status', 'already_scanned')
        );

        $this->assertTrue(
            $this->usedTicket->fresh()->scanned_at->eq($originalScannedAt)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Valid ticket — first scan succeeds, status flips to used, scanned_by
    |    is stamped with the door staff member's user id
    |--------------------------------------------------------------------------
    */
    public function test_scanning_a_valid_ticket_marks_it_used(): void
    {
        $this->actingAs($this->doorStaff);

        $response = $this->post(route('staff.scan.store'), [
            'code' => $this->validTicket->code,
        ]);

        $response->assertInertia(
            fn ($page) => $page->where('result.status', 'ok')
        );

        $fresh = $this->validTicket->fresh();
        $this->assertSame('used', $fresh->status);
        $this->assertNotNull($fresh->scanned_at);
        $this->assertSame($this->doorStaff->id, $fresh->scanned_by);
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Scanning the same valid ticket twice in a row: first succeeds,
    |    second is correctly rejected as already_scanned rather than
    |    scanning it a second time
    |--------------------------------------------------------------------------
    */
    public function test_second_scan_of_the_same_ticket_is_rejected(): void
    {
        $this->actingAs($this->doorStaff);

        $this->post(route('staff.scan.store'), ['code' => $this->validTicket->code]);
        $firstScannedAt = $this->validTicket->fresh()->scanned_at;

        $response = $this->post(route('staff.scan.store'), [
            'code' => $this->validTicket->code,
        ]);

        $response->assertInertia(
            fn ($page) => $page->where('result.status', 'already_scanned')
        );

        $this->assertTrue(
            $this->validTicket->fresh()->scanned_at->eq($firstScannedAt)
        );
    }
}
