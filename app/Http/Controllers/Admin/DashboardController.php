<?php

namespace App\Http\Controllers\Admin;

use App\Enums\VendorStatusEnum;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventLeg;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * One dashboard, two scopes. Admin sees the whole marketplace; a
     * Vendor (or Staff acting for one, via actingVendorId()) sees only
     * their own events/tickets/orders. Same query shapes either way —
     * just an extra ->where() on the vendor scope — so this stays one
     * controller action instead of forking into two.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user->isAdmin();
        $vendorId = $user->actingVendorId();

        try {
            // ── Scoped base queries ───────────────────────────────────
            $eventsBase = Event::query()
                ->when(! $isAdmin, fn ($q) => $q->where('vendor_user_id', $vendorId));

            $ticketsBase = Ticket::query()
                ->when(
                    ! $isAdmin,
                    fn ($q) => $q->whereHas(
                        'eventLeg.event',
                        fn ($eq) => $eq->where('vendor_user_id', $vendorId)
                    )
                );

            $ordersBase = Order::query()
                ->when(! $isAdmin, fn ($q) => $q->where('vendor_user_id', $vendorId));

            // ── Stat cards ────────────────────────────────────────────
            $totalRevenue = (clone $ordersBase)->where('is_paid', true)->sum('total_price');
            $totalOrders = (clone $ordersBase)->count();
            $pendingOrders = (clone $ordersBase)->where('status', 'draft')->count();

            $publishedEvents = (clone $eventsBase)->where('status', 'published')->count();
            $upcomingEventsCount = (clone $eventsBase)
                ->where('status', 'published')
                ->whereHas('legs', fn ($q) => $q->where('event_date', '>=', today()))
                ->count();

            $ticketsSold = (clone $ticketsBase)->count();
            $ticketsUsed = (clone $ticketsBase)->where('status', 'used')->count();
            $ticketsValid = (clone $ticketsBase)->where('status', 'valid')->count();
            $ticketsVoid = (clone $ticketsBase)->where('status', 'void')->count();
            $checkedInToday = (clone $ticketsBase)->whereDate('scanned_at', today())->count();

            $stats = [
                'total_revenue' => round($totalRevenue, 2),
                'total_orders' => $totalOrders,
                'pending_orders' => $pendingOrders,
                'published_events' => $publishedEvents,
                'upcoming_events' => $upcomingEventsCount,
                'tickets_sold' => $ticketsSold,
                'tickets_used' => $ticketsUsed,
                'checked_in_today' => $checkedInToday,
            ];

            // Marketplace-health numbers that are meaningless per-vendor.
            if ($isAdmin) {
                $stats['total_vendors'] = Vendor::where('status', VendorStatusEnum::Approved->value)->count();
                $stats['pending_vendors'] = Vendor::where('status', VendorStatusEnum::Pending->value)->count();
            }

            // ── Revenue chart — last 30 days ─────────────────────────
            $salesRaw = (clone $ordersBase)
                ->where('is_paid', true)
                ->whereDate('created_at', '>=', now()->subDays(29))
                ->selectRaw('DATE(created_at) as date, SUM(total_price) as total')
                ->groupBy('date')
                ->orderBy('date')
                ->pluck('total', 'date');

            $salesLabels = [];
            $salesData = [];
            for ($i = 29; $i >= 0; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $salesLabels[] = now()->subDays($i)->format('d M');
                $salesData[] = round($salesRaw[$date] ?? 0, 2);
            }

            // ── Ticket status breakdown (replaces the old order-status donut —
            //    "is this event selling / filling up" is what actually matters here) ─
            $ticketsByStatus = [
                'valid' => $ticketsValid,
                'used' => $ticketsUsed,
                'void' => $ticketsVoid,
            ];

            // ── Upcoming events (next 6, published, today or later) ──
            $upcomingEvents = EventLeg::query()
                ->with(['event', 'venue'])
                ->whereHas('event', function ($q) use ($isAdmin, $vendorId) {
                    $q->where('status', 'published')
                        ->when(! $isAdmin, fn ($qq) => $qq->where('vendor_user_id', $vendorId));
                })
                ->where('event_date', '>=', today())
                ->orderBy('event_date')
                ->take(6)
                ->get()
                ->map(fn ($leg) => [
                    'id' => $leg->id,
                    'event_name' => $leg->event?->name ?? '—',
                    'venue' => $leg->venue?->name ?? $leg->venue_name ?? '—',
                    'city' => $leg->city,
                    'date' => optional($leg->event_date)->format('d M Y'),
                    'tickets_sold' => $leg->tickets()->count(),
                    'capacity' => $leg->capacity,
                ]);

            // ── Recent orders ─────────────────────────────────────────
            $recentOrders = (clone $ordersBase)
                ->with('user')
                ->latest()
                ->take(8)
                ->get()
                ->map(fn ($o) => [
                    'id' => $o->id,
                    'customer' => $o->user?->name ?? '—',
                    'total' => $o->total_price,
                    'status' => $o->status,
                    'created_at' => $o->created_at?->format('d M Y'),
                ]);

            // ── Top events by tickets sold — admin only. Once you're
            //    scoped to a single vendor this would just re-list their
            //    own events again, so it adds nothing for that view. ──
            $topEvents = $isAdmin
                ? Event::query()
                    ->join('event_legs', 'event_legs.event_id', '=', 'events.id')
                    ->join('tickets', 'tickets.event_leg_id', '=', 'event_legs.id')
                    ->groupBy('events.id', 'events.name')
                    ->orderByDesc(DB::raw('COUNT(tickets.id)'))
                    ->selectRaw('events.id, events.name, COUNT(tickets.id) as tickets_sold')
                    ->take(6)
                    ->get()
                    ->map(fn ($e) => [
                        'id' => $e->id,
                        'name' => $e->name,
                        'tickets_sold' => $e->tickets_sold,
                    ])
                : [];

            return Inertia::render('Admin/Dashboard', [
                'scope' => $isAdmin ? 'admin' : 'vendor',
                'stats' => $stats,
                'salesChart' => [
                    'labels' => $salesLabels,
                    'data' => $salesData,
                ],
                'ticketsByStatus' => $ticketsByStatus,
                'upcomingEvents' => $upcomingEvents,
                'recentOrders' => $recentOrders,
                'topEvents' => $topEvents,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => collect($e->getTrace())->take(15)->map(
                    fn ($t) => ($t['file'] ?? '?').':'.($t['line'] ?? '?').' '.($t['function'] ?? '')
                ),
            ], 500);
        }
    }
}
