import Button from '@/Components/App/ui/Button';
import { label, input, err } from '@/Components/App/formStyles';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Forgot Password" />

            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>
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
                        <div style={{ fontSize: '20px', color: 'var(--color-primary)', marginBottom: 12 }}>
                            ✦
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
                            Reset your password
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
                            Enter the email on your account and we'll send you a
                            link to choose a new password.
                        </p>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '28px 32px 32px' }}>
                        {status && (
                            <div
                                style={{
                                    marginBottom: 20,
                                    padding: '12px 14px',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: 500,
                                    color: 'var(--color-success)',
                                    background: 'var(--color-bg-alt)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm, 3px)',
                                }}
                            >
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <div>
                                <label style={label} htmlFor="email">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    style={input}
                                    value={data.email}
                                    autoFocus
                                    placeholder="you@example.com"
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                {errors.email && <p style={err}>{errors.email}</p>}
                            </div>

                            <div style={{ marginTop: 24 }}>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={processing}
                                    style={{ width: '100%' }}
                                >
                                    {processing ? 'Sending…' : 'Send Reset Link'}
                                </Button>
                            </div>
                        </form>

                        <div style={{ marginTop: 24, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)' }}>

                            <a    href={route('login')}
                                style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}
                                className="hover:underline"
                            >
                                ← Back to sign in
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
