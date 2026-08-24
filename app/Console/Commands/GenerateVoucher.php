<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\VoucherGeneratorService;

class GenerateVoucher extends Command
{
    protected $signature = 'voucher:generate
        {--type=promo : Type of voucher (gift/promo)}
        {--amount=10 : Discount or gift amount}
        {--discount_type=fixed : Discount type for promo (fixed/percent)}
        {--count=1 : Number of vouchers}
        {--max_uses=1 : Max uses for promo code}
        {--expires=30 : Days until expiration}';

    protected $description = 'Generate gift cards or promo vouchers';

    public function handle(VoucherGeneratorService $generator)
    {
        $options = [
            'type' => $this->option('type'),
            'amount' => $this->option('amount'),
            'discount_type' => $this->option('discount_type'),
            'count' => $this->option('count'),
            'max_uses' => $this->option('max_uses'),
            'expires' => $this->option('expires'),
        ];

        $vouchers = $generator->generate($options);

        foreach ($vouchers as $voucher) {
            $this->info("Created {$voucher->type} voucher: {$voucher->code}");
        }
    }
}
