import Button from '@/Components/App/ui/Button';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({
    status,
}: {
    status?: string;
}) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Email Verification" />

            <div
                style={{
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 20px',
                }}
            >
                <div
                    style={{
                        maxWidth: 440,
                        width: '100%',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md, 4px)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: '32px 32px 24px',
                            textAlign: 'center',
                            borderBottom: '1px solid var(--color-border)',
                            background: 'var(--color-bg-alt)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '20px',
                                color: 'var(--color-primary)',
                                marginBottom: 12,
                            }}
                        >
                            ✉
                        </div>

                        <h1
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 'var(--text-2xl)',
                                fontWeight: 400,
                                color: 'var(--color-text)',
                                margin: 0,
                                marginBottom: 10,
                            }}
                        >
                            Verify your email address
                        </h1>

                        <p
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: 'var(--text-sm)',
                                color: 'var(--color-text-muted)',
                                lineHeight: 1.6,
                                margin: 0,
                            }}
                        >
                            Please confirm your email address to finish
                            setting up your account.
                        </p>
                    </div>

                    {/* Body */}
                    <div
                        style={{
                            padding: '28px 32px 32px',
                        }}
                    >
                        <div
                            style={{
                                marginBottom: 24,
                                fontFamily: 'var(--font-body)',
                                fontSize: 'var(--text-sm)',
                                color: 'var(--color-text-muted)',
                                lineHeight: 1.7,
                            }}
                        >
                            Thanks for signing up. We've sent a verification
                            link to your email address. Click the link in that
                            email to verify your account.
                        </div>

                        {status === 'verification-link-sent' && (
                            <div
                                style={{
                                    marginBottom: 24,
                                    padding: '12px 14px',
                                    border: '1px solid rgba(58, 125, 68, 0.2)',
                                    background:
                                        'rgba(58, 125, 68, 0.06)',
                                    borderRadius:
                                        'var(--radius-sm, 4px)',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: 'var(--text-sm)',
                                    lineHeight: 1.5,
                                    color: 'var(--color-success)',
                                }}
                            >
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                }}
                            >
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={processing}
                                    style={{
                                        width: '100%',
                                    }}
                                >
                                    {processing
                                        ? 'Sending…'
                                        : 'Resend Verification Email'}
                                </Button>

                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    style={{
                                        width: '100%',
                                        padding: '11px 16px',
                                        border: '1px solid var(--color-border)',
                                        borderRadius:
                                            'var(--radius-sm, 4px)',
                                        background: 'transparent',
                                        color:
                                            'var(--color-text-muted)',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: 'var(--text-sm)',
                                        textDecoration: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                    }}
                                >
                                    Log Out
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
