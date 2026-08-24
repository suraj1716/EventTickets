<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payout extends Model
{
    protected $fillable = [
        'vendor_id',
        'amount',
        'starting_from',
        'until',
    ];

    protected $casts = [
        'starting_from' => 'date',
        'until'         => 'date',
        'amount'        => 'decimal:2',
    ];

    public function vendor()
    {
        // Vendor's primary key is user_id, not id.
        return $this->belongsTo(Vendor::class, 'vendor_id', 'user_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
