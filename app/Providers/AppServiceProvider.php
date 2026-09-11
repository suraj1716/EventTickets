<?php

namespace App\Providers;

use App\Http\Resources\AuthUserResource;
use App\Mail\BrevoApiTransport;
use App\Models\Department;
use App\Services\CartService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Filament\Support\Components\Badge;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;
use App\Models\Product;
use App\Models\Vendor;
use App\Models\TicketTier;
use App\Models\VenueSection;
use App\Models\VenueSeat;
use App\Observers\ProductObserver;
use App\Observers\VendorObserver;
use App\Observers\TicketTierObserver;
use App\Observers\VenueSectionObserver;
use App\Observers\VenueSeatObserver;
use Illuminate\Support\Facades\Mail;
use App\Models\Event;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(CartService::class, function ($app) {
            return new CartService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {

        Mail::extend('brevo-api', function (array $config = []) {
            return new BrevoApiTransport(config('services.brevo.api_key'));
        });

        Product::observe(ProductObserver::class);
        Vendor::observe(VendorObserver::class);
        VenueSection::observe(VenueSectionObserver::class);
        VenueSeat::observe(VenueSeatObserver::class);
        TicketTier::observe(TicketTierObserver::class);

        Model::preventSilentlyDiscardingAttributes(true);

        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
        Inertia::share('auth', function () {
            return [
                'user' => Auth::user() ? new AuthUserResource(Auth::user()) : null,
            ];
        });


        Vite::prefetch(concurrency: 3);

        // ── RBAC test abilities (Admin/Vendor/Staff) ───────────────────
        // Admins pass every check automatically.
        Gate::before(function (User $user, string $ability) {
            return $user->isAdmin() ? true : null;
        });

        // Vendor/Staff can manage an event only if it belongs to whichever
        // vendor they're currently acting as (themselves for a Vendor,
        // the session-selected vendor for Staff — see User::actingVendorId()).
        Gate::define('manage-event', function (User $user, Event $event) {
            return ($user->isVendorRole() || $user->isStaffRole())
                && $event->vendor_user_id === $user->actingVendorId();
        });

        // Staff can view/update but never delete or publish — Vendor can
        // do all of it for their own events.
        Gate::define('delete-event', function (User $user, Event $event) {
            return $user->isVendorRole()
                && $event->vendor_user_id === $user->actingVendorId();
        });

        Gate::define('publish-event', function (User $user, Event $event) {
            return $user->isVendorRole()
                && $event->vendor_user_id === $user->actingVendorId();
        });
    }
}
