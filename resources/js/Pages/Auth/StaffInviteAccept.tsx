// resources/js/Pages/Auth/StaffInviteAccept.tsx
import { Head, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";

type Props = {
  invalid: boolean;
  message?: string;
  vendorName?: string;
  staffName?: string;
  staffEmail?: string;
  needsPassword?: boolean;
  loggedInAsSomeoneElse?: boolean;
  acceptUrl?: string;
};

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
    outline: "none",
    boxSizing: "border-box",
  };
}

export default function StaffInviteAccept({
  invalid,
  message,
  vendorName,
  staffName,
  staffEmail,
  needsPassword,
  loggedInAsSomeoneElse,
  acceptUrl,
}: Props) {
  const { data, setData, post, processing, errors } = useForm({
    password: "",
    password_confirmation: "",
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    if (acceptUrl) post(acceptUrl);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "rgb(10, 9, 8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <Head title="Join the team" />

      <div
        style={{
          background: "rgb(28, 26, 23)",
          border: "1px solid rgba(212, 175, 90, 0.2)",
          borderRadius: "2px",
          width: "100%",
          maxWidth: "420px",
          padding: "3rem 2.5rem",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {invalid ? (
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "1.5rem",
                color: "rgba(255,255,255,0.88)",
                marginBottom: "0.75rem",
              }}
            >
              Invitation unavailable
            </p>
            <p style={{ fontFamily: "Jost, sans-serif", fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>
              {message}
            </p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
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
                You're invited
              </p>
              <h2
                style={{
                  fontFamily: "Cormorant Garamond, Georgia, serif",
                  fontSize: "1.6rem",
                  color: "rgba(255,255,255,0.92)",
                  margin: 0,
                }}
              >
                Join {vendorName}'s team
              </h2>
              <p
                style={{
                  fontFamily: "Jost, sans-serif",
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.5)",
                  marginTop: "0.5rem",
                }}
              >
                Hi {staffName} ({staffEmail})
              </p>
            </div>

            {loggedInAsSomeoneElse && (
              <p
                style={{
                  fontFamily: "Jost, sans-serif",
                  fontSize: "0.8rem",
                  color: "rgba(255,110,110,0.85)",
                  marginBottom: "1rem",
                  textAlign: "center",
                }}
              >
                You're logged in as a different account. Log out first, then reopen this link.
              </p>
            )}

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              {needsPassword && (
                <>
                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      value={data.password}
                      onChange={(e) => setData("password", e.target.value)}
                      style={inputStyle(!!errors.password)}
                    />
                    {errors.password && (
                      <span style={{ fontSize: "0.72rem", color: "rgba(255,110,110,0.85)" }}>
                        {errors.password}
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={data.password_confirmation}
                    onChange={(e) => setData("password_confirmation", e.target.value)}
                    style={inputStyle(false)}
                  />
                </>
              )}

              {errors.email && (
                <span style={{ fontSize: "0.72rem", color: "rgba(255,110,110,0.85)" }}>{errors.email}</span>
              )}

              <button
                type="submit"
                disabled={processing || loggedInAsSomeoneElse}
                style={{
                  background: "rgba(212, 175, 90, 0.9)",
                  color: "rgb(20, 18, 16)",
                  border: "none",
                  borderRadius: "2px",
                  padding: "0.85rem",
                  fontFamily: "Jost, sans-serif",
                  fontSize: "0.8rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: loggedInAsSomeoneElse ? "not-allowed" : "pointer",
                  opacity: processing || loggedInAsSomeoneElse ? 0.6 : 1,
                }}
              >
                {needsPassword ? "Set password & accept" : "Accept invitation"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
