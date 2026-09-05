import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import Button from "@/Components/App/ui/Button";
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

// Box Office dark theme tokens
const C = {
  bg: "#0B0B10",
  surface: "#15141B",
  border: "#26232E",
  borderDark: "#34303F",
  text: "#F7F5F2",
  textMuted: "#9C97A8",
  textLight: "#6B6775",
  amber: "#FFB627",
  amberDark: "#C98A1A",
  amberLight: "#FFC864",
  success: "#34D399",
  error: "#F87171",
};

// ── Gift card tile (ticket-stub styled) ──────────────────────────
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
  };

  let statusLabel = "Active";
  let statusColor = C.success;
  if (isDepleted) {
    statusLabel = "Used Up";
    statusColor = C.textLight;
  } else if (isExpired) {
    statusLabel = "Expired";
    statusColor = C.error;
  } else if (!card.active) {
    statusLabel = "Pending";
    statusColor = C.amber;
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: isUsable
          ? `linear-gradient(135deg, ${C.amber} 0%, ${C.amberDark} 100%)`
          : C.surface,
        border: `1px solid ${isUsable ? C.amber : C.border}`,
        padding: "24px",
        opacity: isUsable ? 1 : 0.8,
      }}
    >
      {/* perforated ticket-stub edge (top) */}
      <div
        className="absolute left-0 right-0 top-0 h-3"
        style={{
          backgroundImage: `radial-gradient(circle at 10px 0, ${C.bg} 5px, transparent 5.5px)`,
          backgroundSize: "20px 6px",
          backgroundRepeat: "repeat-x",
          backgroundPosition: "top",
        }}
      />

      {/* decorative corner glow */}
      <div
        className="absolute right-0 top-0 rounded-full"
        style={{
          width: "90px",
          height: "90px",
          background: isUsable ? "rgba(255,255,255,0.08)" : "rgba(255,182,39,0.04)",
          transform: "translate(30%, -30%)",
        }}
      />

      {/* status pill */}
      <div
        className="absolute rounded-full font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider"
        style={{
          top: "16px",
          right: "16px",
          color: isUsable ? "#0B0B10" : statusColor,
          background: isUsable ? "rgba(11,11,16,0.15)" : "transparent",
          border: isUsable ? "none" : `1px solid ${statusColor}`,
          padding: "3px 10px",
        }}
      >
        {statusLabel}
      </div>

      {/* gifted-to / received badge */}
      {variant === "purchased" && card.gifted_to_email && (
        <span
          className="mb-2 block font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider"
          style={{ color: isUsable ? "rgba(11,11,16,0.75)" : C.amber }}
        >
          Sent to {card.gifted_to_email}
        </span>
      )}
      {variant === "received" && (
        <span
          className="mb-2 block font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider"
          style={{ color: isUsable ? "rgba(11,11,16,0.75)" : C.amber }}
        >
          Gift Received
        </span>
      )}

      {/* balance */}
      <div className="mb-4">
        <span
          className="mb-1 block font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider"
          style={{ color: isUsable ? "rgba(11,11,16,0.65)" : C.textLight }}
        >
          Remaining Balance
        </span>
        <span
          className="font-['Anton'] uppercase"
          style={{ fontSize: "32px", color: isUsable ? "#0B0B10" : C.text }}
        >
          A${Number(card.remaining_amount ?? 0).toFixed(2)}
        </span>
        <span
          className="ml-2 font-['IBM_Plex_Mono'] text-sm"
          style={{ color: isUsable ? "rgba(11,11,16,0.55)" : C.textLight }}
        >
          of A${Number(card.amount).toFixed(2)}
        </span>
      </div>

      {/* usage bar */}
      <div
        className="mb-4 w-full"
        style={{ height: "3px", background: isUsable ? "rgba(11,11,16,0.2)" : C.border }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${Math.min(Math.max(usagePct, 0), 100)}%`,
            background: isUsable ? "#0B0B10" : C.amber,
          }}
        />
      </div>

      {/* code row */}
      <div
        className="flex items-center justify-between gap-2 rounded-lg"
        style={{
          background: isUsable ? "rgba(11,11,16,0.12)" : C.bg,
          border: `1px dashed ${isUsable ? "rgba(11,11,16,0.35)" : C.borderDark}`,
          padding: "10px 14px",
        }}
      >
        <span
          className="font-['IBM_Plex_Mono'] text-sm font-semibold tracking-widest"
          style={{ color: isUsable ? "#0B0B10" : C.amber }}
        >
          {card.code}
        </span>
        <button
          onClick={handleCopy}
          className="whitespace-nowrap font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: isUsable ? "#0B0B10" : C.amber,
            opacity: 0.85,
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* expiry */}
      {card.expires_at && (
        <p
          className="mt-2 mb-0 font-['IBM_Plex_Mono'] text-xs"
          style={{ color: isUsable ? "rgba(11,11,16,0.6)" : C.textLight }}
        >
          {isExpired ? "Expired" : "Expires"}{" "}
          {new Date(card.expires_at).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      {/* remove button — only once fully used up */}
      {isDepleted && (
        <button
          onClick={handleRemove}
          disabled={removing}
          className="mt-4 block w-full rounded-lg font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider transition-colors"
          style={{
            padding: "8px 12px",
            color: removing ? C.textLight : C.error,
            background: "transparent",
            border: `1px solid ${removing ? C.border : C.error}`,
            cursor: removing ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!removing) {
              (e.currentTarget as HTMLButtonElement).style.background = C.error;
              (e.currentTarget as HTMLButtonElement).style.color = "#0B0B10";
            }
          }}
          onMouseLeave={(e) => {
            if (!removing) {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = C.error;
            }
          }}
        >
          {removing ? "Removing…" : "Remove"}
        </button>
      )}

      {/* perforated ticket-stub edge (bottom) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-3"
        style={{
          backgroundImage: `radial-gradient(circle at 10px 6px, ${C.bg} 5px, transparent 5.5px)`,
          backgroundSize: "20px 6px",
          backgroundRepeat: "repeat-x",
          backgroundPosition: "bottom",
        }}
      />
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
      <h2 className="mb-1 font-['Anton'] uppercase text-xl" style={{ color: C.text }}>
        {title}
      </h2>
      <p className="mb-6 font-['Manrope'] text-sm" style={{ color: C.textMuted }}>
        {subtitle}
      </p>
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
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

  const [hiddenIds, setHiddenIds] = useState<number[]>([]);

  const handleRemove = (id: number) => {
    setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    router.patch(
      route("vouchers.hide", id),
      {},
      {
        preserveScroll: true,
        preserveState: true,
        onError: () => {
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
    <AuthenticatedLayout
      header={
        <h2 className="font-['Anton'] uppercase text-2xl text-white">Vouchers</h2>
      }
    >
      <Head title="Vouchers">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen font-['Manrope']" style={{ background: C.bg, color: C.text }}>
        <PageHero
          eyebrow="Promotions & Rewards"
          title={<>Your <em>Vouchers</em></>}
          subtitle="Your gift card balances, plus a quick way to check any promo or gift code."
          breadcrumbs={[{ label: "Home", href: route("home") }, { label: "Vouchers" }]}
        />

        <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 pb-24 sm:px-1">
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

          {/* ── Empty state ── */}
          {visiblePurchased.length === 0 && visibleReceived.length === 0 && (
            <div
              className="rounded-2xl px-8 py-16 text-center"
              style={{ background: C.surface, border: `1px dashed ${C.border}` }}
            >
              <p className="mb-4 font-['Manrope'] text-sm" style={{ color: C.textMuted }}>
                You don't have any gift cards yet.
              </p>

               <a href="/gift-vouchers/shop"
                className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider no-underline"
                style={{ color: C.amber, borderBottom: `1px solid ${C.amber}`, paddingBottom: "1px" }}
              >
                Buy a Gift Card →
              </a>
            </div>
          )}

          {/* ── Referral Code ── */}
          {referral_code && (
            <div
              className="rounded-2xl"
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.amber}`,
                padding: "24px",
              }}
            >
              <span
                className="mb-2 block font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.2em]"
                style={{ color: C.amber }}
              >
                Your Referral Code
              </span>
              <h2 className="mb-2 font-['Anton'] uppercase text-xl" style={{ color: C.text }}>
                Share &amp; Earn
              </h2>
              <p className="mb-4 font-['Manrope'] text-sm" style={{ color: C.textMuted }}>
                Give your friends a $30 voucher — and you'll earn one too after they spend $100.
              </p>

              <div
                className="mb-3 inline-block font-['IBM_Plex_Mono'] text-xl font-semibold tracking-[0.2em] rounded-lg"
                style={{
                  color: C.amber,
                  background: C.bg,
                  border: `1px dashed ${C.borderDark}`,
                  padding: "10px 24px",
                }}
              >
                {referral_code}
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${referral_code}`}
                  className="flex-1 rounded-lg font-['IBM_Plex_Mono'] text-sm"
                  style={{
                    minWidth: "200px",
                    padding: "10px 16px",
                    color: C.textMuted,
                    background: C.bg,
                    border: `1px solid ${C.border}`,
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
            className="rounded-2xl"
            style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "24px" }}
          >
            <label
              className="mb-4 block font-['IBM_Plex_Mono'] text-[10px] font-medium uppercase tracking-wider"
              style={{ color: C.textMuted }}
            >
              Check a Code
            </label>
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
              <input
                type="text"
                name="code"
                placeholder="Enter voucher or gift code"
                value={data.code}
                onChange={(e) => setData("code", e.target.value)}
                className="flex-1 rounded-lg font-['IBM_Plex_Mono'] text-sm"
                style={{
                  minWidth: "200px",
                  padding: "10px 16px",
                  color: C.text,
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  outline: "none",
                }}
                onFocus={(e) =>
                  ((e.currentTarget as HTMLInputElement).style.borderColor = C.amber)
                }
                onBlur={(e) =>
                  ((e.currentTarget as HTMLInputElement).style.borderColor = C.border)
                }
              />
              <Button type="submit" variant="accent" disabled={processing}>
                {processing ? "Checking…" : "Check Code"}
              </Button>
            </form>

            {error && (
              <p className="mt-4 font-['Manrope'] text-sm" style={{ color: C.error }}>
                {error}
              </p>
            )}
          </div>

          {/* ── Voucher result ── */}
          {voucher && (
            <div
              className="overflow-hidden rounded-2xl"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
            >
              <div
                className="flex items-baseline justify-between"
                style={{ background: C.amber, padding: "18px 24px" }}
              >
                <span className="font-['Anton'] uppercase text-xl" style={{ color: "#0B0B10" }}>
                  Voucher Details
                </span>
                <span
                  className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider"
                  style={{ color: "rgba(11,11,16,0.7)" }}
                >
                  {voucher.type === "gift" ? "Gift Card" : "Promo Code"}
                </span>
              </div>

              <div style={{ padding: "24px" }}>
                <div className="mb-6 text-center">
                  <span
                    className="inline-block rounded-lg font-['IBM_Plex_Mono'] text-2xl font-semibold tracking-[0.2em]"
                    style={{
                      color: C.amber,
                      background: C.bg,
                      border: `1px dashed ${C.borderDark}`,
                      padding: "10px 32px",
                    }}
                  >
                    {voucher.code}
                  </span>
                </div>

                <div
                  className="grid rounded-lg overflow-hidden"
                  style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    border: `1px solid ${C.border}`,
                  }}
                >
                  {[
                    { label: "Type", value: voucher.type.charAt(0).toUpperCase() + voucher.type.slice(1) },
                    { label: "Value", value: `A$${Number(voucher.amount).toFixed(2)}` },
                    ...(voucher.type === "gift"
                      ? [{ label: "Remaining", value: `A$${Number(voucher.remaining_amount ?? 0).toFixed(2)}` }]
                      : []),
                    {
                      label: "Expires",
                      value: new Date(voucher.expires_at).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }),
                    },
                  ].map(({ label, value }, i) => (
                    <div
                      key={label}
                      style={{
                        padding: "16px",
                        borderRight: i % 2 === 0 ? `1px solid ${C.border}` : "none",
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <span
                        className="mb-1 block font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider"
                        style={{ color: C.textLight }}
                      >
                        {label}
                      </span>
                      <span className="font-['Anton'] uppercase text-xl" style={{ color: C.text }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="mb-1 flex justify-between">
                    <span
                      className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider"
                      style={{ color: C.textLight }}
                    >
                      Usage
                    </span>
                    <span className="font-['IBM_Plex_Mono'] text-xs" style={{ color: C.textMuted }}>
                      {voucher.used_count} / {voucher.max_uses}
                    </span>
                  </div>
                  <div className="w-full" style={{ height: "3px", background: C.border }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(usagePct, 100)}%`,
                        background:
                          usagePct >= 100 ? C.error : usagePct > 60 ? C.amber : C.success,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Info panels ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div
              className="rounded-2xl"
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.amberLight}`,
                padding: "24px",
              }}
            >
              <span
                className="mb-2 block font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider"
                style={{ color: C.amberLight }}
              >
                Tip
              </span>
              <p className="mb-2 font-['Manrope'] text-sm" style={{ color: C.textMuted }}>
                Looking for more discounts? Check our latest seasonal promotions.
              </p>

               <a href="/offers"
                className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider no-underline"
                style={{ color: C.amber, borderBottom: `1px solid ${C.amber}`, paddingBottom: "1px" }}
              >
                View Offers →
              </a>
            </div>

            <div
              className="rounded-2xl"
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.amber}`,
                padding: "24px",
              }}
            >
              <span
                className="mb-2 block font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider"
                style={{ color: C.amber }}
              >
                Referral Program
              </span>
              <p className="mb-2 font-['Manrope'] text-sm" style={{ color: C.textMuted }}>
                Invite friends and earn bonus gift vouchers for every referral.
              </p>

              <a  href="/referral"
                className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider no-underline"
                style={{ color: C.amber, borderBottom: `1px solid ${C.amber}`, paddingBottom: "1px" }}
              >
                Learn More →
              </a>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
