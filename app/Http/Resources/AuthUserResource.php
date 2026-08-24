<?php

namespace App\Http\Resources;

use App\Enums\VendorStatusEnum;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthUserResource extends JsonResource
{

    public static $wrap = false;
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'name' => $this->name,
            'avatar' => $this->avatar, // from Google
            'permissions' => $this->getAllPermissions()->map(function ($permission) {
                return $permission->name;
            }),
            'roles' => $this->getRoleNames(),
            'stripe_account_active' => (bool)$this->stripe_account_active,
           'vendor' => !$this->vendor ? null : [
    'status' => $this->vendor->status,
    'status_label' => VendorStatusEnum::from($this->vendor->status)->label(),
    'store_name' => $this->vendor->store_name,
    'store_address' => $this->vendor->store_address,
    'phone' => $this->vendor->phone,
    'cover_image' => $this->vendor->cover_image,
    'vendor_type' => $this->vendor->vendor_type,
    'booking_fee' => $this->vendor->booking_fee,
    'total_seats' => $this->vendor->total_seats,
    'business_start_time' => $this->vendor->business_start_time,
    'business_end_time' => $this->vendor->business_end_time,
    'slot_interval_minutes' => $this->vendor->slot_interval_minutes,
    'recurring_closed_days' => $this->vendor->recurring_closed_days ?? [],
    'closed_dates' => $this->vendor->closed_dates ?? [],
    'facebook_url' => $this->vendor->facebook_url,
    'instagram_url' => $this->vendor->instagram_url,
    'youtube_url' => $this->vendor->youtube_url,
    'tiktok_url' => $this->vendor->tiktok_url,
],
        ];
    }
}
