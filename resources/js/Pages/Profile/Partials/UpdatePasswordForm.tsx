import { FormEventHandler, useRef } from "react";
import { useForm } from "@inertiajs/react";
import { Transition } from "@headlessui/react";

const C = {
    bg: "#0B0B10",
    border: "#26232E",
    text: "#F7F5F2",
    textMuted: "#9C97A8",
    textFainter: "#565262",
    amber: "#FFB627",
    amberHover: "#ffc75c",
    error: "#FF6B6B",
};

export default function UpdatePasswordForm({
    className = "",
}: {
    className?: string;
}) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } =
        useForm({
            current_password: "",
            password: "",
            password_confirmation: "",
        });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route("password.update"), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset("password", "password_confirmation");
                    passwordInput.current?.focus();
                }
                if (errors.current_password) {
                    reset("current_password");
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <form onSubmit={updatePassword} className={className}>
            <style>{`
                .up-field { display: flex; flex-direction: column; gap: 16px; }
                .up-field label {
                    display: block;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 10.5px;
                    font-weight: 500;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: ${C.textMuted};
                    margin-bottom: 8px;
                }
                .up-field input {
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
                .up-field input::placeholder { color: ${C.textFainter}; }
                .up-field input:focus {
                    border-color: ${C.amberHover};
                    box-shadow: 0 0 0 3px rgba(255, 182, 39, 0.15);
                }
                .up-error {
                    font-size: 11.5px;
                    color: ${C.error};
                    margin-top: 6px;
                    font-family: 'IBM Plex Mono', monospace;
                }
                .up-submit {
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
                .up-submit:hover:not(:disabled) { background: ${C.amberHover}; }
                .up-submit:disabled { opacity: 0.6; cursor: default; }
                .up-saved {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: ${C.textMuted};
                }
            `}</style>

            <div className="up-field">
                <div>
                    <label htmlFor="current_password">Current Password</label>
                    <input
                        id="current_password"
                        ref={currentPasswordInput}
                        type="password"
                        value={data.current_password}
                        onChange={(e) => setData("current_password", e.target.value)}
                        autoComplete="current-password"
                    />
                    {errors.current_password && (
                        <p className="up-error">{errors.current_password}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="password">New Password</label>
                    <input
                        id="password"
                        ref={passwordInput}
                        type="password"
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        autoComplete="new-password"
                    />
                    {errors.password && <p className="up-error">{errors.password}</p>}
                </div>

                <div>
                    <label htmlFor="password_confirmation">Confirm Password</label>
                    <input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData("password_confirmation", e.target.value)
                        }
                        autoComplete="new-password"
                    />
                    {errors.password_confirmation && (
                        <p className="up-error">{errors.password_confirmation}</p>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button type="submit" className="up-submit" disabled={processing}>
                        Save
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <span className="up-saved">Saved.</span>
                    </Transition>
                </div>
            </div>
        </form>
    );
}
