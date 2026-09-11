<?php

namespace App\Policies;

use App\Models\TicketTier;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

class TicketTierPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('ticket-tiers.view');
    }

    public function view(User $user, TicketTier $ticketTier): bool
    {
        return $user->can('ticket-tiers.view') && $this->belongsToActiveTeam($user, $ticketTier);
    }

    public function create(User $user): bool
    {
        return $user->can('ticket-tiers.create');
    }

    public function update(User $user, TicketTier $ticketTier): bool
    {
        return $user->can('ticket-tiers.update') && $this->belongsToActiveTeam($user, $ticketTier);
    }

    public function delete(User $user, TicketTier $ticketTier): bool
    {
        return $user->can('ticket-tiers.delete') && $this->belongsToActiveTeam($user, $ticketTier);
    }

    /**
     * TicketTier -> EventLeg -> Event -> vendor_user_id.
     * Adjust the relation name ('eventLeg') if yours differs — the
     * seeder builds tiers via $leg->ticketTiers()->create(), so the
     * inverse is assumed to be TicketTier::eventLeg().
     */
    protected function belongsToActiveTeam(User $user, TicketTier $ticketTier): bool
    {
        $currentTeamId = app(PermissionRegistrar::class)->getPermissionsTeamId();

        return $ticketTier->eventLeg->event->vendor_user_id === $currentTeamId;
    }
}
