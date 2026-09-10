<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class EventMedia extends Model
{
    protected $fillable = ['event_id', 'type', 'path', 'mime_type', 'size', 'position'];

    protected $appends = ['url'];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function getUrlAttribute(): string
    {
        // If path already starts with http (e.g. already a full URL stored
        // in image_url column from old data) — return as-is
        if (str_starts_with($this->path, 'http')) {
            return $this->path;
        }

        // Resolve the disk via config (not env()) so it stays correct even
        // after `php artisan config:cache`, and lowercase it so a stray
        // MEDIA_DISK=R2 in production doesn't miss the registered 'r2' disk.
        $disk = strtolower(config('media-library.disk_name', 'public'));

        return Storage::disk($disk)->url($this->path);
    }
}
