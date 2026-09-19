<?php

namespace App\Console\Commands;

use App\Models\Event;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * One-off cleanup: the seeder's Event::updateOrCreate() only ever matches
 * the FIRST row for a given (vendor_user_id, name) — if a duplicate row
 * already existed (e.g. from before `policy`/sponsors were added), the
 * seeder silently keeps updating one copy while the other sits stale
 * forever, and the buyer-side page shows the same event twice.
 *
 * Keeps the highest-id row per (vendor_user_id, name) — the one the
 * seeder has actually been updating — and hard-deletes the rest, along
 * with their legs/tickets/media/sponsors/category links.
 *
 * Usage:
 *   php artisan events:dedupe          (dry run — lists what WOULD be deleted)
 *   php artisan events:dedupe --force  (actually deletes)
 */
class DedupeEvents extends Command
{
    protected $signature = 'events:dedupe {--force : Actually delete the duplicates instead of just listing them}';

    protected $description = 'Remove duplicate Event rows sharing the same vendor_user_id + name, keeping the highest id';

    public function handle(): int
    {
        $duplicateGroups = Event::select('vendor_user_id', 'name')
            ->groupBy('vendor_user_id', 'name')
            ->havingRaw('count(*) > 1')
            ->get();

        if ($duplicateGroups->isEmpty()) {
            $this->info('No duplicate events found.');

            return self::SUCCESS;
        }

        foreach ($duplicateGroups as $group) {
            $rows = Event::where('vendor_user_id', $group->vendor_user_id)
                ->where('name', $group->name)
                ->orderByDesc('id')
                ->get();

            $keep = $rows->shift();
            $staleIds = $rows->pluck('id')->implode(', ');

            $this->line("{$group->name}: keeping #{$keep->id}, " .
                ($this->option('force') ? 'deleting' : 'would delete') .
                " #{$staleIds}");

            if (! $this->option('force')) {
                continue;
            }

            DB::transaction(function () use ($rows) {
                foreach ($rows as $stale) {
                    $stale->legs()->each(function ($leg) {
                        $leg->ticketTiers()->delete();
                        $leg->delete();
                    });

                    $stale->media()->delete();
                    $stale->sponsors()->delete();
                    $stale->categories()->detach();
                    $stale->forceDelete();
                }
            });
        }

        if (! $this->option('force')) {
            $this->newLine();
            $this->comment('Dry run only — re-run with --force to actually delete.');
        } else {
            $this->newLine();
            $this->info('Duplicates removed.');
        }

        return self::SUCCESS;
    }
}
