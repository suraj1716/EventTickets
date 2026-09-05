import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const C = {
    bg: '#0B0B10',
    border: '#26232E',
    text: '#F7F5F2',
    textMuted: '#9C97A8',
    textFainter: '#565262',
    amber: '#FFB627',
    amberHover: '#ffc75c',
    success: '#7CE0A8',
    error: '#FF6B6B',
};

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <form onSubmit={submit} className={className}>
            <style>{`
                .pi-field { display: flex; flex-direction: column; gap: 16px; }
                .pi-field label {
                    display: block;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 10.5px;
                    font-weight: 500;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: ${C.textMuted};
                    margin-bottom: 8px;
                }
                .pi-field input {
                    width: 100%;
                    box-sizing: border-box;
                    background: ${C.bg};
                    border: 1px solid ${C.border};
                    border-radius: 8px;
                    padding: 0.8rem 1rem;
                    font-family: 'Manrope', sans-serif;
                    font-size: 14px;
                    color: ${C.text};
                    outline: none;
                    transition: border-color 0.15s ease, box-shadow 0.15s ease;
                }
                .pi-field input::placeholder { color: ${C.textFainter}; }
                .pi-field input:focus {
                    border-color: ${C.amberHover};
                    box-shadow: 0 0 0 3px rgba(255, 182, 39, 0.15);
                }
                .pi-error {
                    font-size: 11.5px;
                    color: ${C.error};
                    margin-top: 6px;
                    font-family: 'IBM Plex Mono', monospace;
                }
                .pi-verify-note {
                    font-family: 'Manrope', sans-serif;
                    font-size: 12.5px;
                    color: ${C.textMuted};
                    line-height: 1.6;
                }
                .pi-verify-link {
                    color: ${C.amber};
                    text-decoration: underline;
                }
                .pi-verify-sent {
                    margin-top: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    color: ${C.success};
                }
                .pi-submit {
                    border: none;
                    border-radius: 10px;
                    background: ${C.amber};
                    color: ${C.bg};
                    padding: 12px 20px;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }
                .pi-submit:hover:not(:disabled) { background: ${C.amberHover}; }
                .pi-submit:disabled { opacity: 0.6; cursor: default; }
                .pi-saved {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: ${C.textMuted};
                }
            `}</style>

            <div className="pi-field">
                <div>
                    <label htmlFor="name">Name</label>
                    <input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoFocus
                        autoComplete="name"
                    />
                    {errors.name && <p className="pi-error">{errors.name}</p>}
                </div>

                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    {errors.email && <p className="pi-error">{errors.email}</p>}
                </div>

                <div>
                    <label htmlFor="phone">Phone</label>
                    <input
                        id="phone"
                        type="tel"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        placeholder="+61 4xx xxx xxx"
                        autoComplete="tel"
                    />
                    {errors.phone && <p className="pi-error">{errors.phone}</p>}
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="pi-verify-note">
                        Your email address is unverified.{' '}
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="pi-verify-link"
                        >
                            Click here to re-send the verification email.
                        </Link>
                        {status === 'verification-link-sent' && (
                            <p className="pi-verify-sent">
                                A new verification link has been sent to your
                                email address.
                            </p>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button type="submit" className="pi-submit" disabled={processing}>
                        Save
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <span className="pi-saved">Saved.</span>
                    </Transition>
                </div>
            </div>
        </form>
    );
}
