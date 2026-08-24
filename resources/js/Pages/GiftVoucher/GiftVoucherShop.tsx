import { useState } from "react";
import { router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHero from "@/Components/Page/PageHero";

type GiftCardTemplate = {
  id: number;
  title: string;
  description: string | null;
  amount: number;
  image_url: string | null;
};

interface GiftVoucherShopProps {
  giftCards: GiftCardTemplate[];
}

export default function GiftVoucherShop({ giftCards }: GiftVoucherShopProps) {
  const [selectedId, setSelectedId] = useState<number | null>(
    giftCards.length > 0 ? giftCards[0].id : null
  );
  const [giftedToEmail, setGiftedToEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = giftCards.find((g) => g.id === selectedId) ?? null;

  const handleAddToCart = () => {
    if (!selectedId) { alert("Please select a gift card."); return; }
    setLoading(true);
    router.post(
      route("gift-voucher.add-to-cart"),
      { gift_card_template_id: selectedId, gifted_to_email: giftedToEmail || null },
      {
        preserveScroll: true,
        onFinish: () => setLoading(false),
        onError: () => setLoading(false),
      }
    );
  };

  const handleBuyNow = () => {
    if (!selectedId) { alert("Please select a gift card."); return; }
    setLoading(true);
    router.post(
      route("gift-voucher.purchase"),
      { gift_card_template_id: selectedId, gifted_to_email: giftedToEmail || null, quantity: 1 },
      { onFinish: () => setLoading(false), onError: () => setLoading(false) }
    );
  };

  return (
    <AuthenticatedLayout>

 {/* Hero */}
          <PageHero
               eyebrow="We'd love to hear from you"
               title={<>Gift Vouchers</>}
               subtitle="Send Gift Vouchers To Your Loved Ones."
               breadcrumbs={[{ label: "Home", href: route("home") }, { label: "Gift Vouchers" }]}
             />

      <div
        style={{
          maxWidth: "720px",
          margin: "var(--space-4xl) auto",
          padding: "0 var(--space-lg)",
          fontFamily: "var(--font-body)",
        }}
      >




        {/* Card grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "var(--space-md)",
            marginBottom: "var(--space-2xl)",
          }}
        >
          {giftCards.map((card) => {
            const isSelected = selectedId === card.id;
            return (
              <button
                key={card.id}
                onClick={() => setSelectedId(card.id)}
                style={{
                  background: isSelected ? "var(--color-primary)" : "var(--color-surface)",
                  border: `1px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                  padding: "var(--space-xl) var(--space-md)",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all var(--transition-base)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-3xl)",
                    fontWeight: 300,
                    color: isSelected ? "#fff" : "var(--color-primary)",
                    lineHeight: 1,
                  }}
                >
                  ${card.amount.toFixed(0)}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-xs)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: isSelected ? "rgba(255,255,255,0.75)" : "var(--color-text-light)",
                  }}
                >
                  {card.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Description */}
        {selected?.description && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
              textAlign: "center",
              marginBottom: "var(--space-xl)",
            }}
          >
            {selected.description}
          </p>
        )}

        {/* Gift email */}
        <div
          style={{
            background: "var(--color-surface-warm)",
            border: "1px solid var(--color-border)",
            padding: "var(--space-xl)",
            marginBottom: "var(--space-xl)",
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
              marginBottom: "var(--space-sm)",
            }}
          >
            Send to someone (optional)
          </label>
          <input
            type="email"
            placeholder="recipient@email.com"
            value={giftedToEmail}
            onChange={(e) => setGiftedToEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text)",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              outline: "none",
            }}
          />
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-light)",
              marginTop: "var(--space-xs)",
            }}
          >
            Leave blank to keep for yourself. The recipient will receive the voucher code by email.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "var(--space-md)" }}>
          {/* <button
            onClick={handleAddToCart}
            disabled={loading || !selectedId}
            style={{
              flex: 1,
              background: "transparent",
              color: "var(--color-primary)",
              border: "1px solid var(--color-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.875rem",
              cursor: loading || !selectedId ? "not-allowed" : "pointer",
              opacity: loading || !selectedId ? 0.6 : 1,
              transition: "all var(--transition-base)",
            }}
          >
            Add to Cart
          </button> */}

          <button
            onClick={handleBuyNow}
            disabled={loading || !selectedId}
            style={{
              flex: 1,
              background: loading || !selectedId ? "var(--color-border)" : "var(--color-primary)",
              color: loading || !selectedId ? "var(--color-text-light)" : "var(--color-text-inverse)",
              border: "none",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.875rem",
              cursor: loading || !selectedId ? "not-allowed" : "pointer",
              transition: "background var(--transition-base)",
            }}
          >
            {loading ? "Please wait…" : "Buy Now"}
          </button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
