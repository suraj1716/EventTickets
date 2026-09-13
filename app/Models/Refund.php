<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Refund extends Model
{
   protected $fillable = [
    'order_id',
    'ticket_id',   // ← new column: which ticket this refund is for (null = order-level)
    'resale_listing_id', // ← which hop of a resale chain this refund unwinds (null = original, non-resale purchase)
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

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function resaleListing(): BelongsTo
    {
        return $this->belongsTo(TicketResaleListing::class, 'resale_listing_id');
    }
}
