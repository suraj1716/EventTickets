import { useRef, useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import type { FormEventHandler } from "react";
import GoogleLoginButton from "@/Components/Core/GoogleLoginButton";

type RegisterClientErrors = {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const C = {
  bg: "#0B0B10",
  surface: "#15141B",
  border: "#26232E",
  borderDashed: "#33303C",
  text: "#F7F5F2",
  textMuted: "#9C97A8",
  textFaint: "#6B6775",
  textFainter: "#565262",
  amber: "#FFB627",
  amberHover: "#ffc75c",
  error: "#FF6B6B",
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style>{`
        .bo-auth-overlay {
          position: fixed; inset: 0; z-index: 99999;
          background: rgba(11, 11, 16, 0.78);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .bo-auth-modal {
          position: relative; width: 100%; max-width: 420px;
          max-height: calc(100vh - 2rem); overflow-y: auto;
          background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 16px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6); font-family: 'Manrope', sans-serif;
        }
        .bo-auth-close {
          position: absolute; top: 1rem; right: 1rem; background: none; border: none;
          color: ${C.textFaint}; font-size: 1.15rem; line-height: 1; cursor: pointer;
          padding: 0.35rem; transition: color 0.15s ease; z-index: 2;
        }
        .bo-auth-close:hover { color: ${C.amber}; }
        .bo-auth-top { padding: 30px 30px 22px; text-align: center; }
        .bo-auth-eyebrow {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'IBM Plex Mono', monospace; font-size: 11px;
          letter-spacing: 0.3em; text-transform: uppercase; color: ${C.amber}; margin-bottom: 14px;
        }
        .bo-auth-eyebrow-dot { display: inline-block; height: 6px; width: 6px; border-radius: 50%; background: ${C.amber}; }
        .bo-auth-title {
          font-family: 'Anton', sans-serif; text-transform: uppercase;
          font-size: 1.6rem; line-height: 1.15; letter-spacing: 0.01em; color: ${C.text}; margin: 0 0 8px;
        }
        .bo-auth-sub { font-family: 'Manrope', sans-serif; font-size: 13px; color: ${C.textMuted}; line-height: 1.6; margin: 0; }
        .bo-auth-perf { position: relative; height: 1px; border-top: 1px dashed ${C.borderDashed}; }
        .bo-auth-perf::before, .bo-auth-perf::after {
          content: ''; position: absolute; top: -10px; width: 20px; height: 20px; border-radius: 50%; background: ${C.bg};
        }
        .bo-auth-perf::before { left: -10px; }
        .bo-auth-perf::after { right: -10px; }
        .bo-auth-bottom { padding: 24px 30px 30px; }
        .bo-auth-form { display: flex; flex-direction: column; gap: 16px; }
        .bo-auth-field { margin-bottom: 0; display: flex; flex-direction: column; gap: 7px; }
        .bo-auth-field label {
          font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase; color: ${C.textMuted};
        }
        .bo-auth-input-wrap { position: relative; }
        .bo-auth-field input {
          width: 100%; background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 8px;
          padding: 0.8rem 1rem; font-family: 'Manrope', sans-serif; font-size: 14.5px;
          color: ${C.text}; outline: none; transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
        }
        .bo-auth-field input.has-error { border-color: rgba(255,107,107,0.5); }
        .bo-auth-field input::placeholder { color: ${C.textFainter}; }
        .bo-auth-field input:focus { border-color: ${C.amberHover}; box-shadow: 0 0 0 3px rgba(255,182,39,0.15); }
        .bo-auth-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          border: none; background: transparent; padding: 4px; cursor: pointer;
          color: ${C.textFaint}; display: flex; align-items: center; justify-content: center;
        }
        .bo-auth-eye:hover { color: ${C.amber}; }
        .bo-auth-error { font-size: 11.5px; color: ${C.error}; margin-top: 2px; font-family: 'IBM Plex Mono', monospace; }
        .bo-auth-submit {
          width: 100%; border: none; border-radius: 10px; background: ${C.amber}; color: ${C.bg};
          padding: 13px 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: background 0.15s ease;
        }
        .bo-auth-submit:hover:not(:disabled) { background: ${C.amberHover}; }
        .bo-auth-submit:disabled { opacity: 0.6; cursor: default; }
        .bo-auth-divider { display: flex; align-items: center; gap: 10px; }
        .bo-auth-divider-line { flex: 1; height: 1px; background: ${C.border}; }
        .bo-auth-divider-text { color: ${C.textFaint}; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; }
        .bo-auth-switch { text-align: center; font-size: 12.5px; color: ${C.textMuted}; margin: 0; }
        .bo-auth-switch button {
          background: none; border: none; padding: 0; color: ${C.amber}; font-size: 12.5px;
          cursor: pointer; text-decoration: underline; text-underline-offset: 3px; font-family: 'Manrope', sans-serif;
        }
        .bo-auth-switch button:hover { color: ${C.amberHover}; }
      `}</style>

      <div className="bo-auth-overlay" onClick={handleOverlayClick}>
        <div className="bo-auth-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
          <button className="bo-auth-close" onClick={onClose} aria-label="Close">✕</button>

          <div className="bo-auth-top">
            <div className="bo-auth-eyebrow">
              <span className="bo-auth-eyebrow-dot" />
              New Account
            </div>
            <h2 className="bo-auth-title">Join Box Office</h2>
            <p className="bo-auth-sub">Create an account to start booking tickets.</p>
          </div>

          <div className="bo-auth-perf" />

          <div className="bo-auth-bottom">
            {status && <div className="bo-auth-status">{status}</div>}

            <form onSubmit={submit} noValidate className="bo-auth-form">
              <div className="bo-auth-field">
                <label htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  name="name"
                  autoComplete="name"
                  type="text"
                  value={data.name}
                  onChange={(e) => {
                    setData("name", e.target.value);
                    if (clientErrors.name) setClientErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="Jane Doe"
                  className={nameError ? "has-error" : ""}
                />
                {nameError && String(nameError).trim() && <span className="bo-auth-error">{nameError}</span>}
              </div>

              <div className="bo-auth-field">
                <label htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  name="email"
                  autoComplete="username"
                  type="text"
                  value={data.email}
                  onChange={(e) => {
                    setData("email", e.target.value);
                    if (clientErrors.email) setClientErrors((p) => ({ ...p, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  className={emailError ? "has-error" : ""}
                />
                {emailError && String(emailError).trim() && <span className="bo-auth-error">{emailError}</span>}
              </div>

              <div className="bo-auth-field">
                <label htmlFor="reg-password">Password</label>
                <div className="bo-auth-input-wrap">
                  <input
                    id="reg-password"
                    name="password"
                    autoComplete="new-password"
                    type={showPassword ? "text" : "password"}
                    value={data.password}
                    onChange={(e) => {
                      setData("password", e.target.value);
                      if (clientErrors.password) setClientErrors((p) => ({ ...p, password: undefined }));
                    }}
                    placeholder="••••••••"
                    style={{ paddingRight: "44px" }}
                    className={passwordError ? "has-error" : ""}
                  />
                  <button
                    type="button"
                    className="bo-auth-eye"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5.5 0 9.3 4 10 8-.3 1.7-1.1 3.2-2.2 4.4" />
                        <path d="M6.6 6.6C4.5 7.9 3.1 9.9 2 12c.7 4 4.5 8 10 8 1.4 0 2.7-.3 3.9-.8" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && String(passwordError).trim() && <span className="bo-auth-error">{passwordError}</span>}
              </div>

              <div className="bo-auth-field">
                <label htmlFor="reg-password-confirm">Confirm Password</label>
                <div className="bo-auth-input-wrap">
                  <input
                    id="reg-password-confirm"
                    name="password_confirmation"
                    autoComplete="new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={data.password_confirmation}
                    onChange={(e) => {
                      setData("password_confirmation", e.target.value);
                      if (clientErrors.password_confirmation) {
                        setClientErrors((p) => ({ ...p, password_confirmation: undefined }));
                      }
                    }}
                    placeholder="••••••••"
                    style={{ paddingRight: "44px" }}
                    className={confirmError ? "has-error" : ""}
                  />
                  <button
                    type="button"
                    className="bo-auth-eye"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5.5 0 9.3 4 10 8-.3 1.7-1.1 3.2-2.2 4.4" />
                        <path d="M6.6 6.6C4.5 7.9 3.1 9.9 2 12c.7 4 4.5 8 10 8 1.4 0 2.7-.3 3.9-.8" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {confirmError && String(confirmError).trim() && <span className="bo-auth-error">{confirmError}</span>}
              </div>

              <button type="submit" className="bo-auth-submit" disabled={processing}>
                {processing ? "Creating account…" : "Create Account"}
              </button>

              <div className="bo-auth-divider">
                <div className="bo-auth-divider-line" />
                <span className="bo-auth-divider-text">or</span>
                <div className="bo-auth-divider-line" />
              </div>

              <GoogleLoginButton className="w-full" />

              <p className="bo-auth-switch">
                Already have an account?{" "}
                <button type="button" onClick={onSwitchToLogin}>
                  Sign in
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
