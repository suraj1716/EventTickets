<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VendorStaff;

class VendorStaffPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('staff.view');
    }

    /**
     * @param  int  $vendorId  The vendor whose team is being invited into.
     */
    public function create(User $user, int $vendorId): bool
    {
        return $user->can('staff.invite') && $this->ownsVendor($user, $vendorId);
    }

    public function update(User $user, VendorStaff $vendorStaff): bool
    {
        return $user->can('staff.update') && $this->ownsVendor($user, $vendorStaff->vendor_id);
    }

    public function delete(User $user, VendorStaff $vendorStaff): bool
    {
        return $user->can('staff.remove') && $this->ownsVendor($user, $vendorStaff->vendor_id);
    }

    /**
     * A vendor can only manage their own team. (Admin never reaches this
     * check — Gate::before short-circuits Admin in AppServiceProvider.)
     */
    protected function ownsVendor(User $user, int $vendorId): bool
    {
        return $user->actingVendorId() === $vendorId;
    }
}
