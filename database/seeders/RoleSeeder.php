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

        /*
        |--------------------------------------------------------------------------
        | Role Permissions
        |--------------------------------------------------------------------------
        */

        $userRole->syncPermissions([
            $buyProducts,
        ]);

        $vendorRole->syncPermissions([
            $sellProducts,
            $buyProducts,
        ]);

        $adminRole->syncPermissions([
            $sellProducts,
            $buyProducts,
            $approveVendors,
        ]);

        $this->command?->info('Roles and permissions seeded successfully.');
    }
}
