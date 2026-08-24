<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\ShippingAddress;
use Illuminate\Database\Seeder;

class ShippingAddressSeeder extends Seeder
{
    public function run(): void
    {
        // Sydney-area fake addresses, one per customer
        $addresses = [
            'emma@example.com' => [
                'full_name'    => 'Emma Wilson',
                'phone'        => '0412 345 678',
                'address_line1'=> '14 Pitt Street',
                'address_line2'=> 'Apt 3',
                'city'         => 'Sydney',
                'state'        => 'NSW',
                'postal_code'  => '2000',
                'country'      => 'Australia',
                'is_default'   => true,
            ],
            'sophia@example.com' => [
                'full_name'    => 'Sophia Chen',
                'phone'        => '0423 456 789',
                'address_line1'=> '7 Military Road',
                'address_line2'=> null,
                'city'         => 'Mosman',
                'state'        => 'NSW',
                'postal_code'  => '2088',
                'country'      => 'Australia',
                'is_default'   => true,
            ],
            'olivia@example.com' => [
                'full_name'    => 'Olivia Brown',
                'phone'        => '0434 567 890',
                'address_line1'=> '22 Crown Street',
                'address_line2'=> null,
                'city'         => 'Surry Hills',
                'state'        => 'NSW',
                'postal_code'  => '2010',
                'country'      => 'Australia',
                'is_default'   => true,
            ],
            'ava@example.com' => [
                'full_name'    => 'Ava Martinez',
                'phone'        => '0445 678 901',
                'address_line1'=> '88 Bondi Road',
                'address_line2'=> 'Unit 12',
                'city'         => 'Bondi',
                'state'        => 'NSW',
                'postal_code'  => '2026',
                'country'      => 'Australia',
                'is_default'   => true,
            ],
            'isabella@example.com' => [
                'full_name'    => 'Isabella Taylor',
                'phone'        => '0456 789 012',
                'address_line1'=> '3 Pacific Highway',
                'address_line2'=> null,
                'city'         => 'Chatswood',
                'state'        => 'NSW',
                'postal_code'  => '2067',
                'country'      => 'Australia',
                'is_default'   => true,
            ],
        ];

        foreach ($addresses as $email => $addr) {
            $user = User::where('email', $email)->first();
            if (!$user) continue;

            ShippingAddress::firstOrCreate(
                [
                    'user_id'      => $user->id,
                    'address_line1'=> $addr['address_line1'],
                ],
                array_merge($addr, ['user_id' => $user->id])
            );
        }
    }
}
