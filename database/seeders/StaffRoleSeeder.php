<?php

namespace Database\Seeders;

use App\Enums\RolesEnum;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Adds the 'Staff' role. Deliberately separate from RoleSeeder /
 * Rolesandpermissionsseeder to avoid touching what those already do for
 * Admin/Vendor/User — this only adds what's new.
 *
 * Run standalone: php artisan db:seed --class=StaffRoleSeeder
 */
class StaffRoleSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Role::firstOrCreate([
            'name' => RolesEnum::Staff->value,
            'guard_name' => 'web',
        ]);

        $this->command?->info('Staff role seeded.');
    }
}
