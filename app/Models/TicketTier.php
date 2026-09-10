<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class TicketTier extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_leg_id',
        'name',
        'price',
        'quantity',
        'remaining',
        'starts_at',
        'ends_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function eventLeg(): BelongsTo
    {
        return $this->belongsTo(EventLeg::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function isOpen(): bool
    {
        return $this->remaining > 0
            && now()->between($this->starts_at, $this->ends_at);
    }

    /**
     * Atomically reserve $qty tickets from this tier.
     * Returns true if the reservation succeeded, false if not enough remained.
     * Must run inside the same DB transaction as ticket generation.
     */
    public function reserve(int $qty): bool
    {
        $updated = static::where('id', $this->id)
            ->where('remaining', '>=', $qty)
            ->decrement('remaining', $qty);

        return $updated > 0;
    }

    /**
     * Cached tier catalog (name/price/window) for an event leg — for
     * display only. Deliberately excludes `remaining`: reserve() above
     * decrements it via the query builder, which bypasses Eloquent's
     * `saved` event, so observer-based cache invalidation would never
     * fire for it and a cached count would silently go stale after the
     * first sale. Always query `remaining` live, never from this cache.
     */
    public static function cachedTierList(int $eventLegId)
    {
        return Cache::remember("event_leg:{$eventLegId}:tier_catalog", 3600, function () use ($eventLegId) {
            return static::where('event_leg_id', $eventLegId)
                ->get(['id', 'event_leg_id', 'name', 'price', 'starts_at', 'ends_at']);
        });
    }

    public static function forgetCachedTierList(int $eventLegId): void
    {
        Cache::forget("event_leg:{$eventLegId}:tier_catalog");
    }
}
