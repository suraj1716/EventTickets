<?php

namespace App\Models;

use App\Support\TimeSlotParser;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    protected $table = 'bookings';

    protected $fillable = [
        'user_id',
        'booking_date',
        'time_slot',
        'order_id',
        'staff_id',
        'edited_at',
        'booking_fee_refunded',
        'booking_fee_refund_amount'
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'booking_date' => 'date',
    ];

    protected static function booted()
    {
        static::saving(function (Booking $booking) {
            $booking->sort_minutes = TimeSlotParser::toMinutes($booking->time_slot);
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vendor()
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }
}
