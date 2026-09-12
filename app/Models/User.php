<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use SimonHamp\LaravelStripeConnect\Traits\Payable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles, Payable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'google_id',
        'avatar',
        'given_name',
        'family_name',
        'locale',
        'google_access_token',
        'google_refresh_token',
        'token_expires_at',
        'email_verified_at',
        'is_read',
        'stripe_account_active'
    ];



    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'token_expires_at' => 'datetime',
        ];
    }

    // public function vendor():HasOne
    // {
    //     return $this->hasOne(Vendor::class,'user_id');
    // }

    public function vendor(): HasOne
    {
        return $this->hasOne(Vendor::class, 'user_id', 'id');
    }

    /**
     * Staff members who work for this user, when this user is a vendor owner.
     */
    public function staffMembers(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(User::class, 'vendor_staff', 'vendor_id', 'staff_id')
            ->withPivot(['status'])
            ->withTimestamps();
    }

    /**
     * Vendors this user works for, when this user is staff.
     */
    public function vendors(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(User::class, 'vendor_staff', 'staff_id', 'vendor_id')
            ->withPivot(['status'])
            ->withTimestamps();
    }

    public function activeVendors(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->vendors()->wherePivot('status', 'active');
    }

    /**
     * True if this user holds $role under ANY team (or no team at all).
     *
     * Spatie's own hasRole() only checks the team currently active on
     * PermissionRegistrar, which isn't meaningful for "what kind of
     * account is this" — Admin/Vendor are assigned under team_id=null,
     * Staff is assigned per-vendor-team (see VendorStaffController::
     * suspend/reactivate/destroy), so a single active team can never
     * correctly answer this for all three. Query the pivot directly
     * instead of going through the currently-active team.
     */
    private function hasRoleInAnyTeam(string $role): bool
    {
        return DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_id', $this->id)
            ->where('model_has_roles.model_type', self::class)
            ->where('roles.name', $role)
            ->exists();
    }

    public function isAdmin(): bool
    {
        return $this->hasRoleInAnyTeam(\App\Enums\RolesEnum::Admin->value);
    }

    public function isVendorRole(): bool
    {
        return $this->hasRoleInAnyTeam(\App\Enums\RolesEnum::Vendor->value);
    }

    public function isStaffRole(): bool
    {
        return $this->hasRoleInAnyTeam(\App\Enums\RolesEnum::Staff->value);
    }

    /**
     * The vendor id this user is currently "acting as" for
     * ownership checks — themselves if they're a vendor, or whichever
     * vendor a staff member has selected (see SetActingVendor middleware).
     */
    public function actingVendorId(): ?int
    {
        if ($this->isVendorRole()) {
            return $this->id;
        }

        if ($this->isStaffRole()) {
            return session('acting_vendor_id');
        }

        return null;
    }

    public function shippingAddresses()
    {
        return $this->hasMany(ShippingAddress::class);
    }
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
