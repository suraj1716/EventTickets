<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto;">
    <h2 style="font-weight: 400;">New Contact Form Submission</h2>

    <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; font-weight: bold; width: 140px;">Name</td><td>{{ $contact->name }}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Email</td><td>{{ $contact->email }}</td></tr>
        @if($contact->phone)
        <tr><td style="padding: 6px 0; font-weight: bold;">Phone</td><td>{{ $contact->phone }}</td></tr>
        @endif
        @if($contact->reason)
        <tr><td style="padding: 6px 0; font-weight: bold;">Reason</td><td>{{ ucfirst(str_replace('_', ' ', $contact->reason)) }}</td></tr>
        @endif
        @if($contact->quantity)
        <tr><td style="padding: 6px 0; font-weight: bold;">Quantity</td><td>{{ $contact->quantity }}</td></tr>
        @endif
    </table>

    <p style="margin-top: 20px; font-weight: bold;">Message</p>
    <p style="white-space: pre-wrap;">{{ $contact->message }}</p>

    @if($contact->file_path)
        <p style="margin-top: 20px;">
            <a href="{{ asset('storage/' . $contact->file_path) }}">View attached file</a>
        </p>
    @endif

    <p style="margin-top: 30px; font-size: 12px; color: #888;">
        Submitted {{ $contact->created_at->format('d M Y, g:i A') }}
    </p>
</body>
</html>
