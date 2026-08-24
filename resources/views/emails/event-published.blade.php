{{-- resources/views/emails/event-published.blade.php --}}
@component('mail::message')
# {{ $event->name }} is confirmed!

Good news — the event you were watching is now confirmed and tickets are on sale.

@if($firstLeg)
**{{ $firstLeg->venue_name }}**
{{ $firstLeg->event_date->format('l, F j, Y') }}
@endif

@component('mail::button', ['url' => route('events.show', $event->slug)])
Get tickets
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
