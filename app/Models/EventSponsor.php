<?php

namespace App\Models;

use App\Enums\SponsorTierEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class EventSponsor extends Model
{
    protected $fillable = [
        'event_id',
        'name',
        'logo_path',
        'tier',
        'website_url',
        'position',
    ];

    protected $casts = [
        'tier' => SponsorTierEnum::class,
        'position' => 'integer',
    ];

    protected $appends = ['logo_url', 'tier_label'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Same resolution rules as EventMedia::getUrlAttribute(): absolute URLs
     * pass through untouched, everything else resolves against the
     * configured media disk via config() (not env(), so it survives
     * `php artisan config:cache`) and lowercased (so MEDIA_DISK=R2 still
     * finds the registered 'r2' disk).
     */
    public function getLogoUrlAttribute(): ?string
    {
        $path = $this->logo_path;

        if (!$path) {
            return null;
        }

        if (str_starts_with($path, 'http')) {
            return $path;
        }

        $disk = strtolower(config('media-library.disk_name', 'public'));

        return Storage::disk($disk)->url($path);
    }

    public function getTierLabelAttribute(): string
    {
        return ($this->tier ?? SponsorTierEnum::OTHER)->label();
    }
}
