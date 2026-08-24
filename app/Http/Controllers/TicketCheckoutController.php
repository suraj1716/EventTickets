<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\CartService;
use Illuminate\Http\Request;

class TicketCheckoutController extends Controller
{
    /**
     * Bridge for the "buy now" ticket flow. Does NOT duplicate any
     * checkout/payment logic — it just populates the cart with exactly
     * the selected ticket lines (buy-now: replaces any stale ticket
     * selection, doesn't stack) and hands off to the existing
     * CartController::checkout(), scoped to just this event's vendor so
     * any unrelated product cart items the user already had aren't
     * swept into the same Stripe session.
     */
    public function store(Request $request, CartService $cartService, CartController $cartController)
    {
        $data = $request->validate([
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'lines' => ['required', 'array', 'min:1'],

            'lines.*.ticket_tier_id' => [
                'required',
                'integer',
                'exists:ticket_tiers,id',
            ],

            'lines.*.quantity' => [
                'required',
                'integer',
                'min:1',
            ],

            'lines.*.seat_ids' => [
                'nullable',
                'array',
            ],

            'lines.*.seat_ids.*' => [
                'integer',
                'exists:event_seats,id',
            ],
        ]);

        $event = Event::findOrFail($data['event_id']);

        foreach ($data['lines'] as $line) {
            $tier = \App\Models\TicketTier::with('eventLeg')
                ->findOrFail($line['ticket_tier_id']);

            abort_unless(
                $tier->eventLeg &&
                    $tier->eventLeg->event_id === $event->id,
                422,
                'Ticket tier does not belong to this event.'
            );
        }

        $cartService->setTicketCartItems($data['lines']);

        $request->merge([
            'vendor_id' => $event->vendor_user_id,
            'ticket_checkout' => true,
        ]);

        return $cartController->checkout(
            $request,
            $cartService
        );
    }
}
