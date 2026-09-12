<?php

namespace Database\Seeders;

use App\Enums\PermissionsEnum;
use App\Enums\RolesEnum;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Permissions
        |--------------------------------------------------------------------------
        */

        $approveVendors = Permission::firstOrCreate([
            'name' => PermissionsEnum::ApproveVendors->value,
            'guard_name' => 'web',
        ]);

        $sellProducts = Permission::firstOrCreate([
            'name' => PermissionsEnum::SellProducts->value,
            'guard_name' => 'web',
        ]);

        $buyProducts = Permission::firstOrCreate([
            'name' => PermissionsEnum::BuyProducts->value,
            'guard_name' => 'web',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Roles
        |--------------------------------------------------------------------------
        */

        $userRole = Role::firstOrCreate([
            'name' => RolesEnum::User->value,
            'guard_name' => 'web',
        ]);

        $vendorRole = Role::firstOrCreate([
            'name' => RolesEnum::Vendor->value,
            'guard_name' => 'web',
        ]);

        $adminRole = Role::firstOrCreate([
            'name' => RolesEnum::Admin->value,
            'guard_name' => 'web',
        ]);

        // Staff carries no permissions of its own here — RoleSeeder only
        // owns the 3 legacy marketplace permissions above, none of which
        // apply to Staff. It still needs to exist as a role, though:
        // RolesEnum::Staff is one of only 4 roles in the app, and
        // anything that seeds RoleSeeder in isolation (several Feature
        // tests do) must be able to assignRole(Staff) without hitting
        // Spatie's RoleDoesNotExist.
        Role::firstOrCreate([
            'name' => RolesEnum::Staff->value,
            'guard_name' => 'web',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Role Permissions
        |--------------------------------------------------------------------------
        */

        // givePermissionTo() is additive (skips duplicates) — unlike
        // syncPermissions(), it can never remove permissions another
        // seeder (RolesAndPermissionsSeeder) already granted these same
        // roles. This seeder only owns the 3 legacy marketplace
        // permissions below; it must never touch anything else on these
        // roles, since RoleSeeder is also invoked standalone in several
        // Feature tests (see TicketScanControllerTest,
        // EventWatchlistNotifyTest, EventSeatImportGuardTest) and, in the
        // past, from ad-hoc re-seeds — either of which used to silently
        // strip events.create/venues.*/etc. off every Vendor by replacing
        // the role's permission set instead of adding to it.
        $userRole->givePermissionTo([
            $buyProducts,
        ]);

        $vendorRole->givePermissionTo([
            $sellProducts,
            $buyProducts,
        ]);

        $adminRole->givePermissionTo([
            $sellProducts,
            $buyProducts,
            $approveVendors,
        ]);

        $this->command?->info('Roles and permissions seeded successfully.');
    }
}
