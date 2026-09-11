<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves which "team" (vendor) the current request is acting as, and
 * tells spatie/laravel-permission about it before any ->can() / policy
 * check runs.
 *
 * - Admins: team id is null — their role was assigned globally, and
 *   Gate::before() bypasses checks anyway, but this keeps hasRole()/
 *   hasPermissionTo() calls consistent if ever used directly.
 * - Vendor owners: team id is always their own user id.
 * - Staff: team id comes from session('current_vendor_id'), set by the
 *   "switch vendor" action. If it's missing or the staff member isn't an
 *   active member of that vendor, we fall back to their first active
 *   vendor and update the session.
 */
class SetPermissionsTeam
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $registrar = app(PermissionRegistrar::class);

        if ($user->isAdmin()) {
            $registrar->setPermissionsTeamId(null);

            return $next($request);
        }

        if ($user->isVendor()) {
            $registrar->setPermissionsTeamId($user->id);

            return $next($request);
        }

        if ($user->isStaff()) {
            $vendorId = $request->session()->get('current_vendor_id');

            $validVendor = $vendorId
                && $user->activeVendors()->where('users.id', $vendorId)->exists();

            if (! $validVendor) {
                $vendorId = $user->activeVendors()->value('users.id');
                $request->session()->put('current_vendor_id', $vendorId);
            }

            $registrar->setPermissionsTeamId($vendorId);

            return $next($request);
        }

        return $next($request);
    }
}
