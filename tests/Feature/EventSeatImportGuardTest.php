<?php

namespace Tests\Feature;

use App\Enums\RolesEnum;
use App\Models\Event;
use App\Models\EventLeg;
use App\Models\EventSeat;
use App\Models\TicketTier;
use App\Models\User;
use App\Models\Venue;
use App\Models\VenueSection;
use App\Models\VenueSeat;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * EventSeatController::import() has an explicit guard —
 * assertNoSoldOrHeldSeats() — meant to stop a vendor wiping out real,
 * already-sold seat inventory by re-running the seat import. That
 * guard has never been exercised by a test, so there's no proof it
 * actually blocks anything rather than just existing as a comment.
 */
class EventSeatImportGuardTest extends TestCase
{
    use RefreshDatabase;

    protected User $vendor;
    protected Venue $venue;
    protected VenueSection $section;
    protected Event $event;
    protected EventLeg $leg;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->vendor = User::factory()->create();
        $this->vendor->assignRole(RolesEnum::Vendor->value);

        $this->venue = Venue::factory()->create([
            'created_by_user_id' => $this->vendor->id,
        ]);

        $this->section = VenueSection::create([
            'venue_id' => $this->venue->id,
            'name' => 'Floor',
            'code' => 'FLR',
            'sort_order' => 1,
            'capacity' => 2,
            'is_active' => true,
        ]);

        VenueSeat::create([
            'venue_id' => $this->venue->id,
            'venue_section_id' => $this->section->id,
            'row_label' => 'A',
            'seat_number' => 1,
            'label' => 'A1',
            'is_active' => true,
        ]);

        VenueSeat::create([
            'venue_id' => $this->venue->id,
            'venue_section_id' => $this->section->id,
            'row_label' => 'A',
            'seat_number' => 2,
            'label' => 'A2',
            'is_active' => true,
        ]);

        $this->event = Event::create([
            'vendor_user_id' => $this->vendor->id,
            'name' => 'Seat Import Test Event',
            'description' => 'Created by EventSeatImportGuardTest',
            'type' => 'standalone',
            'status' => 'proposed',
            'languages' => ['English'],
        ]);

        $this->leg = EventLeg::create([
            'event_id' => $this->event->id,
            'venue_id' => $this->venue->id,
            'venue_name' => $this->venue->name,
            'address' => $this->venue->address,
            'city' => $this->venue->city,
            'event_date' => now()->addDays(30)->toDateString(),
            'capacity' => 2,
            'sequence' => 1,
            'seating_type' => 'general',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 1. First import succeeds and creates one EventSeat per active
    |    VenueSeat
    |--------------------------------------------------------------------------
    */
    public function test_first_import_creates_seats_for_the_leg(): void
    {
        $this->actingAs($this->vendor);

        $response = $this->post(
            route('admin.event-legs.seats.import', $this->leg),
            ['section_assignments' => []]
        );

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseCount('event_seats', 2);
        $this->assertSame(
            'reserved',
            $this->leg->fresh()->seating_type
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Re-import is blocked once ANY seat is sold
    |--------------------------------------------------------------------------
    */
    public function test_reimport_is_blocked_when_a_seat_is_sold(): void
    {
        $this->actingAs($this->vendor);

        $this->post(
            route('admin.event-legs.seats.import', $this->leg),
            ['section_assignments' => []]
        );

        $seat = EventSeat::where('event_leg_id', $this->leg->id)->first();
        $seat->update(['status' => 'sold']);

        $response = $this->post(
            route('admin.event-legs.seats.import', $this->leg),
            ['section_assignments' => []]
        );

        $response->assertStatus(422);

        // The sold seat must still exist, untouched — the guard exists
        // specifically to prevent the delete-and-recreate below it from
        // wiping out real inventory.
        $this->assertDatabaseHas('event_seats', [
            'id' => $seat->id,
            'status' => 'sold',
        ]);
        $this->assertDatabaseCount('event_seats', 2);
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Re-import is blocked when a seat is merely held, not just sold
    |--------------------------------------------------------------------------
    */
    public function test_reimport_is_blocked_when_a_seat_is_held(): void
    {
        $this->actingAs($this->vendor);

        $this->post(
            route('admin.event-legs.seats.import', $this->leg),
            ['section_assignments' => []]
        );

        $seat = EventSeat::where('event_leg_id', $this->leg->id)->first();
        $seat->update(['status' => 'held']);

        $response = $this->post(
            route('admin.event-legs.seats.import', $this->leg),
            ['section_assignments' => []]
        );

        $response->assertStatus(422);
        $this->assertDatabaseCount('event_seats', 2);
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Re-import IS allowed while every seat is still available
    |--------------------------------------------------------------------------
    */
    public function test_reimport_is_allowed_when_all_seats_still_available(): void
    {
        $this->actingAs($this->vendor);

        $this->post(
            route('admin.event-legs.seats.import', $this->leg),
            ['section_assignments' => []]
        );

        $response = $this->post(
            route('admin.event-legs.seats.import', $this->leg),
            ['section_assignments' => []]
        );

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseCount('event_seats', 2);
    }

    /*
    |--------------------------------------------------------------------------
    | 5. A ticket tier belonging to a different event leg cannot be
    |    assigned to this leg's section
    |--------------------------------------------------------------------------
    */
    public function test_tier_from_another_event_leg_cannot_be_assigned_to_section(): void
    {
        $otherLeg = EventLeg::create([
            'event_id' => $this->event->id,
            'venue_id' => $this->venue->id,
            'venue_name' => $this->venue->name,
            'address' => $this->venue->address,
            'city' => $this->venue->city,
            'event_date' => now()->addDays(31)->toDateString(),
            'capacity' => 2,
            'sequence' => 2,
            'seating_type' => 'general',
        ]);

        $foreignTier = TicketTier::create([
            'event_leg_id' => $otherLeg->id,
            'name' => 'Wrong Leg Tier',
            'price' => 20,
            'quantity' => 5,
            'remaining' => 5,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(29),
        ]);

        $this->actingAs($this->vendor);

        $response = $this->post(
            route('admin.event-legs.seats.import', $this->leg),
            [
                'section_assignments' => [
                    $this->section->id => $foreignTier->id,
                ],
            ]
        );

        $response->assertStatus(422);
        $this->assertDatabaseCount('event_seats', 0);
    }

    /*
    |--------------------------------------------------------------------------
    | 6. A vendor who does not own the event cannot import seats for it
    |--------------------------------------------------------------------------
    */
    public function test_other_vendor_cannot_import_seats_for_this_event(): void
    {
        $intruder = User::factory()->create();
        $intruder->assignRole(RolesEnum::Vendor->value);

        $this->actingAs($intruder);

        $response = $this->post(
            route('admin.event-legs.seats.import', $this->leg),
            ['section_assignments' => []]
        );

        $response->assertStatus(403);
        $this->assertDatabaseCount('event_seats', 0);
    }
}
