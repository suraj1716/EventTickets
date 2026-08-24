<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{

    protected $casts = [
    'variation_type_option_ids' => 'array',
     'seat_ids' => 'array',
];
    public $timestamps=false;

   protected $fillable = [
    'order_id',
    'product_id',
    'quantity',
    'price',
    'variation_type_option_ids',
    'designer',
    'gift_card_template_id',
    'ticket_tier_id',
    'item_type',
    'attachment_path',
    'attachment_name',
     'seat_ids',
];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

public function ticketTier(): BelongsTo
{
    return $this->belongsTo(TicketTier::class, 'ticket_tier_id');
}
public function booking()
{
    return $this->belongsTo(Booking::class); // or correct FK name here
}


public function giftCardTemplate(): BelongsTo
{
    return $this->belongsTo(GiftCardTemplate::class);
}



}
