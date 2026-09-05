<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatusEnum;
use App\Enums\RolesEnum;
use App\Enums\VendorType;
use App\Http\Resources\OrderViewResource;
use App\Models\Booking;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ShippingAddress;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use App\Notifications\NewOrderNotification;
use App\Services\CartService;
use App\Services\StripeCheckoutService;
use App\Services\CartService as ServicesCartService;
use App\Services\GoogleCalendarService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

use App\Mail\NewOrderMail;
use App\Mail\CheckoutCompleted;


class CartController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(CartService $cartService, Request $request)
    {
        $user = Auth::user();
        $userId = $user ? $user->id : null;

        $cartItems = CartItem::with('product.vendor')->where('user_id', $userId)->get();


        $appointmentVendorIds = $cartItems
            ->pluck('product.vendor')            // Get vendor from each cart item's product
            ->filter(fn($vendor) => $vendor !== null && $vendor->vendor_type->value === VendorType::APPOINTMENT->value)
            ->pluck('user_id')                   // Get the user_id of vendor (which is vendor's primary key)
            ->unique()                          // Unique vendor IDs
            ->values();



        if ($user) {
            $shippingAddresses = ShippingAddress::where('user_id', $user->id)
                ->get();
        } else {
            $shippingAddresses = [];
        }

        $hasEcommerceVendor = false;
        if ($user) {
            $hasEcommerceVendor = CartItem::where('user_id', $user->id)
                ->whereHas('product.user.vendor', function ($query) {
                    $query->where('vendor_type', 'ecommerce');
                })
                ->exists();
        }

        $hasAppointmentVendor = false;
        if ($user) {
            $hasAppointmentVendor = CartItem::where('user_id', $user->id)
                ->whereHas('product.user.vendor', function ($query) {
                    $query->where('vendor_type', 'appointment');
                })
                ->exists();
        }

        return Inertia::render('Cart/Index', [
            'cartItems' => $cartService->getCartItemsGrouped(),
            'totalQuantity' => $cartService->getTotalQuantity(),
            'totalPrice' => $cartService->getTotalPrice(),
            'shippingAddresses' => $shippingAddresses,
            'showShippingForm' => $hasEcommerceVendor,  // <-- new prop
            'showBookingWidget' => $hasAppointmentVendor,
            'csrf_token' => csrf_token(),
            'vendorId' => $appointmentVendorIds,
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Product $product, CartService $cartService)
    {
        $optionIds = $request->input('option_ids');

        if (is_array($optionIds)) {
            ksort($optionIds);
        }

        // Set default quantity if not provided
        $request->mergeIfMissing(['quantity' => 1]);

        $data = $request->validate([
            'option_ids' => ['nullable', 'array'],
            'quantity' => 'required|integer|min:1',
            'designer' => 'nullable|boolean', // ✅ validate it
        ]);

        // ✅ Explicitly get the boolean value
        $designer = $request->boolean('designer', false);

        $cartService->addItemToCart(
            $product,
            $data['quantity'],
            $data['option_ids'] ?? [],
            $designer // ✅ pass it here
        );

        return back()->with('success', 'Product added to cart successfully.');
    }



    public function update(Request $request, Product $product, CartService $cartService)
    {
        $request->validate([
            'quantity' => ['integer', 'min:1'],
            'attachment_path' => ['nullable', 'string'], // validate attachment path if passed as string
        ]);

        $optionIds = $request->input('option_ids');
        $quantity = $request->input('quantity');
        $attachmentPath = $request->input('attachment_path'); // get attachment from request

        $cartService->updateItemQuantity($product->id, $quantity, $optionIds, $attachmentPath);

        return back()->with('success', 'Product quantity and attachment updated successfully.');
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Product $product, CartService $cartService)
    {
        $optionIds = $request->input('option_ids');
        $cartService->removeItemFromCart($product->id, $optionIds);

        return back()->with('success', 'Product removed from cart successfully.');
    }

    public function checkout(Request $request, CartService $cartService, StripeCheckoutService $stripeCheckoutService)
    {
        Log::info('Checkout hit', [
            'user_id'    => $request->user()?->id,
            'voucher_id' => $request->input('voucher_id'),
            'cart_count' => count($cartService->getCartItemsGrouped()),
        ]);
        $request->validate([
            'vendor_id' => ['nullable', 'integer'],
            'shipping_address_id' => ['nullable', 'exists:shipping_addresses,id'],
            'voucher_id' => ['nullable', 'exists:vouchers,id'],
        ]);


        $user = $request->user();
        $vendorId = $request->input('vendor_id');
        $shippingAddressId = $request->input('shipping_address_id');
        $voucherId = $request->input('voucher_id');

        $shippingAddress = $shippingAddressId
            ? ShippingAddress::where('id', $shippingAddressId)
            ->where('user_id', $user->id)
            ->first()
            : null;

        $latestBooking = Booking::where('user_id', $user->id)
            ->whereNull('order_id')
            ->latest()
            ->first();

        $hasBooking = !is_null($latestBooking);

        $cartItemIds = $request->input('cart_item_ids');

        $allCartItems = $cartItemIds
            ? $cartService->getCartItemsGrouped($cartItemIds)
            : ($request->boolean('ticket_checkout')
                ? $cartService->getTicketCartItemsGrouped()
                : $cartService->getCartItemsGrouped());
        // CHECKPOINT 5 — what checkout() reads back
        Log::info('CHECKPOINT 5 - CHECKOUT READ', [
            'vendor_id_requested' => $vendorId,
            'available_keys' => array_keys($allCartItems),
            'full_items' => $allCartItems,
        ]);
        if ($vendorId && ! array_key_exists($vendorId, $allCartItems)) {
            return back()->withErrors(['error' => 'Your cart is empty.']);
        }

        $checkoutCartItems = $vendorId
            ? [$allCartItems[$vendorId]]
            : $allCartItems;
        foreach ($allCartItems as &$group) {
            if (is_null($group['vendor'])) {
                $group['vendor'] = $group['user'];
            }
        }

        // Only own the transaction when the caller does not already
        // have one (e.g. Laravel's RefreshDatabase test transaction).
        // ── Void any abandoned draft order(s) for this same
        //    user+vendor before creating a new one. Without this,
        //    every retry (back, reselect, confirm again) left the
        //    previous draft order and its Stripe session alive
        //    forever. ──
        $staleOrdersQuery = Order::where("user_id", $user->id)
            ->where("status", OrderStatusEnum::Draft->value);

        if ($vendorId) {
            $staleOrdersQuery->where("vendor_user_id", $vendorId);
        }

        $staleOrders = $staleOrdersQuery->get();

        if ($staleOrders->isNotEmpty()) {
            \Stripe\Stripe::setApiKey(config("services.stripe.secret"));

                       foreach ($staleOrders as $staleOrder) {
                if ($staleOrder->stripe_session_id) {
                    try {
                        \Stripe\Checkout\Session::retrieve($staleOrder->stripe_session_id)->expire();
                    } catch (\Exception $e) {
                        Log::warning("Failed to expire stale Stripe session", [
                            "order_id" => $staleOrder->id,
                            "error" => $e->getMessage(),
                        ]);
                    }
                }

                // Release any seats this abandoned draft was holding before
                // deleting its order items — otherwise the EventSeat rows
                // stay 'reserved' forever with nothing left to track or
                // release them (the order/order-items that referenced them
                // are gone). A Draft order was never fulfilled, so any seat
                // it references is still ours to release; only skip ones a
                // concurrent process has already sold.
                $staleSeatIds = $staleOrder->orderItems
                    ->flatMap(fn($item) => $item->seat_ids ?? [])
                    ->filter()
                    ->unique()
                    ->values();

                if ($staleSeatIds->isNotEmpty()) {
                    \App\Models\EventSeat::whereIn('id', $staleSeatIds)
                        ->where('status', 'reserved')
                        ->update(['status' => 'available']);
                }

                $staleOrder->orderItems()->delete();
                $staleOrder->delete();
            }
        }


        $ownsTransaction = DB::transactionLevel() === 0;

        if ($ownsTransaction) {
            DB::beginTransaction();
        }

        try {
            $checkoutCartItems = $vendorId ? [$allCartItems[$vendorId]] : $allCartItems;

            // ── Lock + validate voucher up front (before creating anything) ──
            $voucher = null;
            if ($voucherId) {
                $voucher = Voucher::lockForUpdate()->find($voucherId);
                if (!$voucher || !$voucher->isUsable()) {
                    if ($ownsTransaction) {
                        if ($ownsTransaction) {
                            DB::rollBack();
                        }
                    }
                    return back()->withErrors(['error' => 'Voucher is no longer valid.']);
                }
            }

            // ── First pass: build each order's raw (pre-discount) totals ──
            $orderBuildData = [];
            $combinedTotal = 0;

            foreach ($checkoutCartItems as $item) {
                $vendor = $item['vendor'];
                $cartItems = $item['items'];

                $bookingFee = 0;
                $isAppointmentVendor = $vendor &&
                    $vendor['vendor_type'] instanceof VendorType &&
                    $vendor['vendor_type']->value === VendorType::APPOINTMENT->value;

                if ($hasBooking && $isAppointmentVendor && !empty($orderBuildData) === false) {
                    // booking fee only ever attaches to the first eligible vendor order;
                    // resolved properly in the loop below via $bookingLinked
                }

                $orderBuildData[] = [
                    'vendor' => $vendor,
                    'cartItems' => $cartItems,
                    'isAppointmentVendor' => $isAppointmentVendor,
                ];
            }

            // Determine booking fee placement (first appointment vendor, same as before)
            $bookingLinked = false;
            foreach ($orderBuildData as &$data) {
                $bookingFee = 0;
                if ($hasBooking && $data['isAppointmentVendor'] && !$bookingLinked) {
                    $bookingFee = floatval($data['vendor']['booking_fee'] ?? 0);
                    $bookingLinked = true;
                }
                $itemsTotal = collect($data['cartItems'])->sum(fn($ci) => $ci['quantity'] * $ci['price']);
                $data['bookingFee'] = $bookingFee;
                $data['rawTotal'] = $itemsTotal + $bookingFee;
                $combinedTotal += $data['rawTotal'];
            }
            unset($data);

            // ── Calculate voucher discount against the combined total ──
            $discountToApply = $voucher ? $voucher->discountFor($combinedTotal) : 0;
            $discountToApply = min($discountToApply, $combinedTotal);

            // ── Second pass: create orders + line items with discount distributed proportionally ──
            $orders = [];
            $lineItems = [];
            $bookingLinked = false;
            $discountRemaining = $discountToApply;
            $orderCount = count($orderBuildData);
            $i = 0;

            foreach ($orderBuildData as $data) {
                $i++;
                $vendor = $data['vendor'];
                $cartItems = $data['cartItems'];
                $bookingFee = $data['bookingFee'];
                $rawTotal = $data['rawTotal'];
                $isAppointmentVendor = $data['isAppointmentVendor'];

                // Proportional share of the discount for this order.
                // Last order absorbs any rounding remainder so totals reconcile exactly.
                if ($combinedTotal > 0 && $discountToApply > 0) {
                    $orderDiscount = $i === $orderCount
                        ? round($discountRemaining, 2)
                        : round(($rawTotal / $combinedTotal) * $discountToApply, 2);
                } else {
                    $orderDiscount = 0;
                }
                $orderDiscount = min($orderDiscount, $rawTotal);
                $discountRemaining = round($discountRemaining - $orderDiscount, 2);

                $totalPrice = round($rawTotal - $orderDiscount, 2);

                $onlineFee = round(($totalPrice * 0.029) + 0.30, 4);
                $platformFeePercent = config('app.platform_fee_pct');
                $platformFee = round($totalPrice * ($platformFeePercent / 100), 4);
                $vendorSubtotal = round($totalPrice - $onlineFee - $platformFee, 4);

                $order = Order::create([
                    'stripe_session_id' => null,
                    'user_id' => $user->id,
                    'vendor_user_id' => $vendor['id'],
                    'staff_id' => ($hasBooking && $isAppointmentVendor && !$bookingLinked)
                        ? $latestBooking->staff_id
                        : null,
                    'total_price' => $totalPrice,
                    'booking_fee' => $bookingFee,
                    'voucher_discount' => $orderDiscount,
                    'status' => $totalPrice <= 0 ? OrderStatusEnum::Paid->value : OrderStatusEnum::Draft->value,
                    'shipping_address_id' => optional($shippingAddress)->id,
                    'online_payment_comission' => $onlineFee,
                    'website_payment_comission' => $platformFee,
                    'vendor_subtotal' => $vendorSubtotal,
                    'voucher_id' => $voucher?->id,
                ]);
                Log::info('ORDER CREATED', [
                    'order_id' => $order->id,
                    'buyer_id' => $order->user_id,
                    'vendor_id' => $order->vendor_user_id,
                ]);
                $orders[] = $order;

                if ($hasBooking && $isAppointmentVendor && !$bookingLinked) {
                    $latestBooking->order_id = $order->id;
                    $latestBooking->save();
                    $bookingLinked = true;

                    if ($user->google_access_token) {
                        $googleService = new GoogleCalendarService(
                            ['access_token' => $user->google_access_token],
                            $user->google_refresh_token
                        );

                        try {
                            $bookingDateStr = \Carbon\Carbon::parse($latestBooking->booking_date)->format('Y-m-d');
                            $startDateTime  = (new \DateTime($bookingDateStr . ' ' . explode(' - ', $latestBooking->time_slot)[0]))->format(\DateTime::RFC3339);
                            $endDateTime    = (new \DateTime($bookingDateStr . ' ' . explode(' - ', $latestBooking->time_slot)[1]))->format(\DateTime::RFC3339);
                            $vendorEmail = $vendor['email'] ?? null;

                            $googleEvent = $googleService->createEvent(
                                'Booking Appointment',
                                "Booking ID: {$latestBooking->id}",
                                $startDateTime,
                                $endDateTime,
                                'Australia/Sydney',
                                null,
                                null,
                                $vendorEmail ? [$vendorEmail] : [],
                                [
                                    ['method' => 'popup', 'minutes' => 180],
                                    ['method' => 'popup', 'minutes' => 60],
                                ]
                            );

                            $latestBooking->google_event_id = $googleEvent->id;
                            $latestBooking->save();

                            if ($googleService->newAccessToken) {
                                $user->google_access_token = $googleService->newAccessToken;
                                $user->save();
                            }
                        } catch (\Exception $e) {
                            if ($ownsTransaction) {
                                if ($ownsTransaction) {
                                    DB::rollBack();
                                }
                            }
                            return redirect()->back()->with('error', 'Google Calendar sync failed: ' . $e->getMessage());
                        }
                    }
                }

                foreach ($cartItems as $cartItem) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $cartItem['product_id'],
                        'ticket_tier_id' => $cartItem['ticket_tier_id'] ?? null,
                        'quantity' => $cartItem['quantity'],
                        'price' => $cartItem['price'],
                        'variation_type_option_ids' => $cartItem['option_ids'],
                        'attachment_path' => $cartItem['attachment_path'] ?? null,
                        'attachment_name' => $cartItem['attachment_name'] ?? null,
                        'designer' => $cartItem['designer'] ?? false,
                        'seat_ids' => $cartItem['seat_ids'] ?? null,
                    ]);
                }

                // ── Build this order's Stripe line items, scaled down proportionally
                //    so their sum matches totalPrice (rawTotal - orderDiscount). ──
                if ($totalPrice > 0) {
                    $scale = $rawTotal > 0 ? $totalPrice / $rawTotal : 0;

                    foreach ($cartItems as $cartItem) {
                        $scaledPrice = round($cartItem['price'] * $scale, 2);

                        $description = collect($cartItem['options'])
                            ->map(fn($opt) => "{$opt['type']['name']}::{$opt['name']}")
                            ->implode(',');

                        $productData = ['name' => $cartItem['title']];
                        if (!empty($description)) {
                            $productData['description'] = $description;
                        }

                        $lineItems[] = [
                            'price_data' => [
                                'currency' => config('app.currency'),
                                'product_data' => $productData,
                                'unit_amount' => intval($scaledPrice * 100),
                            ],
                            'quantity' => $cartItem['quantity'],
                        ];
                    }

                    if ($bookingFee > 0) {
                        $scaledFee = round($bookingFee * $scale, 2);
                        $lineItems[] = [
                            'price_data' => [
                                'currency' => config('app.currency'),
                                'product_data' => [
                                    'name' => "Booking Fee for Installer ({$vendor['name']})",
                                ],
                                'unit_amount' => intval($scaledFee * 100),
                            ],
                            'quantity' => 1,
                        ];
                    }
                }
            }

            // ── Redeem the voucher synchronously, once, for the combined discount ──
            if ($voucher && $discountToApply > 0) {
                foreach ($orders as $idx => $order) {
                    $orderDiscountUsed = $order->voucher_discount ?? 0;
                    if ($orderDiscountUsed > 0) {
                        VoucherUsage::create([
                            'voucher_id' => $voucher->id,
                            'user_id' => $user->id,
                            'order_id' => $order->id,
                            'amount_used' => $orderDiscountUsed,
                        ]);
                    }
                }

                if ($voucher->type === 'gift') {
                    $voucher->remaining_amount = max(0, ($voucher->remaining_amount ?? 0) - $discountToApply);
                    if ($voucher->remaining_amount <= 0) {
                        $voucher->remaining_amount = 0;
                        $voucher->active = false;
                    }
                } elseif ($voucher->type === 'promo') {
                    $voucher->used_count += 1;
                    if ($voucher->max_uses && $voucher->used_count >= $voucher->max_uses) {
                        $voucher->active = false;
                    }
                }

                $voucher->save();
            }

            $combinedTotalDue = round($combinedTotal - $discountToApply, 2);

            // ── Fully covered by voucher: skip Stripe entirely ──
            if ($combinedTotalDue <= 0) {
                foreach ($orders as $order) {
                    $order->status = OrderStatusEnum::Paid->value;
                    $order->payment_method = 'gift_card';
                    $order->is_paid = true;
                    $order->save();
  if ($order->orderItems->contains(fn($item) => $item->ticket_tier_id !== null)) {
                        app(\App\Services\TicketGenerationService::class)->generate($order);
                    }
                    if ($order->vendorUser) {
                        Mail::to($order->vendorUser)->queue(new NewOrderMail($order));
                    }
                }

                // Clear product cart items
                $orderedProductIds = collect($orders)
                    ->flatMap(fn($o) => $o->orderItems()->pluck('product_id'))
                    ->filter()
                    ->unique()
                    ->values();

                if ($orderedProductIds->isNotEmpty()) {
                    CartItem::where('user_id', $user->id)
                        ->whereIn('product_id', $orderedProductIds)
                        ->where('saved_for_later', false)
                        ->delete();
                }

                // Clear ticket cart items
                $orderedTicketTierIds = collect($orders)
                    ->flatMap(fn($o) => $o->orderItems()->pluck('ticket_tier_id'))
                    ->filter()
                    ->unique()
                    ->values();

                if ($orderedTicketTierIds->isNotEmpty()) {
                    CartItem::where('user_id', $user->id)
                        ->whereIn('ticket_tier_id', $orderedTicketTierIds)
                        ->where('saved_for_later', false)
                        ->delete();
                }

                if (!empty($orders)) {
                    Mail::to($user)->queue(new CheckoutCompleted(collect($orders)));
                }

                if ($ownsTransaction) {
                    DB::commit();
                }

                return Inertia::render('Stripe/Success', [
                    'orders' => OrderViewResource::collection($orders)->collection->toArray(),
                ]);
            }


            // ── Otherwise, charge the remainder through Stripe ──

            // CHECKPOINT 6 — what's about to be sent to Stripe
            Log::info('CHECKPOINT 6 - STRIPE LINE ITEMS', [
                'line_items' => $lineItems,
                'orders' => collect($orders)->map(fn($o) => [
                    'order_id' => $o->id,
                    'items' => $o->orderItems->map(fn($i) => [
                        'tier' => $i->ticket_tier_id,
                        'seats' => $i->seat_ids,
                    ])->toArray(),
                ])->toArray(),
            ]);
            // ── Otherwise, charge the remainder through Stripe. Same
            //    Checkout Session/line_items engine as before — only
            //    change is ui_mode: 'elements', so it renders inline on
            //    our own page instead of redirecting to checkout.stripe.com.
            //    Webhook (checkout.session.completed) is untouched. ──
            $paymentIntent = $stripeCheckoutService->createPaymentIntent([
                'amount' => (int) round($combinedTotalDue * 100),
                'currency' => 'aud',
                'receipt_email' => $user->email,
                'payment_method_types' => ['card'], // explicit list — excludes link, wallets, etc.
                'metadata' => [
                    'buyer_id' => $user->id,
                    'order_ids' => collect($orders)->pluck('id')->implode(','),
                ],
            ]);

            foreach ($orders as $order) {
                $order->payment_intent = $paymentIntent->id;
                $order->save();
            }

            DB::commit();

            // NEW: inline flow just wants the client secret back as JSON
            if ($request->wantsJson()) {
                return response()->json([
                    'clientSecret' => $paymentIntent->client_secret,
                    'stripeKey' => config('services.stripe.key'),
                    'totalDue' => $combinedTotalDue,
                ]);
            }

            // Fallback: keep the old full-page route working too, if you still need it
            return Inertia::render('Checkout/Payment', [
                'clientSecret' => $paymentIntent->client_secret,
                'stripeKey' => config('services.stripe.key'),
                'orderSummary' => collect($lineItems)->map(fn($li) => [
                    'title' => $li['price_data']['product_data']['name'],
                    'quantity' => $li['quantity'],
                    'price' => $li['price_data']['unit_amount'] / 100,
                ])->values(),
                'totalDue' => $combinedTotalDue,
            ]);
        } catch (\Exception $e) {
            if ($ownsTransaction) {
                DB::rollBack();
            }
            Log::error('Checkout failed: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
            return back()->withErrors('Checkout failed. Please try again.');
        }
    }

    public function destroyGiftCard(CartItem $cartItem)
    {
        // Ensure the item belongs to the authenticated user
        if ($cartItem->user_id !== Auth::id()) {
            abort(403);
        }

        $cartItem->delete();

        return back()->with('success', 'Gift card removed from cart.');
    }
}
