<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoucherUsage extends Model
{
    protected $fillable = [
        'voucher_id',
        'user_id',
        'order_id',
        'amount_used',
        'balance_before',
        'balance_after',
    ];

    protected $casts = [
        'amount_used'    => 'float',
        'balance_before' => 'float',
        'balance_after'  => 'float',
    ];

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
