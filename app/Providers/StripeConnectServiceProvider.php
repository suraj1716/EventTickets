<?php

namespace App\Providers;

use SimonHamp\LaravelStripeConnect\ServiceProvider as BaseStripeConnectServiceProvider;

class StripeConnectServiceProvider extends BaseStripeConnectServiceProvider
{
    protected function registerMigrations(): void
    {
        //
    }
}
