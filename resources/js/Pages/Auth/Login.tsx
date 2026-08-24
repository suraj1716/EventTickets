import { useRef, useState } from "react";
import InputError from "@/Components/Core/InputError";
import { Link, router } from "@inertiajs/react";
import type { FormEventHandler } from "react";
import GoogleLoginButton from "@/Components/Core/GoogleLoginButton";

type LoginClientErrors = {
  email?: string;
  password?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getFreshCsrfToken(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
function getCsrfToken(): string {
  return (
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") ?? ""
  );
}

export default function LoginModal({
  isOpen,
  onClose,
  status,
  canResetPassword = true,
  onSwitchToRegister,
}: {
  isOpen: boolean;
  onClose: () => void;
  status?: string;
  canResetPassword?: boolean;
  onSwitchToRegister?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [clientErrors, setClientErrors] = useState<LoginClientErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const next: LoginClientErrors = {};
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email)) {
      next.email = "Enter a valid email address.";
    }
    if (!password) {
      next.password = "Password is required.";
    }
    setClientErrors(next);
    return Object.keys(next).length === 0;
  };

const submit: FormEventHandler = async (e) => {
  e.preventDefault();
  setServerError(null);
  if (!validate()) return;

  setProcessing(true);

  try {
    const response = await fetch(route("login"), {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
          "X-XSRF-TOKEN": getFreshCsrfToken(), // ← was "X-CSRF-TOKEN"
      },
      body: JSON.stringify({ email, password, remember }),
    });

    if (response.status === 422) {
      const data = await response.json();
      const msg =
        data.errors?.email?.[0] ?? data.errors?.password?.[0] ?? "Invalid credentials.";
      setServerError(msg);
      setClientErrors((prev) => ({ ...prev, password: " " }));
      setPassword("");
      return;
    }

    if (!response.ok) {
      setServerError("Something went wrong. Please try again.");
      return;
    }

    const data = await response.json();
    onClose();
    router.visit(data.redirect ?? "/"); // real, intentional navigation on success
  } catch {
    setServerError("Network error. Please try again.");
  } finally {
    setProcessing(false);
  }
};

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };
  const emailError = clientErrors.email;
  const passwordError = clientErrors.password;

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
          background: "var(--color-primary)",
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
            ((e.currentTarget as HTMLButtonElement).style.color =
              "rgba(212,175,90,0.9)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              "rgba(255,255,255,0.35)")
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
              color: "var(--color-accent)",
              marginBottom: "0.6rem",
            }}
          >
            Welcome back
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
            Sign In
          </h2>
          <div
            style={{
              width: "2rem",
              height: "1px",
              background:"var(--color-accent)",
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

        <form
          onSubmit={submit}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Email */}
          <Field label="Email Address" error={emailError}>
            <input
              autoComplete="username"
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (clientErrors.email)
                  setClientErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="your@email.com"
              style={inputStyle(!!emailError)}
            />
          </Field>

       {/* Password */}
<Field label="Password" error={passwordError}>
  <div style={{ position: "relative" }}>
    <input
      autoComplete="current-password"
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => {
        setPassword(e.target.value);

        if (clientErrors.password) {
          setClientErrors((p) => ({
            ...p,
            password: undefined,
          }));
          setServerError(null);
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
        // Eye off
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
        // Eye
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

          {/* Remember + Forgot */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "-0.5rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                color: "rgba(255,255,255,0.45)",
                fontSize: "0.75rem",
                letterSpacing: "0.04em",
              }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ accentColor: "rgb(212,175,90)" }}
              />
              Remember me
            </label>

         {canResetPassword && (
    <button
        type="button"
        onClick={() => {
            onClose();
            router.visit(route("password.request"));
        }}
        style={{
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
            fontSize: "0.75rem",
            letterSpacing: "0.04em",
            color: "var(--color-accent)",
        }}
    >
        Forgot password?
    </button>
)}
          </div>

          {/* Server error banner */}
          {serverError && (
            <div
              style={{
                padding: "0.65rem 1rem",
                background: "rgba(220,60,60,0.1)",
                border: "1px solid rgba(220,60,60,0.3)",
                borderRadius: "2px",
                color: "rgba(255,110,110,0.9)",
                fontSize: "0.8rem",
                letterSpacing: "0.02em",
                textAlign: "center",
              }}
            >
              {serverError}
            </div>
          )}

          {/* Submit */}
         <button
  type="submit"
  disabled={processing}
  style={{
    width: "100%",
    padding: "0.85rem",
    background: processing
      ? "var(--color-primary-200)"
      : "var(--color-accent)",
    border: "none",
    borderRadius: "2px",
    color: "var(--color-bg-dark-black)",
    fontFamily: "var(--font-body)",
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    cursor: processing ? "not-allowed" : "pointer",
    transition: "background 0.2s",
  }}
  onMouseEnter={(e) => {
    if (!processing) {
      e.currentTarget.style.background = "var(--color-accent-dark)";
    }
  }}
  onMouseLeave={(e) => {
    if (!processing) {
      e.currentTarget.style.background = "var(--color-accent)";
    }
  }}
>
  {processing ? "Signing in…" : "Sign In"}
</button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(255,255,255,0.35)",
              }}
            />
            <span
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: "0.7rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              or
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(255,255,255,0.35)",
              }}
            />
          </div>

          <GoogleLoginButton className="w-full" />

          {/* Switch to register */}
          <p
            style={{
              textAlign: "center",
              fontSize: "0.75rem",
              letterSpacing: "0.04em",
              color: "rgba(255,255,255,0.75)",
              margin: 0,
            }}
          >
            New to RB Hair & Beauty Lounge?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--color-accent)",
                fontSize: "0.75rem",
                letterSpacing: "0.04em",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "var(--color-accent-dark)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "var(--color-accent)")
              }
            >
              Create an account
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${
      hasError
        ? "rgba(255,255,255,0.1)"
        : "rgba(255,255,255,0.1)"
    }`,
    borderRadius: "2px",
    padding: "0.75rem 1rem",
    color: "var(--color-surface)",
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
          color: "var(--color-surface-warm)",
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
