<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Staff;
use App\Models\Vendor;
use Illuminate\Database\Seeder;

class StaffSeeder extends Seeder
{
    public function run(): void
    {
        $positions = ['Senior Stylist', 'Junior Stylist', 'Threading Specialist', 'Colourist', 'Beautician'];
        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        Vendor::all()->each(function (Vendor $vendor) use ($positions, $days) {
           $categoryIds = Category::whereHas('products', function ($q) use ($vendor) {
    $q->where('created_by', $vendor->user_id);
})->pluck('id');

            for ($i = 0; $i < rand(2, 5); $i++) {
                $staff = Staff::create([
                    'vendor_id' => $vendor->user_id,
                    'name' => fake()->name(),
                    'email' => fake()->unique()->safeEmail(),
                    'phone' => fake()->phoneNumber(),
                    'position' => $positions[array_rand($positions)],
                    'bio' => fake()->sentence(12),
                    'hired_date' => fake()->dateTimeBetween('-3 years', 'now'),
                    'employment_type' => fake()->randomElement(['full-time', 'part-time']),
                    'working_days' => fake()->randomElements($days, rand(3, 6)),
                    'working_start_time' => '09:00',
                    'working_end_time' => '17:00',
                    'is_active' => true,
                ]);

                if ($categoryIds->isNotEmpty()) {
                    $staff->categories()->attach($categoryIds->random(min(2, $categoryIds->count())));
                }
            }
        });
    }
}
