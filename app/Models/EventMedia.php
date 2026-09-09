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
        // Use the MEDIA_DISK env var so local uses 'public'
        // and production uses 'r2' — same code, different .env
        $disk = env('MEDIA_DISK', 'public');

        // If path already starts with http (e.g. already a full URL stored
        // in image_url column from old data) — return as-is
        if (str_starts_with($this->path, 'http')) {
            return $this->path;
        }

        return Storage::disk($disk)->url($this->path);
    }
}
