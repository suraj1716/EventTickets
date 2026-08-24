<?php

namespace App\Services;

use App\Jobs\SendEventWatchlistNotification;
use App\Models\Event;

class EventWatchlistNotifier
{
    /**
     * Queue an email to watchlist entries for this event.
     * By default, only entries not yet notified (call this right after
     * $event->publish()). Pass force: true for a manual reminder blast
     * that re-emails everyone, including already-notified entries.
     */
    public function notify(Event $event, bool $force = false): void
    {
        $event->watchlist()
            ->when(!$force, fn ($q) => $q->where('notified', false))
            ->chunkById(200, function ($chunk) use ($force) {
                foreach ($chunk as $entry) {
                    SendEventWatchlistNotification::dispatch($entry, $force);
                }
            });
    }
}
