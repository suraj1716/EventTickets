import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Sparkle } from 'lucide-react';

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
    success: '#7CE0A8',
    error: '#FF6B6B',
};

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
            <Head title="Forgot Password">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <style>{`
                .fp-page {
                    min-height: 100vh;
                    background: ${C.bg};
                    color: ${C.text};
                    font-family: 'Manrope', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 48px 20px;
                }

                .fp-stub {
                    max-width: 440px;
                    width: 100%;
                    border-radius: 16px;
                    border: 1px solid ${C.border};
                    background: ${C.surface};
                    overflow: hidden;
                }

                .fp-stub-top {
                    padding: 32px 32px 24px;
                    text-align: center;
                }

                .fp-eyebrow {
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

                .fp-eyebrow-dot {
                    display: inline-block;
                    height: 6px;
                    width: 6px;
                    border-radius: 50%;
                    background: ${C.amber};
                }

                .fp-icon {
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

                .fp-title {
                    font-family: 'Anton', sans-serif;
                    text-transform: uppercase;
                    font-size: 1.7rem;
                    line-height: 1.15;
                    letter-spacing: 0.01em;
                    color: ${C.text};
                    margin: 0 0 10px;
                }

                .fp-sub {
                    font-family: 'Manrope', sans-serif;
                    font-size: 13.5px;
                    color: ${C.textMuted};
                    line-height: 1.65;
                    margin: 0;
                }

                /* ── ticket perforation seam ── */
                .fp-perf {
                    position: relative;
                    height: 1px;
                    border-top: 1px dashed ${C.borderDashed};
                }
                .fp-perf::before,
                .fp-perf::after {
                    content: '';
                    position: absolute;
                    top: -10px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: ${C.bg};
                }
                .fp-perf::before { left: -10px; }
                .fp-perf::after { right: -10px; }

                .fp-stub-bottom {
                    padding: 26px 32px 32px;
                }

                .fp-status {
                    margin-bottom: 20px;
                    padding: 12px 14px;
                    border: 1px solid rgba(124, 224, 168, 0.25);
                    background: rgba(124, 224, 168, 0.08);
                    border-radius: 8px;
                    font-family: 'Manrope', sans-serif;
                    font-size: 13px;
                    font-weight: 500;
                    line-height: 1.5;
                    color: ${C.success};
                }

                .fp-field { margin-bottom: 0; }
                .fp-field label {
                    display: block;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 10.5px;
                    font-weight: 500;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: ${C.textMuted};
                    margin-bottom: 8px;
                }
                .fp-field input {
                    width: 100%;
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
                .fp-field input::placeholder { color: ${C.textFainter}; }
                .fp-field input:focus {
                    border-color: ${C.amberHover};
                    box-shadow: 0 0 0 3px rgba(255, 182, 39, 0.15);
                }
                .fp-error {
                    font-size: 11.5px;
                    color: ${C.error};
                    margin-top: 6px;
                    font-family: 'IBM Plex Mono', monospace;
                }

                .fp-submit {
                    margin-top: 24px;
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
                .fp-submit:hover:not(:disabled) { background: ${C.amberHover}; }
                .fp-submit:disabled { opacity: 0.6; cursor: default; }

                .fp-back {
                    display: block;
                    margin-top: 22px;
                    text-align: center;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: ${C.textFaint};
                    text-decoration: none;
                    transition: color 0.15s ease;
                }
                .fp-back:hover { color: ${C.amber}; }
            `}</style>

            <div className="fp-page">
                <div className="fp-stub">
                    <div className="fp-stub-top">
                        <div className="fp-eyebrow">
                            <span className="fp-eyebrow-dot" />
                            Account Recovery
                        </div>

                        <div className="fp-icon">
                            <Sparkle size={20} strokeWidth={1.75} />
                        </div>

                        <h1 className="fp-title">Reset your password</h1>

                        <p className="fp-sub">
                            Enter the email on your account and we&apos;ll
                            send you a link to choose a new password.
                        </p>
                    </div>

                    <div className="fp-perf" />

                    <div className="fp-stub-bottom">
                        {status && <div className="fp-status">{status}</div>}

                        <form onSubmit={submit}>
                            <div className="fp-field">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoFocus
                                    placeholder="you@example.com"
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                />
                                {errors.email && (
                                    <p className="fp-error">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="fp-submit"
                                disabled={processing}
                            >
                                {processing
                                    ? 'Sending…'
                                    : 'Send Reset Link'}
                            </button>
                        </form>

                        <Link href={route('login')} className="fp-back">
                            ← Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
