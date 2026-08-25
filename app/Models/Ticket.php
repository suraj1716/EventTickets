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
    'owner_user_id',
    'ticket_tier_id',
    'event_leg_id',
    'seat_id',
    'code',
    'qr_path',
    'barcode_path',
    'holder_name',
    'holder_email',
    'status',
    'times_resold',
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

    // Current holder. Distinct from order->user_id, which stays pointed
    // at whoever originally bought it, forever — owner_user_id is the
    // one that changes on a resale transfer.
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function resaleListings(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(TicketResaleListing::class);
    }

    public function activeResaleListing(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(TicketResaleListing::class)->where('status', 'active');
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

    public function isListedForResale(): bool
    {
        return $this->status === 'listed';
    }

    public function neverResold(): bool
    {
        return $this->times_resold === 0;
    }

    /**
     * Badge state for the ticket display page / public verify page.
     * Deliberately just three states — the actual anti-fraud work
     * happens in TicketResaleService, this is only presentation.
     */
    public function resaleBadge(): string
    {
        return match (true) {
            $this->status === 'listed' => 'listed_for_resale',
            $this->times_resold > 0 => 'verified_resold',
            default => 'verified_original',
        };
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
