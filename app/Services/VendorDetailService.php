<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

class VendorDetailService
{
    public function getVendorDetails()
    {
        return Cache::remember('vendor-details', now()->addHours(6), function () {
            return User::where('email', config('services.vendor_owner_email'))
                ->whereHas('vendor', function ($query) {
                    $query->where('status', 'approved');
                })
                ->with('vendor')
                ->first();
        });
    }
}
