<?php

namespace App\Support;

use Closure;
use Spatie\Permission\PermissionRegistrar;

class PermissionTeams
{
    /**
     * Execute a callback using the specified vendor/team ID.
     *
     * The previous team ID is restored after the callback completes.
     */
    public static function asTeam(int|string|null $teamId, Closure $callback): mixed
    {
        $registrar = app(PermissionRegistrar::class);

        $previousTeamId = $registrar->getPermissionsTeamId();

        try {
            $registrar->setPermissionsTeamId($teamId);

            return $callback();
        } finally {
            $registrar->setPermissionsTeamId($previousTeamId);
        }
    }
}
