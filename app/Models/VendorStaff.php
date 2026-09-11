<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A staff member's membership on a vendor's team. vendor_id doubles as
 * the spatie permissions team id (see app/Support/PermissionTeams.php).
 *
 * status: invited -> active -> suspended (or removed entirely, which
 * deletes the row). Only 'active' rows count toward $user->activeVendors()
 * and therefore toward SetActingVendor/SetPermissionsTeam resolving this
 * as a vendor a staff member can act as.
 */
class VendorStaff extends Model
{
    use HasFactory;

    protected $table = 'vendor_staff';

    protected $fillable = [
        'vendor_id',
        'staff_id',
        'status',
        'invited_at',
        'joined_at',
    ];

    protected $casts = [
        'invited_at' => 'datetime',
        'joined_at' => 'datetime',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function scopeForVendor($query, int $vendorId)
    {
        return $query->where('vendor_id', $vendorId);
    }

    public function isInvited(): bool
    {
        return $this->status === 'invited';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
