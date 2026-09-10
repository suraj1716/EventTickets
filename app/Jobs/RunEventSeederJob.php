<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class RunEventSeederJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes — well past the HTTP proxy's limit
    public $tries = 1;     // don't auto-retry a seeder; if it half-ran, retrying could duplicate/confuse things

    public function handle(): void
    {
        Artisan::call('db:seed', [
            '--class' => 'EventSeeder',
            '--force' => true,
        ]);

        Log::info('RunEventSeederJob output', [
            'output' => Artisan::output(),
        ]);
    }
}
