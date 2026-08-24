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
use App\Observers\ProductObserver;
use App\Observers\VendorObserver;
use Illuminate\Support\Facades\Mail;

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
    }
}
