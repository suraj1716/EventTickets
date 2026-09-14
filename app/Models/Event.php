<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Event extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'vendor_user_id',
        'name',
        'slug',
        'description',
        'type',
        'status',
        'languages',
        'watchlist_enabled',
        'published_at',
        'cancelled_at',
    ];

    protected $casts = [
        'languages' => 'array',
        'watchlist_enabled' => 'boolean',
        'published_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Event $event) {
            $event->slug ??= static::uniqueSlug($event->name);
        });

        static::updated(function (Event $event) {
            if (
                $event->wasChanged('status') &&
                $event->getOriginal('status') === 'proposed' &&
                $event->status === 'published'
            ) {
                app(\App\Services\EventWatchlistNotifier::class)
                    ->notify($event);
            }
        });
    }

public function media()
{
    return $this->hasMany(EventMedia::class)
        ->orderBy('position');
}

    public static function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (static::where('slug', $slug)->exists()) {
            $slug = "{$base}-" . ++$i;
        }

        return $slug;
    }

    public function vendor(): BelongsTo
    {
        // vendors.user_id is the primary key (not id) — mirrors how
        // Order::vendor() is keyed in the existing codebase.
        return $this->belongsTo(Vendor::class, 'vendor_user_id', 'user_id');
    }

    public function legs(): HasMany
    {
        return $this->hasMany(EventLeg::class)->orderBy('sequence');
    }

    /**
     * DB-level count of sold tickets, for the admin/browse listing pages.
     * Added so EventController::index() can use withCount() instead of
     * eager-loading every ticket row for every event on the page just
     * to count them in PHP — with a few hundred tickets per event and
     * 20 events on a page, that's thousands of rows shipped over the
     * wire and re-serialized purely to compute a single number.
     */
    public function tickets(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
    {
        return $this->hasManyThrough(Ticket::class, EventLeg::class);
    }

    public function artists(): BelongsToMany
    {
        return $this->belongsToMany(Artist::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }

   public function watchlist(): HasMany
{
    return $this->hasMany(EventWatchlist::class)
        ->whereNotNull('verified_at');
}

    public function watchlistCount(): int
    {
        return $this->watchlist()->count();
    }

    public function isTour(): bool
    {
        return $this->type === 'tour';
    }

    public function publish(): void
    {
        $this->update([
            'status' => 'published',
            'published_at' => now(),
        ]);
    }
    public function products(): HasMany
{
    return $this->hasMany(Product::class);
}

}
