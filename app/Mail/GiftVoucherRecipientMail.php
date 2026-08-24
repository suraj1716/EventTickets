<?php

namespace App\Mail;

use App\Models\Voucher;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class GiftVoucherRecipientMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Voucher $voucher, public ?string $buyerName = null)
    {
    }

      public function build()
    {
        return $this
            ->subject('You\'ve Received a Gift Voucher!')
            ->markdown('emails.gift-voucher')
            ->with([
                'buyerName' => $this->buyerName,
            ]);
    }
}
