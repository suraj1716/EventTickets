@component('mail::message')
# You've Received a Gift Voucher!

{{ $buyerName ?? 'Someone' }} has sent you a gift voucher worth **A${{ number_format($voucher->amount, 2) }}**.

**Voucher Code:** {{ $voucher->code }}

@component('mail::button', ['url' => route('gift-voucher.shop')])
Redeem Your Voucher
@endcomponent

This voucher is valid until {{ $voucher->expires_at?->format('d M Y') ?? 'no expiry' }}.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
