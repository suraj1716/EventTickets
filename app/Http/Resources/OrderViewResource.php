<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderViewResource extends JsonResource
{
    public static $wrap = false;

    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'total_price' => $this->total_price,
            'voucher_discount' => (float) ($this->voucher_discount ?? 0),
            'booking_fee' => (float) ($this->vendorUser->vendor->booking_fee ?? 0),
            'payment_method' => $this->payment_method,
            'booking_date' => optional($this->booking)->booking_date,
            'time_slot' => optional($this->booking)->time_slot,
            'refunded_at' => $this->refunded_at,
            'refund_amount' => $this->refund_amount,
            'refund_reason' => $this->refund_reason,
            'refunded_types' => $this->refunds->pluck('type'),
            'vendor' => [
                'user_id' => $this->vendor_user_id,
                'id' => $this->vendorUser->vendor->id ?? null,
                'name' => $this->vendorUser->name ?? '',
                'store_name' => $this->vendorUser->vendor->store_name ?? '',
                'store_address' => $this->vendorUser->vendor->store_address ?? '',
                'vendor_type' => $this->vendorUser->vendor->vendor_type?->value ?? '',
            ],

            'orderItems' => $this->orderItems->map(function ($item) {
                $variationOptionIds = is_string($item->variation_type_option_ids)
                    ? json_decode($item->variation_type_option_ids, true)
                    : $item->variation_type_option_ids;

                $variations = [];

                if ($item->product && $item->product->variationTypes) {
                    foreach ($item->product->variationTypes as $variationType) {
                        $selectedOptionId = $variationOptionIds[$variationType->id] ?? null;

                        if ($selectedOptionId) {
                            $selectedOption = $variationType->options->firstWhere('id', $selectedOptionId);
                            if ($selectedOption) {
                                $variations[] = [
                                    'type' => $variationType->name,
                                    'option' => $selectedOption->name,
                                    'image' => $selectedOption->image ? asset('storage/' . $selectedOption->image) : null,
                                ];
                            }
                        }
                    }
                }

                return [
                    'booking' => $this->booking ? [
                        'id' => $this->booking->id,
                        'booking_date' => $this->booking->booking_date,
                        'time_slot' => $this->booking->time_slot,
                        'edited_at' => $this->booking->edited_at,
                        'staff' => $this->booking->staff ? [
                            'id' => $this->booking->staff->id,
                            'name' => $this->booking->staff->name,
                        ] : null,
                    ] : null,

                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'variation_summary' => $variations,
                    'attachment_name' => $item->attachment_name,
                    'attachment_path' => $item->attachment_path,

                    'product' => $item->product ? [
                        'id'    => $item->product->id,
                        'title' => $item->product->title,
                        'image' => $item->product->getImageForOptions($variationOptionIds ?: []),
                        'slug'  => $item->product->slug,
                    ] : ($item->gift_card_template_id ? [
                        'id'    => null,
                        'title' => 'Gift Card',
                        'image' => null,
                        'slug'  => null,
                    ] : null),

                   'ticket_tier' => $item->ticketTier ? [
    'id'          => $item->ticketTier->id,
    'name'        => $item->ticketTier->name,
    'event_name'  => $item->ticketTier->eventLeg->event->name ?? null,
    'venue_name'  => $item->ticketTier->eventLeg->venue_name ?? null,
    'event_date'  => $item->ticketTier->eventLeg->event_date ?? null,
    'event_image' => $item->ticketTier->eventLeg->event->media->first()?->url,
] : null,

                    'seats' => !empty($item->seat_ids)
                        ? \App\Models\EventSeat::whereIn('id', $item->seat_ids)
                            ->get()
                            ->map(fn ($seat) => [
                                'id'        => $seat->id,
                                'label'     => $seat->label,
                                'row_label' => $seat->row_label,
                            ])
                        : [],

                    'vouchers' => $item->gift_card_template_id
                        ? \App\Models\Voucher::where('stripe_session_id', $this->stripe_session_id)
                            ->get()
                            ->map(fn($v) => [
                                'code'             => $v->code,
                                'amount'           => $v->amount,
                                'remaining_amount' => $v->remaining_amount,
                                'expires_at'       => $v->expires_at?->toDateString(),
                                'gifted_to_email'  => $v->gifted_to_email,
                                'active'           => $v->active,
                            ])
                        : [],
                ];
            }),
        ];
    }
}
