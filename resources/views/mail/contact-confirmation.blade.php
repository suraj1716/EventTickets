<!DOCTYPE html>
<html>
<body style="font-family: 'Georgia', serif; color: #2a2a2a; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="font-weight: 400; letter-spacing: 1px;">RB Hair & Beauty Lounge</h1>

    <p>Hi {{ $contact->name }},</p>

    <p>
        Thank you for reaching out — we've received your message and someone from our team
        will get back to you shortly, usually within 1–2 business days.
    </p>

    <p style="margin-top: 20px; padding: 16px; background: #f7f5f2; border-left: 3px solid #b08d57;">
        {{ $contact->message }}
    </p>

    <p style="margin-top: 30px;">
        Warm regards,<br>
        The RB Hair & Beauty Lounge Team
    </p>
</body>
</html>
