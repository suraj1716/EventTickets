import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { X } from 'lucide-react';

const C = {
    bg: '#0B0B10',
    surface: '#15141B',
    border: '#26232E',
    text: '#F7F5F2',
    textMuted: '#9C97A8',
    textFainter: '#565262',
    amber: '#FFB627',
    amberHover: '#ffc75c',
    danger: '#FF1F1F',
    dangerHover: '#D90000',
    error: '#FF6B6B',
    overlay: 'rgba(11,11,16,0.7)',
};

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={className}>
            <style>{`
                .du-title {
                    font-family: 'Anton', sans-serif;
                    text-transform: uppercase;
                    font-size: 1.1rem;
                    color: ${C.text};
                    margin: 0;
                }
                .du-copy {
                    margin-top: 8px;
                    font-family: 'Manrope', sans-serif;
                    font-size: 13px;
                    color: ${C.textMuted};
                    line-height: 1.6;
                }
                .du-btn-danger {
                    border: 1px solid ${C.danger};
                    border-radius: 10px;
                    background: ${C.danger};
                    color: #fff;
                    padding: 11px 20px;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: background 0.15s ease, border-color 0.15s ease;
                }
                .du-btn-danger:hover:not(:disabled) {
                    background: ${C.dangerHover};
                    border-color: ${C.dangerHover};
                }
                .du-btn-danger:disabled { opacity: 0.6; cursor: default; }

                .du-btn-ghost {
                    border: 1px solid ${C.border};
                    border-radius: 10px;
                    background: transparent;
                    color: ${C.textMuted};
                    padding: 11px 18px;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: border-color 0.15s ease, color 0.15s ease;
                }
                .du-btn-ghost:hover { border-color: rgba(255,182,39,0.5); color: ${C.text}; }

                .du-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    background: ${C.overlay};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .du-modal-card {
                    width: 100%;
                    max-width: 460px;
                    background: ${C.surface};
                    border: 1px solid ${C.border};
                    border-radius: 16px;
                    padding: 32px;
                    position: relative;
                }
                .du-modal-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: none;
                    border: none;
                    color: ${C.textFainter};
                    cursor: pointer;
                }
                .du-modal-close:hover { color: ${C.amber}; }
                .du-modal-title {
                    font-family: 'Anton', sans-serif;
                    text-transform: uppercase;
                    font-size: 1.25rem;
                    color: ${C.text};
                    margin: 0 0 10px;
                }
                .du-modal-copy {
                    font-family: 'Manrope', sans-serif;
                    font-size: 13px;
                    color: ${C.textMuted};
                    line-height: 1.6;
                    margin: 0;
                }
                .du-field { margin-top: 22px; }
                .du-field input {
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
                .du-field input::placeholder { color: ${C.textFainter}; }
                .du-field input:focus {
                    border-color: ${C.amberHover};
                    box-shadow: 0 0 0 3px rgba(255, 182, 39, 0.15);
                }
                .du-error {
                    font-size: 11.5px;
                    color: ${C.error};
                    margin-top: 6px;
                    font-family: 'IBM Plex Mono', monospace;
                }
            `}</style>

            <header>
                <h3 className="du-title">Delete Account</h3>
                <p className="du-copy">
                    Once your account is deleted, all of its resources and data
                    will be permanently deleted. Before deleting your account,
                    please download any data or information that you wish to
                    retain.
                </p>
            </header>

            <div style={{ marginTop: 16 }}>
                <button className="du-btn-danger" onClick={confirmUserDeletion}>
                    Delete Account
                </button>
            </div>

            {confirmingUserDeletion && (
                <div className="du-modal-overlay" onClick={closeModal}>
                    <div
                        className="du-modal-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="du-modal-close"
                            onClick={closeModal}
                            aria-label="Close"
                        >
                            <X size={18} strokeWidth={1.5} />
                        </button>

                        <form onSubmit={deleteUser}>
                            <h3 className="du-modal-title">
                                Are you sure you want to delete your account?
                            </h3>

                            <p className="du-modal-copy">
                                Once your account is deleted, all of its
                                resources and data will be permanently deleted.
                                Please enter your password to confirm you would
                                like to permanently delete your account.
                            </p>

                            <div className="du-field">
                                <label htmlFor="password" className="sr-only">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    autoFocus
                                    placeholder="Password"
                                />
                                {errors.password && (
                                    <p className="du-error">{errors.password}</p>
                                )}
                            </div>

                            <div
                                style={{
                                    marginTop: 24,
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: 12,
                                }}
                            >
                                <button
                                    type="button"
                                    className="du-btn-ghost"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="du-btn-danger"
                                    disabled={processing}
                                >
                                    Delete Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
