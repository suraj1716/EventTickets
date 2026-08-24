<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VenueSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'venue_id',
        'name',
        'code',
        'sort_order',
        'capacity',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'capacity' => 'integer',
        'is_active' => 'boolean',
    ];

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    public function seats(): HasMany
    {
        return $this->hasMany(VenueSeat::class)
            ->orderBy('row_label')
            ->orderBy('seat_number');
    }

    public function activeSeats(): HasMany
    {
        return $this->hasMany(VenueSeat::class)
            ->where('is_active', true)
            ->orderBy('row_label')
            ->orderBy('seat_number');
    }
}
