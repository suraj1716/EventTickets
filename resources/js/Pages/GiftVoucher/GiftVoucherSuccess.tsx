import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Link } from "@inertiajs/react";

interface Voucher {
  code: string;
  amount: number;
  remaining_amount: number;
  expires_at: string | null;
  gifted_to_email?: string | null;
}

interface Props {
  vouchers: Voucher[];
}

export default function GiftVoucherSuccess({ vouchers = [] }: Props) {
  const isEmpty = !vouchers || vouchers.length === 0;

  return (
    <AuthenticatedLayout>
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-xl)",
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ maxWidth: "560px", width: "100%", textAlign: "center" }}>

        {/* Icon */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            border: "1px solid var(--color-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto var(--space-xl)",
            color: "var(--color-accent)",
            fontSize: "1.75rem",
          }}
        >
          ✦
        </div>

        {/* Heading */}
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            marginBottom: "var(--space-sm)",
          }}
        >
          Purchase Confirmed
        </span>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            fontWeight: 300,
            color: "var(--color-text)",
            lineHeight: 1.1,
            marginBottom: "var(--space-lg)",
          }}
        >
          {isEmpty
            ? "We're confirming your purchase"
            : vouchers.length > 1
            ? `Your ${vouchers.length} vouchers are ready`
            : "Your voucher is ready"}
        </h1>
        <div
          style={{
            width: "48px",
            height: "1px",
            background: "var(--color-accent)",
            margin: "0 auto var(--space-2xl)",
          }}
        />

        {isEmpty ? (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-2xl)",
            }}
          >
            Your payment went through, but we couldn't load the voucher details
            right now. Check your email for the confirmation, or visit{" "}
            <Link href={route("vouchers.index")} style={{ color: "var(--color-primary)" }}>
              Your Vouchers
            </Link>{" "}
            in a moment.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-lg)",
              marginBottom: "var(--space-2xl)",
            }}
          >
            {vouchers.map((voucher, idx) => (
              <div
                key={voucher.code ?? idx}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  padding: "var(--space-2xl)",
                  textAlign: "left",
                }}
              >
                {/* Code */}
                <div style={{ marginBottom: "var(--space-lg)", textAlign: "center" }}>
                  <span
                    style={{
                      display: "block",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-xs)",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--color-text-light)",
                      marginBottom: "var(--space-sm)",
                    }}
                  >
                    Voucher Code
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-2xl)",
                      fontWeight: 600,
                      letterSpacing: "0.2em",
                      color: "var(--color-primary)",
                      background: "var(--color-surface-warm)",
                      border: "1px dashed var(--color-border-dark)",
                      padding: "var(--space-sm) var(--space-xl)",
                    }}
                  >
                    {voucher.code}
                  </span>
                </div>

                {voucher.gifted_to_email && (
                  <p
                    style={{
                      textAlign: "center",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-muted)",
                      marginBottom: "var(--space-lg)",
                    }}
                  >
                    Sent to <strong style={{ color: "var(--color-text)" }}>{voucher.gifted_to_email}</strong>
                  </p>
                )}

                <div
                  style={{
                    height: "1px",
                    background: "var(--color-border)",
                    margin: "var(--space-lg) 0",
                  }}
                />

                {/* Details rows */}
                {[
                  { label: "Total Value", value: `A$${Number(voucher.amount ?? 0).toFixed(2)}` },
                  { label: "Remaining Balance", value: `A$${Number(voucher.remaining_amount ?? 0).toFixed(2)}` },
                  {
                    label: "Expires On",
                    value: voucher.expires_at
                      ? new Date(voucher.expires_at).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      padding: "var(--space-sm) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-xs)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--color-text-light)",
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-lg)",
                        fontWeight: 400,
                        color: "var(--color-text)",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: "flex", gap: "var(--space-md)", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href={route("vouchers.index")}
            style={{
              display: "inline-block",
              background: "var(--color-primary)",
              color: "var(--color-text-inverse)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.875rem 2.5rem",
              border: "1px solid var(--color-primary)",
              textDecoration: "none",
              transition: "all var(--transition-base)",
            }}
          >
            View My Vouchers
          </Link>

          <Link
            href={route("gift-voucher.shop")}
            style={{
              display: "inline-block",
              background: "transparent",
              color: "var(--color-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.875rem 2.5rem",
              border: "1px solid var(--color-primary)",
              textDecoration: "none",
              transition: "all var(--transition-base)",
            }}
            onMouseEnter={(e) => {
              const a = e.currentTarget as HTMLAnchorElement;
              a.style.background = "var(--color-primary)";
              a.style.color = "var(--color-text-inverse)";
            }}
            onMouseLeave={(e) => {
              const a = e.currentTarget as HTMLAnchorElement;
              a.style.background = "transparent";
              a.style.color = "var(--color-primary)";
            }}
          >
            Buy Another Voucher
          </Link>
        </div>
      </div>
    </div>
    </AuthenticatedLayout>
  );
}
