<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

class OrderResource extends JsonResource
{
    /**
     * The model associated with this resource.
     *
     * @var string
     */
    protected static string $model = \App\Models\Order::class;


    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return parent::toArray($request);
    }
 public static function getNavigationBadge(): ?string
{
    $user = Auth::user();

    $query = static::getModel()::where('is_read', false)
        ->where(function ($q) {
            $q->whereDoesntHave('booking') // No booking = order
              ->orWhereHas('booking', fn ($q) => $q->whereNull('booking_date')); // booking with null date = order
        });

    if (!$user->hasRole(\App\Enums\RolesEnum::Admin->value)) {
        $query->where('vendor_user_id', $user->id);
    }

    return (string) $query->count();
}


    public static function getNavigationBadgeColor(): string|array|null
    {
        return 'danger'; // red badge
    }
}
