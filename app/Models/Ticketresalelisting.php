<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketResaleListing extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'seller_user_id',
        'buyer_user_id',
        'price',
        'commission_pct',
        'commission_amount',
        'seller_payout_amount',
        'status',
        'stripe_session_id',
        'stripe_payment_intent',
        'seller_paid_out',
        'seller_paid_out_at',
        'sold_at',
        'cancelled_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'commission_pct' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'seller_payout_amount' => 'decimal:2',
        'seller_paid_out' => 'boolean',
        'seller_paid_out_at' => 'datetime',
        'sold_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_user_id');
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_user_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
