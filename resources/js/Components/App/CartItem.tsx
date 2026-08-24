import { productRoute } from "@/helper";
import { CartItem as CartItemType } from "@/types";
import { Link, router, useForm } from "@inertiajs/react";
import React, { useState } from "react";
import { CurrencyFormatter } from "@/utils/CurrencyFormatter";

function CartItem({ item }: { item: CartItemType }) {
  const deleteForm = useForm({ option_ids: item.option_ids });
  const [error, setError] = useState("");


  const onDeleteClick = () => {
  if (item.is_gift_card) {
    router.delete(route("cart.gift-card.destroy", item.id), { preserveScroll: true });
  } else {
    deleteForm.delete(route("cart.destroy", item.product_id), { preserveScroll: true });
  }
};

  const handleQuantityChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    router.put(
      route("cart.update", item.product_id),
      { quantity: ev.target.value, option_ids: item.option_ids },
      {
        preserveScroll: true,
        onError: (errors) => setError(Object.values(errors)[0]),
      }
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "var(--space-lg)",
        padding: "var(--space-lg) 0",
        borderBottom: "1px solid var(--color-border)",
        alignItems: "flex-start",
      }}
    >
      {/* Thumbnail */}
      <Link
        href='#'
      // href={productRoute(item)}
      style={{ flexShrink: 0 }}>
        <div
          style={{
            width: "96px",
            height: "96px",
            background: "var(--color-bg-alt)",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={item.image_url}
            alt={item.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform var(--transition-slow)",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")}
          />
        </div>
      </Link>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
        href='#'
          // href={productRoute(item)}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-lg)",
            fontWeight: 400,
            color: "var(--color-text)",
            textDecoration: "none",
            display: "block",
            marginBottom: "6px",
            lineHeight: 1.3,
          }}
        >
          {item.title}
        </Link>

        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--color-primary)",
            marginBottom: "var(--space-sm)",
          }}
        >
          <CurrencyFormatter amount={item.price * item.quantity} currency="AUD" />
        </div>

        {/* Options */}
        {item.options.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "var(--space-sm)" }}>
            {item.options.map((option) => (
              <span
                key={option.id}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--color-accent-dark)",
                  background: "rgba(201,169,110,0.12)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                }}
              >
                {option.type.name}: {option.name}
              </span>
            ))}
          </div>
        )}

        {item.attachment_name && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-light)",
              marginTop: "4px",
            }}
          >
            Attachment: {item.attachment_name}
          </p>
        )}

        {error && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-error)", marginTop: "4px" }}>
            {error}
          </p>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
          flexShrink: 0,
          alignItems: "flex-end",
        }}
      >
        <button
          onClick={onDeleteClick}
          style={{
            background: "transparent",
            color: "var(--color-error)",
            border: "1px solid var(--color-border)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "6px 14px",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "var(--color-text)";
            b.style.color = "var(--color-error)";
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "var(--color-border)";
            b.style.color = "var(--color-error)";
          }}
        >
          Remove
        </button>
        <button
          style={{
            background: "transparent",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "6px 14px",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "var(--color-border-dark)";
            b.style.color = "var(--color-text)";
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.borderColor = "var(--color-border)";
            b.style.color = "var(--color-text-muted)";
          }}
        >
          Save for later
        </button>
      </div>
    </div>
  );
}

export default CartItem;
