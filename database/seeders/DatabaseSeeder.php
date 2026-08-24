<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        $this->call([
            RoleSeeder::class,
             UserSeeder::class,
EventSeeder::class,
            DepartmentSeeder::class,
            DepartmentCategorySeeder::class,
            AdminAndVendorSeeder::class,   // ← creates owner@hairsalon.com (vendor)
            UserSeeder::class,             // whatever this actually does
            CustomerSeeder::class,
            ProductSeeder::class,
            StaffSeeder::class,
            GallerySeeder::class,
            HeroBannerSeeder::class,
            OrderAndBookingSeeder::class,
            VoucherSeeder::class
        ]);
    }
}
