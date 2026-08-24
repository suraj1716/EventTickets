<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Models\Vendor;
use App\Models\ShippingAddress;
use App\Models\ProductVariation;
use Illuminate\Database\Seeder;

class OrderAndBookingSeeder extends Seeder
{
    public function run(): void
    {
        $vendorUser = User::where('email', 'info@rbhairlounge.com.au')->first();
        $customers  = User::whereHas('roles', fn($q) => $q->where('name', 'User'))->get();
        $products   = Product::where('status', 'published')
                             ->where('created_by', $vendorUser->id)
                             ->get();

        if ($products->isEmpty() || $customers->isEmpty()) {
            $this->command->warn('No products or customers found. Run ProductSeeder and CustomerSeeder first.');
            return;
        }

        // We'll spread bookings across next 14 days, Mon–Fri, realistic time slots
        $slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

        $usedSlots = []; // track [date => [slot, ...]] to avoid double booking

        $bookingDate = now()->addDay()->startOfDay();

        foreach ($customers as $customerIndex => $customer) {
            // Each customer gets 2 bookings / orders
            for ($i = 0; $i < 2; $i++) {

                // Pick a weekday (skip Sat/Sun, matching recurring_closed_days)
                $date = clone $bookingDate;
                $date->addDays($customerIndex * 3 + $i * 1);
                while (in_array($date->dayOfWeek, [0, 6])) {
                    $date->addDay();
                }
                $dateStr = $date->format('Y-m-d');

                // Pick a time slot not yet used on this date
                $availableSlots = array_diff($slots, $usedSlots[$dateStr] ?? []);
                if (empty($availableSlots)) {
                    continue; // day full, skip
                }
                $slot = array_values($availableSlots)[array_rand(array_values($availableSlots))];
                $usedSlots[$dateStr][] = $slot;

                // Pick a product
                $product = $products->random();

                // Find first variation for this product (if any)
                $variation = ProductVariation::where('product_id', $product->id)->first();
                $price     = $variation ? $variation->price : $product->price;
                $optionIds = $variation ? $variation->variation_type_option_ids : null;

                $bookingFee  = 20.00;
                $totalPrice  = $price + $bookingFee;
                $commission  = round($totalPrice * 0.05, 4); // 5% platform commission
                $vendorTotal = round($totalPrice - $commission, 4);

                // Determine order status — vary across seed data
                $statuses = ['paid', 'paid', 'paid', 'draft', 'cancelled'];
                $status   = $statuses[($customerIndex + $i) % count($statuses)];
                $isPaid   = in_array($status, ['paid']);

                // ── Order ──────────────────────────────────────
                $order = Order::create([
                    'user_id'                  => $customer->id,
                    'vendor_user_id'           => $vendorUser->id,
                    'total_price'              => $totalPrice,
                    'booking_fee'              => $bookingFee,
                    'status'                   => $status,
                    'payment_method'           => 'stripe',
                    'is_paid'                  => $isPaid,
                    'is_manual'                => false,
                    'discount_amount'          => 0.00,
                    'online_payment_comission' => $commission,
                    'website_payment_comission'=> 0,
                    'vendor_subtotal'          => $vendorTotal,
                    'stripe_session_id'        => $isPaid ? 'cs_test_seed_' . uniqid() : null,
                    'payment_intent'           => $isPaid ? 'pi_test_seed_' . uniqid() : null,
                    'is_read'                  => false,
                ]);

                // ── Order Item ─────────────────────────────────
                OrderItem::create([
                    'order_id'                 => $order->id,
                    'product_id'               => $product->id,
                    'price'                    => $price,
                    'quantity'                 => 1,
                    'variation_type_option_ids'=> $optionIds ? json_encode($optionIds) : null,
                    'designer'                 => false,
                ]);

                // ── Booking ────────────────────────────────────
                // Only create booking if order is paid or draft (not cancelled)
                if ($status !== 'cancelled') {
                    Booking::create([
                        'order_id'    => $order->id,
                        'user_id'     => $customer->id,
                        'booking_date'=> $dateStr,
                        'time_slot'   => $slot,
                        'is_read'     => false,
                        'booking_fee_refunded'     => false,
                        'booking_fee_refund_amount'=> null,
                    ]);
                }
            }
        }
    }
}
