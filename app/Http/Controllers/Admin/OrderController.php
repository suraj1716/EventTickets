<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatusEnum;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use App\Services\RefundService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OrderController extends Controller
{
    /* ══════════════════════════════════════════
       INDEX
    ══════════════════════════════════════════ */
    public function index(Request $request)
    {
        $query = Order::with('user', 'vendorUser.vendor', 'booking', 'refunds')->latest();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('id', $s)
                    ->orWhereHas(
                        'user',
                        fn($q) =>
                        $q->where('name', 'like', "%$s%")
                            ->orWhere('email', 'like', "%$s%")
                            ->orWhere('phone', 'like', "%$s%")
                    );
            });
        }

        if ($request->filled('status'))    $query->where('status', $request->status);
        if ($request->filled('is_paid'))   $query->where('is_paid', (bool) $request->is_paid);
        if ($request->filled('date_from')) $query->whereDate('created_at', '>=', $request->date_from);
        if ($request->filled('date_to'))   $query->whereDate('created_at', '<=', $request->date_to);

        $orders = $query->paginate(25)->through(fn($o) => [
            'id'             => $o->id,
            'customer'       => $o->user?->name ?? '—',
            'customer_email' => $o->user?->email ?? '—',
            'customer_phone' => $o->user?->phone ?? '—',
            'vendor'         => $o->vendorUser?->vendor?->store_name ?? '—',
            'vendor_type'    => $o->vendorUser?->vendor?->vendor_type?->value ?? '—',
            'total_price'    => $o->total_price,
            'voucher_discount' => $o->voucher_discount ?? 0,
            'gross_total'      => round(($o->total_price ?? 0) + ($o->voucher_discount ?? 0), 2), // ← new, ready to display
            'status'         => $o->status,
            'is_paid'        => $o->is_paid,
            'payment_method' => $o->payment_method ?? null,
            'payment_intent' => $o->payment_intent,
            'refunded_at'    => $o->refunded_at?->format('d M Y H:i'),
            'refund_amount'  => $o->refund_amount,

            'has_booking'    => !is_null($o->booking),
            'created_at'     => $o->created_at?->format('d M Y H:i'),
            'refunded_types' => $o->refunds()->pluck('type')->values()->all(),
        ]);

        return Inertia::render('Admin/Orders/Index', [
            'orders'   => $orders,
            'filters'  => $request->only(['search', 'status', 'is_paid', 'date_from', 'date_to']),
            'statuses' => ['draft', 'paid', 'delivered', 'cancelled', 'refunded'],
            'flash'    => ['success' => session('success'), 'error' => session('error')],
        ]);
    }

    /* ══════════════════════════════════════════
       SHOW
    ══════════════════════════════════════════ */
    public function show(Order $order)
    {
        if (!$order->is_read) {
            $order->update(['is_read' => true]);
        }
        $order->load(
            'user',
            'vendorUser.vendor',
            'booking',
            'orderItems.product',
            'refunds',
            'staff'
        );
        return Inertia::render('Admin/Orders/Show', [
            'order' => [
                'id'             => $order->id,
                'customer'       => $order->user?->name ?? '—',
                'customer_email' => $order->user?->email ?? '—',
                'customer_phone' => $order->user?->phone ?? '—',
                'vendor'         => $order->vendorUser?->vendor?->store_name ?? '—',
                'vendor_type'    => $order->vendorUser?->vendor?->vendor_type?->value ?? '—',
                'voucher_discount' => $order->voucher_discount ?? 0,
                'total_price'    => $order->total_price,
                'gross_total'    => round(($order->total_price ?? 0) + ($order->voucher_discount ?? 0), 2), // ← add this
                'booking_fee'    => $order->booking_fee ?? 0,
                'status'         => $order->status,
                'is_paid'        => $order->is_paid,
                'payment_method' => $order->payment_method ?? null,
                'manual_paid_at' => $order->manual_paid_at?->format('d M Y H:i'),
                'payment_intent' => $order->payment_intent,
                'refunded_types' => $order->refunds->pluck('type')->values()->all(),
                'refunded_at'    => $order->refunded_at?->format('d M Y H:i'),
                'refund_amount'  => $order->refund_amount,

                'created_at'     => $order->created_at?->format('d M Y H:i'),
                'booking' => $order->booking ? [
                    'id'           => $order->booking->id,
                    'booking_date' => $order->booking->booking_date,
                    'time_slot'    => $order->booking->time_slot,
                ] : null,
                'staff_id' => $order->staff_id,
                'staff' => $order->staff ? [
                    'id'   => $order->staff->id,
                    'name' => $order->staff->name,
                ] : null,
                'items' => $order->orderItems->map(fn($i) => [
                    'id'       => $i->id,
                    'title'    => $i->product?->title ?? '—',
                    'image'    => $i->product?->image,
                    'quantity' => $i->quantity,
                    'price'    => $i->price,
                    'subtotal' => $i->quantity * $i->price,
                ]),
            ],
            'statuses' => ['draft', 'paid', 'delivered', 'cancelled', 'refunded'],
            'flash'    => ['success' => session('success'), 'error' => session('error')],
        ]);
    }

    /* ══════════════════════════════════════════
       CREATE (walk-in POS)
    ══════════════════════════════════════════ */
    public function create()
    {
        $products = Product::where('status', 'published')
            ->get(['id', 'title', 'price'])
            ->map(function ($product) {
                return [
                    'id'    => $product->id,
                    'title' => $product->title,
                    'price' => $product->price,
                    'image' => $product->getFirstMediaUrl('products'),
                ];
            });

        $users = User::orderBy('name')
            ->get(['id', 'name', 'email', 'phone']);

        $vendors = Vendor::with('user')->get();

        $statuses = [
            'draft',
            'paid',
            'delivered',
            'cancelled',
            'refunded',
        ];

        return Inertia::render('Admin/Orders/Create', [
            'users'          => $users,
            'vendors'        => $vendors,
            'products'       => $products,
            'statuses'       => $statuses,
            'vendor_user_id' => Auth::id(),
            'vendor_name'    => Auth::user()->name,
            'flash'          => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ]);
    }

    /* ══════════════════════════════════════════
       PHONE LOOKUP (JSON)
    ══════════════════════════════════════════ */
    public function lookupPhone(Request $request)
    {
        $request->validate(['phone' => 'required|string|min:6']);
        $user = User::where('phone', $request->phone)->first();

        if (!$user) return response()->json(['found' => false]);

        return response()->json([
            'found' => true,
            'user'  => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $user->phone],
        ]);
    }

    /* ══════════════════════════════════════════
       STORE (walk-in)
    ══════════════════════════════════════════ */
    public function store(Request $request)
    {
        $request->validate([
            'user_id'           => 'nullable|exists:users,id',
            'new_name'          => 'required_without:user_id|string|max:255',
            'new_email'         => 'nullable|email|max:255',
            'new_phone'         => 'required_without:user_id|string|max:30',
            'vendor_user_id'    => 'required|exists:users,id',
            'payment_method' => 'nullable|in:cash,eftpos,other,stripe,card',
            'is_paid'           => 'boolean',
            'notes'             => 'nullable|string|max:500',
            'items'             => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'  => 'required|integer|min:1',
            'items.*.price'     => 'required|numeric|min:0',
            'add_booking'       => 'boolean',
            'booking_date'      => 'required_if:add_booking,true|date',
            'booking_time_slot' => 'required_if:add_booking,true|string',
        ]);

        DB::beginTransaction();
        try {
            // Resolve or create customer
            if ($request->filled('user_id')) {
                $user = User::findOrFail($request->user_id);
            } else {
                if ($request->filled('new_email') && User::where('email', $request->new_email)->exists()) {
                    return back()->withErrors(['new_email' => 'Email already belongs to another account.']);
                }
                $user = User::create([
                    'name'              => $request->new_name,
                    'email'             => $request->new_email ?? ($request->new_phone . '@walkin.local'),
                    'phone'             => $request->new_phone,
                    'password'          => Hash::make(Str::random(16)),
                    'email_verified_at' => now(),
                ]);
            }

            $total = collect($request->items)->sum(fn($i) => $i['quantity'] * $i['price']);

            $order = Order::create([
                'user_id'                   => $user->id,
                'vendor_user_id'            => $request->vendor_user_id,
                'total_price'               => $total,
                'booking_fee'               => 0,
                'status'                    => $request->boolean('is_paid') ? 'paid' : 'draft',
                'is_paid'                   => $request->boolean('is_paid'),
                'payment_method'            => $request->payment_method,
                'manual_paid_at'            => $request->boolean('is_paid') ? now() : null,
                'online_payment_comission'  => 0,
                'website_payment_comission' => 0,
                'vendor_subtotal'           => $total,
            ]);

            foreach ($request->items as $item) {
                OrderItem::create([
                    'order_id'   => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                    'price'      => $item['price'],
                ]);
            }

            if ($request->boolean('add_booking')) {
                Booking::create([
                    'user_id'      => $user->id,
                    'order_id'     => $order->id,
                    'booking_date' => $request->booking_date,
                    'time_slot'    => $request->booking_time_slot,
                ]);
            }

            DB::commit();
            return redirect()->route('admin.orders.show', $order->id)
                ->with('success', "Walk-in order #{$order->id} created for {$user->name}.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Order failed: ' . $e->getMessage()]);
        }
    }

    /* ══════════════════════════════════════════
   EDIT
══════════════════════════════════════════ */
    public function edit(Order $order)
    {

        $order->load('orderItems.product', 'booking.staff');
        $products = Product::where('status', 'published')->get(['id', 'title', 'price']);
        $users    = User::orderBy('name')->get(['id', 'name', 'email', 'phone']);
        $vendor = \App\Models\Vendor::where('user_id', $order->vendor_user_id)->first();
        $staffOptions = \App\Models\Staff::select('id', 'name')->orderBy('name')->get();

        $payload = [
            'order' => [
                'id'             => $order->id,
                'user_id'        => $order->user_id,
                'vendor_user_id' => $order->vendor_user_id,
                'status'         => $order->status,
                'is_paid'        => (bool) $order->is_paid,
                'payment_intent'  => $order->payment_intent,
                'payment_method' => $order->payment_method ?? 'cash',
                'total_price'    => $order->total_price,
                'notes'          => $order->notes ?? '',
                'booking' => $order->booking ? [
                    'id'                => $order->booking->id,
                    'booking_date'      => $order->booking->booking_date,
                    'time_slot'         => $order->booking->time_slot,
                    'assigned_staff_id' => $order->booking->staff_id,
                    'assigned_staff'    => $order->booking->staff?->name,
                ] : null,
                'items' => $order->orderItems->map(fn($i) => [
                    'product_id' => $i->product_id,
                    'title'      => $i->product?->title ?? '—',
                    'quantity'   => $i->quantity,
                    'price'      => $i->price,
                ]),
            ],
            'vendor' => $vendor ? [
                'business_start_time'   => $vendor->business_start_time,
                'business_end_time'     => $vendor->business_end_time,
                'slot_interval_minutes' => $vendor->slot_interval_minutes,
            ] : null,
            'products'     => $products,
            'users'        => $users,
            'staffOptions' => $staffOptions,
            'statuses'     => ['draft', 'paid', 'delivered', 'cancelled', 'refunded'],
            'flash'        => ['success' => session('success'), 'error' => session('error')],
        ];


        return Inertia::render('Admin/Orders/Edit', $payload);
    }

    /* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
    public function update(Request $request, Order $order)
    {
        $request->validate([
            'status'            => 'required|in:draft,paid,shipped,delivered,cancelled',
            'is_paid'           => 'boolean',
            'payment_method' => 'nullable|in:cash,eftpos,other,stripe,card',
            'notes'             => 'nullable|string|max:500',
            'user_id'           => 'nullable|exists:users,id',
            'items'             => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'  => 'required|integer|min:1',
            'items.*.price'     => 'required|numeric|min:0',
            'booking_date'      => 'nullable|date',
            'booking_time_slot' => 'nullable|string',
            'assigned_staff_id' => 'nullable|exists:staff,id',
        ]);

        $total = collect($request->items)->sum(fn($i) => $i['quantity'] * $i['price']);

        $order->update([
            'status'         => $request->status,
            'is_paid'        => $request->boolean('is_paid'),
            'payment_method' => $request->payment_method,
            'total_price'    => $total,
            'user_id'        => $request->user_id ?? $order->user_id,
            'manual_paid_at' => $request->boolean('is_paid') && !$order->manual_paid_at ? now() : $order->manual_paid_at,
        ]);

        // Rebuild items
        $order->orderItems()->delete();
        foreach ($request->items as $item) {
            OrderItem::create([
                'order_id'   => $order->id,
                'product_id' => $item['product_id'],
                'quantity'   => $item['quantity'],
                'price'      => $item['price'],
            ]);
        }

        // Update or create booking
        if ($request->filled('booking_date') && $request->filled('booking_time_slot')) {
            $order->booking()->updateOrCreate(
                ['order_id' => $order->id],
                [
                    'user_id'        => $request->user_id ?? $order->user_id,
                    'booking_date'   => $request->booking_date,
                    'time_slot'      => $request->booking_time_slot,
                    'staff_id'       => $request->assigned_staff_id,
                ]
            );
        }

        return redirect()->route('admin.orders.show', $order->id)
            ->with('success', "Order #{$order->id} updated.");
    }

    /* ══════════════════════════════════════════
       UPDATE STATUS (inline from index)
    ══════════════════════════════════════════ */
    public function updateStatus(Request $request, Order $order)
    {
        $request->validate(['status' => 'required|in:draft,paid,delivered,cancelled,refunded']);

        $isPaid = match ($request->status) {
            'paid', 'delivered' => true,
            'draft', 'cancelled', 'refunded' => false,
            default => $order->is_paid,
        };

        $wasUnpaid = !$order->is_paid;

        $order->update([
            'status' => $request->status,
            'is_paid' => $isPaid,
        ]);

        // If this transition is turning a previously-unpaid order into paid,
        // redeem any voucher attached to it — mirrors the webhook's redemption
        // logic, so a manual admin override can't be used to bypass voucher spend.
        if ($wasUnpaid && $isPaid && $order->voucher_id && $order->voucher_discount > 0) {
            $orderVoucher = Voucher::lockForUpdate()->find($order->voucher_id);
            if ($orderVoucher) {
                $alreadyRedeemed = VoucherUsage::where('order_id', $order->id)
                    ->where('voucher_id', $orderVoucher->id)
                    ->exists();

                if (!$alreadyRedeemed) {
                    VoucherUsage::create([
                        'voucher_id'  => $orderVoucher->id,
                        'user_id'     => $order->user_id,
                        'order_id'    => $order->id,
                        'amount_used' => $order->voucher_discount,
                    ]);

                    if ($orderVoucher->type === 'gift') {
                        $orderVoucher->remaining_amount = max(0, ($orderVoucher->remaining_amount ?? 0) - $order->voucher_discount);
                        if ($orderVoucher->remaining_amount <= 0) {
                            $orderVoucher->remaining_amount = 0;
                            $orderVoucher->active = false;
                        }
                    } elseif ($orderVoucher->type === 'promo') {
                        $orderVoucher->used_count += 1;
                        if ($orderVoucher->max_uses && $orderVoucher->used_count >= $orderVoucher->max_uses) {
                            $orderVoucher->active = false;
                        }
                    }

                    $orderVoucher->save();

                    Log::info("Voucher #{$orderVoucher->id} redeemed manually via admin status change for Order #{$order->id}");
                }
            }
        }

        return back()->with('success', 'Status updated.');
    }

    /* ══════════════════════════════════════════
   REFUND
   ══════════════════════════════════════════ */
    public function refund(Request $request, Order $order)
    {
        $request->validate([
            'type' => ['required', 'in:full,booking_fee,except_booking_fee,custom'],
            'amount' => ['required_if:type,custom', 'nullable', 'numeric', 'min:0.01'],
        ]);

        $type = $request->type;

        Log::info("Refund requested for Order #{$order->id}", [
            'type' => $type,
            'payment_method' => $order->payment_method,
            'payment_intent' => $order->payment_intent,
            'refunded_at' => $order->refunded_at,
            'total_price' => $order->total_price,
            'status' => $order->status,
            'has_booking' => (bool) $order->booking,
        ]);

        $refundService = app(RefundService::class);

        // Per-type guard — full/booking_fee/except_booking_fee can only be processed
        // once per order; custom amounts are allowed multiple times, capped by the
        // remaining refundable total (checked at line ~500 below).
        if ($type !== 'custom' && $refundService->hasRefundType($order, $type)) {
            return back()->withErrors(['error' => 'This refund type has already been processed.']);
        }

        try {
            $stripePaymentMethods = ['stripe', 'card', 'link', 'afterpay_clearpay', 'klarna', 'zip'];
            $isStripe   = in_array($order->payment_method, $stripePaymentMethods);
            $isManual   = in_array($order->payment_method, ['cash', 'eftpos']);
            $isGiftCard = $order->payment_method === 'gift_card';

            if ($isStripe && empty($order->payment_intent)) {
                return back()->withErrors(['error' => 'Stripe order missing payment intent — cannot refund.']);
            }

            if ($request->type === 'custom') {
                $maxRefundable = $order->total_price - ($order->refund_amount ?? 0);
                if ($request->amount > $maxRefundable) {
                    return back()->withErrors(['error' => "Amount exceeds refundable total of \${$maxRefundable}."]);
                }
            }

            $amount = match ($request->type) {
                'full' => $isStripe
                    ? $refundService->refundBookingFeeAndOrder($order)
                    : ($isManual
                        ? $refundService->refundManual($order)
                        : ($isGiftCard ? $order->total_price : 0)),

                'except_booking_fee' => $isStripe
                    ? $refundService->refundExcludingBookingFee($order)
                    : 0,

                'booking_fee' => $refundService->refundBookingFeeOnly($order),

                'custom' => $isStripe
                    ? $refundService->refundCustomAmount($order, (float) $request->amount)
                    : 0, // custom cash/manual refunds should be handled outside the system, same as your other manual flows
            };

            // Gift card full refund doesn't touch Stripe — mark it manually
            if ($type === 'full' && $isGiftCard) {
                $order->update([
                    'refund_amount' => $amount,
                    'refunded_at' => now(),
                    'status' => OrderStatusEnum::Refunded->value,
                    'is_paid' => false,
                ]);
            }
            // After computing $voucherRestored for booking_fee/except_booking_fee types:
            if (in_array($type, ['booking_fee', 'except_booking_fee']) && $isGiftCard) {
                $bothPartialsUsed = $refundService->hasRefundType($order, 'booking_fee')
                    && $refundService->hasRefundType($order, 'except_booking_fee');

                // hasRefundType checks refunds already recorded — but THIS refund hasn't been recorded yet,
                // so also check if the current click completes the pair:
                $willCompletePair = $type === 'booking_fee'
                    ? $refundService->hasRefundType($order, 'except_booking_fee')
                    : $refundService->hasRefundType($order, 'booking_fee');

                if ($bothPartialsUsed || $willCompletePair) {
                    $order->update([
                        'refunded_at' => now(),
                        'status' => OrderStatusEnum::Refunded->value,
                        'is_paid' => false,
                    ]);
                }
            }
            // ── Voucher restoration, split by refund type ──
            $isVoucherCovered = !empty($order->voucher_id) && (float) $order->voucher_discount > 0;

            $voucherRestored = 0;
            if ($isVoucherCovered) {
                $voucherRestored = match ($type) {
                    'full'               => $refundService->restoreVoucherForOrder($order),
                    'booking_fee'        => $refundService->restoreVoucherAmountForOrder($order, (float) $order->booking_fee),
                    'except_booking_fee' => $refundService->restoreVoucherAmountForOrder(
                        $order,
                        max(0, (float) $order->voucher_discount - (float) $order->booking_fee)
                    ),
                };
            } elseif ($type === 'full') {
                // Stripe/cash orders that also had a partial voucher applied on top
                $voucherRestored = $refundService->restoreVoucherForOrder($order);
            }

            Log::info("Order #{$order->id} refund [{$type}] amount: {$amount}, voucher restored: {$voucherRestored}");

            if ($amount <= 0 && $voucherRestored <= 0) {
                return back()->withErrors(['error' => 'Refund failed — nothing was refunded.']);
            }

            if ($type === 'full') {
                $refundService->recordRefund($order, 'full', $amount, reason: 'Full refund', voucherRestored: $voucherRestored);

                if (!$refundService->hasRefundType($order, 'except_booking_fee')) {
                    $refundService->recordRefund($order, 'except_booking_fee', 0, reason: 'Covered by full refund', isMarker: true);
                }
                if (!$refundService->hasRefundType($order, 'booking_fee')) {
                    $refundService->recordRefund($order, 'booking_fee', 0, reason: 'Covered by full refund', isMarker: true);
                }
            } else {
                $refundService->recordRefund($order, $type, $amount, voucherRestored: $voucherRestored);
            }

            $message = "Refunded \${$amount}";
            if ($voucherRestored > 0) {
                $message .= " and restored \${$voucherRestored} to voucher balance";
            }

            return back()->with('success', $message . ' successfully.');
        } catch (\Exception $e) {
            Log::error("Refund exception for Order #{$order->id} [{$type}]: " . $e->getMessage());
            return back()->withErrors(['error' => 'Refund failed: ' . $e->getMessage()]);
        }
    }

    /* ══════════════════════════════════════════
       DESTROY
    ══════════════════════════════════════════ */
    public function destroy(Order $order)
    {
        $order->booking?->delete();
        $order->orderItems()->delete();
        $order->delete();
        return redirect()->route('admin.orders.index')->with('success', "Order #{$order->id} deleted.");
    }
}
