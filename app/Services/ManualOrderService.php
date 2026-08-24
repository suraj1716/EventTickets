<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Booking;
use App\Services\GoogleCalendarService;
use App\Enums\VendorType;
use App\Enums\OrderStatusEnum;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ManualOrderService
{
    public static function create(array $data): Order
    {
        // Optional: validate again in service (normally done in controller)
        $validated = validator($data, [
            'user_id' => ['required', 'exists:users,id'],
            'vendor_id' => ['required', 'exists:users,id'],
            'items' => ['required', 'array'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['required', 'numeric'],
            'items.*.variation_option_ids' => ['nullable', 'array'],
            'items.*.attachment_path' => ['nullable'],
            'items.*.attachment_name' => ['nullable'],
            'items.*.designer' => ['nullable', 'boolean'],
            'shipping_address_id' => ['nullable', 'exists:shipping_addresses,id'],
        ])->validate();

        DB::beginTransaction();

        try {
            $user = \App\Models\User::findOrFail($validated['user_id']);
            $vendor = \App\Models\User::findOrFail($validated['vendor_id']);
            $items = $validated['items'];

            $latestBooking = Booking::where('user_id', $user->id)
                ->whereNull('order_id')
                ->latest()
                ->first();

            $hasBooking = !is_null($latestBooking);

            $bookingFee = 0;
            if (
                $hasBooking &&
                $vendor->vendor_type->value === VendorType::APPOINTMENT->value
            ) {
                $bookingFee = floatval($vendor->booking_fee ?? 0);
            }

            $totalItemPrice = collect($items)->sum(fn($item) => $item['price'] * $item['quantity']);
            $totalPrice = $totalItemPrice + $bookingFee;

            $order = Order::create([
                'user_id' => $user->id,
                'vendor_user_id' => $vendor->id,
                'total_price' => $totalPrice,
                'booking_fee' => $bookingFee,
                'status' => OrderStatusEnum::Draft->value,
                'shipping_address_id' => $validated['shipping_address_id'] ?? null,
                'online_payment_comission' => 0,
                'website_payment_comission' => round($totalPrice * 0.08, 4),
                'vendor_subtotal' => round($totalPrice * 0.92, 4),
            ]);

            foreach ($items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                   'variation_type_option_ids' => $item['variation_type_option_ids'] ?? [],
                    'attachment_path' => $item['attachment_path'] ?? null,
                    'attachment_name' => $item['attachment_name'] ?? null,
                    'designer' => $item['designer'] ?? false,
                ]);

            }

            if ($hasBooking && $vendor->vendor_type->value === VendorType::APPOINTMENT->value) {
                $latestBooking->order_id = $order->id;

                if ($user->google_access_token) {
                    $googleService = new GoogleCalendarService(
                        ['access_token' => $user->google_access_token],
                        $user->google_refresh_token
                    );

                    try {
                        $start = new \DateTime($latestBooking->booking_date . ' ' . explode(' - ', $latestBooking->time_slot)[0]);
                        $end = new \DateTime($latestBooking->booking_date . ' ' . explode(' - ', $latestBooking->time_slot)[1]);

                        $googleEvent = $googleService->createEvent(
                            'Booking Appointment',
                            "Booking ID: {$latestBooking->id}",
                            $start->format(\DateTime::RFC3339),
                            $end->format(\DateTime::RFC3339),
                            'Australia/Sydney',
                            null,
                            null,
                            ['admin@gmail.com'],
                            [
                                ['method' => 'popup', 'minutes' => 180],
                                ['method' => 'popup', 'minutes' => 60],
                            ]
                        );

                        $latestBooking->google_event_id = $googleEvent->id;

                        if ($googleService->newAccessToken) {
                            $user->google_access_token = $googleService->newAccessToken;
                            $user->save();
                        }
                    } catch (\Exception $e) {
                        DB::rollBack();
                        Log::error("Manual booking Google calendar sync failed: " . $e->getMessage());
                        throw new \Exception('Google Calendar sync failed.');
                    }
                }

                $latestBooking->save();
            }

            DB::commit();

            return $order->load('orderItems');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Manual checkout failed: " . $e->getMessage());
            throw $e;
        }
    }
}
