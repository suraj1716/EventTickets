<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        Permission::firstOrCreate(['name' => 'ApproveVendors']);
        Permission::firstOrCreate(['name' => 'SellProducts']);
        Permission::firstOrCreate(['name' => 'BuyProducts']);

        // Create roles and assign permissions
        $admin = Role::firstOrCreate(['name' => 'Admin']);
        $admin->givePermissionTo(['ApproveVendors', 'SellProducts', 'BuyProducts']);

        $vendor = Role::firstOrCreate(['name' => 'Vendor']);
        $vendor->givePermissionTo(['SellProducts', 'BuyProducts']);

        $user = Role::firstOrCreate(['name' => 'User']);
        $user->givePermissionTo(['BuyProducts']);
    }
}
