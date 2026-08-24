<?php

namespace Database\Seeders;

use App\Enums\VendorType;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminAndVendorSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin ──────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'shrestha.suraj.2013@gmail.com'],
            [
                'name'              => 'Salon Admin',
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
                'referral_code'     => strtoupper(Str::random(8)),
            ]
        );
        $admin->assignRole('Admin');

     // ── Vendor (Hair Salon Owner) ──────────────────────────
$vendorUser = User::firstOrCreate(
    ['email' => 'info@rbhairlounge.com.au'],
    [
        'name'              => 'Rb Hair & Beauty Lounge',
        'phone'             => '+61280654661',
        'password'          => Hash::make('password'),
        'email_verified_at' => now(),
        'referral_code'     => strtoupper(Str::random(8)),
    ]
);

$vendorUser->assignRole('Vendor');

Vendor::updateOrCreate(
    ['user_id' => $vendorUser->id],
    [
        'status' => 'approved',
        'store_name' => 'Rb Hair & Beauty Lounge',
        'store_address' => 'Shop 3/46 Morts Road, Mortdale, Infront of IGA Car Park, Mortdale NSW 2223',
        'vendor_type' => VendorType::APPOINTMENT,
        'booking_fee' => 20.00,
        'business_start_time' => '09:30:00',
        'business_end_time' => '18:30:00',
        'slot_interval_minutes' => 30,
        'total_seats' => 1,
        'recurring_closed_days' => [],
        'closed_dates' => ['2026-07-28'],
        'facebook_url' => 'https://www.facebook.com/rbhairandbeautylounge/',
        'instagram_url' => 'https://www.instagram.com/rbhairandbeautylounge/',
        'tiktok_url' => null,
        'youtube_url' => 'https://www.youtube.com/channel/UCJZ-VPORKymqE7pMbhiMxow',
    ]
);

        Vendor::firstOrCreate(
            ['user_id' => $vendorUser->id],
            [
                'status'                  => 'approved',
                'store_name'              => 'Glamour Hair Salon',
                'store_address'           => '123 George Street, Sydney NSW 2000',
                'vendor_type'             => 'appointment',
                'booking_fee'             => 20.00,
                'business_start_time'     => '09:00:00',
                'business_end_time'       => '18:00:00',
                'slot_interval_minutes'   => 30,
                'recurring_closed_days'   => json_encode([0, 6]), // Sunday=0, Saturday=6
                'closed_dates'            => json_encode([]),
            ]
        );
    }
}
