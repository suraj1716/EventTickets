<?php

namespace Database\Seeders;

use App\Enums\PermissionsEnum;
use App\Enums\RolesEnum;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role as ModelsRole;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $UserRole=ModelsRole::create (['name'=>RolesEnum::User->value]);
        $VendorRole=ModelsRole::create (['name'=>RolesEnum::Vendor->value]);
        $AdminRole=ModelsRole::create (['name'=>RolesEnum::Admin->value]);

        $approveVendors=Permission::create(['name'=>PermissionsEnum::ApproveVendors->value]);
        $sellProducts=Permission::create(['name'=>PermissionsEnum::SellProducts->value]);
        $buyProducts=Permission::create(['name'=>PermissionsEnum::BuyProducts->value]);

        $UserRole->syncPermissions([
            $buyProducts
        ]);
        $VendorRole->syncPermissions([
            $sellProducts,$buyProducts
        ]);
        $AdminRole->syncPermissions([
            $sellProducts,$buyProducts, $approveVendors
        ]);

    }
}
