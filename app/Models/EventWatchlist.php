<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventWatchlist extends Model
{
    use HasFactory;

    protected $table = 'event_watchlist';

    protected $fillable = [
        'event_id',
        'email',
        'user_id',
        'verified_at',
        'verification_token_hash',
        'verification_expires_at',
        'notified',
        'notified_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'verification_expires_at' => 'datetime',
        'notified' => 'boolean',
        'notified_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
