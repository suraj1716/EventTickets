<x-mail::message>
# Confirm your watchlist

You've asked to be notified when **{{ $watchlist->event->name }}** is confirmed
and tickets become available.

Please confirm that this email address belongs to you.

<x-mail::button :url="route('events.watchlist.verify', ['token' => $token])">
Confirm watchlist
</x-mail::button>

If you didn't request this, you can safely ignore this email.

This confirmation link expires in 24 hours.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
