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
        'image_url',
        'type',
        'status',
        'languages',
        'watchlist_enabled',
        'published_at',
    ];

    protected $casts = [
        'languages' => 'array',
        'watchlist_enabled' => 'boolean',
        'published_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Event $event) {
            $event->slug ??= static::uniqueSlug($event->name);
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
        return $this->hasMany(EventWatchlist::class);
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
}
