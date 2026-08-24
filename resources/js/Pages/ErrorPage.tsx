import React from "react";
import { Link, usePage } from "@inertiajs/react";
import { PageProps } from "@/types";

interface ErrorPageProps {
  statusCode?: number;
  message?: string;
  componentStack?: string;
}

const ERROR_META: Record<number, { title: string; subtitle: string }> = {
  400: {
    title: "Bad Request",
    subtitle: "The request could not be understood.",
  },
  401: { title: "Unauthorised", subtitle: "Please sign in to continue." },
  403: {
    title: "Forbidden",
    subtitle: "You don't have permission to view this.",
  },
  404: {
    title: "Page Not Found",
    subtitle: "This page may have moved or no longer exists.",
  },
  419: {
    title: "Session Expired",
    subtitle: "Your session has expired. Please refresh.",
  },
  422: {
    title: "Unprocessable",
    subtitle: "The submitted data could not be processed.",
  },
  429: {
    title: "Too Many Requests",
    subtitle: "Please wait a moment before trying again.",
  },
  500: { title: "Server Error", subtitle: "Something went wrong on our end." },
  503: { title: "Unavailable", subtitle: "We'll be back shortly." },
};

export default function ErrorPage({
  statusCode = 500,
  message,
  componentStack,
}: ErrorPageProps) {
  const meta = ERROR_META[statusCode] ?? {
    title: "Unexpected Error",
    subtitle: "Something went wrong.",
  };
  const isDashboard = window.location.pathname.startsWith("/dashboard");
  const displayMessage =
    message && message !== meta.subtitle ? message : meta.subtitle;
  const handleAction = () => {
    switch (statusCode) {
      case 404:
        // Route doesn't exist
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = "/dashboard";
        }
        break;

      default:
        // 500, 419, etc.
        window.location.reload();
        break;
    }
  };
  return (
    <div className="error-page">
      <div className="error-page__inner">
        {/* Decorative rule */}
        <div className="error-page__rule" />

        <p className="error-page__eyebrow">RB Hair & Beauty Lounge</p>

        <h1 className="error-page__code">{statusCode}</h1>
        <h2 className="error-page__title">{meta.title}</h2>
        <p className="error-page__message">{displayMessage}</p>

        {/* Stack trace — dev only */}
        {componentStack && import.meta.env.DEV && (
          <details className="error-page__stack">
            <summary>Component stack trace</summary>
            <pre>{componentStack}</pre>
          </details>
        )}

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "1.5rem",
            flexWrap: "wrap", // wraps on small screens
          }}
        >
          <button onClick={handleAction} className="error-page__cta">
            {statusCode === 404 ? "Go Back" : "Try Again"}
          </button>

          <Link
            href={isDashboard ? "/dashboard" : "/"}
            className="error-page__cta"
          >
            {isDashboard ? "Dashboard" : "Home"}
          </Link>
        </div>
        <div className="error-page__rule error-page__rule--bottom" />
      </div>

      <style>{`
                .error-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--color-background, #faf9f7);
                    font-family: var(--font-body, 'Jost', sans-serif);
                    padding: 2rem;
                }

                .error-page__inner {
                    text-align: center;
                    max-width: 520px;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0;
                }

                .error-page__rule {
                    width: 48px;
                    height: 1px;
                    background-color: var(--color-primary, #b8976a);
                    margin-bottom: 2rem;
                }

                .error-page__rule--bottom {
                    margin-bottom: 0;
                    margin-top: 2.5rem;
                }

                .error-page__eyebrow {
                    font-family: var(--font-body, 'Jost', sans-serif);
                    font-size: 0.65rem;
                    letter-spacing: 0.25em;
                    text-transform: uppercase;
                    color: var(--color-primary, #b8976a);
                    margin: 0 0 1.75rem;
                }

                .error-page__code {
                    font-family: var(--font-display, 'Cormorant Garamond', serif);
                    font-size: clamp(5rem, 20vw, 9rem);
                    font-weight: 300;
                    line-height: 1;
                    color: var(--color-text, #1a1a1a);
                    letter-spacing: -0.02em;
                    margin: 0 0 0.5rem;
                }

                .error-page__title {
                    font-family: var(--font-display, 'Cormorant Garamond', serif);
                    font-size: clamp(1.25rem, 4vw, 1.75rem);
                    font-weight: 400;
                    font-style: italic;
                    color: var(--color-text, #1a1a1a);
                    margin: 0 0 1.25rem;
                    letter-spacing: 0.02em;
                }

                .error-page__message {
                    font-size: 0.875rem;
                    color: var(--color-muted, #6b6b6b);
                    line-height: 1.7;
                    margin: 0 0 2rem;
                    letter-spacing: 0.01em;
                }

                .error-page__cta {
                    display: inline-block;
                    padding: 0.75rem 2.25rem;
                    border: 1px solid var(--color-primary, #b8976a);
                    color: var(--color-primary, #b8976a);
                    font-family: var(--font-body, 'Jost', sans-serif);
                    font-size: 0.7rem;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    text-decoration: none;
                    transition: background-color 0.25s ease, color 0.25s ease;
                }

                .error-page__cta:hover {
                    background-color: var(--color-primary, #b8976a);
                    color: #fff;
                }

                .error-page__stack {
                    width: 100%;
                    text-align: left;
                    background: #f5f0eb;
                    border: 1px solid #e8ddd0;
                    border-radius: 2px;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                    font-size: 0.75rem;
                    color: #5a4a3a;
                }

                .error-page__stack summary {
                    cursor: pointer;
                    font-family: var(--font-body, 'Jost', sans-serif);
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    font-size: 0.65rem;
                    color: var(--color-primary, #b8976a);
                    margin-bottom: 0.75rem;
                }

                .error-page__stack pre {
                    white-space: pre-wrap;
                    word-break: break-word;
                    margin: 0;
                    line-height: 1.6;
                }
            `}</style>
    </div>
  );
}
