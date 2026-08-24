<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
  public function index()
{
    try {
        // ── Stat cards ────────────────────────────────────────────
        $totalRevenue   = Order::where('is_paid', true)->sum('total_price');
        $totalOrders    = Order::count();
        $pendingOrders  = Order::where('status', 'draft')->count();
        $totalBookings  = Booking::count();
        $todayBookings  = Booking::whereDate('booking_date', today())->count();
        $totalProducts  = Product::count();
        $totalUsers     = User::count();
        $totalVendors   = Vendor::where('status', 'approved')->count();

        // ── Sales chart — last 30 days ────────────────────────────
        $salesRaw = Order::where('is_paid', true)
            ->whereDate('created_at', '>=', now()->subDays(29))
            ->selectRaw('DATE(created_at) as date, SUM(total_price) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('total', 'date');

        $salesLabels = [];
        $salesData   = [];
        for ($i = 29; $i >= 0; $i--) {
            $date          = now()->subDays($i)->format('Y-m-d');
            $salesLabels[] = now()->subDays($i)->format('d M');
            $salesData[]   = round($salesRaw[$date] ?? 0, 2);
        }

        $ordersByStatus = Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $recentOrders = Order::with('user', 'vendorUser.vendor')
            ->latest()
            ->take(8)
            ->get()
            ->map(fn($o) => [
                'id'           => $o->id,
                'customer'     => $o->user?->name ?? '—',
                'vendor'       => $o->vendorUser?->vendor?->store_name ?? '—',
                'total'        => $o->total_price,
                'status'       => $o->status,
                'created_at'   => $o->created_at?->format('d M Y'),
            ]);

        $upcomingBookings = Booking::with('user', 'order')
            ->whereDate('booking_date', '>=', today())
            ->orderBy('booking_date')
            ->orderBy('time_slot')
            ->take(8)
            ->get()
            ->map(fn($b) => [
                'id'           => $b->id,
                'customer'     => $b->user?->name ?? '—',
                'date'         => $b->booking_date,
                'time_slot'    => $b->time_slot,
                'order_status' => $b->order?->status ?? '—',
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_revenue'  => round($totalRevenue, 2),
                'total_orders'   => $totalOrders,
                'pending_orders' => $pendingOrders,
                'total_bookings' => $totalBookings,
                'today_bookings' => $todayBookings,
                'total_products' => $totalProducts,
                'total_users'    => $totalUsers,
                'total_vendors'  => $totalVendors,
            ],
            'salesChart' => [
                'labels' => $salesLabels,
                'data'   => $salesData,
            ],
            'ordersByStatus'   => $ordersByStatus,
            'recentOrders'     => $recentOrders,
            'upcomingBookings' => $upcomingBookings,
        ]);

    } catch (\Throwable $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'file'  => $e->getFile(),
            'line'  => $e->getLine(),
            'trace' => collect($e->getTrace())->take(15)->map(fn($t) =>
                ($t['file'] ?? '?') . ':' . ($t['line'] ?? '?') . ' ' . ($t['function'] ?? '')
            ),
        ], 500);
    }
}
}
