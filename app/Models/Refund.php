<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Refund extends Model
{
   protected $fillable = [
    'order_id',
    'type',
    'amount',
    'stripe_refund_id',
    'reason',
    'refunded_by',
    'is_marker',
    'voucher_restored',   // ← new column we just migrated
];

protected $casts = [
    'amount'           => 'float',
    'is_marker'        => 'boolean',
    'voucher_restored' => 'float',   // ← add this cast too
];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function refundedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'refunded_by');
    }
}
