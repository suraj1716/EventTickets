<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // Permissions / roles first
            RoleSeeder::class,

            // Core users / vendor
            AdminAndVendorSeeder::class,
            CustomerSeeder::class,

            // Event dependencies
            DepartmentSeeder::class,
            DepartmentCategorySeeder::class,
            EventSeeder::class,

            // Other application data
            ProductSeeder::class,
            StaffSeeder::class,
            GallerySeeder::class,
            HeroBannerSeeder::class,
            OrderAndBookingSeeder::class,
            VoucherSeeder::class,
        ]);
    }
}
