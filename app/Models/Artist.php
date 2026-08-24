<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Artist extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug'];

    protected static function booted(): void
    {
        static::creating(function (Artist $artist) {
            $artist->slug ??= Str::slug($artist->name);
        });
    }

    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class);
    }
}
