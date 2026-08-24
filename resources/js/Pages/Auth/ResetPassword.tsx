import Button from '@/Components/App/ui/Button';
import { label, input, err } from '@/Components/App/formStyles';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Reset Password" />

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
                            Choose a new password
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
                            Make it something you haven't used before.
                        </p>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '28px 32px 32px' }}>
                        <form
                            onSubmit={submit}
                            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                        >
                            <div>
                                <label style={label} htmlFor="email">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    style={{ ...input, width: '100%', boxSizing: 'border-box' }}
                                    value={data.email}
                                    autoComplete="username"
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                {errors.email && <p style={err}>{errors.email}</p>}
                            </div>

                            <div>
                                <label style={label} htmlFor="password">
                                    New password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    style={{ ...input, width: '100%', boxSizing: 'border-box' }}
                                    value={data.password}
                                    autoComplete="new-password"
                                    autoFocus
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                {errors.password && <p style={err}>{errors.password}</p>}
                            </div>

                            <div>
                                <label style={label} htmlFor="password_confirmation">
                                    Confirm password
                                </label>
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    style={{ ...input, width: '100%', boxSizing: 'border-box' }}
                                    value={data.password_confirmation}
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                />
                                {errors.password_confirmation && (
                                    <p style={err}>{errors.password_confirmation}</p>
                                )}
                            </div>

                            <div style={{ marginTop: 6 }}>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={processing}
                                    style={{ width: '100%' }}
                                >
                                    {processing ? 'Resetting…' : 'Reset Password'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
