<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\EventSeat;
class Ticket extends Model
{
    use HasFactory;

 protected $fillable = [
    'order_id',
    'ticket_tier_id',
    'event_leg_id',
    'seat_id',
    'code',
    'qr_path',
    'barcode_path',
    'holder_name',
    'holder_email',
    'status',
    'scanned_at',
    'scanned_by',
];

    protected $casts = [
        'scanned_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
public function seat(): BelongsTo
{
    return $this->belongsTo(EventSeat::class);
}
    public function ticketTier(): BelongsTo
    {
        return $this->belongsTo(TicketTier::class);
    }

    public function eventLeg(): BelongsTo
    {
        return $this->belongsTo(EventLeg::class);
    }

    public function scannedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scanned_by');
    }

    public function isValid(): bool
    {
        return $this->status === 'valid';
    }

    /**
     * Mark as used. Returns false (does not throw) if already used/void,
     * so the controller can return a clean "already scanned" response
     * rather than a 500 on a duplicate scan.
     */
    public function markScanned(?int $scannedByUserId = null): bool
    {
        if (! $this->isValid()) {
            return false;
        }

        $this->update([
            'status' => 'used',
            'scanned_at' => now(),
            'scanned_by' => $scannedByUserId,
        ]);

        return true;
    }
}
