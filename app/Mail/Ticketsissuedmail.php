<?php

namespace App\Mail;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * The actual "here are your tickets" email — separate from
 * CheckoutCompleted (which is just an order receipt). This is what
 * the buyer shows at the gate: one QR code per ticket.
 *
 * Used from TWO places:
 *  - StripeController's checkout.session.completed webhook, after
 *    TicketGenerationService::generate() runs for a normal purchase
 *  - DoorSaleController, after generate() runs for a walk-up sale
 */
class TicketsIssuedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Collection $tickets,
        public Event $event,
    ) {
    }

    public function build(): self
    {
        // TODO: build resources/views/emails/tickets-issued.blade.php
        // Needs: foreach ($tickets as $ticket), showing
        // Storage::disk('public')->url($ticket->qr_path) as an <img>,
        // plus $ticket->ticketTier->name and $event->name/legs for context.
        return $this->subject("Your tickets for {$this->event->name}")
            ->view('emails.tickets-issued')
            ->with([
                'tickets' => $this->tickets,
                'event' => $this->event,
            ]);
    }
}