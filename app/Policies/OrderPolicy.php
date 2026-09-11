<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('orders.view');
    }

    /**
     * Two paths to viewing an order:
     *  - the customer who placed it (not part of the admin/vendor/staff
     *    RBAC at all — just an ownership check), or
     *  - a vendor/staff member with 'orders.view' whose active team owns
     *    the event the order is for.
     */
    public function view(User $user, Order $order): bool
    {
        if ($order->user_id === $user->id) {
            return true;
        }

        return $user->can('orders.view') && $this->belongsToActiveTeam($user, $order);
    }

    public function refund(User $user, Order $order): bool
    {
        return $user->can('orders.refund') && $this->belongsToActiveTeam($user, $order);
    }

    /**
     * Order -> Event -> vendor_user_id. Adjust the relation name
     * ('event') to match your actual Order model.
     */
    protected function belongsToActiveTeam(User $user, Order $order): bool
    {
        $currentTeamId = app(PermissionRegistrar::class)->getPermissionsTeamId();

        return $order->event->vendor_user_id === $currentTeamId;
    }
}
