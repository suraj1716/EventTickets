<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\Refund as RefundRecord;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RefundProcessedForVendor extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public RefundRecord $refund,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'A Refund Has Been Issued for an Order',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.refund.vendor',
            with: [
                'order' => $this->order,
                'refund' => $this->refund,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
