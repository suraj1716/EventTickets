<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Ticket;
use App\Models\TicketTier;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Picqer\Barcode\BarcodeGeneratorPNG;

class TicketGenerationService
{
    /**
     * Generate one Ticket row (+ QR + barcode) per unit purchased on the order.
     * Idempotent: if tickets already exist for this order, does nothing.
     *
     * IMPORTANT: assumes stock has ALREADY been reserved via
     * TicketTier::reserve() before this is called — see the
     * checkout.session.completed webhook, which reserves stock per
     * order item and then calls this once per order. Do not call
     * reserve() again in here, or stock gets decremented twice.
     *
     * Expects $order->lines to be a collection of objects/rows with:
     *   ticket_tier_id, quantity
     * (adjust the property names to match your existing order-line schema —
     * for the hair salon platform integration this is $order->orderItems,
     * filtered to items where ticket_tier_id is not null)
     */
   public function generate(Order $order): Collection
{
    return DB::transaction(function () use ($order) {
        if (Ticket::where('order_id', $order->id)->exists()) {
            return Ticket::where('order_id', $order->id)
                ->with('seat')
                ->get();
        }

        $tickets = collect();

        $ticketLines = $order->orderItems
            ->filter(fn ($item) => $item->ticket_tier_id !== null);

        foreach ($ticketLines as $line) {
            $tier = TicketTier::findOrFail(
                $line->ticket_tier_id
            );

            $seatIds = collect($line->seat_ids ?? [])
                ->map(fn ($id) => (int) $id)
                ->values();

            if (
                $tier->eventLeg?->seating_type === 'reserved'
            ) {
                if ($seatIds->count() !== (int) $line->quantity) {
                    throw new \RuntimeException(
                        "Seat selection does not match ticket quantity."
                    );
                }

                $seats = \App\Models\EventSeat::whereIn(
                    'id',
                    $seatIds
                )
                    ->where('event_leg_id', $tier->event_leg_id)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                if ($seats->count() !== $seatIds->count()) {
                    throw new \RuntimeException(
                        'One or more selected seats no longer exist.'
                    );
                }

                foreach ($seatIds as $seatId) {
                    $seat = $seats->get($seatId);

                    if (! $seat || $seat->status !== 'available') {
                        throw new \RuntimeException(
                            "Seat {$seatId} is no longer available."
                        );
                    }

                    if (
                        $seat->ticket_tier_id !== null &&
                        (int) $seat->ticket_tier_id !== (int) $tier->id
                    ) {
                        throw new \RuntimeException(
                            'Selected seat does not match the ticket tier.'
                        );
                    }

                    $tickets->push(
                        $this->createTicket(
                            $order,
                            $tier,
                            $seat
                        )
                    );
                }

                continue;
            }

            for ($i = 0; $i < $line->quantity; $i++) {
                $tickets->push(
                    $this->createTicket($order, $tier)
                );
            }
        }

        return $tickets;
    });
}

   protected function createTicket(
    Order $order,
    TicketTier $tier,
    ?\App\Models\EventSeat $seat = null
): Ticket {
    $ticket = Ticket::create([
        'order_id' => $order->id,
        'owner_user_id' => $order->user_id,
        'ticket_tier_id' => $tier->id,
        'event_leg_id' => $tier->event_leg_id,
        'seat_id' => $seat?->id,
        'code' => $this->generateCode(),
        'status' => 'valid',
    ]);

    [$qrPath, $barcodePath] = $this->renderCodes($ticket);

    $ticket->update([
        'qr_path' => $qrPath,
        'barcode_path' => $barcodePath,
    ]);

    if ($seat) {
        $seat->update([
            'status' => 'sold',
        ]);
    }

    return $ticket;
}

    /**
     * Opaque, unguessable ticket identity. Never derive this from the
     * auto-increment id — that would let someone forge a neighbouring
     * ticket's code just by incrementing a number.
     */
    protected function generateCode(): string
    {
        do {
            $code = strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
        } while (Ticket::where('code', $code)->exists());

        return $code;
    }

    /**
     * Renders a QR (encoding the ticket code) and a Code128 barcode
     * of the same code, and stores both on the public disk.
     *
     * Requires: composer require simplesoftwareio/simple-qrcode picqer/php-barcode-generator
     */
    protected function renderCodes(Ticket $ticket): array
    {
        $qrPath = "tickets/qr/{$ticket->code}.svg";
        $qrSvg = QrCode::format('svg')->size(300)->generate($ticket->code);
        Storage::disk('public')->put($qrPath, $qrSvg);

        $barcodePath = "tickets/barcode/{$ticket->code}.png";
        $generator = new BarcodeGeneratorPNG();
        $barcodePng = $generator->getBarcode($ticket->code, $generator::TYPE_CODE_128);
        Storage::disk('public')->put($barcodePath, $barcodePng);

        return [$qrPath, $barcodePath];
    }
}
