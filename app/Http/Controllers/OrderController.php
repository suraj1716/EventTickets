<?php

namespace App\Http\Controllers;

namespace App\Http\Controllers;

use App\Enums\OrderStatusEnum;
use App\Http\Resources\OrderViewResource;
use App\Models\Order;
use App\Services\RefundService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class OrderController extends Controller
{

    protected $refundService;

    public function __construct(RefundService $refundService)
    {
        $this->refundService = $refundService;
    }
   public function index()
{
    $orders = Auth::user()
        ->orders()
        ->where('status', OrderStatusEnum::Paid)
        ->with([
            'orderItems.product.variationTypes.options',
           'orderItems.ticketTier.eventLeg.event.media',
            'booking',
            'vendorUser.vendor',
        ])
        ->latest()
        ->paginate(10);

    return Inertia::render('Order/OrdersHistory', [
        'orders' => OrderViewResource::collection($orders),
    ]);
}

public function show($orderId)
{
    $order = Order::with([
        'orderItems.product',
        'orderItems.booking',
        'orderItems.ticketTier.eventLeg.event',
        'vendor.vendor',
        'shippingAddress'
    ])->findOrFail($orderId);

    return new OrderViewResource($order);
}
}
