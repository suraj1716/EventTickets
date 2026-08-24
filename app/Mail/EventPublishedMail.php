// app/Mail/EventPublishedMail.php
<?php

namespace App\Mail;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EventPublishedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Event $event)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "{$this->event->name} is now on sale",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.event-published',
            with: [
                'event' => $this->event,
                'firstLeg' => $this->event->legs->first(),
            ],
        );
    }
}
