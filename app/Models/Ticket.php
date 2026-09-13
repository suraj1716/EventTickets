<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\EventSeat;
use Illuminate\Support\Facades\Storage;

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
    'voided_at',
    'voided_by',
    'void_reason',
];

    protected $casts = [
        'scanned_at' => 'datetime',
        'voided_at' => 'datetime',
    ];

    protected $appends = [
        'qr_url',
        'barcode_url',
    ];

    /**
     * Resolves via config (not env()) so it stays correct even after
     * config:cache, and lowercased so a stray-cased MEDIA_DISK env
     * var doesn't miss the registered disk key — same fix applied
     * to EventMedia::getUrlAttribute().
     */
    protected function resolveMediaDisk(): string
    {
        return strtolower(config('media-library.disk_name', 'public'));
    }

    public function getQrUrlAttribute(): ?string
    {
        if (! $this->qr_path) {
            return null;
        }

        if (str_starts_with($this->qr_path, 'http')) {
            return $this->qr_path;
        }

        return Storage::disk($this->resolveMediaDisk())->url($this->qr_path);
    }

    public function getBarcodeUrlAttribute(): ?string
    {
        if (! $this->barcode_path) {
            return null;
        }

        if (str_starts_with($this->barcode_path, 'http')) {
            return $this->barcode_path;
        }

        return Storage::disk($this->resolveMediaDisk())->url($this->barcode_path);
    }

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

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
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

    /**
     * Corrective action for a mis-scan (wrong ticket tapped, staff error).
     * Only reverses a 'used' ticket back to 'valid' — never touches a
     * voided ticket, since voiding is a deliberate revoke, not a mistake
     * to undo. Clears the scan record entirely rather than leaving a
     * stale scanned_at/scanned_by that no longer reflects reality.
     */
    public function undoScan(): bool
    {
        if ($this->status !== 'used') {
            return false;
        }

        $this->update([
            'status' => 'valid',
            'scanned_at' => null,
            'scanned_by' => null,
        ]);

        return true;
    }

    /**
     * Manual check-in for when scanning isn't possible (dead phone,
     * unreadable code, printed ticket). Same end state as a real scan —
     * deliberately routed through markScanned() so there's exactly one
     * place that flips a ticket to 'used'.
     */
    public function checkInManually(?int $staffUserId = null): bool
    {
        return $this->markScanned($staffUserId);
    }

    /**
     * Revoke a ticket outright (fraud, refund, chargeback). Distinct from
     * undoScan(): this is adversarial/permanent, not corrective — a voided
     * ticket must never scan valid again, regardless of its prior status.
     */
    public function voidTicket(?int $voidedByUserId = null, ?string $reason = null): bool
    {
        if ($this->status === 'void') {
            return false;
        }

        $this->update([
            'status' => 'void',
            'voided_at' => now(),
            'voided_by' => $voidedByUserId,
            'void_reason' => $reason,
        ]);

        return true;
    }
}
