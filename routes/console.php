<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;



Schedule::command('payout:vendors')->monthlyOn(1, '02:00');
Schedule::command('seats:release-expired --minutes=30')->everyFiveMinutes();
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


Schedule::command('sitemap:generate')->daily();
