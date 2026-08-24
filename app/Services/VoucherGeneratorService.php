<?php
namespace App\Services;

use App\Models\Voucher;
use Illuminate\Support\Str;

class VoucherGeneratorService
{
    public function generate(array $options): array
    {
        $vouchers = [];

        for ($i = 0; $i < (int) $options['count']; $i++) {
            $code = strtoupper(Str::random(8));

            $voucher = Voucher::create([
                'code' => $code,
                'type' => $options['type'],
                'amount' => $options['amount'],
                'discount_type' => $options['type'] === 'promo' ? $options['discount_type'] : null,
                'remaining_amount' => $options['type'] === 'gift' ? $options['amount'] : null,
                'max_uses' => $options['type'] === 'promo' ? $options['max_uses'] : null,
                'expires_at' => now()->addDays($options['expires']),
                'active' => true,
            ]);

            $vouchers[] = $voucher;
        }

        return $vouchers;
    }
}
