<?php

namespace App\Console\Commands;

use App\Enums\OrderStatusEnum;
use App\Models\Order;
use App\Models\Payout;
use App\Models\Vendor;
use Carbon\Carbon;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PayoutVendors extends Command
{
    protected $signature = 'payout:vendors {--today : Include up to today in the payout window, for testing only — do not use in production}';

    protected $description = 'Perform vendors payout';

    public function handle()
    {
        Log::info('Payout process started');
        $this->info('starting monthly payout process for vendors...');

        if ($this->option('today')) {
            $this->warn('Running with --today: payout window extended through today. Testing only.');
        }

        Log::info('Start fetching vendors...');
        $vendors = Vendor::eligibleForPayout()->with('user')->get();
        Log::info('Fetched vendors count: ' . $vendors->count());

        foreach ($vendors as $vendor) {
            $this->processPayout($vendor, $this->option('today'));
        }

        $this->info('monthly payout process completed');
        Log::info('Payout process completed');
        return Command::SUCCESS;
    }

public function processPayout(Vendor $vendor, bool $includeToday = false)
{
    $this->info(
        'Processing payout for vendor [Id=' .
        $vendor->user->id .
        '] - "' .
        $vendor->store_name .
        '"'
    );

    Log::info('Processing payout for vendor', [
        'vendor_id' => $vendor->user->id,
        'store_name' => $vendor->store_name,
    ]);

    try {
        DB::beginTransaction();

        $startingFrom = Payout::where('vendor_id', $vendor->user_id)
            ->orderBy('until', 'desc')
            ->value('until');

        $startingFrom = $startingFrom
            ? Carbon::parse($startingFrom)
            : Carbon::create(1970, 1, 1);

        $until = $includeToday
            ? Carbon::now()->endOfDay()
            : Carbon::now()->subMonthNoOverflow()->startOfMonth();

        /*
         * Find the exact orders that belong to this payout.
         */
        $orders = Order::query()
            ->where('vendor_user_id', $vendor->user_id)
            ->where('is_paid', true)
            ->whereNull('payout_id')
            ->whereBetween('created_at', [$startingFrom, $until])
            ->get(['id', 'vendor_subtotal', 'refund_amount']);

        $vendorSubtotal = $orders->sum(function ($order) {
            $refunded = $order->refund_amount ?? 0;

            return max(
                0,
                $order->vendor_subtotal - $refunded
            );
        });

        if ($vendorSubtotal <= 0 || $orders->isEmpty()) {
            Log::info('Payout skipped: no eligible orders', [
                'vendor_id' => $vendor->user_id,
                'starting_from' => $startingFrom,
                'until' => $until,
            ]);

            $this->info('Nothing to process');

            DB::commit();

            return;
        }

        /*
         * Create payout record.
         */
        $payout = Payout::create([
            'vendor_id' => $vendor->user_id,
            'amount' => $vendorSubtotal,
            'starting_from' => $startingFrom,
            'until' => $until,
        ]);

        /*
         * Attach every order to this payout.
         */
        Order::whereIn('id', $orders->pluck('id'))
            ->update([
                'payout_id' => $payout->id,
                'paid_out_at' => now(),
            ]);

        $this->info(
            'Payout created: #' .
            $payout->id .
            ' — A$' .
            number_format($vendorSubtotal, 2)
        );

        $this->info(
            'Orders attached: ' .
            $orders->count()
        );

        Log::info('Payout created and orders attached', [
            'payout_id' => $payout->id,
            'vendor_id' => $vendor->user_id,
            'amount' => $vendorSubtotal,
            'orders_count' => $orders->count(),
            'order_ids' => $orders->pluck('id')->values()->all(),
        ]);

        /*
         * Stripe transfer.
         */
        if (
            $vendor->user->isStripeAccountActive() &&
            $vendor->user->getStripeAccountId()
        ) {
            $vendor->user->transfer(
                (int) round($vendorSubtotal * 100),
                config('app.currency')
            );

            Log::info('Stripe transfer successful', [
                'vendor_id' => $vendor->user->id,
                'payout_id' => $payout->id,
                'amount' => $vendorSubtotal,
            ]);
        }

        DB::commit();

    } catch (Exception $e) {

        DB::rollBack();

        Log::error('Vendor payout failed', [
            'vendor_id' => $vendor->user->id,
            'error' => $e->getMessage(),
        ]);

        $this->error(
            'Payout failed: ' . $e->getMessage()
        );
    }
}
}
