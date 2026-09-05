<?php

namespace App\Console\Commands;

use App\Enums\OrderStatusEnum;
use App\Models\EventSeat;
use App\Models\Order;
use Illuminate\Console\Command;

class ReleaseExpiredSeatHolds extends Command
{
    protected $signature = 'seats:release-expired {--minutes=30}';
    protected $description = 'Release seats held by draft orders older than the given threshold';

    public function handle(): int
    {
        $minutes = (int) $this->option('minutes');

        $staleOrders = Order::where('status', OrderStatusEnum::Draft->value)
            ->where('created_at', '<', now()->subMinutes($minutes))
            ->with('orderItems')
            ->get();

        foreach ($staleOrders as $order) {
            $seatIds = $order->orderItems
                ->flatMap(fn($item) => $item->seat_ids ?? [])
                ->unique()
                ->values()
                ->all();

            if ($seatIds) {
                EventSeat::whereIn('id', $seatIds)
                    ->where('status', 'reserved')
                    ->update(['status' => 'available']);
            }

            $order->orderItems()->delete();
            $order->delete();
        }

        $this->info("Released seats for {$staleOrders->count()} expired draft order(s).");

        return self::SUCCESS;
    }
}
