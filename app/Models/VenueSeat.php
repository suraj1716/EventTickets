<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VenueSeat extends Model
{
    use HasFactory;

    protected $fillable = [
        'venue_id',
        'venue_section_id',
        'row_label',
        'seat_number',
        'label',
        'seat_type',
        'x',
        'y',
        'is_active',
    ];

    protected $casts = [
        'seat_number' => 'integer',
        'x' => 'decimal:3',
        'y' => 'decimal:3',
        'is_active' => 'boolean',
    ];

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(
            VenueSection::class,
            'venue_section_id'
        );
    }
}
