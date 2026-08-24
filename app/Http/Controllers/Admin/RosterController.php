<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Product;
use App\Models\Staff;
use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class RosterController extends Controller
{
    public function index(Request $request)
    {
        $from      = $request->input('from', today()->toDateString());
        $to        = $request->input('to', today()->addDays(7)->toDateString());
        $serviceId = $request->input('service_id');

        $bookings = Booking::query()
            ->whereBetween('booking_date', [$from, $to])
            ->whereHas(
                'order',
                // fn($q) => $q->where('status', 'paid') // adjust value to match your statuses
            )
            ->with([
                'order:id,status,payment_method',
                'order.orderItems.product:id,title',
                'user:id,name',
                'staff:id,name',  // ← was assignedStaff
            ])
            ->when(
                $serviceId,
                fn($q) => $q->whereHas('order.orderItems', fn($q2) => $q2->where('product_id', $serviceId))  // ← was order.items
            )
            ->orderBy('booking_date')
            ->orderBy('time_slot')
            ->get()
         ->map(fn($b) => [
    'id'                => $b->id,
    'date'              => $b->booking_date->toDateString(),
    'time'              => $b->time_slot,

    'customer'          => $b->user?->name,
    'service'           => $b->order?->orderItems->first()?->product?->title,
    'service_id'        => $b->order?->orderItems->first()?->product_id,
    'assigned_staff_id' => $b->staff_id,       // ← fixed
    'assigned_staff'    => $b->staff?->name,   // ← fixed
    'payment_method'    => $b->order?->payment_method,
]);

        $staff = Staff::select('id', 'name')->orderBy('name')->get();

        $services = Product::select('id', 'title as name')->orderBy('title')->get();

        return Inertia::render('Admin/Roster/Index', [
            'bookings' => $bookings,
            'staff'    => $staff,
            'services' => $services,
            'filters'  => [
                'from'       => $from,
                'to'         => $to,
                'service_id' => $serviceId,
            ],
        ]);
    }

    public function assign(Request $request, Booking $booking)
    {
        $request->validate([
            'staff_id' => ['required', 'exists:staff,id'],
        ]);

        $booking->update(['assigned_staff_id' => $request->staff_id]);

        return back()->with('success', 'Staff assigned.');
    }

    public function deassign(Booking $booking)
    {
        $booking->update(['assigned_staff_id' => null]);

        return back()->with('success', 'Assignment removed.');
    }
}
