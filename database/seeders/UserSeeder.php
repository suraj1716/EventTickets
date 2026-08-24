<?php

namespace Database\Seeders;

use App\Models\User;
use App\Enums\RolesEnum;
use App\Enums\VendorStatusEnum;
use App\Models\Vendor;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'User',
            'email' => 'user@gmail.com',
            'password' => 'Qwerty123'
        ])->assignRole(RolesEnum::User->value);

        $user = User::factory()->create([
            'name' => 'Vendor',
            'email' => 'vendor@gmail.com',
            'password' => 'Qwerty123'
        ]);

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'password' => 'Qwerty123'
        ])->assignRole(RolesEnum::Admin->value);

        $user->assignRole(RolesEnum::Vendor->value);

        // Vendor owner, sourced from env — this is the account
        // DepartmentCategorySeeder (and other seeders) look up via
        // config('services.vendor_owner_email') for created_by ownership.
        $vendorOwnerEmail = config('services.vendor_owner_email');
        $vendorOwnerPassword = config('services.vendor_owner_password');

        if ($vendorOwnerEmail && $vendorOwnerPassword) {
            $vendorOwner = User::firstOrCreate(
                ['email' => $vendorOwnerEmail],
                [
                    'name'     => 'Vendor Owner',
                    'password' => Hash::make($vendorOwnerPassword),
                ]
            );

            if (! $vendorOwner->hasRole(RolesEnum::Vendor->value)) {
                $vendorOwner->assignRole(RolesEnum::Vendor->value);
            }

            Vendor::firstOrCreate(
                ['user_id' => $vendorOwner->id],
                [
                    'status'       => VendorStatusEnum::Approved->value,
                    'store_name'   => 'vendor-' . $vendorOwner->id,
                    'store_address' => fake()->address(),
                ]
            );
        } else {
            $this->command->warn('UserSeeder: VENDOR_OWNER_EMAIL/VENDOR_OWNER_PASSWORD not set — skipping vendor owner creation.');
        }
    }
}
