<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Venue extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by_user_id',
        'name',
        'address',
        'city',
        'state',
        'postcode',
        'country',
        'latitude',
        'longitude',
        'capacity',
        'seating_type',
        'contact_name',
        'contact_email',
        'contact_phone',
        'notes',
        'image_url',
        'is_active',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'is_active' => 'boolean',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(VenueSection::class);
    }

    public function seats(): HasMany
    {
        return $this->hasMany(VenueSeat::class);
    }

    public function activeSections(): HasMany
    {
        return $this->hasMany(VenueSection::class)
            ->where('is_active', true)
            ->orderBy('sort_order');
    }
    public function eventLegs(): HasMany
    {
        return $this->hasMany(
            EventLeg::class,
            'venue_id'
        );
    }
    public function activeSeats(): HasMany
    {
        return $this->hasMany(VenueSeat::class)
            ->where('is_active', true);
    }
}
