import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "@inertiajs/react";
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
  success: "#7CE0A8",
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

  const [clientErrors, setClientErrors] =
    useState<RegisterClientErrors>({});

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  /*
   * Load fonts.
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
   * Lock background page while modal is open.
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
      next.password =
        "Password must be at least 8 characters.";
    }

    if (!data.password_confirmation) {
      next.password_confirmation =
        "Please confirm your password.";
    } else if (
      data.password_confirmation !== data.password
    ) {
      next.password_confirmation =
        "Passwords do not match.";
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
        reset(
          "password",
          "password_confirmation"
        );
      },
    });
  };

  if (!isOpen) return null;

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

  const nameError =
    clientErrors.name || errors.name;

  const emailError =
    clientErrors.email || errors.email;

  const passwordError =
    clientErrors.password || errors.password;

  const confirmError =
    clientErrors.password_confirmation ||
    errors.password_confirmation;

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

        /*
         * MAIN SPLIT MODAL
         */

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
         * RIGHT FORM SIDE
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
         * CLOSE
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

          border-top: 1px dashed ${C.borderDashed};
        }

        /*
         * STATUS
         */

        .bo-auth-status {
          margin-bottom: 18px;

          padding: 12px 14px;

          border: 1px solid rgba(
            124,
            224,
            168,
            0.25
          );

          background: rgba(
            124,
            224,
            168,
            0.08
          );

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

          gap: 16px;
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
          border-color: rgba(
            255,
            107,
            107,
            0.5
          );
        }

        .bo-auth-field input::placeholder {
          color: ${C.textFainter};
        }

        .bo-auth-field input:focus {
          border-color: ${C.amberHover};

          box-shadow:
            0 0 0 3px rgba(
              255,
              182,
              39,
              0.15
            );
        }

        /*
         * PASSWORD EYE
         */

        .bo-auth-eye {
          position: absolute;

          right: 12px;
          top: 50%;

          transform: translateY(-50%);

          border: none;

          background: transparent;

          padding: 4px;

          cursor: pointer;

          color: ${C.textFaint};

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bo-auth-eye:hover {
          color: ${C.amber};
        }

        /*
         * ERRORS
         */

        .bo-auth-error {
          margin-top: 2px;

          font-family: 'IBM Plex Mono', monospace;

          font-size: 11.5px;

          color: ${C.error};
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
         * DIVIDER
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

        /*
         * VERY SMALL PHONES
         */

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
          onMouseDown={(e) =>
            e.stopPropagation()
          }
        >
          {/* ========================================
              LEFT SIDE
          ======================================== */}

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
                Your next
                <br />
                experience.
              </h2>

              <p className="bo-auth-sidebar-description">
                Create your account and discover
                events, experiences and unforgettable
                moments all in one place.
              </p>
            </div>

            <div className="bo-auth-sidebar-footer">
              Event Tickets · Experiences · Moments
            </div>
          </aside>

          {/* ========================================
              RIGHT SIDE — FORM
          ======================================== */}

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
                <div className="bo-auth-eyebrow">
                  <span className="bo-auth-eyebrow-dot" />

                  New Account
                </div>

                <h2 className="bo-auth-title">
                  Join Box Office
                </h2>

                <p className="bo-auth-sub">
                  Create an account to start booking
                  tickets.
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
                {/* NAME */}

                <div className="bo-auth-field">
                  <label htmlFor="reg-name">
                    Full Name
                  </label>

                  <input
                    id="reg-name"
                    name="name"
                    autoComplete="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => {
                      setData(
                        "name",
                        e.target.value
                      );

                      if (clientErrors.name) {
                        setClientErrors((p) => ({
                          ...p,
                          name: undefined,
                        }));
                      }
                    }}
                    placeholder="Jane Doe"
                    className={
                      nameError
                        ? "has-error"
                        : ""
                    }
                  />

                  {nameError &&
                    String(nameError).trim() && (
                      <span className="bo-auth-error">
                        {nameError}
                      </span>
                    )}
                </div>

                {/* EMAIL */}

                <div className="bo-auth-field">
                  <label htmlFor="reg-email">
                    Email Address
                  </label>

                  <input
                    id="reg-email"
                    name="email"
                    autoComplete="username"
                    type="text"
                    value={data.email}
                    onChange={(e) => {
                      setData(
                        "email",
                        e.target.value
                      );

                      if (clientErrors.email) {
                        setClientErrors((p) => ({
                          ...p,
                          email: undefined,
                        }));
                      }
                    }}
                    placeholder="you@example.com"
                    className={
                      emailError
                        ? "has-error"
                        : ""
                    }
                  />

                  {emailError &&
                    String(emailError).trim() && (
                      <span className="bo-auth-error">
                        {emailError}
                      </span>
                    )}
                </div>

                {/* PASSWORD */}

                <div className="bo-auth-field">
                  <label htmlFor="reg-password">
                    Password
                  </label>

                  <div className="bo-auth-input-wrap">
                    <input
                      id="reg-password"
                      name="password"
                      autoComplete="new-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={data.password}
                      onChange={(e) => {
                        setData(
                          "password",
                          e.target.value
                        );

                        if (
                          clientErrors.password
                        ) {
                          setClientErrors((p) => ({
                            ...p,
                            password: undefined,
                          }));
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
                    String(passwordError).trim() && (
                      <span className="bo-auth-error">
                        {passwordError}
                      </span>
                    )}
                </div>

                {/* CONFIRM PASSWORD */}

                <div className="bo-auth-field">
                  <label htmlFor="reg-password-confirm">
                    Confirm Password
                  </label>

                  <div className="bo-auth-input-wrap">
                    <input
                      id="reg-password-confirm"
                      name="password_confirmation"
                      autoComplete="new-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        data.password_confirmation
                      }
                      onChange={(e) => {
                        setData(
                          "password_confirmation",
                          e.target.value
                        );

                        if (
                          clientErrors.password_confirmation
                        ) {
                          setClientErrors((p) => ({
                            ...p,
                            password_confirmation:
                              undefined,
                          }));
                        }
                      }}
                      placeholder="••••••••"
                      style={{
                        paddingRight: "44px",
                      }}
                      className={
                        confirmError
                          ? "has-error"
                          : ""
                      }
                    />

                    <button
                      type="button"
                      className="bo-auth-eye"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) => !prev
                        )
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
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

                  {confirmError &&
                    String(confirmError).trim() && (
                      <span className="bo-auth-error">
                        {confirmError}
                      </span>
                    )}
                </div>

                {/* SUBMIT */}

                <button
                  type="submit"
                  className="bo-auth-submit"
                  disabled={processing}
                >
                  {processing
                    ? "Creating account…"
                    : "Create Account"}
                </button>

                {/* DIVIDER */}

                <div className="bo-auth-divider">
                  <div className="bo-auth-divider-line" />

                  <span className="bo-auth-divider-text">
                    or
                  </span>

                  <div className="bo-auth-divider-line" />
                </div>

                {/* GOOGLE */}

                <GoogleLoginButton className="w-full" />

                {/* LOGIN */}

                <p className="bo-auth-switch">
                  Already have an account?{" "}

                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                  >
                    Sign in
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
