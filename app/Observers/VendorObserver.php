<?php

namespace App\Observers;

use App\Models\Vendor;
use Illuminate\Support\Facades\Cache;

class VendorObserver
{
    public function saved(Vendor $vendor): void
    {
        Cache::forget('vendor-details');
    }

    public function deleted(Vendor $vendor): void
    {
        Cache::forget('vendor-details');
    }
}
