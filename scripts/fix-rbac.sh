#!/usr/bin/env bash
#
# fix-rbac.sh — applies the vendor/staff RBAC bug fixes discussed for
# EventTickets, and removes the throwaway/redundant files that came out
# of the "Implement vendor staff RBAC and permission switching" commit.
#
# Run from the repo root:
#   bash scripts/fix-rbac.sh
#
# Safe to re-run — every step checks whether it's already applied before
# touching anything. Nothing here does composer/artisan/migrate for you;
# see the checklist printed at the end.

set -euo pipefail

if [ ! -f "artisan" ]; then
  echo "Run this from the Laravel project root (artisan not found here)." >&2
  exit 1
fi

CHANGED=0
note() { echo "  - $1"; }
step()  { echo; echo "==> $1"; }

# ─────────────────────────────────────────────────────────────────────
step "1/8  Fixing app/Http/Middleware/SetPermissionsTeam.php"
# ─────────────────────────────────────────────────────────────────────
F="app/Http/Middleware/SetPermissionsTeam.php"
if grep -q 'isVendor()\|isStaff()\|current_vendor_id' "$F" 2>/dev/null; then
  cat > "$F" <<'EOF'
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
 * - Staff: team id comes from session('acting_vendor_id'), set by the
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

        if ($user->isVendorRole()) {
            $registrar->setPermissionsTeamId($user->id);

            return $next($request);
        }

        if ($user->isStaffRole()) {
            $vendorId = $request->session()->get('acting_vendor_id');

            $validVendor = $vendorId
                && $user->activeVendors()->where('users.id', $vendorId)->exists();

            if (! $validVendor) {
                $vendorId = $user->activeVendors()->value('users.id');
                $request->session()->put('acting_vendor_id', $vendorId);
            }

            $registrar->setPermissionsTeamId($vendorId);

            return $next($request);
        }

        return $next($request);
    }
}
EOF
  note "rewrote — isVendor()/isStaff() -> isVendorRole()/isStaffRole(), session key -> acting_vendor_id"
  CHANGED=1
else
  note "already fixed, skipped"
fi

# ─────────────────────────────────────────────────────────────────────
step "2/8  Registering the 'permissions.team' middleware alias"
# ─────────────────────────────────────────────────────────────────────
F="bootstrap/app.php"
if ! grep -q "'permissions.team'" "$F"; then
  perl -0777 -pi -e \
    "s/('acting\.vendor' => \\\\App\\\\Http\\\\Middleware\\\\SetActingVendor::class,\n)/\$1            'permissions.team' => \\\\App\\\\Http\\\\Middleware\\\\SetPermissionsTeam::class,\n/" \
    "$F"
  note "added 'permissions.team' alias"
  CHANGED=1
else
  note "already registered, skipped"
fi

# ─────────────────────────────────────────────────────────────────────
step "3/8  Applying 'permissions.team' middleware to the admin route group"
# ─────────────────────────────────────────────────────────────────────
F="routes/admin_routes.php"
if grep -q "'acting.vendor'\])" "$F"; then
  perl -pi -e "s/'acting\.vendor'\]\)/'acting.vendor', 'permissions.team'])/" "$F"
  note "added 'permissions.team' to the admin. route group"
  CHANGED=1
else
  note "already applied (or line shape changed — check manually), skipped"
fi

# ─────────────────────────────────────────────────────────────────────
step "4/8  Renaming + fixing the roles/permissions seeder"
# ─────────────────────────────────────────────────────────────────────
OLD="database/seeders/Rolesandpermissionsseeder.php"
NEW="database/seeders/RolesAndPermissionsSeeder.php"
if [ -f "$OLD" ]; then
  git mv "$OLD" "$NEW" 2>/dev/null || mv "$OLD" "$NEW"
  note "renamed $(basename "$OLD") -> $(basename "$NEW") (PSR-4 needs exact case)"
  CHANGED=1
fi
if [ -f "$NEW" ] && grep -q "Role::findOrCreate('admin'" "$NEW"; then
  cat > "$NEW" <<'EOF'
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Resource => [abilities]. Kept flat as "resource.ability" permission
     * names so policies and Blade @can checks read naturally.
     */
    protected array $permissionMap = [
        // Platform-wide, admin-only
        'departments' => ['view', 'create', 'update', 'delete'],
        'categories' => ['view', 'create', 'update', 'delete'],
        'vendors' => ['view', 'approve', 'suspend', 'delete'],
        'users' => ['view', 'create', 'update', 'delete', 'impersonate'],
        'reports' => ['view-platform'],

        // Vendor-owned resources — scoped per-team via the policies
        'venues' => ['view', 'create', 'update', 'delete'],
        'events' => ['view', 'create', 'update', 'delete', 'publish', 'manage-media'],
        'ticket-tiers' => ['view', 'create', 'update', 'delete'],
        'orders' => ['view', 'refund'],
        'tickets' => ['view', 'scan'], // 'scan' = door/check-in staff
        'staff' => ['view', 'invite', 'update', 'remove'],
        'reports' => ['view-vendor'],
    ];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ($this->permissionMap as $resource => $abilities) {
            foreach ($abilities as $ability) {
                Permission::findOrCreate("{$resource}.{$ability}", 'web');
            }
        }

        // Must match App\Enums\RolesEnum and the role names assigned
        // elsewhere (AdminAndVendorSeeder, VendorController, the
        // 'role:Admin|Vendor|Staff' route middleware, etc). Spatie
        // matches role names exactly — a case mismatch here means these
        // permissions attach to a role no real user ever holds.
        $admin = Role::findOrCreate(\App\Enums\RolesEnum::Admin->value, 'web');
        $vendor = Role::findOrCreate(\App\Enums\RolesEnum::Vendor->value, 'web');
        $staff = Role::findOrCreate(\App\Enums\RolesEnum::Staff->value, 'web');

        // Admin: everything. (Gate::before also short-circuits admin, this
        // is belt-and-suspenders / makes hasPermissionTo() checks correct too.)
        $admin->syncPermissions(Permission::all());

        // Vendor owner: full control of their own venues/events/staff/orders,
        // no platform-level abilities (categories, departments, other vendors).
        $vendor->syncPermissions([
            'venues.view', 'venues.create', 'venues.update', 'venues.delete',
            'events.view', 'events.create', 'events.update', 'events.delete',
            'events.publish', 'events.manage-media',
            'ticket-tiers.view', 'ticket-tiers.create', 'ticket-tiers.update', 'ticket-tiers.delete',
            'orders.view', 'orders.refund',
            'tickets.view', 'tickets.scan',
            'staff.view', 'staff.invite', 'staff.update', 'staff.remove',
            'reports.view-vendor',
        ]);

        // Staff: day-to-day operational abilities only. No delete/publish,
        // no staff management, no refunds by default.
        $staff->syncPermissions([
            'venues.view',
            'events.view', 'events.update', 'events.manage-media',
            'ticket-tiers.view',
            'orders.view',
            'tickets.view', 'tickets.scan',
        ]);

        $this->command?->info('Roles & permissions seeded.');
    }
}
EOF
  note "role names fixed to match RolesEnum (Admin/Vendor/Staff, not admin/vendor/staff)"
  CHANGED=1
else
  note "already fixed, skipped"
fi

# ─────────────────────────────────────────────────────────────────────
step "5/8  Wiring RolesAndPermissionsSeeder into DatabaseSeeder"
# ─────────────────────────────────────────────────────────────────────
F="database/seeders/DatabaseSeeder.php"
if ! grep -q "RolesAndPermissionsSeeder::class" "$F"; then
  perl -pi -e "s/(\s*)(RoleSeeder::class,)/\$1\$2\$1RolesAndPermissionsSeeder::class,/" "$F"
  note "added RolesAndPermissionsSeeder::class after RoleSeeder::class"
  CHANGED=1
else
  note "already wired, skipped"
fi

# ─────────────────────────────────────────────────────────────────────
step "6/8  Repointing EventController at real Policy authorization"
# ─────────────────────────────────────────────────────────────────────
F="app/Http/Controllers/EventController.php"
if grep -q "authorizeVendorOwnsEvent" "$F"; then
  perl -0777 -pi -e "s/use Illuminate\\\\Http\\\\Request;/use Illuminate\\\\Foundation\\\\Auth\\\\Access\\\\AuthorizesRequests;\nuse Illuminate\\\\Http\\\\Request;/" "$F"
  perl -0777 -pi -e "s/(class EventController extends Controller\n\{\n)/\$1    use AuthorizesRequests;\n\n/" "$F"

  perl -0777 -pi -e "s/Event::where\(\s*'vendor_user_id',\s*\\\$request->user\(\)->id\s*\)/Event::where(\n        'vendor_user_id',\n        \\\$request->user()->actingVendorId()\n    )/" "$F"

  perl -0777 -pi -e "s/(public function store\(Request \\\$request\)\n    \{\n)(        \\\$data = \\\$this->validateEvent\(\\\$request\);)/\$1        \\\$this->authorize('create', Event::class);\n\n\$2/" "$F"
  perl -pi -e "s/(\s*'vendor_user_id' =>\s*\n\s*)\\\$request->user\(\)->id,/\$1\\\$request->user()->actingVendorId(),/" "$F"

  # Replace each authorizeVendorOwnsEvent() call with the matching
  # EventPolicy ability, one function at a time (order-independent —
  # matched by the enclosing method signature, not call order).
  auth_call_regex='\$this->authorizeVendorOwnsEvent\(\s*\$request,\s*\$event\s*\);'

  perl -0777 -pi -e "s/(public function edit\(\s*Request \\\$request,\s*Event \\\$event\s*\) \{\s*\n\s*)$auth_call_regex/\${1}\\\$this->authorize('update', \\\$event);/s" "$F"
  perl -0777 -pi -e "s/(public function update\(\s*Request \\\$request,\s*Event \\\$event\s*\) \{\s*\n\s*)$auth_call_regex/\${1}\\\$this->authorize('update', \\\$event);/s" "$F"
  perl -0777 -pi -e "s/(public function publish\(\s*Request \\\$request,\s*Event \\\$event\s*\) \{\s*\n\s*)$auth_call_regex/\${1}\\\$this->authorize('publish', \\\$event);/s" "$F"
  # cancel() refunds real money — kept on the same strict, vendor-owner-only
  # guard as destroy() below, not the looser staff-inclusive 'update'.
  perl -0777 -pi -e "s/(public function cancel\(\s*Request \\\$request,\s*Event \\\$event\s*\) \{\s*\n\s*)$auth_call_regex/\${1}\\\$this->authorize('delete', \\\$event);/s" "$F"
  perl -0777 -pi -e "s/(public function destroy\(\s*Request \\\$request,\s*Event \\\$event\s*\) \{\s*\n\s*)$auth_call_regex/\${1}\\\$this->authorize('delete', \\\$event);/s" "$F"

  # Delete the now-unused authorizeVendorOwnsEvent() method + its header comment.
  perl -0777 -pi -e "s/\n    \/\*\n    \|-+\n    \| Authorization\n    \|-+\n    \*\/\n\n    protected function authorizeVendorOwnsEvent\([^}]*?\n    \}\n\}\n\z/\n}\n/s" "$F"

  note "index()/store() now use actingVendorId(); edit/update/publish/cancel/destroy now call \$this->authorize() against EventPolicy"
  note "authorizeVendorOwnsEvent() removed"
  CHANGED=1
else
  note "already fixed, skipped"
fi

# ─────────────────────────────────────────────────────────────────────
step "7/8  Removing the superseded diagnostic-only Gates"
# ─────────────────────────────────────────────────────────────────────
F="app/Providers/AppServiceProvider.php"
if grep -q "Gate::define('manage-event'" "$F"; then
  perl -0777 -pi -e "s/\n        \/\/ Vendor\/Staff can manage an event.*?Gate::define\('publish-event'.*?\n        \}\);\n//s" "$F"
  perl -0777 -pi -e "s/\/\/ ── RBAC test abilities \(Admin\/Vendor\/Staff\) ───────────────────\n        \/\/ Admins pass every check automatically\./\/\/ ── RBAC (Admin\/Vendor\/Staff) ───────────────────────────────────\n        \/\/ Admins pass every check automatically. Real per-resource\n        \/\/ authorization now lives in the Policies (see app\/Policies\/*),\n        \/\/ backed by Spatie permissions + SetPermissionsTeam. See EventPolicy./" "$F"
  perl -pi -e "s/^use App\\\\Models\\\\Event;\n//" "$F"
  note "removed manage-event/delete-event/publish-event Gates (dead — only the diagnostic page used them)"
  CHANGED=1
else
  note "already removed, skipped"
fi

F="app/Http/Controllers/Admin/PermissionsTestController.php"
if grep -q "allows('manage-event'" "$F"; then
  perl -pi -e "s/allows\('manage-event', \\\$event\)/allows('update', \\\$event)/" "$F"
  perl -pi -e "s/allows\('delete-event', \\\$event\)/allows('delete', \\\$event)/" "$F"
  perl -pi -e "s/allows\('publish-event', \\\$event\)/allows('publish', \\\$event)/" "$F"
  note "Permissions Test page now checks the real EventPolicy abilities, same JSON shape — no React changes needed"
  CHANGED=1
else
  note "already fixed, skipped"
fi

# ─────────────────────────────────────────────────────────────────────
step "8/8  Removing unneeded files from the recent RBAC commit"
# ─────────────────────────────────────────────────────────────────────
remove_file() {
  local path="$1" reason="$2"
  if [ -f "$path" ]; then
    git rm -q "$path" 2>/dev/null || rm -f "$path"
    note "removed $path — $reason"
    CHANGED=1
  fi
}

remove_file "app/Console/Commands/TestRbac.php" \
  "throwaway debug command, seeds its own lowercase 'vendor'/'admin'/'staff' roles — conflicts with the case fix above, don't run it"

remove_file "database/seeders/StaffRoleSeeder.php" \
  "redundant — RolesAndPermissionsSeeder now creates the Staff role itself"

remove_file "database/seeders/RolePermissionSeeder.php" \
  "older dead duplicate — never called from DatabaseSeeder, fully superseded by RoleSeeder + RolesAndPermissionsSeeder"

# EventFactory's only consumer was TestRbac (just removed). Comment out the
# next line if you want to keep it around for future tests.
remove_file "database/factories/EventFactory.php" \
  "only used by TestRbac, which was just removed (comment this line out in the script to keep it)"

echo
if [ "$CHANGED" -eq 1 ]; then
  echo "Done. Review the diff (git diff / git status), then:"
else
  echo "Nothing to do — repo already matches the fixed state."
fi
cat <<'EOF'

  composer dump-autoload
  php artisan optimize:clear
  php artisan db:seed --class=RolesAndPermissionsSeeder

No new DB migration is needed for this batch — vendor_staff already
exists. (Per-vendor permission grants via Spatie "teams" is a separate,
bigger follow-up we haven't built yet.)
EOFss
