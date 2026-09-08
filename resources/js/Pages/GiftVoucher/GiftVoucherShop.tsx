import { useMemo, useState, FormEvent } from "react";
import { router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHero from "@/Components/Page/PageHero";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

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

// Embedded payment form for a gift card purchase — same
// PaymentElement pattern as Checkout/Payment.tsx and the resale
// checkout modal, rendered inline instead of redirecting to
// checkout.stripe.com.
function GiftCardPaymentForm({
  totalDue,
  onDone,
}: {
  totalDue: number;
  onDone: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/stripe/success?payment_intent={PAYMENT_INTENT_ID}`,
      },
    });

    if (error) {
      setErrorMessage(
        error.message ?? "Payment failed. Please check your payment details."
      );
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {errorMessage && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 8,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: 14,
          }}
        >
          {errorMessage}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-lg)" }}>
        <button
          type="button"
          onClick={onDone}
          disabled={submitting}
          style={{
            flex: 1,
            background: "transparent",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            padding: "0.875rem",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || submitting}
          style={{
            flex: 1,
            background: "var(--color-primary)",
            color: "var(--color-text-inverse)",
            border: "none",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            padding: "0.875rem",
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Processing…" : `Pay $${totalDue.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

function GiftCardCheckoutModal({
  clientSecret,
  stripeKey,
  totalDue,
  onClose,
}: {
  clientSecret: string;
  stripeKey: string;
  totalDue: number;
  onClose: () => void;
}) {
  const stripePromise = useMemo(() => loadStripe(stripeKey), [stripeKey]);
  const options = useMemo(() => ({ clientSecret }), [clientSecret]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          padding: "var(--space-xl)",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-lg)",
            marginBottom: "var(--space-md)",
          }}
        >
          Gift card payment
        </h3>

        <Elements stripe={stripePromise} options={options}>
          <GiftCardPaymentForm totalDue={totalDue} onDone={onClose} />
        </Elements>
      </div>
    </div>
  );
}

export default function GiftVoucherShop({ giftCards }: GiftVoucherShopProps) {
  const { csrf_token } = usePage().props as { csrf_token: string };
  const [selectedId, setSelectedId] = useState<number | null>(
    giftCards.length > 0 ? giftCards[0].id : null
  );
  const [giftedToEmail, setGiftedToEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkout, setCheckout] = useState<{
    clientSecret: string;
    stripeKey: string;
    totalDue: number;
  } | null>(null);

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

  const handleBuyNow = async () => {
    if (!selectedId) { alert("Please select a gift card."); return; }
    setLoading(true);
    try {
      const res = await fetch(route("gift-voucher.purchase"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-TOKEN": csrf_token,
        },
        body: JSON.stringify({
          gift_card_template_id: selectedId,
          gifted_to_email: giftedToEmail || null,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Purchase failed. Please try again.");
        return;
      }

      setCheckout({
        clientSecret: data.clientSecret,
        stripeKey: data.stripeKey,
        totalDue: data.totalDue,
      });
    } catch {
      alert("Purchase failed. Please try again.");
    } finally {
      setLoading(false);
    }
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

      {checkout && (
        <GiftCardCheckoutModal
          clientSecret={checkout.clientSecret}
          stripeKey={checkout.stripeKey}
          totalDue={checkout.totalDue}
          onClose={() => setCheckout(null)}
        />
      )}
    </AuthenticatedLayout>
  );
}
