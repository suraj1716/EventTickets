<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventSeat extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_leg_id',
        'venue_seat_id',
        'ticket_tier_id',
        'row_label',
        'seat_number',
        'label',
        'status',
        'sort_order'
    ];

    protected $casts = [
        'seat_number' => 'integer',
           'sort_order' => 'integer',
    ];

    public function eventLeg(): BelongsTo
    {
        return $this->belongsTo(EventLeg::class);
    }

    public function venueSeat(): BelongsTo
    {
        return $this->belongsTo(VenueSeat::class);
    }

    public function ticketTier(): BelongsTo
    {
        return $this->belongsTo(TicketTier::class);
    }

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }
}
