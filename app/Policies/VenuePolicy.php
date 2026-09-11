<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Venue;

class VenuePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('venues.view');
    }

    public function view(User $user, Venue $venue): bool
    {
        // Venues can be shared platform-level records (created_by_user_id
        // null, e.g. "Sydney Opera House" reused across many vendors) or
        // a vendor's own private venue. Viewing a shared venue is always
        // fine if you have the base permission.
        return $user->can('venues.view');
    }

    public function create(User $user): bool
    {
        return $user->can('venues.create');
    }

    public function update(User $user, Venue $venue): bool
    {
        return $user->can('venues.update') && $this->ownsOrIsShared($user, $venue);
    }

    public function delete(User $user, Venue $venue): bool
    {
        return $user->can('venues.delete') && $this->ownsOrIsShared($user, $venue);
    }

    /**
     * Shared/platform venues (no creator) are managed by admins only —
     * Gate::before already lets admin through, so a non-admin only passes
     * this for a venue *they* created.
     */
    protected function ownsOrIsShared(User $user, Venue $venue): bool
    {
        if (is_null($venue->created_by_user_id)) {
            return false; // platform venue — admin-only, handled by Gate::before
        }

        $currentTeamId = app(\Spatie\Permission\PermissionRegistrar::class)
            ->getPermissionsTeamId();

        return $venue->created_by_user_id === $currentTeamId;
    }
}
