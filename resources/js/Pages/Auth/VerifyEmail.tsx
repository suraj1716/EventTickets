import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Mail } from 'lucide-react';

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
};

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Email Verification">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <style>{`
                .ve-page {
                    min-height: 100vh;
                    background: ${C.bg};
                    color: ${C.text};
                    font-family: 'Manrope', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 48px 20px;
                }

                .ve-stub {
                    max-width: 440px;
                    width: 100%;
                    border-radius: 16px;
                    border: 1px solid ${C.border};
                    background: ${C.surface};
                    overflow: hidden;
                }

                .ve-stub-top {
                    padding: 32px 32px 24px;
                    text-align: center;
                }

                .ve-eyebrow {
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

                .ve-eyebrow-dot {
                    display: inline-block;
                    height: 6px;
                    width: 6px;
                    border-radius: 50%;
                    background: ${C.amber};
                }

                .ve-icon {
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

                .ve-title {
                    font-family: 'Anton', sans-serif;
                    text-transform: uppercase;
                    font-size: 1.7rem;
                    line-height: 1.15;
                    letter-spacing: 0.01em;
                    color: ${C.text};
                    margin: 0 0 10px;
                }

                .ve-sub {
                    font-family: 'Manrope', sans-serif;
                    font-size: 13.5px;
                    color: ${C.textMuted};
                    line-height: 1.65;
                    margin: 0;
                }

                /* ── ticket perforation seam ── */
                .ve-perf {
                    position: relative;
                    height: 1px;
                    border-top: 1px dashed ${C.borderDashed};
                }
                .ve-perf::before,
                .ve-perf::after {
                    content: '';
                    position: absolute;
                    top: -10px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: ${C.bg};
                }
                .ve-perf::before { left: -10px; }
                .ve-perf::after { right: -10px; }

                .ve-stub-bottom {
                    padding: 26px 32px 32px;
                }

                .ve-success {
                    margin-bottom: 20px;
                    padding: 12px 14px;
                    border: 1px solid rgba(124, 224, 168, 0.25);
                    background: rgba(124, 224, 168, 0.08);
                    border-radius: 8px;
                    font-family: 'Manrope', sans-serif;
                    font-size: 13px;
                    line-height: 1.5;
                    color: ${C.success};
                }

                .ve-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .ve-btn-primary {
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
                .ve-btn-primary:hover:not(:disabled) { background: ${C.amberHover}; }
                .ve-btn-primary:disabled { opacity: 0.6; cursor: default; }

                .ve-btn-secondary {
                    width: 100%;
                    border: 1px solid ${C.border};
                    border-radius: 10px;
                    background: transparent;
                    color: ${C.textMuted};
                    padding: 12px 16px;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    text-decoration: none;
                    text-align: center;
                    cursor: pointer;
                    transition: border-color 0.15s ease, color 0.15s ease;
                    display: block;
                }
                .ve-btn-secondary:hover {
                    border-color: rgba(255, 182, 39, 0.5);
                    color: ${C.text};
                }
            `}</style>

            <div className="ve-page">
                <div className="ve-stub">
                    <div className="ve-stub-top">
                        <div className="ve-eyebrow">
                            <span className="ve-eyebrow-dot" />
                            Admit One — Pending Activation
                        </div>

                        <div className="ve-icon">
                            <Mail size={20} strokeWidth={1.75} />
                        </div>

                        <h1 className="ve-title">Verify your email</h1>

                        <p className="ve-sub">
                            Thanks for signing up. We&apos;ve sent a
                            verification link to your email address — click
                            it to activate your account before you check out.
                        </p>
                    </div>

                    <div className="ve-perf" />

                    <div className="ve-stub-bottom">
                        {status === 'verification-link-sent' && (
                            <div className="ve-success">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <div className="ve-actions">
                                <button
                                    type="submit"
                                    className="ve-btn-primary"
                                    disabled={processing}
                                >
                                    {processing
                                        ? 'Sending…'
                                        : 'Resend Verification Email'}
                                </button>

                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="ve-btn-secondary"
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
