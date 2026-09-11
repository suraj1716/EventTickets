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
