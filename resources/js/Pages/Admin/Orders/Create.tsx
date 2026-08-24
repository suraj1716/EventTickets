import React, { useState, useRef, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  AdminBtn,
  Icons,
  FlashMessage,
} from "../../../Components/Admin/AdminComponents";
import { User, Vendor } from "@/types";

/* ── Types ── */
interface Product {
  id: number;
  title: string;
  price: number;
  image: string | null;
}
interface LineItem {
  product_id: number;
  title: string;
  quantity: number;
  price: number;
}
interface FoundUser {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Props {
  products: Product[];
  vendor_user_id: number;
  vendor_name: string;
  users?: User[];
  vendors?: Vendor[];
  statuses?: string[];
  flash?: { success?: string; error?: string };
  errors?: Record<string, string>;
}

/* ── Style helpers ── */
const label: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "10px",
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  marginBottom: 6,
};
const input: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  fontFamily: "var(--font-body)",
  fontSize: "13px",
  color: "var(--color-text)",
  background: "var(--color-bg-alt)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 150ms",
};
const err: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "11px",
  color: "var(--color-error)",
  marginTop: 4,
};
const fieldWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

function Card({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg-alt)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 3,
              height: 16,
              background: "var(--color-accent)",
              borderRadius: 2,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              fontWeight: 500,
            }}
          >
            {title}
          </span>
        </div>
        {badge && (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              background: "rgba(201,169,110,0.1)",
              border: "1px solid rgba(201,169,110,0.25)",
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

/* ── Time slot helper ── */
function roundedSlot(): { date: string; slot: string } {
  const now = new Date();
  const mins = now.getMinutes();
  const roundedMins = Math.round(mins / 30) * 30;
  const start = new Date(now);
  start.setMinutes(roundedMins, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const dateStr = now.toISOString().split("T")[0];
  return { date: dateStr, slot: `${fmt(start)} - ${fmt(end)}` };
}

/* ── Available 30-min time slots for today ── */
function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h < 20; h++) {
    for (const m of [0, 30]) {
      const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const endM = m + 30;
      const endH = endM >= 60 ? h + 1 : h;
      const end = `${String(endH).padStart(2, "0")}:${String(endM % 60).padStart(2, "0")}`;
      slots.push(`${start} - ${end}`);
    }
  }
  return slots;
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function Create({
  products,
  vendor_user_id,
  vendor_name,
  flash,
  errors = {},
  users = [],
  vendors = [],
  statuses = [],
}: Props) {
  /* ── Customer state ── */
  const [phone, setPhone] = useState("");
  const [lookupState, setLookupState] = useState<
    "idle" | "searching" | "found" | "new"
  >("idle");
  const { props } = usePage();
  const csrfToken = (props as any).csrf_token;
  const [foundUser, setFoundUser] = useState<User | null>(null);

  const [resolvedUserId, setResolvedUserId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  /* ── Items state ── */
  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedPid, setSelectedPid] = useState("");
  const [productSearch, setProductSearch] = useState("");

  /* ── Booking state ── */
  const { date: autoDate, slot: autoSlot } = roundedSlot();
  const [addBooking, setAddBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState(autoDate);
  const [bookingSlot, setBookingSlot] = useState(autoSlot);
  const timeSlots = buildTimeSlots();

  /* ── Payment state ── */
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "eftpos" | "other"
  >("cash");
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ── Phone lookup ── */
  const handlePhoneLookup = async () => {
    if (phone.length < 6) return;
    setLookupState("searching");
    setFoundUser(null);
    setResolvedUserId(null);

    try {
      const res = await fetch(route("admin.orders.walkin.lookup"), {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          Accept: "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (data.found) {
        setFoundUser(data.user);
        setResolvedUserId(data.user.id);
        setLookupState("found");
      } else {
        setLookupState("new");
      }
    } catch {
      setLookupState("new");
    }
  };

  const resetCustomer = () => {
    setPhone("");
    setLookupState("idle");
    setFoundUser(null);
    setResolvedUserId(null);
    setNewName("");
    setNewEmail("");
  };

  /* ── Product helpers ── */
  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const addItem = () => {
    const product = products.find((p) => p.id === Number(selectedPid));
    if (!product) return;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product_id === product.id);
      if (idx >= 0) {
        const u = [...prev];
        u[idx].quantity += 1;
        return u;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          title: product.title,
          quantity: 1,
          price: product.price,
        },
      ];
    });
    setSelectedPid("");
    setProductSearch("");
  };

  const updateItem = (
    idx: number,
    field: "quantity" | "price",
    val: number,
  ) => {
    setItems((prev) => {
      const u = [...prev];
      u[idx][field] = val;
      return u;
    });
  };

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);

  /* ── Submit ── */
  const handleSubmit = () => {
    setSubmitting(true);
    const payload: Record<string, any> = {
      vendor_user_id: vendor_user_id,
      payment_method: paymentMethod,
      is_paid: isPaid,
      notes,
      items: items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        price: i.price,
      })),
      add_booking: addBooking,
      booking_date: addBooking ? bookingDate : undefined,
      booking_time_slot: addBooking ? bookingSlot : undefined,
    };

    if (resolvedUserId) {
      payload.user_id = resolvedUserId;
    } else {
      payload.new_name = newName;
      payload.new_email = newEmail;
      payload.new_phone = phone;
    }

    router.post(route("admin.orders.store"), payload, {
      onFinish: () => setSubmitting(false),
    });
  };

  const canSubmit =
    (resolvedUserId || (lookupState === "new" && newName.trim())) &&
    items.length > 0;

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <>
      <Head title="Walk-in Order" />
      <AdminLayout>
        <AdminPageHeader
          eyebrow="Orders"
          title="Walk-in Order"
          meta={`Serving as: ${vendor_name}`}
          action={
            <AdminBtn as="a" href={route("admin.orders.index")} variant="ghost">
              <Icons.Back /> Back to Orders
            </AdminBtn>
          }
        />

        <FlashMessage flash={flash ?? {}} />
        {errors.error && (
          <div
            style={{
              ...err,
              padding: "10px 14px",
              border: "1px solid rgba(192,57,43,0.2)",
              background: "rgba(192,57,43,0.06)",
              borderRadius: "var(--radius-sm)",
              marginBottom: 16,
            }}
          >
            {errors.error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 300px",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* ════ LEFT COLUMN ════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* ── STEP 1: Customer ── */}
            <Card
              title="Step 1 — Customer"
              badge={
                resolvedUserId || lookupState === "new"
                  ? resolvedUserId
                    ? "✓ Linked"
                    : "✓ New"
                  : undefined
              }
            >
              {/* Phone lookup row */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1, ...fieldWrap }}>
                  <label style={label}>Mobile Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setLookupState("idle");
                      setFoundUser(null);
                      setResolvedUserId(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handlePhoneLookup()}
                    placeholder="e.g. 0412 345 678"
                    style={input}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <AdminBtn
                    onClick={handlePhoneLookup}
                    disabled={phone.length < 6 || lookupState === "searching"}
                    variant="primary"
                  >
                    {lookupState === "searching" ? "Searching…" : "Lookup"}
                  </AdminBtn>
                </div>
              </div>

              {/* Found existing user */}
              {lookupState === "found" && foundUser && (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(58,125,68,0.06)",
                    border: "1px solid rgba(58,125,68,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--color-text)",
                      }}
                    >
                      {foundUser.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        color: "var(--color-text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {foundUser.email} · {foundUser.phone}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--color-success)",
                      }}
                    >
                      ✓ Existing customer
                    </span>
                    <button
                      onClick={resetCustomer}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-text-muted)",
                        cursor: "pointer",
                        fontSize: 16,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* New user register form */}
              {lookupState === "new" && (
                <div
                  style={{
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "var(--color-bg-alt)",
                      borderBottom: "1px solid var(--color-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "10px",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "var(--color-warning)",
                      }}
                    >
                      ✦ No account found — register new customer
                    </span>
                    <button
                      onClick={resetCustomer}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-text-muted)",
                        cursor: "pointer",
                        fontSize: 16,
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div
                    style={{
                      padding: "16px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div style={fieldWrap}>
                      <label style={label}>Full Name *</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Jane Smith"
                        style={input}
                      />
                      {errors.new_name && (
                        <span style={err}>{errors.new_name}</span>
                      )}
                    </div>
                    <div style={fieldWrap}>
                      <label style={label}>Email (optional)</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="jane@email.com"
                        style={input}
                      />
                      {errors.new_email && (
                        <span style={err}>{errors.new_email}</span>
                      )}
                    </div>
                    <div style={fieldWrap}>
                      <label style={label}>Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        disabled
                        style={{ ...input, opacity: 0.6 }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* ── STEP 2: Products ── */}
            <Card
              title="Step 2 — Products"
              badge={
                items.length > 0
                  ? `${items.length} item${items.length > 1 ? "s" : ""}`
                  : undefined
              }
            >
              {/* Product search + add */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    style={{
                      width: 13,
                      height: 13,
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-muted)",
                      pointerEvents: "none",
                    }}
                  >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setSelectedPid("");
                    }}
                    placeholder="Search products…"
                    style={{ ...input, paddingLeft: 30 }}
                  />
                  {productSearch && filteredProducts.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 20,
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        maxHeight: 220,
                        overflowY: "auto",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      }}
                    >
                      {filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPid(String(p.id));
                            setProductSearch(p.title);
                          }}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            borderBottom: "1px solid var(--color-border)",
                            background:
                              selectedPid === String(p.id)
                                ? "var(--color-bg-alt)"
                                : "transparent",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "13px",
                              color: "var(--color-text)",
                            }}
                          >
                            {p.title}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "12px",
                              color: "var(--color-primary)",
                              fontWeight: 500,
                            }}
                          >
                            A${p.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <AdminBtn
                  onClick={addItem}
                  disabled={!selectedPid}
                  variant="primary"
                >
                  <Icons.Plus /> Add
                </AdminBtn>
              </div>

              {/* Line items table */}
              {items.length === 0 ? (
                <div
                  style={{
                    padding: "32px 0",
                    textAlign: "center",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--color-text-muted)",
                    opacity: 0.6,
                  }}
                >
                  Search and add products above
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr
                        style={{
                          background: "var(--color-bg-alt)",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        {["Product", "Qty", "Price", "Subtotal", ""].map(
                          (h) => (
                            <th
                              key={h}
                              style={{
                                padding: "8px 12px",
                                textAlign: "left",
                                fontFamily: "var(--font-body)",
                                fontSize: "9px",
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                                color: "var(--color-text-muted)",
                                fontWeight: 500,
                              }}
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr
                          key={item.product_id}
                          style={{
                            borderBottom: "1px solid var(--color-border)",
                          }}
                        >
                          <td
                            style={{
                              padding: "10px 12px",
                              fontFamily: "var(--font-body)",
                              fontSize: "13px",
                              color: "var(--color-text)",
                            }}
                          >
                            {item.title}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  i,
                                  "quantity",
                                  Number(e.target.value),
                                )
                              }
                              style={{
                                ...input,
                                width: 60,
                                padding: "5px 8px",
                              }}
                            />
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={item.price}
                              onChange={(e) =>
                                updateItem(i, "price", Number(e.target.value))
                              }
                              style={{
                                ...input,
                                width: 80,
                                padding: "5px 8px",
                              }}
                            />
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              fontFamily: "var(--font-body)",
                              fontSize: "13px",
                              color: "var(--color-primary)",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                            }}
                          >
                            A${(item.quantity * item.price).toFixed(2)}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <button
                              onClick={() => removeItem(i)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--color-error)",
                                fontSize: 16,
                                lineHeight: 1,
                                display: "flex",
                              }}
                            >
                              <Icons.Delete />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr
                        style={{
                          borderTop: "2px solid var(--color-border)",
                          background: "var(--color-bg-alt)",
                        }}
                      >
                        <td
                          colSpan={3}
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            fontFamily: "var(--font-body)",
                            fontSize: "10px",
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          Order Total
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontFamily: "var(--font-display)",
                            fontSize: "1.2rem",
                            color: "var(--color-primary)",
                            fontWeight: 400,
                          }}
                        >
                          A${total.toFixed(2)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>

            {/* ── STEP 3: Booking ── */}
            <Card title="Step 3 — Booking (optional)">
              {/* Toggle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: addBooking ? 16 : 0,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      color: "var(--color-text)",
                      fontWeight: 500,
                    }}
                  >
                    Add a booking for this visit
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      color: "var(--color-text-muted)",
                      marginTop: 2,
                    }}
                  >
                    Auto-filled to current time slot · {autoDate}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAddBooking((v) => !v)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: "var(--radius-full)",
                    background: addBooking
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 200ms",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: addBooking ? 23 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "white",
                      transition: "left 200ms",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </button>
              </div>

              {addBooking && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div style={fieldWrap}>
                    <label style={label}>Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      style={input}
                    />
                  </div>
                  <div style={fieldWrap}>
                    <label style={label}>Time Slot</label>
                    <select
                      value={bookingSlot}
                      onChange={(e) => setBookingSlot(e.target.value)}
                      style={input}
                    >
                      {timeSlots.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </Card>

            {/* ── Notes ── */}
            <Card title="Notes (optional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any staff notes about this visit…"
                rows={3}
                style={{ ...input, resize: "vertical", lineHeight: 1.6 }}
              />
            </Card>
          </div>

          {/* ════ RIGHT COLUMN ════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Vendor info */}
            <Card title="Vendor">
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--color-bg-alt)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--color-success)",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--color-text)",
                    }}
                  >
                    {vendor_name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "10px",
                      color: "var(--color-text-muted)",
                      marginTop: 1,
                    }}
                  >
                    Auto-assigned · logged in user
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment */}
            <Card title="Payment">
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* Method buttons */}
                <div style={fieldWrap}>
                  <label style={label}>Method</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    {(["cash", "eftpos"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        style={{
                          padding: "10px 0",
                          fontFamily: "var(--font-body)",
                          fontSize: "11px",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          border: `1px solid ${paymentMethod === m ? "var(--color-accent)" : "var(--color-border)"}`,
                          background:
                            paymentMethod === m
                              ? "rgba(201,169,110,0.1)"
                              : "transparent",
                          color:
                            paymentMethod === m
                              ? "var(--color-accent)"
                              : "var(--color-text-muted)",
                          borderRadius: "var(--radius-sm)",
                          transition: "all 150ms",
                        }}
                      >
                        {m === "cash" ? "💵 Cash" : "💳 EFTPOS"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paid toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "var(--color-bg-alt)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "var(--color-text)",
                      }}
                    >
                      Mark as Paid
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "10px",
                        color: "var(--color-text-muted)",
                        marginTop: 1,
                      }}
                    >
                      Payment collected now
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPaid((v) => !v)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: "var(--radius-full)",
                      background: isPaid
                        ? "var(--color-success)"
                        : "var(--color-border)",
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 200ms",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: isPaid ? 23 : 3,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "white",
                        transition: "left 200ms",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </button>
                </div>
              </div>
            </Card>

            {/* Order summary */}
            <Card title="Summary">
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[
                  [
                    "Customer",
                    resolvedUserId
                      ? (foundUser?.name ?? "Existing")
                      : lookupState === "new" && newName
                        ? `${newName} (new)`
                        : "—",
                  ],
                  [
                    "Items",
                    items.length > 0
                      ? `${items.length} product${items.length > 1 ? "s" : ""}`
                      : "—",
                  ],
                  [
                    "Booking",
                    addBooking ? `${bookingDate} · ${bookingSlot}` : "None",
                  ],
                  [
                    "Payment",
                    `${paymentMethod.toUpperCase()} · ${isPaid ? "Paid" : "Unpaid"}`,
                  ],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {k}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: "var(--color-text)",
                        textAlign: "right",
                        maxWidth: 160,
                        wordBreak: "break-word",
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}

                <div
                  style={{
                    height: 1,
                    background: "var(--color-border)",
                    margin: "4px 0",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.3rem",
                      color: "var(--color-primary)",
                    }}
                  >
                    A${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Submit */}
            {/* <AdminBtn
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              variant="accent"
            >
              <Icons.Check />
              {submitting ? "Creating Order…" : "Create Walk-in Order"}
            </AdminBtn> */}

            {!canSubmit && (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  color: "var(--color-text-muted)",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                {!resolvedUserId && lookupState !== "new"
                  ? "Look up a customer first"
                  : items.length === 0
                    ? "Add at least one product"
                    : ""}
              </p>
            )}
          </div>
        </div>

        {/* Sticky save bar */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            zIndex: 40,
            background: "var(--color-surface)",
            borderTop: "1px solid var(--color-border)",
            padding: "12px 20px",
            margin: "24px -28px -32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-text-muted)",
            }}
          >
            {resolvedUserId || (lookupState === "new" && newName)
              ? `Customer: ${foundUser?.name ?? newName} · ${items.length} item(s) · A$${total.toFixed(2)}`
              : "Walk-in order — no customer linked yet"}
          </div>
          <AdminBtn
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            variant="accent"
          >
            <Icons.Check />
            {submitting ? "Creating…" : "Create Order"}
          </AdminBtn>
        </div>
      </AdminLayout>
    </>
  );
}
