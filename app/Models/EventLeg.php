<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventLeg extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'venue_name',
        'address',
        'city',
        'latitude',
        'longitude',
        'event_date',
        'capacity',
        'sequence',
        'seating_type',
        'venue_id',
    ];

    protected $casts = [
        'event_date' => 'date',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];



    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }



    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
    public function seats(): HasMany
    {
        return $this->hasMany(EventSeat::class)->orderBy('row_label')->orderBy('seat_number');
    }

    public function isReservedSeating(): bool
    {
        return $this->seating_type === 'reserved';
    }
    public function ticketTiers(): HasMany
    {
        return $this->hasMany(TicketTier::class)->orderBy('starts_at');
    }

    public function activeTier(): ?TicketTier
    {
        return $this->ticketTiers()
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->where('remaining', '>', 0)
            ->first();
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}
