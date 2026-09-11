{{-- resources/views/mail/staff-invitation.blade.php --}}

<!DOCTYPE html>

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've been invited to join {{ $vendorName }}</title>
</head>

<body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial, Helvetica, sans-serif; color:#222;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5; padding:40px 20px;">
    <tr>
        <td align="center">

            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="max-width:600px; background:#ffffff;">

                {{-- Header / Logo --}}
                <tr>
                    <td style="padding:32px 40px 24px; border-bottom:1px solid #eeeeee;">
                        <img
                            src="https://pub-52e671ba26c14bb5b10e0e3d0f45dfac.r2.dev/logo/logo.png"
                            alt="{{ config('app.name') }}"
                            style="display:block; max-width:180px; max-height:60px; width:auto; height:auto;"
                        >
                    </td>
                </tr>

                {{-- Content --}}
                <tr>
                    <td style="padding:36px 40px 40px;">

                        <h1 style="margin:0 0 20px; font-size:24px; line-height:1.3; font-weight:600; color:#222; text-align:left;">
                            You've been invited to join {{ $vendorName }}
                        </h1>

                        <p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:#333;">
                            Hi {{ $staffName }},
                        </p>

                        <p style="margin:0 0 28px; font-size:15px; line-height:1.7; color:#555;">
                            @if($needsPassword)
                                {{ $vendorName }} has invited you to join their team on {{ config('app.name') }}. Set a password to activate your account and get started.
                            @else
                                {{ $vendorName }} has invited you to join their team on {{ config('app.name') }}. Accept the invitation below to get started.
                            @endif
                        </p>

                        <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="background:#188533; border-radius:4px;">
                                    <a
                                        href="{{ $acceptUrl }}"
                                        style="display:inline-block; padding:13px 26px; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; line-height:1.2;"
                                    >
                                        {{ $needsPassword ? 'Set password & accept' : 'Accept invitation' }}
                                    </a>
                                </td>
                            </tr>
                        </table>

                        <p style="margin:28px 0 0; font-size:13px; line-height:1.6; color:#999;">
                            This invitation link expires in 7 days. If you weren't expecting this, you can safely ignore this email.
                        </p>

                        <p style="margin:32px 0 0; font-size:14px; line-height:1.6; color:#555;">
                            Thanks,<br>
                            <strong>{{ config('app.name') }}</strong>
                        </p>

                    </td>
                </tr>

                {{-- Footer --}}
                <tr>
                    <td style="padding:20px 40px; background:#fafafa; border-top:1px solid #eeeeee;">
                        <p style="margin:0; font-size:12px; line-height:1.5; color:#999; text-align:left;">
                            This is an automated email from {{ config('app.name') }}.
                        </p>
                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>
