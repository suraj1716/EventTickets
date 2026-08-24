<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventOrdersController extends Controller
{
    // Reuses the existing Order/OrderItem infrastructure entirely —
    // this is just a filtered view of orders that happen to contain
    // ticket lines, scoped to events this vendor owns. Nothing new
    // at the data layer, only the query.
  public function index(Request $request)
{
    $orders = Order::query()
        ->where('vendor_user_id', $request->user()->id)
        ->whereHas('orderItems', fn ($q) => $q->whereNotNull('ticket_tier_id'))
        ->with([
            'user',
            'orderItems' => function ($q) {
                $q->whereNotNull('ticket_tier_id')
                    ->with('ticketTier.eventLeg.event');
            },
        ])
        ->when(
            $request->filled('search'),
            fn ($q) => $q->whereHas(
                'user',
                fn ($u) => $u
                    ->where('name', 'like', '%' . $request->input('search') . '%')
                    ->orWhere(
                        'email',
                        'like',
                        '%' . $request->input('search') . '%'
                    )
            )
        )
        ->latest()
        ->paginate(30)
        ->withQueryString();

    return Inertia::render('Admin/Events/Orders', [
        'orders' => [
            'data' => $orders->items(),

            'links' => [
                'first' => $orders->url(1),
                'last' => $orders->url($orders->lastPage()),
                'prev' => $orders->previousPageUrl(),
                'next' => $orders->nextPageUrl(),
            ],

            'meta' => [
                'current_page' => $orders->currentPage(),
                'from' => $orders->firstItem(),
                'last_page' => $orders->lastPage(),
                'links' => $orders->linkCollection()->toArray(),
                'path' => $orders->path(),
                'per_page' => $orders->perPage(),
                'to' => $orders->lastItem(),
                'total' => $orders->total(),
            ],
        ],

        'filters' => $request->only(['search']),
    ]);
}
}