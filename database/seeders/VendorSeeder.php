<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VendorSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = [
            ['email' => 'vendor.sydney@eventtickets.test', 'store_name' => 'Harbour Live Events', 'city' => 'Sydney', 'type' => 'ecommerce'],
            ['email' => 'vendor.melbourne@eventtickets.test', 'store_name' => 'Southern Stage Co', 'city' => 'Melbourne', 'type' => 'ecommerce'],
            ['email' => 'vendor.brisbane@eventtickets.test', 'store_name' => 'River City Experiences', 'city' => 'Brisbane', 'type' => 'appointment'],
        ];

        foreach ($vendors as $data) {
            $user = User::where('email', $data['email'])->firstOrFail();

            Vendor::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'status' => 'approved',
                    'store_name' => $data['store_name'],
                    'phone' => $user->phone,
                    'store_address' => "1 Market Street, {$data['city']}",
                    'vendor_type' => $data['type'],
                    'booking_fee' => $data['type'] === 'appointment' ? 5.00 : null,
                    'business_start_time' => '09:00:00',
                    'business_end_time' => '18:00:00',
                    'slot_interval_minutes' => 30,
                    'total_seats' => 1,
                    'recurring_closed_days' => ['Sunday'],
                    'closed_dates' => [],
                    'facebook_url' => null,
                    'instagram_url' => null,
                    'tiktok_url' => null,
                    'youtube_url' => null,
                ]
            );

            $departmentIds = Department::whereIn('slug', [
                'events-entertainment', 'arts-culture', 'sports-recreation', 'travel-experiences'
            ])->pluck('id');

            DB::table('department_vendor')->where('vendor_user_id', $user->id)->delete();
            foreach ($departmentIds as $departmentId) {
                DB::table('department_vendor')->insert([
                    'vendor_user_id' => $user->id,
                    'department_id' => $departmentId,
                ]);
            }
        }
    }
}
