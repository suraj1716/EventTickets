import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { router } from "@inertiajs/react";
import type { FormEventHandler } from "react";
import GoogleLoginButton from "@/Components/Core/GoogleLoginButton";

type LoginClientErrors = {
  email?: string;
  password?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const C = {
  bg: "#0B0B10",
  surface: "#15141B",
  border: "#26232E",
  text: "#F7F5F2",
  textMuted: "#9C97A8",
  textFaint: "#6B6775",
  textFainter: "#565262",
  amber: "#FFB627",
  amberHover: "#ffc75c",
  success: "#7CE0A8",
  error: "#FF6B6B",
};

function getFreshCsrfToken(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
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
  const [clientErrors, setClientErrors] =
    useState<LoginClientErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  /*
   * Load fonts when modal opens.
   */
  useEffect(() => {
    if (!isOpen) return;

    if (document.getElementById("bo-auth-font-preconnect")) {
      return;
    }

    const preconnect = document.createElement("link");
    preconnect.id = "bo-auth-font-preconnect";
    preconnect.rel = "preconnect";
    preconnect.href = "https://fonts.googleapis.com";

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href =
      "https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap";

    document.head.appendChild(preconnect);
    document.head.appendChild(stylesheet);
  }, [isOpen]);

  /*
   * Completely lock the page behind the modal.
   *
   * We use position: fixed rather than only overflow:hidden
   * because mobile browsers can otherwise still move the page.
   */
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;

    const html = document.documentElement;
    const body = document.body;

    html.style.overflow = "hidden";

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      html.style.overflow = "";

      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";

      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

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

    if (!validate()) {
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(route("login"), {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": getFreshCsrfToken(),
        },
        body: JSON.stringify({
          email,
          password,
          remember,
        }),
      });

      if (response.status === 422) {
        const data = await response.json();

        const msg =
          data.errors?.email?.[0] ??
          data.errors?.password?.[0] ??
          "Invalid credentials.";

        setServerError(msg);

        setClientErrors((prev) => ({
          ...prev,
          password: " ",
        }));

        setPassword("");

        return;
      }

      if (!response.ok) {
        setServerError(
          "Something went wrong. Please try again."
        );

        return;
      }

      const data = await response.json();

      onClose();

      router.visit(data.redirect ?? "/");
    } catch {
      setServerError(
        "Network error. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (
      modalRef.current &&
      !modalRef.current.contains(e.target as Node)
    ) {
      onClose();
    }
  };

  const emailError = clientErrors.email;
  const passwordError = clientErrors.password;

  return createPortal(
    <>
      <style>{`
        .bo-auth-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;

          width: 100%;
          height: 100dvh;

          overflow: hidden;
          overscroll-behavior: none;

          background: rgba(11, 11, 16, 0.78);

          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 1rem;

          box-sizing: border-box;
        }

        .bo-auth-modal {
          position: relative;

          width: min(900px, 100%);
          max-height: calc(100dvh - 2rem);

          display: grid;
          grid-template-columns: 40% 60%;

          overflow: hidden;

          background: ${C.surface};

          border: 1px solid ${C.border};
          border-radius: 20px;

          box-shadow:
            0 32px 80px rgba(0, 0, 0, 0.6),
            0 8px 30px rgba(0, 0, 0, 0.25);

          font-family: 'Manrope', sans-serif;
        }

        /*
         * LEFT SIDE
         */

        .bo-auth-sidebar {
          position: relative;

          min-height: 560px;

          padding: 3rem;

          display: flex;
          flex-direction: column;
          justify-content: space-between;

          overflow: hidden;

          background: ${C.bg};
          color: ${C.text};

          box-sizing: border-box;
        }

        .bo-auth-sidebar::before {
          content: '';

          position: absolute;

          width: 260px;
          height: 260px;

          right: -100px;
          bottom: -100px;

          border-radius: 50%;

          border: 1px solid rgba(255, 182, 39, 0.15);

          box-shadow:
            0 0 0 40px rgba(255, 182, 39, 0.025),
            0 0 0 80px rgba(255, 182, 39, 0.018);
        }

        .bo-auth-sidebar::after {
          content: '';

          position: absolute;

          width: 1px;
          height: 180px;

          left: 3rem;
          top: 0;

          background: linear-gradient(
            to bottom,
            transparent,
            ${C.amber},
            transparent
          );

          opacity: 0.5;
        }

        .bo-auth-sidebar-content {
          position: relative;
          z-index: 1;

          margin-top: auto;
          margin-bottom: auto;

          max-width: 290px;
        }

        .bo-auth-logo {
          width: 52px;
          height: 52px;

          margin-bottom: 2rem;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 14px;

          background: ${C.amber};
          color: ${C.bg};

          font-family: 'Anton', sans-serif;
          font-size: 20px;
          letter-spacing: 0.04em;
        }

        .bo-auth-sidebar-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-bottom: 14px;

          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 500;

          letter-spacing: 0.2em;
          text-transform: uppercase;

          color: ${C.amber};
        }

        .bo-auth-sidebar-dot {
          width: 6px;
          height: 6px;

          flex-shrink: 0;

          border-radius: 50%;

          background: ${C.amber};
        }

        .bo-auth-sidebar-title {
          margin: 0 0 1rem;

          font-family: 'Anton', sans-serif;

          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1;

          text-transform: uppercase;
          letter-spacing: 0.01em;

          color: ${C.text};
        }

        .bo-auth-sidebar-description {
          margin: 0;

          font-size: 13px;
          line-height: 1.7;

          color: ${C.textMuted};
        }

        .bo-auth-sidebar-footer {
          position: relative;
          z-index: 1;

          color: ${C.textFaint};

          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;

          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /*
         * RIGHT SIDE
         */

        .bo-auth-form-panel {
          position: relative;

          min-width: 0;
          min-height: 0;

          max-height: calc(100dvh - 2rem);

          overflow-x: hidden;
          overflow-y: auto;

          overscroll-behavior: contain;

          background: ${C.surface};

          scrollbar-width: thin;
          scrollbar-color: ${C.border} transparent;
        }

        .bo-auth-form-panel::-webkit-scrollbar {
          width: 5px;
        }

        .bo-auth-form-panel::-webkit-scrollbar-track {
          background: transparent;
        }

        .bo-auth-form-panel::-webkit-scrollbar-thumb {
          background: ${C.border};
          border-radius: 10px;
        }

        .bo-auth-form-content {
          width: 100%;
          max-width: 430px;

          margin: 0 auto;

          padding: 3.5rem 3rem;

          box-sizing: border-box;
        }

        /*
         * CLOSE BUTTON
         */

        .bo-auth-close {
          position: absolute;

          top: 1rem;
          right: 1rem;

          width: 34px;
          height: 34px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: none;
          border-radius: 50%;

          background: transparent;

          color: ${C.textFaint};

          font-size: 18px;
          line-height: 1;

          cursor: pointer;

          z-index: 20;

          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .bo-auth-close:hover {
          background: rgba(255, 182, 39, 0.1);
          color: ${C.amber};
        }

        /*
         * FORM HEADER
         */

        .bo-auth-top {
          padding: 0 0 26px;
        }

        .bo-auth-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-bottom: 12px;

          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 500;

          letter-spacing: 0.2em;
          text-transform: uppercase;

          color: ${C.amber};
        }

        .bo-auth-eyebrow-dot {
          display: inline-block;

          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: ${C.amber};
        }

        .bo-auth-title {
          margin: 0 0 8px;

          font-family: 'Anton', sans-serif;

          font-size: 2rem;
          line-height: 1.1;

          text-transform: uppercase;

          color: ${C.text};
        }

        .bo-auth-sub {
          margin: 0;

          font-size: 13px;
          line-height: 1.6;

          color: ${C.textMuted};
        }

        .bo-auth-perf {
          position: relative;

          height: 1px;

          margin-bottom: 26px;

          border-top: 1px dashed ${C.border};
        }

        /*
         * STATUS
         */

        .bo-auth-status {
          margin-bottom: 18px;

          padding: 12px 14px;

          border: 1px solid rgba(124, 224, 168, 0.25);
          background: rgba(124, 224, 168, 0.08);

          border-radius: 8px;

          font-size: 13px;
          font-weight: 500;
          line-height: 1.5;

          color: ${C.success};
        }

        /*
         * FORM
         */

        .bo-auth-form {
          display: flex;
          flex-direction: column;

          gap: 18px;
        }

        .bo-auth-field {
          display: flex;
          flex-direction: column;

          gap: 7px;
        }

        .bo-auth-field label {
          font-family: 'IBM Plex Mono', monospace;

          font-size: 10.5px;
          font-weight: 500;

          letter-spacing: 0.12em;
          text-transform: uppercase;

          color: ${C.textMuted};
        }

        .bo-auth-input-wrap {
          position: relative;
        }

        .bo-auth-field input {
          width: 100%;

          box-sizing: border-box;

          padding: 0.8rem 1rem;

          background: ${C.bg};

          border: 1px solid ${C.border};
          border-radius: 8px;

          font-family: 'Manrope', sans-serif;
          font-size: 14.5px;

          color: ${C.text};

          outline: none;

          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .bo-auth-field input.has-error {
          border-color: rgba(255, 107, 107, 0.5);
        }

        .bo-auth-field input::placeholder {
          color: ${C.textFainter};
        }

        .bo-auth-field input:focus {
          border-color: ${C.amberHover};

          box-shadow:
            0 0 0 3px rgba(255, 182, 39, 0.15);
        }

        .bo-auth-eye {
          position: absolute;

          right: 12px;
          top: 50%;

          transform: translateY(-50%);

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 4px;

          border: none;
          background: transparent;

          color: ${C.textFaint};

          cursor: pointer;
        }

        .bo-auth-eye:hover {
          color: ${C.amber};
        }

        .bo-auth-error {
          margin-top: 2px;

          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;

          color: ${C.error};
        }

        /*
         * REMEMBER / FORGOT
         */

        .bo-auth-row {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 12px;
        }

        .bo-auth-remember {
          display: flex;
          align-items: center;

          gap: 8px;

          cursor: pointer;

          color: ${C.textMuted};

          font-size: 12px;
        }

        .bo-auth-remember input {
          accent-color: ${C.amber};
        }

        .bo-auth-link-btn {
          padding: 0;

          border: none;
          background: none;

          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;

          letter-spacing: 0.04em;

          color: ${C.amber};

          cursor: pointer;
        }

        .bo-auth-link-btn:hover {
          color: ${C.amberHover};
        }

        /*
         * SERVER ERROR
         */

        .bo-auth-server-error {
          padding: 0.65rem 1rem;

          background: rgba(255, 107, 107, 0.1);

          border: 1px solid rgba(255, 107, 107, 0.3);

          border-radius: 8px;

          color: ${C.error};

          font-size: 12.5px;

          line-height: 1.5;

          text-align: center;
        }

        /*
         * SUBMIT
         */

        .bo-auth-submit {
          width: 100%;

          padding: 13px 16px;

          border: none;
          border-radius: 10px;

          background: ${C.amber};
          color: ${C.bg};

          font-family: 'IBM Plex Mono', monospace;

          font-size: 12px;
          font-weight: 700;

          letter-spacing: 0.12em;
          text-transform: uppercase;

          cursor: pointer;

          transition:
            background 0.15s ease,
            transform 0.15s ease;
        }

        .bo-auth-submit:hover:not(:disabled) {
          background: ${C.amberHover};
          transform: translateY(-1px);
        }

        .bo-auth-submit:disabled {
          opacity: 0.6;
          cursor: default;
        }

        /*
         * GOOGLE / DIVIDER
         */

        .bo-auth-divider {
          display: flex;
          align-items: center;

          gap: 10px;
        }

        .bo-auth-divider-line {
          flex: 1;

          height: 1px;

          background: ${C.border};
        }

        .bo-auth-divider-text {
          color: ${C.textFaint};

          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;

          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /*
         * SWITCH
         */

        .bo-auth-switch {
          margin: 0;

          text-align: center;

          font-size: 12.5px;

          color: ${C.textMuted};
        }

        .bo-auth-switch button {
          padding: 0;

          border: none;
          background: none;

          color: ${C.amber};

          font-family: 'Manrope', sans-serif;
          font-size: 12.5px;

          cursor: pointer;

          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .bo-auth-switch button:hover {
          color: ${C.amberHover};
        }

        /*
         * MOBILE
         */

        @media (max-width: 700px) {
          .bo-auth-overlay {
            padding: 0.75rem;
          }

          .bo-auth-modal {
            width: 100%;
            max-height: calc(100dvh - 1.5rem);

            display: flex;
            flex-direction: column;
          }

          .bo-auth-sidebar {
            min-height: auto;

            padding: 1.5rem;

            flex: 0 0 auto;
          }

          .bo-auth-sidebar::after {
            left: 1.5rem;
            height: 100px;
          }

          .bo-auth-sidebar-content {
            margin: 0;

            max-width: 100%;
          }

          .bo-auth-logo {
            width: 42px;
            height: 42px;

            margin-bottom: 1rem;

            border-radius: 11px;

            font-size: 16px;
          }

          .bo-auth-sidebar-title {
            margin-bottom: 0.6rem;

            font-size: 2rem;
          }

          .bo-auth-sidebar-description {
            font-size: 12px;
          }

          .bo-auth-sidebar-footer {
            display: none;
          }

          .bo-auth-form-panel {
            flex: 1;

            min-height: 0;

            max-height: none;
          }

          .bo-auth-form-content {
            padding: 2rem 1.5rem;
          }

          .bo-auth-title {
            font-size: 1.7rem;
          }
        }

        @media (max-width: 420px) {
          .bo-auth-overlay {
            padding: 0;
          }

          .bo-auth-modal {
            max-height: 100dvh;

            min-height: 100dvh;

            border-radius: 0;
            border: none;
          }

          .bo-auth-sidebar {
            padding: 1.35rem;
          }

          .bo-auth-form-content {
            padding: 1.75rem 1.25rem 2rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .bo-auth-submit {
            transition: none;
          }
        }
      `}</style>

      <div
        className="bo-auth-overlay"
        onMouseDown={handleOverlayClick}
      >
        <div
          className="bo-auth-modal"
          ref={modalRef}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* LEFT */}
          <aside className="bo-auth-sidebar">
            <div className="bo-auth-sidebar-content">
              <div className="bo-auth-logo">
                AE
              </div>

              <div className="bo-auth-sidebar-eyebrow">
                <span className="bo-auth-sidebar-dot" />
                AD Events
              </div>

              <h2 className="bo-auth-sidebar-title">
                Welcome
                <br />
                back.
              </h2>

              <p className="bo-auth-sidebar-description">
                Sign in to manage your tickets, discover
                upcoming events and keep your experiences
                all in one place.
              </p>
            </div>

            <div className="bo-auth-sidebar-footer">
              Event Tickets · Experiences · Moments
            </div>
          </aside>

          {/* RIGHT */}
          <section className="bo-auth-form-panel">
            <button
              type="button"
              className="bo-auth-close"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>

            <div className="bo-auth-form-content">
              <div className="bo-auth-top">


                <h2 className="bo-auth-title">
                  Sign In
                </h2>

                <p className="bo-auth-sub">
                  Enter your details to access your tickets.
                </p>
              </div>

              <div className="bo-auth-perf" />

              {status && (
                <div className="bo-auth-status">
                  {status}
                </div>
              )}

              <form
                onSubmit={submit}
                noValidate
                className="bo-auth-form"
              >
                <div className="bo-auth-field">
                  <label htmlFor="login-email">
                    Email Address
                  </label>

                  <input
                    id="login-email"
                    autoComplete="username"
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);

                      if (clientErrors.email) {
                        setClientErrors((p) => ({
                          ...p,
                          email: undefined,
                        }));
                      }
                    }}
                    placeholder="you@example.com"
                    className={emailError ? "has-error" : ""}
                  />

                  {emailError &&
                    emailError.trim() && (
                      <span className="bo-auth-error">
                        {emailError}
                      </span>
                    )}
                </div>

                <div className="bo-auth-field">
                  <label htmlFor="login-password">
                    Password
                  </label>

                  <div className="bo-auth-input-wrap">
                    <input
                      id="login-password"
                      autoComplete="current-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
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
                        paddingRight: "44px",
                      }}
                      className={
                        passwordError
                          ? "has-error"
                          : ""
                      }
                    />

                    <button
                      type="button"
                      className="bo-auth-eye"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <svg
                          width="18"
                          height="18"
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
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {passwordError &&
                    passwordError.trim() && (
                      <span className="bo-auth-error">
                        {passwordError}
                      </span>
                    )}
                </div>

                <div
                  className="bo-auth-row"
                  style={{ marginTop: "-6px" }}
                >
                  <label className="bo-auth-remember">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) =>
                        setRemember(
                          e.target.checked
                        )
                      }
                    />

                    Remember me
                  </label>

                  {canResetPassword && (
                    <button
                      type="button"
                      className="bo-auth-link-btn"
                      onClick={() => {
                        onClose();

                        router.visit(
                          route("password.request")
                        );
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {serverError && (
                  <div className="bo-auth-server-error">
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  className="bo-auth-submit"
                  disabled={processing}
                >
                  {processing
                    ? "Signing in…"
                    : "Sign In"}
                </button>

                <div className="bo-auth-divider">
                  <div className="bo-auth-divider-line" />

                  <span className="bo-auth-divider-text">
                    or
                  </span>

                  <div className="bo-auth-divider-line" />
                </div>

                <GoogleLoginButton className="w-full" />

                <p className="bo-auth-switch">
                  New here?{" "}
                  <button
                    type="button"
                    onClick={onSwitchToRegister}
                  >
                    Create an account
                  </button>
                </p>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>,
    document.body
  );
}
