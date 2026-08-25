<?php

use App\Http\Controllers\Admin\EventSeatController;
// use App\Http\Controllers\Admin\EventSearchController;

use App\Http\Controllers\Admin\VenueController;
use App\Http\Controllers\Admin\VenueSeatController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\Admin\EventSearchController;
use App\Http\Controllers\EventWatchlistController;
use App\Http\Controllers\TicketCheckoutController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TicketResaleController;
use App\Http\Controllers\TicketResaleCheckoutController;
use App\Http\Controllers\TicketVerifyController;




/*
|--------------------------------------------------------------------------
| Ticket resale
|--------------------------------------------------------------------------
*/


// Public — no login required. This is the "check before you pay a
// stranger" tool, so it deliberately has zero auth barrier.
Route::get('/resale', [TicketResaleController::class, 'index'])
    ->name('resale.index');

Route::get('/verify', [TicketVerifyController::class, 'index'])
    ->name('verify.index');

Route::post('/verify/check', [TicketVerifyController::class, 'check'])
    ->name('verify.check');

// Authenticated — listing, cancelling, buying.
Route::middleware('auth')->group(function () {
    Route::get('/resale/mine', [TicketResaleController::class, 'mine'])
        ->name('resale.mine');

    Route::get('/resale/connect', [\App\Http\Controllers\ResaleSellerConnectController::class, 'connect'])
        ->name('resale.connect');

    Route::post('/tickets/{ticket}/resell', [TicketResaleController::class, 'store'])
        ->name('resale.store');

    Route::delete('/resale/{listing}', [TicketResaleController::class, 'destroy'])
        ->name('resale.destroy');

    Route::post('/resale/{listing}/checkout', [TicketResaleCheckoutController::class, 'store'])
        ->name('resale.checkout');
});





/*
|--------------------------------------------------------------------------
| Public events
|--------------------------------------------------------------------------
*/

Route::get('/coming-soon', [EventSearchController::class, 'comingSoon'])
    ->name('events.coming-soon');

Route::get('/events', [EventSearchController::class, 'index'])
    ->name('events.index');

Route::get('/events/{event:slug}', [EventSearchController::class, 'show'])
    ->name('events.show');

Route::post('/events/{event}/watchlist', [EventWatchlistController::class, 'store'])
    ->name('events.watchlist.store');

Route::delete('/events/{event}/watchlist', [EventWatchlistController::class, 'destroy'])
    ->name('events.watchlist.destroy');

Route::middleware('auth')->post('/checkout', [TicketCheckoutController::class, 'store'])
    ->name('checkout.store');



/*
|--------------------------------------------------------------------------
| Admin / Vendor event management
|--------------------------------------------------------------------------
|
| Everything under /admin — events, venues, venue seat templates, and
| event-leg seat inventory — lives in ONE group with ONE middleware
| stack. There used to be a second 'admin.' group further down this
| file with only `auth` (no `verified`, no role check) guarding the
| venue-seat-template and event-leg-seat routes — that's been folded
| in here so nothing admin-only is reachable by a plain logged-in
| customer. Do not add another top-level admin group to this file;
| add routes to this one instead.
|
| Venues are a shared catalog: any Admin or Vendor can create one and
| any Admin or Vendor can select any active one when building an event.
| Editing/deleting an existing venue, and managing its seat template,
| is restricted (see VenueController / VenueSeatController) to whoever
| created it, or an Admin.
|
| Seat flow: a venue's seat TEMPLATE (VenueSeat, managed under
| admin.venues.seats.*) gets cloned into real, sellable per-leg
| inventory (EventSeat) via EventSeatController::import(), NOT
| ::generate() — that method was removed when seat generation moved
| to the venue level. admin.events.seats.generate no longer exists;
| use admin.event-legs.seats.import.
|
*/

Route::middleware(['auth', 'verified', 'role:Admin|Vendor'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/events', [EventController::class, 'index'])
            ->name('events.index');

        Route::get('/events/create', [EventController::class, 'create'])
            ->name('events.create');

        Route::post('/events', [EventController::class, 'store'])
            ->name('events.store');

        Route::get('/events/{event}/edit', [EventController::class, 'edit'])
            ->name('events.edit');

        Route::put('/events/{event}', [EventController::class, 'update'])
            ->name('events.update');

        Route::post('/events/{event}/publish', [EventController::class, 'publish'])
            ->name('events.publish');

        Route::delete('/events/{event}', [EventController::class, 'destroy'])
            ->name('events.destroy');

        Route::get('/events/tickets', [\App\Http\Controllers\EventTicketsController::class, 'index'])
            ->name('events.tickets.index');

        Route::get('/events/orders', [\App\Http\Controllers\EventOrdersController::class, 'index'])
            ->name('events.orders.index');

        Route::get('/events/watchlist', [\App\Http\Controllers\EventWatchlistAdminController::class, 'index'])
            ->name('events.watchlist.index');

        Route::get('/events/watchlist/{event}', [\App\Http\Controllers\EventWatchlistAdminController::class, 'show'])
            ->name('events.watchlist.show');

        Route::post('/events/watchlist/{event}/notify', [\App\Http\Controllers\EventWatchlistAdminController::class, 'notify'])
            ->name('events.watchlist.notify');

        /*
         * Event-leg seat inventory (real, sellable EventSeat rows)
         */
        Route::get(
            '/event-legs/{eventLeg}/seats/edit',
            [EventSeatController::class, 'edit']
        )->name('event-legs.seats.edit');

        Route::get(
            '/event-legs/{eventLeg}/seats',
            [EventSeatController::class, 'index']
        )->name('event-legs.seats.index');

        Route::post(
            '/event-legs/{eventLeg}/seats/import',
            [EventSeatController::class, 'import']
        )->name('event-legs.seats.import');

        Route::delete(
            '/event-legs/{eventLeg}/seats/{seat}',
            [EventSeatController::class, 'destroySeat']
        )->name('event-legs.seats.seat.destroy');

        Route::delete(
            '/event-legs/{eventLeg}/seats',
            [EventSeatController::class, 'destroy']
        )->name('event-legs.seats.destroy');

        /*
         * Venues (shared catalog)
         */
        Route::get('/venues', [VenueController::class, 'index'])
            ->name('venues.index');

        Route::get('/venues/create', [VenueController::class, 'create'])
            ->name('venues.create');

        Route::post('/venues', [VenueController::class, 'store'])
            ->name('venues.store');

        Route::get('/venues/{venue}/edit', [VenueController::class, 'edit'])
            ->name('venues.edit');

        Route::put('/venues/{venue}', [VenueController::class, 'update'])
            ->name('venues.update');

        Route::delete('/venues/{venue}', [VenueController::class, 'destroy'])
            ->name('venues.destroy');

        /*
         * Venue seating template (VenueSection / VenueSeat) — the
         * reusable layout that event-leg seat inventory gets cloned
         * from via EventSeatController::import().
         */
        Route::get(
            '/venues/{venue}/seats',
            [VenueSeatController::class, 'index']
        )->name('venues.seats.index');

        Route::post(
            '/venues/{venue}/sections',
            [VenueSeatController::class, 'storeSection']
        )->name('venues.sections.store');

        Route::delete(
            '/venue-sections/{venueSection}',
            [VenueSeatController::class, 'destroySection']
        )->name('venues.sections.destroy');

        Route::post(
            '/venue-sections/{venueSection}/generate-row',
            [VenueSeatController::class, 'generateRow']
        )->name('venues.sections.generate-row');

        Route::post(
            '/venue-sections/{venueSection}/seats',
            [VenueSeatController::class, 'storeSeat']
        )->name('venues.seats.store');

        Route::delete(
            '/venue-seats/{venueSeat}',
            [VenueSeatController::class, 'destroySeat']
        )->name('venues.seats.destroy');
    });


/*
|--------------------------------------------------------------------------
| Door staff
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\DoorSaleController;
use App\Http\Controllers\TicketScanController;

Route::middleware(['auth', 'verified', 'role:Admin|Vendor'])
    ->name('staff.')
    ->group(function () {
        Route::get('/door-sale/create', [DoorSaleController::class, 'create'])
            ->name('door-sale.create');

        Route::post('/door-sale', [DoorSaleController::class, 'store'])
            ->name('door-sale.store');

        Route::get('/scan', [TicketScanController::class, 'index'])
            ->name('scan.index');

        Route::post('/scan', [TicketScanController::class, 'scan'])
            ->name('scan.store');
    });




Route::middleware('auth')
    ->prefix('tickets')
    ->name('tickets.')
    ->group(function () {
        Route::get('/', [TicketController::class, 'index'])
            ->name('index');

        Route::get('/{ticket}', [TicketController::class, 'show'])
            ->name('show');
    });
