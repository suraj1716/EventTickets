<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voucher extends Model
{
 protected $fillable = [
    'code',
    'type',
    'amount',
    'discount_type',
    'remaining_amount',
    'max_uses',
    'used_count',
    'purchased_by',
    'assigned_to',
    'gifted_to_email',
    'gift_card_template_id',
    'gift_card_product_id',
    'stripe_session_id',
    'stripe_coupon_id',
    'expires_at',
    'active',
    'sent_at',
    'hidden',   // ← add this
];

 protected $casts = [
    'active'       => 'boolean',
    'hidden'       => 'boolean',   // ← add this
    'amount'       => 'float',
    'remaining_amount' => 'float',
    'expires_at'   => 'datetime',
    'sent_at'      => 'datetime',
];

    // ── Relationships ──────────────────────────────────────────

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'purchased_by');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function giftCardProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'gift_card_product_id');
    }

    public function usages(): HasMany
    {
        return $this->hasMany(VoucherUsage::class);
    }

    // ── Helpers ────────────────────────────────────────────────

    /**
     * Is this voucher currently usable?
     */
    public function isUsable(): bool
    {
        if (! $this->active) return false;
        if ($this->expires_at && $this->expires_at->isPast()) return false;

        if ($this->type === 'promo') {
            return is_null($this->max_uses) || $this->used_count < $this->max_uses;
        }

        if ($this->type === 'gift') {
            return ($this->remaining_amount ?? 0) > 0;
        }

        return false;
    }

    /**
     * Calculate discount amount against a given order total.
     */
    public function discountFor(float $orderTotal): float
    {
        if ($this->type === 'gift') {
            return min($this->remaining_amount ?? 0, $orderTotal);
        }

        if ($this->type === 'promo') {
            if ($this->discount_type === 'percent') {
                return round($orderTotal * ($this->amount / 100), 2);
            }
            return min($this->amount, $orderTotal);
        }

        return 0;
    }

    /**
     * Deduct from gift card balance and record usage.
     * Call this ONLY inside a DB::transaction after Stripe payment confirmed.
     */
    public function redeem(float $amountUsed, int $userId = null, int $orderId = null): VoucherUsage
    {
        $before = $this->remaining_amount ?? 0;
        $after  = max(0, $before - $amountUsed);

        if ($this->type === 'gift') {
            $this->remaining_amount = $after;
        }

        if ($this->type === 'promo') {
            $this->used_count++;
        }

        $this->save();

        return VoucherUsage::create([
            'voucher_id'     => $this->id,
            'user_id'        => $userId,
            'order_id'       => $orderId,
            'amount_used'    => $amountUsed,
            'balance_before' => $before,
            'balance_after'  => $after,
        ]);
    }
}
