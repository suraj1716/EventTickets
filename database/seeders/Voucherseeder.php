<?php

namespace Database\Seeders;

use App\Models\GiftCardTemplate;
use App\Models\Voucher;
use Illuminate\Database\Seeder;

class VoucherSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Gift Card Templates ────────────────────────────────────
        $templates = [
            ['title' => '$25 Gift Card',  'description' => 'The perfect small gesture.',               'amount' => 25.00,  'sort_order' => 1],
            ['title' => '$50 Gift Card',  'description' => 'A thoughtful gift for any occasion.',      'amount' => 50.00,  'sort_order' => 2],
            ['title' => '$100 Gift Card', 'description' => 'Give them a full luxury experience.',      'amount' => 100.00, 'sort_order' => 3],
            ['title' => '$200 Gift Card', 'description' => 'The ultimate gift for someone special.',   'amount' => 200.00, 'sort_order' => 4],
        ];

        foreach ($templates as $t) {
            GiftCardTemplate::firstOrCreate(
                ['title' => $t['title']],
                array_merge($t, ['active' => true])
            );
        }

        $this->command->info('Seeded ' . count($templates) . ' gift card templates.');

        // ── 2. Promo Codes ────────────────────────────────────────────
        $promoCodes = [
            [
                'code'          => 'WELCOME10',
                'type'          => 'promo',
                'discount_type' => 'percent',
                'amount'        => 10.00,
                'max_uses'      => 100,
                'used_count'    => 0,
                'expires_at'    => now()->addMonths(3),
                'active'        => true,
            ],
            [
                'code'          => 'FLAT20',
                'type'          => 'promo',
                'discount_type' => 'fixed',
                'amount'        => 20.00,
                'max_uses'      => 50,
                'used_count'    => 0,
                'expires_at'    => now()->addMonths(1),
                'active'        => true,
            ],
            [
                'code'          => 'VIP50',
                'type'          => 'promo',
                'discount_type' => 'fixed',
                'amount'        => 50.00,
                'max_uses'      => 10,
                'used_count'    => 0,
                'expires_at'    => now()->addMonths(6),
                'active'        => true,
            ],
            [
                'code'          => 'SUMMER25',
                'type'          => 'promo',
                'discount_type' => 'percent',
                'amount'        => 25.00,
                'max_uses'      => 200,
                'used_count'    => 0,
                'expires_at'    => now()->addMonths(2),
                'active'        => true,
            ],
        ];

        foreach ($promoCodes as $promo) {
            Voucher::firstOrCreate(['code' => $promo['code']], $promo);
        }

        $this->command->info('Seeded ' . count($promoCodes) . ' promo codes.');

        // ── 3. Test Gift Voucher ──────────────────────────────────────
        Voucher::firstOrCreate(
            ['code' => 'TESTGIFT001'],
            [
                'type'             => 'gift',
                'discount_type'    => 'fixed',
                'amount'           => 50.00,
                'remaining_amount' => 50.00,
                'active'           => true,
                'expires_at'       => now()->addYear(),
            ]
        );

        $this->command->info('Seeded test gift voucher TESTGIFT001 ($50).');
    }
}
