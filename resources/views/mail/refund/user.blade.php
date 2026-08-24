<h2>Refund Processed</h2>
<p>Dear {{ $order->user->name }},</p>

@if($refund->type === 'full')
    <p>Your order <strong>#{{ $order->id }}</strong> has been fully refunded.</p>
@elseif($refund->type === 'booking_fee')
    <p>Your booking fee for <strong>Order #{{ $order->id }}</strong> has been refunded.</p>
@else
    <p>A refund has been processed for <strong>Order #{{ $order->id }}</strong>.</p>
@endif

<p><strong>Amount Refunded:</strong> ${{ number_format($refund->amount, 2) }}</p>

@if($refund->voucher_restored > 0)
    <p><strong>Gift voucher restored:</strong> ${{ number_format($refund->voucher_restored, 2) }} has been added back to your gift voucher balance.</p>
@endif

@if($refund->reason)
    <p><strong>Reason:</strong> {{ $refund->reason }}</p>
@endif

<p>Thank you for shopping with us.</p>
