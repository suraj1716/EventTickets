<x-mail::message>

# Order Confirmation

Thank you for your order. Your receipt is below.

@foreach ($orders as $order)

@php
    $grossTotal = $order->orderItems->sum(fn ($item) => (float) $item->price);

    $voucherDiscount = (float) ($order->voucher_discount ?? 0);
    $discountAmount  = (float) ($order->discount_amount ?? 0);
    $totalDiscount   = min($voucherDiscount + $discountAmount, $grossTotal);

    $cardAmount = (float) ($order->total_price ?? 0);

    if ($order->voucher_id && $totalDiscount > 0 && $cardAmount > 0) {
        $paymentLabel = 'Voucher + Card';
    } elseif ($order->voucher_id && $totalDiscount > 0 && $cardAmount <= 0) {
        $paymentLabel = 'Voucher';
    } elseif ($order->payment_method === 'gift_card') {
        $paymentLabel = 'Gift Card';
    } else {
        $paymentLabel = ucfirst($order->payment_method ?? 'Card');
    }
@endphp

---

**Order #{{ $order->id }}** — {{ $order->created_at->format('F j, Y \a\t g:i A') }}

Vendor: {{ $order->vendorUser?->vendor?->store_name ?? config('app.name') }}
Payment: {{ $paymentLabel }}

@if ($order->booking)
Booking: {{ \Carbon\Carbon::parse($order->booking->booking_date)->format('l, F j, Y') }} — {{ $order->booking->time_slot }}
@endif

**Items**

@foreach ($order->orderItems as $orderItem)
<tr>
    <td>
        @if ($orderItem->product)
            {{ $orderItem->product->title }}
        @elseif ($orderItem->giftCardTemplate)
            🎁 Gift card — {{ $orderItem->giftCardTemplate->title}}
        @else
            Item unavailable
        @endif
    </td>
    <td align="right">${{ number_format($orderItem->price, 2) }}</td>
</tr>
@endforeach

Items Subtotal: ${{ number_format($grossTotal, 2) }}
@if ($totalDiscount > 0)
Discount: − ${{ number_format($totalDiscount, 2) }}
@endif
**Total: ${{ number_format($cardAmount, 2) }}**

@if ($totalDiscount > 0 && $cardAmount > 0)
Your order was ${{ number_format($grossTotal, 2) }}. Your discount covered ${{ number_format($totalDiscount, 2) }}. The remaining ${{ number_format($cardAmount, 2) }} was charged to your card.
@elseif ($totalDiscount > 0 && $cardAmount <= 0)
Your discount covered the full order amount of ${{ number_format($grossTotal, 2) }}. No card payment was required.
@endif

@if ($order->shipping_address)
**Shipping Address:** {{ $order->shipping_address }}
@endif

<x-mail::button :url="route('orders.show', $order->id)">
View Order
</x-mail::button>

@endforeach

---

If you have any questions about your order, simply reply to this email.

{{ config('app.name') }}

</x-mail::message>
