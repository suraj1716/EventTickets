<?php
// App\Mail\VendorApproved.php

namespace App\Mail;

use App\Models\Vendor;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VendorApproved extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Vendor $vendor)
    {
    }

    public function build()
    {
        return $this->subject('Your vendor application has been approved')
            ->view('mail.vendor-approved')
            ->with([
                'name' => $this->vendor->user->name,
                'profileUrl' => route('profile.edit') . '#vendor-details',
                'dashboardUrl'=> route('admin.dashboard'),
            ]);
    }
}
