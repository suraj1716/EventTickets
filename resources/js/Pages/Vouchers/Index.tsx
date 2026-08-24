import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, router } from "@inertiajs/react";
import { useState } from "react";
import Button from "@/Components/App/ui/Button";
import { Eyebrow } from "@/Components/App/ui/SectionHeading";
import { input as sharedInput } from "@/Components/App/formStyles";
import PageHero from "@/Components/Page/PageHero";

type Voucher = {
  id?: number;
  code: string;
  type: string;
  amount: number;
  remaining_amount?: number;
  expires_at: string;
  used_count: number;
  max_uses: number;
};

type GiftVoucherCard = {
  id: number;
  code: string;
  amount: number;
  remaining_amount: number;
  active: boolean;
  expires_at: string | null;
  gifted_to_email: string | null;
  created_at: string;
  hidden?: boolean;
};

interface VouchersProps {
  voucher?: Voucher;
  error?: string;
  referral_code?: string;
  purchased?: GiftVoucherCard[];
  received?: GiftVoucherCard[];
}

// ── Gift card visual ─────────────────────────────────────────────
function GiftCardTile({
  card,
  variant = "purchased",
  onRemove,
}: {
  card: GiftVoucherCard;
  variant?: "purchased" | "received";
  onRemove?: (id: number) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState(false);

  const isExpired = card.expires_at ? new Date(card.expires_at) < new Date() : false;
  const isDepleted = (card.remaining_amount ?? 0) <= 0;
  const isUsable = card.active && !isExpired && !isDepleted;

  const usagePct =
    card.amount > 0 ? 100 - (card.remaining_amount / card.amount) * 100 : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(card.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRemove = () => {
    if (removing) return;
    setRemoving(true);
    onRemove?.(card.id);
    // Parent removes this card from the visible list once the request
    // settles, so there's no need to reset `removing` on success — the
    // tile simply unmounts. If it fails and the card reappears, the
    // button becomes usable again on the next render.
  };

  let statusLabel = "Active";
  let statusColor = "var(--color-success)";
  if (isDepleted) {
    statusLabel = "Used Up";
    statusColor = "var(--color-text-light)";
  } else if (isExpired) {
    statusLabel = "Expired";
    statusColor = "var(--color-error)";
  } else if (!card.active) {
    statusLabel = "Pending";
    statusColor = "var(--color-warning)";
  }

  return (


    <div
      style={{
        position: "relative",
        background: isUsable
          ? "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)"
          : "var(--color-surface-warm)",
        border: `1px solid ${isUsable ? "var(--color-primary)" : "var(--color-border)"}`,
        padding: "var(--space-xl)",
        overflow: "hidden",
        opacity: isUsable ? 1 : 0.75,
      }}
    >

      {/* decorative corner accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "90px",
          height: "90px",
          background: isUsable
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.02)",
          borderRadius: "50%",
          transform: "translate(30%, -30%)",
        }}
      />

      {/* status pill */}
      <div
        style={{
          position: "absolute",
          top: "var(--space-md)",
          right: "var(--space-md)",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-xs)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: isUsable ? "#fff" : statusColor,
          background: isUsable ? "rgba(255,255,255,0.15)" : "transparent",
          border: isUsable ? "none" : `1px solid ${statusColor}`,
          padding: "3px 10px",
          borderRadius: "var(--radius-full)",
        }}
      >
        {statusLabel}
      </div>

      {/* gifted-to badge */}
      {variant === "purchased" && card.gifted_to_email && (
        <span
          style={{
            display: "inline-block",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isUsable ? "rgba(255,255,255,0.8)" : "var(--color-accent)",
            marginBottom: "var(--space-sm)",
          }}
        >
          Sent to {card.gifted_to_email}
        </span>
      )}
      {variant === "received" && (
        <span
          style={{
            display: "inline-block",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isUsable ? "rgba(255,255,255,0.8)" : "var(--color-accent)",
            marginBottom: "var(--space-sm)",
          }}
        >
          Gift Received
        </span>
      )}

      {/* balance */}
      <div style={{ marginBottom: "var(--space-md)" }}>
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: isUsable ? "rgba(255,255,255,0.7)" : "var(--color-text-light)",
            marginBottom: "4px",
          }}
        >
          Remaining Balance
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-3xl)",
            fontWeight: 300,
            color: isUsable ? "#fff" : "var(--color-text)",
          }}
        >
          A${Number(card.remaining_amount ?? 0).toFixed(2)}
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: isUsable ? "rgba(255,255,255,0.6)" : "var(--color-text-light)",
            marginLeft: "var(--space-sm)",
          }}
        >
          of A${Number(card.amount).toFixed(2)}
        </span>
      </div>

      {/* usage bar */}
      <div
        style={{
          height: "3px",
          background: isUsable ? "rgba(255,255,255,0.2)" : "var(--color-border)",
          width: "100%",
          marginBottom: "var(--space-lg)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(Math.max(usagePct, 0), 100)}%`,
            background: isUsable ? "var(--color-accent-light)" : "var(--color-text-light)",
            transition: "width var(--transition-slow)",
          }}
        />
      </div>

      {/* code row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-sm)",
          background: isUsable ? "rgba(255,255,255,0.1)" : "var(--color-surface)",
          border: `1px dashed ${isUsable ? "rgba(255,255,255,0.35)" : "var(--color-border-dark)"}`,
          padding: "var(--space-sm) var(--space-md)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-base)",
            fontWeight: 600,
            letterSpacing: "0.15em",
            color: isUsable ? "#fff" : "var(--color-primary)",
          }}
        >
          {card.code}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isUsable ? "#fff" : "var(--color-primary)",
            opacity: 0.85,
            whiteSpace: "nowrap",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* expiry */}
      {card.expires_at && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            color: isUsable ? "rgba(255,255,255,0.6)" : "var(--color-text-light)",
            marginTop: "var(--space-sm)",
            marginBottom: 0,
          }}
        >
          {isExpired ? "Expired" : "Expires"}{" "}
          {new Date(card.expires_at).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      {/* remove button — only shown once the card is fully used up */}
      {isDepleted && (
        <button
          onClick={handleRemove}
          disabled={removing}
          style={{
            display: "block",
            width: "100%",
            marginTop: "var(--space-md)",
            padding: "0.5rem 0.75rem",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: removing ? "var(--color-text-light)" : "var(--color-error)",
            background: "transparent",
            border: `1px solid ${removing ? "var(--color-border)" : "var(--color-error)"}`,
            cursor: removing ? "not-allowed" : "pointer",
            transition: "background var(--transition-fast), color var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            if (!removing) {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--color-error)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }
          }}
          onMouseLeave={(e) => {
            if (!removing) {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-error)";
            }
          }}
        >
          {removing ? "Removing…" : "Remove"}
        </button>
      )}
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────
function VoucherSection({
  title,
  subtitle,
  cards,
  variant,
  onRemove,
}: {
  title: string;
  subtitle: string;
  cards: GiftVoucherCard[];
  variant: "purchased" | "received";
  onRemove?: (id: number) => void;
}) {
  if (!cards || cards.length === 0) return null;

  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          fontWeight: 400,
          color: "var(--color-text)",
          marginBottom: "4px",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
          margin: "0 0 var(--space-lg)",
        }}
      >
        {subtitle}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "var(--space-lg)",
        }}
      >
        {cards.map((card) => (
          <GiftCardTile key={card.id} card={card} variant={variant} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}

export default function Vouchers({
  voucher,
  error,
  referral_code,
  purchased = [],
  received = [],
}: VouchersProps) {
  const { data, setData, post, processing } = useForm({ code: "" });

  // "Remove" for used-up gift cards is non-destructive: it flips a `hidden`
  // flag on the record via a PATCH request (no delete, no other fields
  // touched), so admins still see full voucher history. We hide the card
  // optimistically for a snappy UI, and put it back if the request fails.
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);

  const handleRemove = (id: number) => {
    setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    // NOTE: adjust the route name/params to match your backend's endpoint
    // for marking a voucher hidden (e.g. PATCH /vouchers/{id}/hide).
    router.patch(
      route("vouchers.hide", id),
      {},
      {
        preserveScroll: true,
        preserveState: true,
        onError: () => {
          // Revert — the card reappears and its button becomes usable again.
          setHiddenIds((prev) => prev.filter((hiddenId) => hiddenId !== id));
        },
      }
    );
  };

  const visiblePurchased = purchased.filter(
    (c) => !hiddenIds.includes(c.id) && !c.hidden
  );
  const visibleReceived = received.filter(
    (c) => !hiddenIds.includes(c.id) && !c.hidden
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post(route("vouchers.check"));
  };

  const usagePct = voucher ? (voucher.used_count / voucher.max_uses) * 100 : 0;

  return (
    <AuthenticatedLayout>
        {/* ── Page heading ── */}
          <PageHero
            eyebrow="Promotions & Rewards"
            title={<>Your <em>Vouchers</em></>}
            subtitle="Your gift card balances, plus a quick way to check any promo or gift code."
            breadcrumbs={[{ label: "Home", href: route("home") }, { label: "Gallery" }]}
          />
      <div
        style={{
          maxWidth: "1230px",
          margin: "0 auto",
          padding: "var(--space-4xl) var(--space-lg)",
          fontFamily: "var(--font-body)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2xl)",
        }}
      >


        {/* ── Purchased gift cards ── */}
        <VoucherSection
          title="Your Gift Cards"
          subtitle="Gift cards you've purchased, for yourself or to send to someone else."
          cards={visiblePurchased}
          variant="purchased"
          onRemove={handleRemove}
        />

        {/* ── Received gift cards ── */}
        <VoucherSection
          title="Gifted to You"
          subtitle="Gift cards someone sent you — ready to use on your next order."
          cards={visibleReceived}
          variant="received"
          onRemove={handleRemove}
        />

        {/* ── Empty state if no gift cards at all ── */}
        {visiblePurchased.length === 0 && visibleReceived.length === 0 && (
          <div
            style={{
              background: "var(--color-surface-warm)",
              border: "1px dashed var(--color-border)",
              padding: "var(--space-2xl)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
                margin: "0 0 var(--space-md)",
              }}
            >
              You don't have any gift cards yet.
            </p>
            <a
              href="/gift-vouchers/shop"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
                textDecoration: "none",
                borderBottom: "1px solid var(--color-primary)",
                paddingBottom: "1px",
              }}
            >
              Buy a Gift Card →
            </a>
          </div>
        )}

        {/* ── Referral Code ── */}
        {referral_code && (
          <div
            style={{
              background: "var(--color-surface-warm)",
              border: "1px solid var(--color-border)",
              borderLeft: "3px solid var(--color-primary)",
              padding: "var(--space-xl)",
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
                marginBottom: "var(--space-sm)",
              }}
            >
              Your Referral Code
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-xl)",
                fontWeight: 400,
                color: "var(--color-text)",
                marginBottom: "var(--space-sm)",
              }}
            >
              Share &amp; Earn
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
                marginBottom: "var(--space-lg)",
              }}
            >
              Give your friends a $30 voucher — and you'll earn one too after they spend $100.
            </p>

            {/* Code pill */}
            <div
              style={{
                display: "inline-block",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xl)",
                fontWeight: 600,
                letterSpacing: "0.2em",
                color: "var(--color-primary)",
                background: "var(--color-surface)",
                border: "1px dashed var(--color-border-dark)",
                padding: "var(--space-sm) var(--space-xl)",
                marginBottom: "var(--space-md)",
              }}
            >
              {referral_code}
            </div>

            {/* Copy link row */}
            <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${referral_code}`}
                style={{
                  flex: 1,
                  minWidth: "200px",
                  padding: "0.65rem 1rem",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-muted)",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  outline: "none",
                }}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/login?ref=${referral_code}`
                  )
                }
              >
                Copy Link
              </Button>
            </div>
          </div>
        )}

        {/* ── Code check form ── */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            padding: "var(--space-xl)",
          }}
        >
          <label
            style={{
              display: "block",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-md)",
            }}
          >
            Check a Code
          </label>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}
          >
            <input
              type="text"
              name="code"
              placeholder="Enter voucher or gift code"
              value={data.code}
              onChange={(e) => setData("code", e.target.value)}
              style={{ ...sharedInput, flex: 1, minWidth: "200px" }}
              onFocus={(e) =>
                ((e.currentTarget as HTMLInputElement).style.borderColor =
                  "var(--color-primary)")
              }
              onBlur={(e) =>
                ((e.currentTarget as HTMLInputElement).style.borderColor =
                  "var(--color-border)")
              }
            />
            <Button type="submit" variant="accent" disabled={processing}>
              {processing ? "Checking…" : "Check Code"}
            </Button>
          </form>

          {error && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--color-error)",
                marginTop: "var(--space-md)",
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* ── Voucher result (from code-check form) ── */}
        {voucher && (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              overflow: "hidden",
            }}
          >
            {/* Result header */}
            <div
              style={{
                background: "var(--color-primary)",
                padding: "var(--space-lg) var(--space-xl)",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-xl)",
                  fontWeight: 400,
                  color: "#fff",
                }}
              >
                Voucher Details
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--color-accent-light)",
                }}
              >
                {voucher.type === "gift" ? "Gift Card" : "Promo Code"}
              </span>
            </div>

            <div style={{ padding: "var(--space-xl)" }}>
              {/* Code display */}
              <div style={{ textAlign: "center", marginBottom: "var(--space-xl)" }}>
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
                    padding: "var(--space-sm) var(--space-2xl)",
                  }}
                >
                  {voucher.code}
                </span>
              </div>

              {/* Detail rows */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "0",
                  border: "1px solid var(--color-border)",
                }}
              >
                {[
                  { label: "Type", value: voucher.type.charAt(0).toUpperCase() + voucher.type.slice(1) },
                  { label: "Value", value: `A$${Number(voucher.amount).toFixed(2)}` },
                  ...(voucher.type === "gift"
                    ? [{ label: "Remaining", value: `A$${Number(voucher.remaining_amount ?? 0).toFixed(2)}` }]
                    : []),
                  { label: "Expires", value: new Date(voucher.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) },
                ].map(({ label, value }, i) => (
                  <div
                    key={label}
                    style={{
                      padding: "var(--space-lg)",
                      borderRight: i % 2 === 0 ? "1px solid var(--color-border)" : "none",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-xs)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--color-text-light)",
                        marginBottom: "4px",
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-xl)",
                        fontWeight: 400,
                        color: "var(--color-text)",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Usage bar */}
              <div style={{ marginTop: "var(--space-xl)" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "var(--space-xs)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-xs)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-text-light)",
                    }}
                  >
                    Usage
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {voucher.used_count} / {voucher.max_uses}
                  </span>
                </div>
                <div
                  style={{
                    height: "3px",
                    background: "var(--color-border)",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(usagePct, 100)}%`,
                      background:
                        usagePct >= 100
                          ? "var(--color-error)"
                          : usagePct > 60
                          ? "var(--color-warning)"
                          : "var(--color-primary)",
                      transition: "width var(--transition-slow)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Info panels ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
          <div
            style={{
              background: "var(--color-surface-warm)",
              border: "1px solid var(--color-border)",
              borderLeft: "3px solid var(--color-accent)",
              padding: "var(--space-xl)",
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--color-accent-dark)",
                marginBottom: "var(--space-sm)",
              }}
            >
              Tip
            </span>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: "0 0 var(--space-sm)" }}>
              Looking for more discounts? Check our latest seasonal promotions.
            </p>
            <a
              href="/offers"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
                textDecoration: "none",
                borderBottom: "1px solid var(--color-primary)",
                paddingBottom: "1px",
                transition: "color var(--transition-fast)",
              }}
            >
              View Offers →
            </a>
          </div>

          <div
            style={{
              background: "var(--color-surface-warm)",
              border: "1px solid var(--color-border)",
              borderLeft: "3px solid var(--color-primary)",
              padding: "var(--space-xl)",
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
                marginBottom: "var(--space-sm)",
              }}
            >
              Referral Program
            </span>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: "0 0 var(--space-sm)" }}>
              Invite friends and earn bonus gift vouchers for every referral.
            </p>
            <a
              href="/referral"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
                textDecoration: "none",
                borderBottom: "1px solid var(--color-primary)",
                paddingBottom: "1px",
                transition: "color var(--transition-fast)",
              }}
            >
              Learn More →
            </a>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
