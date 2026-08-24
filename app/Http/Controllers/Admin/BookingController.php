<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingController extends Controller
{
  public function index(Request $request)
{
    $query = Booking::with('user', 'order');

    if ($request->filled('search')) {
        $s = $request->search;
        $query->whereHas('user', fn($q) => $q->where('name', 'like', "%$s%")
            ->orWhere('email', 'like', "%$s%"));
    }

    if ($request->filled('date')) {
        $query->whereDate('booking_date', $request->date);
    }

    if ($request->filled('status')) {
        $query->whereHas('order', fn($q) => $q->where('status', $request->status));
    }

    $sort = $request->get('sort', 'created_at');
    $direction = $request->get('direction') === 'asc' ? 'asc' : 'desc';

   switch ($sort) {
  case 'booking_date':
    $query->orderBy('booking_date', $direction)
          ->orderBy('sort_minutes', 'asc'); // always 9am → 5pm within a day
    break;

    case 'order_total':
        $query->leftJoin('orders', 'bookings.order_id', '=', 'orders.id')
            ->orderBy('orders.total_price', $direction)
            ->orderBy('bookings.booking_date', 'asc')
            ->select('bookings.*');
        break;

    case 'created_at':
    default:
        $query->orderBy('created_at', $direction);
        break;
}

    $bookings = $query->paginate(20)->through(fn($b) => [
        'id'           => $b->id,
        'customer'     => $b->user?->name ?? '—',
        'email'        => $b->user?->email ?? '—',
        'booking_date' => $b->booking_date,
        'time_slot'    => $b->time_slot,
        'order_id'     => $b->order_id,
        'order_status' => $b->order?->status ?? '—',
        'order_total'  => $b->order?->total_price ?? 0,
        'created_at'   => $b->created_at?->format('d M Y'),
    ]);

    return Inertia::render('Admin/Bookings/Index', [
        'bookings' => $bookings,
        'filters'  => $request->only(['search', 'date', 'status', 'sort', 'direction']),
    ]);
}

    public function show(Booking $booking)
    {
        if (!$booking->is_read) {
            $booking->update(['is_read' => true]);
        }
        $booking->load('user', 'order.orderItems.product', 'order.vendor');

        return Inertia::render('Admin/Bookings/Show', [
            'booking' => [
                'id'           => $booking->id,
                'booking_date' => $booking->booking_date,
                'time_slot'    => $booking->time_slot,
                'created_at'   => $booking->created_at?->format('d M Y H:i'),
                'customer'     => [
                    'name'  => $booking->user?->name ?? '—',
                    'email' => $booking->user?->email ?? '—',
                    'phone' => $booking->user?->phone ?? '—',
                ],
                'order' => $booking->order ? [
                    'id'          => $booking->order->id,
                    'status'      => $booking->order->status,
                    'is_paid'     => $booking->order->is_paid,
                    'total_price' => $booking->order->total_price,
                    'vendor'      => $booking->order->vendor?->store_name ?? '—',
                    'items'       => $booking->order->orderItems->map(fn($i) => [
                        'id'       => $i->id,
                        'title'    => $i->product?->title ?? '—',
                        'quantity' => $i->quantity,
                        'price'    => $i->price,
                        'subtotal' => $i->quantity * $i->price,
                    ]),
                ] : null,
            ],
        ]);
    }

    public function create()
    {
        $users  = User::orderBy('name')->get(['id', 'name', 'email']);
        $orders = Order::with('user')->whereDoesntHave('booking')->latest()->get()->map(fn($o) => [
            'id'       => $o->id,
            'label'    => "#$o->id — {$o->user?->name} (A\${$o->total_price})",
        ]);

        return Inertia::render('Admin/Bookings/Create', [
            'users'  => $users,
            'orders' => $orders,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id'      => 'required|exists:users,id',
            'order_id'     => 'nullable|exists:orders,id',
            'booking_date' => 'required|date',
            'time_slot'    => 'required|string',
        ]);

        Booking::create([
            'user_id'      => $request->user_id,
            'order_id'     => $request->order_id ?: null,
            'booking_date' => $request->booking_date,
            'time_slot'    => $request->time_slot,
        ]);

        return redirect()->route('admin.bookings.index')
            ->with('success', 'Booking created.');
    }

    public function edit(Booking $booking)
    {
        $users  = User::orderBy('name')->get(['id', 'name', 'email']);
        $orders = Order::with('user')
            ->where(fn($q) => $q->whereDoesntHave('booking')
                ->orWhereHas('booking', fn($q) => $q->where('id', $booking->id)))
            ->latest()->get()->map(fn($o) => [
                'id'    => $o->id,
                'label' => "#$o->id — {$o->user?->name} (A\${$o->total_price})",
            ]);
        $vendor = \App\Models\Vendor::where('user_id', $booking->vendor_id ?? $booking->order?->vendor_user_id)->first();
        return Inertia::render('Admin/Bookings/Edit', [
            'booking' => [
                'id'           => $booking->id,
                'user_id'      => $booking->user_id,
                'order_id'     => $booking->order_id,
                'booking_date' => $booking->booking_date,
                'time_slot'    => $booking->time_slot,
            ],
            'users'  => $users,
            'orders' => $orders,
            'vendor'  => $vendor ? [
                'business_start_time'  => $vendor->business_start_time,
                'business_end_time'    => $vendor->business_end_time,
                'slot_interval_minutes' => $vendor->slot_interval_minutes,
            ] : null,
        ]);
    }

    public function update(Request $request, Booking $booking)
    {
        $request->validate([
            'user_id'      => 'required|exists:users,id',
            'order_id'     => 'nullable|exists:orders,id',
            'booking_date' => 'required|date',
            'time_slot'    => 'required|string',
        ]);

        $booking->update([
            'user_id'      => $request->user_id,
            'order_id'     => $request->order_id ?: null,
            'booking_date' => $request->booking_date,
            'time_slot'    => $request->time_slot,
        ]);

        return redirect()->route('admin.bookings.show', $booking->id)
            ->with('success', 'Booking updated.');
    }

    public function cancel(Booking $booking)
    {
        if ($booking->order) {
            $booking->order->update(['status' => 'cancelled']);
        }

        $booking->delete();

        return redirect()->route('admin.bookings.index')
            ->with('success', 'Booking cancelled.');
    }

    public function destroy(Booking $booking)
    {
        $booking->delete();

        return redirect()->route('admin.bookings.index')
            ->with('success', 'Booking deleted.');
    }
}
