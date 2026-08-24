import { useRef, useState } from 'react';
import { useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import GoogleLoginButton from '@/Components/Core/GoogleLoginButton';

type RegisterClientErrors = {
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Helpers ──────────────────────────────────────────────────

function inputStyle(hasError: boolean): React.CSSProperties {
    return {
        width: "100%",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${hasError ? "rgba(220,60,60,0.6)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: "2px",
        padding: "0.75rem 1rem",
        color: "rgba(255,255,255,0.88)",
        fontFamily: "Jost, sans-serif",
        fontSize: "0.875rem",
        letterSpacing: "0.02em",
        outline: "none",
        transition: "border-color 0.2s",
        boxSizing: "border-box",
    };
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label
                style={{
                    fontFamily: "Jost, sans-serif",
                    fontSize: "0.68rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                }}
            >
                {label}
            </label>
            {children}
            {error && error.trim() && (
                <span
                    style={{
                        fontSize: "0.72rem",
                        color: "rgba(255,110,110,0.85)",
                        letterSpacing: "0.02em",
                    }}
                >
                    {error}
                </span>
            )}
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────

export default function RegisterModal({
    isOpen,
    onClose,
    onSwitchToLogin,
    status,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToLogin?: () => void;
    status?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const [clientErrors, setClientErrors] = useState<RegisterClientErrors>({});
    const modalRef = useRef<HTMLDivElement>(null);
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const validate = () => {
        const next: RegisterClientErrors = {};

        if (!data.name.trim()) {
            next.name = "Name is required.";
        }
        if (!data.email.trim()) {
            next.email = "Email is required.";
        } else if (!EMAIL_REGEX.test(data.email)) {
            next.email = "Enter a valid email address.";
        }
        if (!data.password) {
            next.password = "Password is required.";
        } else if (data.password.length < 8) {
            next.password = "Password must be at least 8 characters.";
        }
        if (!data.password_confirmation) {
            next.password_confirmation = "Please confirm your password.";
        } else if (data.password_confirmation !== data.password) {
            next.password_confirmation = "Passwords do not match.";
        }

        setClientErrors(next);
        return Object.keys(next).length === 0;
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!validate()) return;

        post(route("register"), {
            onSuccess: () => {
                reset();
                onClose();
            },
            onError: () => {
                reset("password", "password_confirmation");
            },
        });
    };

    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const nameError = clientErrors.name || errors.name;
    const emailError = clientErrors.email || errors.email;
    const passwordError = clientErrors.password || errors.password;
    const confirmError = clientErrors.password_confirmation || errors.password_confirmation;

    return (
        <div
            onClick={handleOverlayClick}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,
                background: "rgba(10, 9, 8, 0.72)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
            }}
        >
            <div
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    background: "rgb(28, 26, 23)",
                    border: "1px solid rgba(212, 175, 90, 0.2)",
                    borderRadius: "2px",
                    width: "100%",
                    maxWidth: "420px",
                    padding: "3rem 2.5rem",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
                }}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                        position: "absolute",
                        top: "1.25rem",
                        right: "1.25rem",
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.35)",
                        fontSize: "1.25rem",
                        lineHeight: 1,
                        cursor: "pointer",
                        padding: "0.25rem",
                        transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color = "rgba(212,175,90,0.9)")
                    }
                    onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)")
                    }
                >
                    ✕
                </button>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "2.25rem" }}>
                    <p
                        style={{
                            fontFamily: "Cormorant Garamond, Georgia, serif",
                            fontSize: "0.65rem",
                            letterSpacing: "0.25em",
                            textTransform: "uppercase",
                            color: "rgba(212,175,90,0.75)",
                            marginBottom: "0.6rem",
                        }}
                    >
                        Join us
                    </p>
                    <h2
                        style={{
                            fontFamily: "Cormorant Garamond, Georgia, serif",
                            fontSize: "2rem",
                            fontWeight: 300,
                            color: "rgba(255,255,255,0.92)",
                            letterSpacing: "0.04em",
                            margin: 0,
                        }}
                    >
                        Create Account
                    </h2>
                    <div
                        style={{
                            width: "2rem",
                            height: "1px",
                            background: "rgba(212,175,90,0.45)",
                            margin: "0.85rem auto 0",
                        }}
                    />
                </div>

                {status && (
                    <div
                        style={{
                            marginBottom: "1.25rem",
                            padding: "0.65rem 1rem",
                            background: "rgba(74,163,105,0.12)",
                            border: "1px solid rgba(74,163,105,0.3)",
                            borderRadius: "2px",
                            color: "rgba(120,210,140,0.9)",
                            fontSize: "0.8rem",
                            letterSpacing: "0.02em",
                        }}
                    >
                        {status}
                    </div>
                )}

                <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                    <Field label="Name" error={nameError}>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => {
                                setData("name", e.target.value);
                                if (clientErrors.name)
                                    setClientErrors((p) => ({ ...p, name: undefined }));
                            }}
                            placeholder="Your full name"
                            style={inputStyle(!!nameError)}
                        />
                    </Field>

                    <Field label="Email Address" error={emailError}>
                        <input
                            id="reg-email"
                            name="email"
                            type="text"
                            autoComplete="username"
                            value={data.email}
                            onChange={(e) => {
                                setData("email", e.target.value);
                                if (clientErrors.email)
                                    setClientErrors((p) => ({ ...p, email: undefined }));
                            }}
                            placeholder="your@email.com"
                            style={inputStyle(!!emailError)}
                        />
                    </Field>

                 <Field label="Password" error={passwordError}>
    <div style={{ position: "relative" }}>
        <input
            id="reg-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={data.password}
            onChange={(e) => {
                setData("password", e.target.value);

                if (clientErrors.password) {
                    setClientErrors((p) => ({
                        ...p,
                        password: undefined,
                    }));
                }
            }}
            placeholder="••••••••"
            style={{
                ...inputStyle(!!passwordError),
                paddingRight: "44px",
            }}
        />

        <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                padding: "4px",
                cursor: "pointer",
                color: "var(--color-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {showPassword ? (
                <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5.5 0 9.3 4 10 8-.3 1.7-1.1 3.2-2.2 4.4" />
                    <path d="M6.6 6.6C4.5 7.9 3.1 9.9 2 12c.7 4 4.5 8 10 8 1.4 0 2.7-.3 3.9-.8" />
                </svg>
            ) : (
                <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            )}
        </button>
    </div>
</Field>


<Field label="Confirm Password" error={confirmError}>
    <div style={{ position: "relative" }}>
        <input
            id="reg-password-confirm"
            name="password_confirmation"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            value={data.password_confirmation}
            onChange={(e) => {
                setData("password_confirmation", e.target.value);

                if (clientErrors.password_confirmation) {
                    setClientErrors((p) => ({
                        ...p,
                        password_confirmation: undefined,
                    }));
                }
            }}
            placeholder="••••••••"
            style={{
                ...inputStyle(!!confirmError),
                paddingRight: "44px",
            }}
        />

        <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={
                showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
            }
            style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                padding: "4px",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {showConfirmPassword ? (
                <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5.5 0 9.3 4 10 8-.3 1.7-1.1 3.2-2.2 4.4" />
                    <path d="M6.6 6.6C4.5 7.9 3.1 9.9 2 12c.7 4 4.5 8 10 8 1.4 0 2.7-.3 3.9-.8" />
                </svg>
            ) : (
                <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            )}
        </button>
    </div>
</Field>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing}
                        style={{
                            width: "100%",
                            padding: "0.85rem",
                            background: processing
                                ? "rgba(212,175,90,0.4)"
                                : "rgba(212,175,90,0.9)",
                            border: "none",
                            borderRadius: "2px",
                            color: "rgb(28,26,23)",
                            fontFamily: "Jost, sans-serif",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            cursor: processing ? "not-allowed" : "pointer",
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            if (!processing)
                                (e.currentTarget as HTMLButtonElement).style.background =
                                    "rgba(212,175,90,1)";
                        }}
                        onMouseLeave={(e) => {
                            if (!processing)
                                (e.currentTarget as HTMLButtonElement).style.background =
                                    "rgba(212,175,90,0.9)";
                        }}
                    >
                        {processing ? "Creating account…" : "Create Account"}
                    </button>

                    {/* Divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                        <span
                            style={{
                                color: "rgba(255,255,255,0.25)",
                                fontSize: "0.7rem",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                            }}
                        >
                            or
                        </span>
                        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                    </div>

                    <GoogleLoginButton className="w-full" />

                    {/* Switch to login */}
                    <p
                        style={{
                            textAlign: "center",
                            fontSize: "0.75rem",
                            letterSpacing: "0.04em",
                            color: "rgba(255,255,255,0.35)",
                            margin: 0,
                        }}
                    >
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                color: "rgba(212,175,90,0.75)",
                                fontSize: "0.75rem",
                                letterSpacing: "0.04em",
                                cursor: "pointer",
                                textDecoration: "underline",
                                textUnderlineOffset: "3px",
                                transition: "color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                                ((e.currentTarget as HTMLButtonElement).style.color = "rgba(212,175,90,1)")
                            }
                            onMouseLeave={(e) =>
                                ((e.currentTarget as HTMLButtonElement).style.color = "rgba(212,175,90,0.75)")
                            }
                        >
                            Sign in
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}
