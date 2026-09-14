<?php

namespace App\Console\Commands;

use App\Enums\OrderStatusEnum;
use App\Models\CartItem;
use App\Models\EventSeat;
use App\Models\Order;
use Illuminate\Console\Command;

class ReleaseExpiredSeatHolds extends Command
{
    protected $signature = 'seats:release-expired {--minutes=30}';
    protected $description = 'Release seats held by draft orders or abandoned cart selections older than the given threshold';

    public function handle(): int
    {
        $minutes = (int) $this->option('minutes');
        $cutoff = now()->subMinutes($minutes);

        $staleOrders = Order::where('status', OrderStatusEnum::Draft->value)
            ->where('created_at', '<', $cutoff)
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

        // A seat also gets marked 'reserved' the moment a user selects it
        // in CartService::setTicketCartItems() — well before any Order
        // exists. If that user closes the tab and never proceeds to
        // checkout, no Order is ever created, so the loop above never
        // sees it, and the seat was never released by anything: not this
        // command (Order-only), not the user's own next visit (only
        // triggers if they come back and re-select seats or revisit
        // checkout — see CartController/CartService). "Comes back after
        // some days and it's still selected" is exactly that: no
        // expiry existed for this stage at all.
        $staleCartItems = CartItem::whereNotNull('ticket_tier_id')
            ->whereNotNull('seat_ids')
            ->where('created_at', '<', $cutoff)
            ->get();

        $staleCartSeatIds = $staleCartItems
            ->flatMap(fn($item) => $item->seat_ids ?? [])
            ->unique()
            ->values()
            ->all();

        if ($staleCartSeatIds) {
            EventSeat::whereIn('id', $staleCartSeatIds)
                ->where('status', 'reserved')
                ->update(['status' => 'available']);
        }

        if ($staleCartItems->isNotEmpty()) {
            CartItem::whereIn('id', $staleCartItems->pluck('id'))->delete();
        }

        $this->info(
            "Released seats for {$staleOrders->count()} expired draft order(s) "
            . "and {$staleCartItems->count()} abandoned cart selection(s)."
        );

        return self::SUCCESS;
    }
}
