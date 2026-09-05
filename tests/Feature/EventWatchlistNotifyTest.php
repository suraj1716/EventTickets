<?php

namespace Tests\Feature;

use App\Enums\RolesEnum;
use App\Jobs\SendEventWatchlistNotification;
use App\Models\Event;
use App\Models\EventWatchlist;
use App\Models\User;
use App\Services\EventWatchlistNotifier;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Watchlist join -> verify -> notify has no test file. Note while
 * writing this: Event::publish() only flips status/published_at — it
 * does NOT call EventWatchlistNotifier itself. Notifying watchers is
 * a separate, manual step (EventWatchlistAdminController::notify,
 * the "notify" button in admin). If the intent was "publish auto-
 * emails the watchlist," that's not wired up — flagging this
 * separately since it's a product decision, not something a test
 * should silently paper over.
 */
class EventWatchlistNotifyTest extends TestCase
{
    use RefreshDatabase;

    protected User $vendor;
    protected Event $event;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->vendor = User::factory()->create();
        $this->vendor->assignRole(RolesEnum::Vendor->value);

        $this->event = Event::create([
            'vendor_user_id' => $this->vendor->id,
            'name' => 'Watchlist Test Event',
            'description' => 'Created by EventWatchlistNotifyTest',
            'type' => 'standalone',
            'status' => 'proposed',
            'languages' => ['English'],
            'watchlist_enabled' => true,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 1. Unverified subscribers are never notified
    |--------------------------------------------------------------------------
    */
    public function test_unverified_subscriber_is_not_notified(): void
    {
        Bus::fake();

        EventWatchlist::create([
            'event_id' => $this->event->id,
            'email' => 'unverified@example.test',
            'verified_at' => null,
            'notified' => false,
        ]);

        $count = app(EventWatchlistNotifier::class)->notify($this->event);

        $this->assertSame(0, $count);
        Bus::assertNotDispatched(SendEventWatchlistNotification::class);
    }

    /*
    |--------------------------------------------------------------------------
    | 2. A verified, not-yet-notified subscriber gets queued exactly once
    |--------------------------------------------------------------------------
    */
    public function test_verified_subscriber_is_notified_once(): void
    {
        Bus::fake();

        $entry = EventWatchlist::create([
            'event_id' => $this->event->id,
            'email' => 'verified@example.test',
            'verified_at' => now(),
            'notified' => false,
        ]);

        $count = app(EventWatchlistNotifier::class)->notify($this->event);

        $this->assertSame(1, $count);
        Bus::assertDispatched(
            SendEventWatchlistNotification::class,
            fn ($job) => $job->entry->id === $entry->id && $job->force === false
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 3. A normal (non-forced) notify run skips subscribers already notified
    |--------------------------------------------------------------------------
    */
    public function test_already_notified_subscriber_is_skipped_on_normal_run(): void
    {
        Bus::fake();

        EventWatchlist::create([
            'event_id' => $this->event->id,
            'email' => 'already-notified@example.test',
            'verified_at' => now(),
            'notified' => true,
            'notified_at' => now()->subDay(),
        ]);

        $count = app(EventWatchlistNotifier::class)->notify($this->event, force: false);

        $this->assertSame(0, $count);
        Bus::assertNotDispatched(SendEventWatchlistNotification::class);
    }

    /*
    |--------------------------------------------------------------------------
    | 4. A forced admin reminder re-sends even to already-notified subscribers
    |--------------------------------------------------------------------------
    */
    public function test_forced_notify_resends_to_already_notified_subscribers(): void
    {
        Bus::fake();

        EventWatchlist::create([
            'event_id' => $this->event->id,
            'email' => 'reminder@example.test',
            'verified_at' => now(),
            'notified' => true,
            'notified_at' => now()->subDay(),
        ]);

        $count = app(EventWatchlistNotifier::class)->notify($this->event, force: true);

        $this->assertSame(1, $count);
        Bus::assertDispatched(
            SendEventWatchlistNotification::class,
            fn ($job) => $job->force === true
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 5. The job itself: a non-forced run must not double-send if it
    |    somehow runs twice for the same entry (belt-and-suspenders on
    |    top of the notifier's own query filter)
    |--------------------------------------------------------------------------
    */
    public function test_job_does_not_resend_when_entry_already_notified_and_not_forced(): void
    {
        \Illuminate\Support\Facades\Mail::fake();

        $entry = EventWatchlist::create([
            'event_id' => $this->event->id,
            'email' => 'job-guard@example.test',
            'verified_at' => now(),
            'notified' => true,
            'notified_at' => now()->subHour(),
        ]);

        (new SendEventWatchlistNotification($entry, false))->handle();

        \Illuminate\Support\Facades\Mail::assertNothingSent();
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Only the vendor who owns the event can trigger a manual notify
    |--------------------------------------------------------------------------
    */
    public function test_other_vendor_cannot_trigger_notify_for_this_event(): void
    {
        $intruder = User::factory()->create();
        $intruder->assignRole(RolesEnum::Vendor->value);

        $this->actingAs($intruder);

        $response = $this->post(
            route('admin.events.watchlist.notify', $this->event)
        );

        $response->assertStatus(403);
    }
}
