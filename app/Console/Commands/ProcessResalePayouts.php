<?php

namespace App\Console\Commands;

use App\Models\TicketResaleListing;
use App\Services\TicketResaleService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessResalePayouts extends Command
{
    protected $signature = 'payout:resale-sellers';

    protected $description = 'Pay out resale sellers whose payout_eligible_at has passed (event date + buffer)';

    public function handle(TicketResaleService $resaleService): int
    {
        // ticket.status != 'void' belt-and-suspenders here too —
        // TicketResaleService::payoutSeller() already re-checks this
        // itself right before transferring, but filtering it out of the
        // query means a cancelled event's leftover listings don't even
        // show up in the "processing" log below as if they were live.
        $listings = TicketResaleListing::query()
            ->where('status', 'sold')
            ->where('seller_paid_out', false)
            ->whereNotNull('payout_eligible_at')
            ->where('payout_eligible_at', '<=', now())
            ->whereHas('ticket', fn ($q) => $q->where('status', '!=', 'void'))
            ->with('ticket', 'seller')
            ->get();

        $this->info("Processing {$listings->count()} eligible resale payout(s)...");

        Log::info('Resale payout run started', ['eligible_count' => $listings->count()]);

        $paid = 0;
        $skipped = 0;

        foreach ($listings as $listing) {
            $resaleService->payoutSeller($listing);

            // payoutSeller() is silent on skip/failure by design (see its
            // docblock) — re-check the flag it would have flipped so this
            // command's own summary is still accurate.
            $listing->refresh()->seller_paid_out ? $paid++ : $skipped++;
        }

        $this->info("Done — {$paid} paid, {$skipped} skipped/failed.");

        Log::info('Resale payout run finished', [
            'paid' => $paid,
            'skipped' => $skipped,
        ]);

        return Command::SUCCESS;
    }
}
