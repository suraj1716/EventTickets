<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class EventPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('events.view');
    }

    public function view(User $user, Event $event): bool
    {
        return $user->can('events.view') && $this->belongsToActiveTeam($user, $event);
    }

    public function create(User $user): bool
    {
        // No $event to check ownership against yet — the permission
        // itself is already team-scoped by SetPermissionsTeam, so having
        // it at all means "for the vendor I'm currently acting as".
        return $user->can('events.create');
    }

  public function update(User $user, Event $event): bool
{
    $teamId = app(\Spatie\Permission\PermissionRegistrar::class)
        ->getPermissionsTeamId();

    Log::info('EVENT UPDATE POLICY', [
        'user_id' => $user->id,
        'roles' => $user->getRoleNames()->toArray(),
        'permission' => $user->can('events.update'),
        'event_id' => $event->id,
        'event_vendor_user_id' => $event->vendor_user_id,
        'permissions_team_id' => $teamId,
    ]);

    return $user->can('events.update')
        && $this->belongsToActiveTeam($user, $event);
}

    public function delete(User $user, Event $event): bool
    {
        return $user->can('events.delete') && $this->belongsToActiveTeam($user, $event);
    }

    public function publish(User $user, Event $event): bool
    {
        return $user->can('events.publish') && $this->belongsToActiveTeam($user, $event);
    }

    public function manageMedia(User $user, Event $event): bool
    {
        return $user->can('events.manage-media') && $this->belongsToActiveTeam($user, $event);
    }

    /**
     * A vendor/staff permission (e.g. "events.update") is scoped by the
     * *currently active* team, but nothing stops someone from guessing
     * another vendor's event id and hitting the route. This is the check
     * that actually stops that: the event's owning vendor must match the
     * team the request is currently acting as.
     */
    protected function belongsToActiveTeam(User $user, Event $event): bool
    {
        $currentTeamId = app(\Spatie\Permission\PermissionRegistrar::class)
            ->getPermissionsTeamId();

        return $event->vendor_user_id === $currentTeamId;
    }
}
