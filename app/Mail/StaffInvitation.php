<?php
// App\Mail\StaffInvitation.php

namespace App\Mail;

use App\Models\VendorStaff;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class StaffInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public VendorStaff $vendorStaff,
        public string $acceptUrl,
        public bool $needsPassword,
    ) {
    }

    public function build()
    {
        return $this->subject("You've been invited to join {$this->vendorStaff->vendor->vendor->store_name}")
            ->view('mail.staff-invitation')
            ->with([
                'staffName' => $this->vendorStaff->staff->name,
                'vendorName' => $this->vendorStaff->vendor->vendor->store_name,
                'acceptUrl' => $this->acceptUrl,
                'needsPassword' => $this->needsPassword,
            ]);
    }
}
