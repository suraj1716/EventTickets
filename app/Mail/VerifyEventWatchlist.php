<?php

namespace App\Mail;

use App\Models\EventWatchlist;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerifyEventWatchlist extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public EventWatchlist $watchlist,
        public string $token,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Confirm your watchlist — {$this->watchlist->event->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.events.verify-watchlist',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
