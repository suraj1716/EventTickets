<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Route-level "is this account type X" gate.
 *
 * Replaces Spatie's built-in 'role:' middleware (RoleMiddleware), which
 * calls hasAnyRole() directly. Once config/permission.php has
 * 'teams' => true, hasAnyRole() only checks whatever team is currently
 * active on PermissionRegistrar — and this middleware always runs
 * before 'acting.vendor' / 'permissions.team' set one, so it would
 * check against team_id = null. Admin/Vendor are fine there, but Staff
 * is assigned per-vendor-team (never null) and would always fail.
 *
 * This middleware checks account type via User::isAdmin()/isVendorRole()/
 * isStaffRole(), which look across ANY team and are unaffected by
 * middleware ordering.
 *
 * Usage (same signature as Spatie's 'role:' alias):
 *   Route::middleware('account_type:Admin|Vendor|Staff')
 */
class EnsureAccountType
{
    public function handle(Request $request, Closure $next, string $types): Response
    {
        $user = $request->user();
        abort_unless($user, 403);

        $allowed = collect(explode('|', $types))
            ->contains(fn (string $type) => match ($type) {
                'Admin' => $user->isAdmin(),
                'Vendor' => $user->isVendorRole(),
                'Staff' => $user->isStaffRole(),
                default => false,
            });

        abort_unless($allowed, 403);

        return $next($request);
    }
}
