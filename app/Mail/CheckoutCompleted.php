<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class CheckoutCompleted extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Collection $orders)
    {
        //
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Thank you for your purchase',
        );
    }

  public function content(): Content
{
    return new Content(
        markdown: 'mail.checkout_completed',
    );
}

    public function attachments(): array
    {
        return [];
    }
}
