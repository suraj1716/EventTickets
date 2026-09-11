<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * For Staff users: makes sure session('acting_vendor_id') is always a
 * vendor they're actually an active member of — falls back to their
 * first active vendor if it's missing or stale. No-op for Admin/Vendor/
 * User, who don't need this.
 */
class SetActingVendor
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isStaffRole()) {
            return $next($request);
        }

        $vendorId = $request->session()->get('acting_vendor_id');

        $isValid = $vendorId
            && $user->activeVendors()->where('users.id', $vendorId)->exists();

        if (! $isValid) {
            $vendorId = $user->activeVendors()->value('users.id');
            $request->session()->put('acting_vendor_id', $vendorId);
        }

        return $next($request);
    }
}
