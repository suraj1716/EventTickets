<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Refund;

class Order extends Model
{
    protected $casts = [
        'variation_type_option_ids' => 'array',
        'total_price' => 'float',
        'refunded_at' => 'datetime',
        'manual_paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
         'vendor_notified_at' => 'datetime',
          'paid_at'             => 'datetime',
    'fees_calculated_at'  => 'datetime',
    'paid_out_at'         => 'datetime',

    ];

    protected $fillable = [
        'is_read',
        'stripe_charge_id',
        'stripe_amount',
        'stripe_session_id',
        'user_id',
        'vendor_user_id',
        'total_price',
        'booking_fee',
        'status',
        'shipping_address_id',
        'payment_intent',
        'online_payment_comission',
        'website_payment_comission',
        'vendor_subtotal',
        'is_paid',
        'manual_paid_at',
        'paid_at',
        'fulfillment_error',
        'payment_method',
        'staff_id',
        'voucher_id',
        'voucher_discount',
        'discount_amount',
        'refund_amount',
        'refunded_at',
        'refund_id',
        'refund_reason',
    ];


    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    public function refunds()
    {
        return $this->hasMany(Refund::class);
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function vendor(): BelongsTo
    {
        // return $this->belongsTo(Vendor::class );

        return $this->belongsTo(Vendor::class, 'vendor_user_id', 'user_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function vendorUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_user_id');
    }

    public function shippingAddress(): BelongsTo
    {
        return $this->belongsTo(ShippingAddress::class, 'shipping_address_id');
    }
    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    public function booking()
    {
        return $this->hasOne(Booking::class, 'order_id');
    }


    public function voucherUsage()
    {
        return $this->hasOne(VoucherUsage::class);
    }

    public function tickets()
{
    return $this->hasManyThrough(Ticket::class, OrderItem::class);
}
}
