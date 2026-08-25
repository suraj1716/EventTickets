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
        return Storage::disk('public')->url($this->path);
    }
}
