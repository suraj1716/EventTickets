<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

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

    /**
     * The venue's physical seating layout — sections and their seats.
     * This is structural data that only changes when an admin edits
     * the floor plan, so it's cached indefinitely and invalidated by
     * VenueSectionObserver / VenueSeatObserver on save/delete.
     *
     * Do NOT use this for live seat availability/status — that's
     * per-event data on EventSeat and must always be queried live.
     */
    public static function cachedLayout(int $venueId)
    {
        return Cache::rememberForever("venue:{$venueId}:layout", function () use ($venueId) {
            return self::with('sections.seats')->findOrFail($venueId);
        });
    }

    public static function forgetCachedLayout(int $venueId): void
    {
        Cache::forget("venue:{$venueId}:layout");
    }
}
