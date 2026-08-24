<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            ['name' => 'Emma Wilson',    'email' => 'emma@example.com'],
            ['name' => 'Sophia Chen',    'email' => 'sophia@example.com'],
            ['name' => 'Olivia Brown',   'email' => 'olivia@example.com'],
            ['name' => 'Ava Martinez',   'email' => 'ava@example.com'],
            ['name' => 'Isabella Taylor','email' => 'isabella@example.com'],
        ];

        foreach ($customers as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'              => $data['name'],
                    'password'          => Hash::make('password'),
                    'email_verified_at' => now(),
                    'referral_code'     => strtoupper(Str::random(8)),
                ]
            );
            $user->assignRole('User');
        }
    }
}
