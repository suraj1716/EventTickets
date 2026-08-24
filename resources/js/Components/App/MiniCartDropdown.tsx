import { productRoute } from "@/helper";
import { CurrencyFormatter } from "@/utils/CurrencyFormatter";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import { Link, usePage } from "@inertiajs/react";
import React, { useState, useRef, useEffect } from "react";
import { useAuthModal } from "@/Contexts/AuthModalContext";
function MiniCartDropdown() {
  const { auth, totalPrice, totalQuantity, miniCartItems } = usePage()
    .props as any;
  const user = (auth as any)?.user ?? null;
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openLogin } = useAuthModal();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div>
      {/* Backdrop */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--color-overlay)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 9998,
            transition: "opacity var(--transition-base)",
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 9999 }} ref={dropdownRef}>
        {/* Cart Icon Button */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Open Cart"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            background: "transparent",
            border: "1px solid var(--color-border)",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
            color: "var(--color-text-muted)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--color-primary)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--color-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--color-border)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--color-text-muted)";
          }}
        >
          <ShoppingBagIcon style={{ width: "18px", height: "18px" }} />
          {totalQuantity > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-6px",
                background: "var(--color-accent)",
                color: "var(--color-bg-dark)",
                fontFamily: "var(--font-body)",
                fontSize: "0.6rem",
                fontWeight: 600,
                lineHeight: 1,
                minWidth: "18px",
                height: "18px",
                borderRadius: "var(--radius-full)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
              }}
            >
              {totalQuantity}
            </span>
          )}
        </button>

       {/* Dropdown Panel */}
<div
  className="minicart-panel"
  style={{
    position: "absolute",
    right: 0,
    top: "calc(100% + 12px)",
    marginRight:-40 ,
    marginTop:-80,
    width: "360px",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    boxShadow: "var(--shadow-xl)",
    transformOrigin: "top right",
    transition:
      "opacity var(--transition-base), transform var(--transition-base), visibility var(--transition-base)",
    opacity: open ? 1 : 0,
    transform: open
      ? "scale(1) translateY(0)"
      : "scale(0.97) translateY(-6px)",
    visibility: open ? "visible" : "hidden",
    pointerEvents: open ? "auto" : "none",
  }}
>
          {/* Header */}
          <div
            style={{
             padding: "14px 16px 10px",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
               fontSize: "1.1rem",
                fontWeight: 400,
                color: "var(--color-text)",
              }}
            >
              Your Bag
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-text-light)",
              }}
            >
              {totalQuantity} item{totalQuantity !== 1 ? "s" : ""}
            </span>

             <button
      onClick={() => setOpen(false)}
      aria-label="Close cart"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "22px",
        height: "22px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "var(--color-text-muted)",
        padding: 0,
        flexShrink: 0,
        transition: "color var(--transition-fast)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color =
          "var(--color-primary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color =
          "var(--color-text-muted)";
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
          </div>

          {/* Items */}
          <div
            style={{
              padding: "var(--space-md) var(--space-lg)",
              maxHeight: "54vh",
              overflowY: "auto",
            }}
          >
            {miniCartItems?.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "var(--space-3xl) 0",
                  gap: "var(--space-md)",
                }}
              >
                <ShoppingBagIcon
                  style={{
                    width: "36px",
                    height: "36px",
                    color: "var(--color-border-dark)",
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-light)",
                    margin: 0,
                  }}
                >
                  Your bag is empty
                </p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "0" }}
              >
                {miniCartItems?.map((item: any, idx: number) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "var(--space-md)",
                      padding: "var(--space-md) 0",
                      borderBottom:
                        idx < miniCartItems?.length - 1
                          ? "1px solid var(--color-border)"
                          : "none",
                    }}
                  >
                    {/* Thumbnail */}
                    <Link
                      href="#"
                      //  href={productRoute(item)}
                    >
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          flexShrink: 0,
                          overflow: "hidden",
                          background: "var(--color-bg-alt)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        <img
                          src={item.image_url}
                          alt={item.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            transition: "transform var(--transition-slow)",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.transform = "scale(1.06)";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.transform = "scale(1)";
                          }}
                        />
                      </div>
                    </Link>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        href="#"
                        // href={productRoute(item)}
                        style={
                          {
                            fontFamily: "var(--font-display)",
                            fontSize: "var(--text-base)",
                            fontWeight: 400,
                            color: "var(--color-text)",
                            textDecoration: "none",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            marginBottom: "4px",
                            lineHeight: 1.3,
                          } as React.CSSProperties
                        }
                      >
                        {item.title}
                      </Link>

                      {/* Qty × price */}
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-primary)",
                          fontWeight: 500,
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--color-text-light)",
                            fontWeight: 400,
                          }}
                        >
                          ×{item.quantity}&nbsp;
                        </span>
                        <CurrencyFormatter
                          amount={item.quantity * item.price}
                          currency="AUD"
                        />
                      </div>

                      {/* Variations */}
                      {item.options && item.options.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "4px",
                          }}
                        >
                          {item.options.map((opt: any) => (
                            <span
                              key={opt.id}
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
                              {opt.type.name}: {opt.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {miniCartItems?.length > 0 && (
            <div
              style={{
                padding: "var(--space-md) var(--space-lg) var(--space-lg)",
                borderTop: "1px solid var(--color-border)",
                background: "var(--color-surface-warm)",
              }}
            >
              {/* Subtotal row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "var(--space-md)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-xs)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Subtotal
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-xl)",
                    fontWeight: 400,
                    color: "var(--color-primary)",
                  }}
                >
                  <CurrencyFormatter amount={totalPrice} currency="AUD" />
                </span>
              </div>

              {/* CTA */}
              {user ? (
                <Link
                  href={route("cart.index")}
                  style={{
                    display: "block",
                    textAlign: "center",
                    background: "var(--color-primary)",
                    color: "var(--color-text-inverse)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "0.875rem",
                    textDecoration: "none",
                    transition: "background var(--transition-fast)",
                    border: "1px solid var(--color-primary)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "var(--color-primary-light)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "var(--color-primary)";
                  }}
                >
                  View Bag & Checkout
                </Link>
              ) : (
                <button
                  onClick={openLogin}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "center",
                    background: "var(--color-primary)",
                    color: "var(--color-text-inverse)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "0.875rem",
                    border: "1px solid var(--color-primary)",
                    cursor: "pointer",
                    transition: "background var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--color-primary-light)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--color-primary)";
                  }}
                >
                  Sign In to Checkout
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
    </div>
  );
}

export default MiniCartDropdown;
