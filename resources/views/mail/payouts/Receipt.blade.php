{{-- save as resources/views/emails/payouts/receipt.blade.php --}}
@component('mail::message')
# Payout Receipt

Hi {{ $payout->vendor->store_name ?? 'there' }},

A payout has been recorded for your account.

@component('mail::table')
| | |
|---|---|
| **Period** | {{ $payout->starting_from->format('d M Y') }} – {{ $payout->until->format('d M Y') }} |
| **Amount** | A${{ number_format($payout->amount, 2) }} |
| **Reference** | #{{ $payout->id }} |
@endcomponent

This reflects your earnings after platform and processing fees for orders completed during this period.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
