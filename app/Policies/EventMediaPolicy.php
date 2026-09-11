<?php

namespace App\Policies;

use App\Models\EventMedia;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

class EventMediaPolicy
{
    /**
     * There's no separate 'media.*' permission group — media is managed
     * as part of an event via 'events.manage-media', since it's always
     * created/deleted in the context of an Event.
     */
    public function view(User $user, EventMedia $media): bool
    {
        return $user->can('events.view') && $this->belongsToActiveTeam($user, $media);
    }

    public function create(User $user): bool
    {
        return $user->can('events.manage-media');
    }

    public function update(User $user, EventMedia $media): bool
    {
        return $user->can('events.manage-media') && $this->belongsToActiveTeam($user, $media);
    }

    public function delete(User $user, EventMedia $media): bool
    {
        return $user->can('events.manage-media') && $this->belongsToActiveTeam($user, $media);
    }

    /**
     * EventMedia -> Event -> vendor_user_id. Adjust the relation name
     * ('event') if your EventMedia model calls it something else.
     */
    protected function belongsToActiveTeam(User $user, EventMedia $media): bool
    {
        $currentTeamId = app(PermissionRegistrar::class)->getPermissionsTeamId();

        return $media->event->vendor_user_id === $currentTeamId;
    }
}
