<?php

namespace App\Mail;

use App\Models\Payout;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VendorPayoutMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Payout $payout)
    {
    }

    public function build()
    {
        return $this->subject('Your Payout Receipt — A$' . number_format($this->payout->amount, 2))
            ->markdown('emails.payouts.receipt', [
                'payout' => $this->payout,
            ]);
    }
}
