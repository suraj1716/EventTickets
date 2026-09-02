<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    protected $fillable = [
        'user_id',
        'item_type',
        'product_id',
        'gift_card_template_id',
        'ticket_tier_id',
        'quantity',
        'price',
        'attachment_path',
        'attachment_name',
        'variation_type_option_ids',
        'designer',
        'gifted_to_email',
        'seat_ids',
    ];

    protected $casts = [
        'variation_type_option_ids' => 'array',
        'designer' => 'boolean',
        'seat_ids' => 'array',
    ];

    // ── Relationships ──────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function giftCardProduct(): BelongsTo
    {
        return $this->belongsTo(
            GiftCardTemplate::class,
            'gift_card_template_id'
        );
    }

    public function ticketTier(): BelongsTo
    {
        return $this->belongsTo(
            TicketTier::class,
            'ticket_tier_id'
        );
    }

    public function variationTypeOption()
    {
        return $this->belongsToMany(
            VariationTypeOption::class,
            'cart_item_variation_option'
        );
    }

    // ── Accessors ──────────────────────────────────────────────────

    public function getImageUrlAttribute(): ?string
    {
        if ($this->gift_card_template_id) {
            return $this->giftCardProduct?->image_url;
        }

        return $this->product?->image_url;
    }

    // ── Helpers ────────────────────────────────────────────────────

    public function isGiftCard(): bool
    {
        return ! is_null($this->gift_card_template_id);
    }
}
