import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { FormEvent, useMemo, useState } from "react";

interface OrderSummaryItem {
  title: string;
  quantity: number;
  price: number;
}

interface PaymentPageProps {
  clientSecret: string;
  stripeKey: string;
  orderSummary: OrderSummaryItem[];
  totalDue: number;
}

function OrderSummary({
  items,
  totalDue,
}: {
  items: OrderSummaryItem[];
  totalDue: number;
}) {
  return (
    <div
      style={{
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: 20,
        marginBottom: 24,
      }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            padding: "8px 0",
            fontSize: 14,
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 500,
                color: "#111827",
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                marginTop: 3,
                color: "#6b7280",
                fontSize: 13,
              }}
            >
              Quantity: {item.quantity}
            </div>
          </div>

          <div
            style={{
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            ${(item.price * item.quantity).toFixed(2)}
          </div>
        </div>
      ))}

      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          marginTop: 12,
          paddingTop: 14,
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        <span>Total</span>

        <span>
          ${Number(totalDue).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function PaymentForm({ totalDue }: { totalDue: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);



  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!stripe || !elements || submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

   const { error } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url:
      `${window.location.origin}/stripe/success?payment_intent={PAYMENT_INTENT_ID}`,
  },
});

    if (error) {
      setErrorMessage(
        error.message ??
          "Payment failed. Please check your payment details."
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
            marginTop: 14,
            padding: "12px 14px",
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

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        style={{
          width: "100%",
          marginTop: 20,
          padding: "15px 20px",
          borderRadius: 8,
          border: "none",
          background: "#111827",
          color: "#fff",
          fontSize: 15,
          fontWeight: 600,
          cursor:
            submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "Processing…" : `Pay $${Number(totalDue).toFixed(2)}`}
      </button>
    </form>
  );
}

export default function Payment({
  clientSecret,
  stripeKey,
  orderSummary,
  totalDue,
}: PaymentPageProps) {
  const stripePromise = useMemo(
    () => loadStripe(stripeKey),
    [stripeKey]
  );

  const options = useMemo(
    () => ({
      clientSecret,
    }),
    [clientSecret]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f8",
        padding: "40px 16px 60px",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: 28,
            boxShadow: "0 4px 20px rgba(0,0,0,.05)",
          }}
        >
          <h1
            style={{
              margin: "0 0 24px",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            Payment
          </h1>

          <OrderSummary
            items={orderSummary}
            totalDue={totalDue}
          />

          <Elements
            stripe={stripePromise}
            options={options}
          >
              <PaymentForm totalDue={totalDue} />
          </Elements>
        </div>
      </div>
    </div>
  );
}
