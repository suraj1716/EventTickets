<?php

namespace App\Models;

use App\Enums\RolesEnum;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class Venue extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by_user_id',
        'name',
        'address',
        'city',
        'state',
        'postcode',
        'country',
        'latitude',
        'longitude',
        'capacity',
        'seating_type',
        'contact_name',
        'contact_email',
        'contact_phone',
        'notes',
        'image_url',
        'is_active',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'is_active' => 'boolean',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Scopes venues to what the given user is allowed to see and pick
     * from — used both for the "Select venue" dropdown on the event form
     * and for the venue management list, so the rule lives in one place.
     *
     * - Admins see every venue, no restriction.
     * - Vendors (and staff acting for a vendor) see venues created by an
     *   Admin (shared, platform-provided venues) plus venues their own
     *   vendor team created. They do NOT see venues another vendor added
     *   — those are private to that vendor + Admin.
     *
     * Compares against actingVendorId(), not the raw user id, so a Staff
     * member acting for Vendor X sees exactly what Vendor X would see.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isAdmin()) {
            return $query;
        }

        $adminUserIds = DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_type', User::class)
            ->where('roles.name', RolesEnum::Admin->value)
            ->pluck('model_has_roles.model_id');

        $actingVendorId = $user->actingVendorId();

        return $query->where(function (Builder $q) use ($adminUserIds, $actingVendorId) {
            $q->whereIn('created_by_user_id', $adminUserIds);

            if ($actingVendorId !== null) {
                $q->orWhere('created_by_user_id', $actingVendorId);
            }
        });
    }

    public function sections(): HasMany
    {
        return $this->hasMany(VenueSection::class);
    }

    public function seats(): HasMany
    {
        return $this->hasMany(VenueSeat::class);
    }

    public function activeSections(): HasMany
    {
        return $this->hasMany(VenueSection::class)
            ->where('is_active', true)
            ->orderBy('sort_order');
    }
    public function eventLegs(): HasMany
    {
        return $this->hasMany(
            EventLeg::class,
            'venue_id'
        );
    }
    public function activeSeats(): HasMany
    {
        return $this->hasMany(VenueSeat::class)
            ->where('is_active', true);
    }

    /**
     * The venue's physical seating layout — sections and their seats.
     * This is structural data that only changes when an admin edits
     * the floor plan, so it's cached indefinitely and invalidated by
     * VenueSectionObserver / VenueSeatObserver on save/delete.
     *
     * Do NOT use this for live seat availability/status — that's
     * per-event data on EventSeat and must always be queried live.
     */
    public static function cachedLayout(int $venueId)
    {
        return Cache::rememberForever("venue:{$venueId}:layout", function () use ($venueId) {
            return self::with('sections.seats')->findOrFail($venueId);
        });
    }

    public static function forgetCachedLayout(int $venueId): void
    {
        Cache::forget("venue:{$venueId}:layout");
    }
}
