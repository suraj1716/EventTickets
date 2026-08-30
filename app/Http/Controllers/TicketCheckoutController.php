<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Product;
use App\Models\TicketTier;
use App\Services\CartService;
use App\Services\StripeCheckoutService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
    public function store(
        Request $request,
        CartService $cartService,
        StripeCheckoutService $stripeCheckoutService,
        CartController $cartController
    )
    {
        Log::info('OLD ticket-only checkout hit');
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
            $cartService,
            $stripeCheckoutService
        );
    }



  public function addToCart(
    Request $request,
    CartService $cartService,
    StripeCheckoutService $stripeCheckoutService,
    CartController $cartController
) {
    $data = $request->validate([
        'event_id' => ['required', 'integer', 'exists:events,id'],
        'ticket_lines' => ['nullable', 'array'],
        'ticket_lines.*.ticket_tier_id' => ['required_with:ticket_lines', 'integer', 'exists:ticket_tiers,id'],
        'ticket_lines.*.quantity' => ['required_with:ticket_lines', 'integer', 'min:1'],
        'ticket_lines.*.seat_ids' => ['nullable', 'array'],
        'ticket_lines.*.seat_ids.*' => ['integer', 'exists:event_seats,id'],
        'product_lines' => ['nullable', 'array'],
        'product_lines.*.product_id' => ['required_with:product_lines', 'integer', 'exists:products,id'],
        'product_lines.*.quantity' => ['required_with:product_lines', 'integer', 'min:1'],
        'product_lines.*.option_ids' => ['nullable', 'array'],
    ]);

    $ticketLines = $data['ticket_lines'] ?? [];
    $productLines = $data['product_lines'] ?? [];

    if (empty($ticketLines) && empty($productLines)) {
        return back()->withErrors(['error' => 'Select at least one ticket or product.']);
    }

    $event = Event::findOrFail($data['event_id']);

    foreach ($ticketLines as $line) {
        $tier = TicketTier::with('eventLeg')->findOrFail($line['ticket_tier_id']);
        abort_unless(
            $tier->eventLeg && $tier->eventLeg->event_id === $event->id,
            422,
            'Ticket tier does not belong to this event.'
        );
    }

    if (!empty($ticketLines)) {
        $cartService->setTicketCartItems($ticketLines);
    }

  if (!empty($productLines)) {
    $cartService->setEventMerchCartItems($event->id, $productLines);
}

    // Go straight to checkout — same pattern as store(), scoped to this
    // event's vendor so it doesn't sweep in unrelated cart items from
    // some other purchase sitting in the user's cart.
    $request->merge(['vendor_id' => $event->vendor_user_id]);

    return $cartController->checkout($request, $cartService, $stripeCheckoutService);
}

}
