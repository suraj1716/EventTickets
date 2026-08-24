<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        if (!$this->resource) {
            return [];
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,

            'phone' => $this->vendor?->phone,
            'status' => $this->vendor?->status,

            'store_name' => $this->vendor?->store_name,
            'store_address' => $this->vendor?->store_address,
            'vendor_type' => $this->vendor?->vendor_type,
            'booking_fee' => $this->vendor?->booking_fee,

            'business_start_time' => $this->vendor?->business_start_time,
            'business_end_time' => $this->vendor?->business_end_time,
            'slot_interval_minutes' => $this->vendor?->slot_interval_minutes,
            'total_seats' => $this->vendor?->total_seats,

            'recurring_closed_days' => $this->vendor?->recurring_closed_days ?? [],
            'closed_dates' => $this->vendor?->closed_dates ?? [],

            'facebook_url' => $this->vendor?->facebook_url,
            'youtube_url' => $this->vendor?->youtube_url,
            'instagram_url' => $this->vendor?->instagram_url,
            'tiktok_url' => $this->vendor?->tiktok_url,
        ];
    }
}
