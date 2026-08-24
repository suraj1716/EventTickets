<?php

namespace App\Jobs;

use App\Mail\EventPublishedMail;
use App\Models\EventWatchlist;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendEventWatchlistNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public EventWatchlist $entry,
        public bool $force = false,
    ) {
    }

    public function handle(): void
    {
        // Guard against double-sending the *initial* publish email.
        // A forced reminder blast is allowed to re-send even if
        // notified is already true.
        if ($this->entry->notified && !$this->force) {
            return;
        }

        Mail::to($this->entry->email)->send(new EventPublishedMail($this->entry->event));

        $this->entry->update([
            'notified' => true,
            'notified_at' => now(),
        ]);
    }
}
