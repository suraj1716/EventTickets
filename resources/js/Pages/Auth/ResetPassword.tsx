import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { KeyRound } from 'lucide-react';

const C = {
    bg: '#0B0B10',
    surface: '#15141B',
    border: '#26232E',
    borderDashed: '#33303C',
    text: '#F7F5F2',
    textMuted: '#9C97A8',
    textFaint: '#6B6775',
    textFainter: '#565262',
    amber: '#FFB627',
    amberHover: '#ffc75c',
    error: '#FF6B6B',
};

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
            <Head title="Reset Password">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <style>{`
                .rp-page {
                    min-height: 100vh;
                    background: ${C.bg};
                    color: ${C.text};
                    font-family: 'Manrope', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 48px 20px;
                }

                .rp-stub {
                    max-width: 440px;
                    width: 100%;
                    border-radius: 16px;
                    border: 1px solid ${C.border};
                    background: ${C.surface};
                    overflow: hidden;
                }

                .rp-stub-top {
                    padding: 32px 32px 24px;
                    text-align: center;
                }

                .rp-eyebrow {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 0.3em;
                    text-transform: uppercase;
                    color: ${C.amber};
                    margin-bottom: 18px;
                }

                .rp-eyebrow-dot {
                    display: inline-block;
                    height: 6px;
                    width: 6px;
                    border-radius: 50%;
                    background: ${C.amber};
                }

                .rp-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    height: 44px;
                    width: 44px;
                    border-radius: 50%;
                    border: 1px solid rgba(255, 182, 39, 0.3);
                    background: rgba(255, 182, 39, 0.06);
                    color: ${C.amber};
                    margin-bottom: 18px;
                }

                .rp-title {
                    font-family: 'Anton', sans-serif;
                    text-transform: uppercase;
                    font-size: 1.7rem;
                    line-height: 1.15;
                    letter-spacing: 0.01em;
                    color: ${C.text};
                    margin: 0 0 10px;
                }

                .rp-sub {
                    font-family: 'Manrope', sans-serif;
                    font-size: 13.5px;
                    color: ${C.textMuted};
                    line-height: 1.65;
                    margin: 0;
                }

                /* ── ticket perforation seam ── */
                .rp-perf {
                    position: relative;
                    height: 1px;
                    border-top: 1px dashed ${C.borderDashed};
                }
                .rp-perf::before,
                .rp-perf::after {
                    content: '';
                    position: absolute;
                    top: -10px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: ${C.bg};
                }
                .rp-perf::before { left: -10px; }
                .rp-perf::after { right: -10px; }

                .rp-stub-bottom {
                    padding: 26px 32px 32px;
                }

                .rp-form {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                .rp-field label {
                    display: block;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 10.5px;
                    font-weight: 500;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: ${C.textMuted};
                    margin-bottom: 8px;
                }
                .rp-field input {
                    width: 100%;
                    box-sizing: border-box;
                    background: ${C.bg};
                    border: 1px solid ${C.border};
                    border-radius: 8px;
                    padding: 0.85rem 1rem;
                    font-family: 'Manrope', sans-serif;
                    font-size: 14.5px;
                    color: ${C.text};
                    outline: none;
                    transition: border-color 0.15s ease, box-shadow 0.15s ease;
                    appearance: none;
                    -webkit-appearance: none;
                }
                .rp-field input::placeholder { color: ${C.textFainter}; }
                .rp-field input:focus {
                    border-color: ${C.amberHover};
                    box-shadow: 0 0 0 3px rgba(255, 182, 39, 0.15);
                }
                .rp-error {
                    font-size: 11.5px;
                    color: ${C.error};
                    margin-top: 6px;
                    font-family: 'IBM Plex Mono', monospace;
                }

                .rp-submit {
                    margin-top: 6px;
                    width: 100%;
                    border: none;
                    border-radius: 10px;
                    background: ${C.amber};
                    color: ${C.bg};
                    padding: 13px 16px;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }
                .rp-submit:hover:not(:disabled) { background: ${C.amberHover}; }
                .rp-submit:disabled { opacity: 0.6; cursor: default; }
            `}</style>

            <div className="rp-page">
                <div className="rp-stub">
                    <div className="rp-stub-top">
                        <div className="rp-eyebrow">
                            <span className="rp-eyebrow-dot" />
                            Account Recovery
                        </div>

                        <div className="rp-icon">
                            <KeyRound size={20} strokeWidth={1.75} />
                        </div>

                        <h1 className="rp-title">Choose a new password</h1>

                        <p className="rp-sub">
                            Make it something you haven&apos;t used before.
                        </p>
                    </div>

                    <div className="rp-perf" />

                    <div className="rp-stub-bottom">
                        <form onSubmit={submit} className="rp-form">
                            <div className="rp-field">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                />
                                {errors.email && (
                                    <p className="rp-error">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="rp-field">
                                <label htmlFor="password">New password</label>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="new-password"
                                    autoFocus
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />
                                {errors.password && (
                                    <p className="rp-error">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="rp-field">
                                <label htmlFor="password_confirmation">
                                    Confirm password
                                </label>
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.password_confirmation && (
                                    <p className="rp-error">
                                        {errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="rp-submit"
                                disabled={processing}
                            >
                                {processing
                                    ? 'Resetting…'
                                    : 'Reset Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
