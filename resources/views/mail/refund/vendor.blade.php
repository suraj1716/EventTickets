<h2>Order Refund Notification</h2>
<p>Dear {{ $order->vendorUser->name }},</p>

@if($refund->type === 'full')
    <p>Order <strong>#{{ $order->id }}</strong> has been fully refunded to the customer.</p>
@elseif($refund->type === 'booking_fee')
    <p>The booking fee for <strong>Order #{{ $order->id }}</strong> has been refunded to the customer.</p>
@else
    <p>A refund has been issued for <strong>Order #{{ $order->id }}</strong>.</p>
@endif

<p><strong>Refunded Amount:</strong> ${{ number_format($refund->amount, 2) }}</p>

@if($refund->voucher_restored > 0)
    <p><strong>Gift voucher restored:</strong> ${{ number_format($refund->voucher_restored, 2) }}</p>
@endif

<p>Please log in to your dashboard to review details.</p>
