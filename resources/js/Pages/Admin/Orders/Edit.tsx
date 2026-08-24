import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  AdminBtn,
  FlashMessage,
  Icons,
} from "../../../Components/Admin/AdminComponents";

interface Product {
  id: number;
  title: string;
  price: number;
}
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}
interface LineItem {
  product_id: number;
  title: string;
  quantity: number;
  price: number;
}
interface StaffOption {
  id: number;
  name: string;
}

interface OrderProp {
  payment_intent: any;
  id: number;
  user_id: number;
  vendor_user_id: number;
  status: string;
  is_paid: boolean;
  payment_method: string;
  total_price: number;
  notes: string;
  booking: {
    id: number;
    booking_date: string;
    time_slot: string;
    assigned_staff_id: number | null;
    assigned_staff: string | null;
  } | null;
  items: LineItem[];
}

interface Props {
  order: OrderProp;
  products: Product[];
  users: User[];
  statuses: string[];
  staffOptions: StaffOption[];
  flash: { success?: string; error?: string };
  errors: Record<string, string>;
  vendor: { business_start_time: string; business_end_time: string; slot_interval_minutes: number } | null;
}

function buildTimeSlots() {
  const slots: string[] = [];
  for (let h = 8; h < 20; h++) {
    for (const m of [0, 30]) {
      const s = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const eh = m + 30 >= 60 ? h + 1 : h;
      const em = (m + 30) % 60;
      const e = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
      slots.push(`${s} - ${e}`);
    }
  }
  return slots;
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "10px",
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
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
};
const errStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "11px",
  color: "var(--color-error)",
  marginTop: 4,
};

function Card({
  title,
  children,
}: {
  title: string;
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
          gap: 10,
        }}
      >
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
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: "var(--radius-full)",
        background: checked ? "var(--color-success)" : "var(--color-border)",
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
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "white",
          transition: "left 200ms",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}


function generateTimeSlots(start: string, end: string, intervalMinutes: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  let current = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  const fmt = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const ampm = h < 12 ? 'am' : 'pm';
    const hour = h % 12 === 0 ? 12 : h % 12;
    const min = String(m).padStart(2, '0');
    return `${hour}:${min} ${ampm}`;
  };

  while (current < endTotal) {
    const next = current + intervalMinutes;
    slots.push(`${fmt(current)} - ${fmt(next)}`);
    current = next;
  }

  return slots;
}


function getCsrfToken(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
export default function OrderEdit({
  order,
  products,
  users,
  statuses,
  staffOptions,
  flash,
 errors = {},
 vendor
}: Props) {
const { props } = usePage();
console.log("ALL PROPS:", props);
  // ── Customer ──
  const customer = users.find((u) => u.id === order.user_id) ?? null;
  const [phone, setPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [foundUser, setFoundUser] = useState<User | null>(customer);
  const [resolvedUserId, setResolvedUserId] = useState<number | null>(
    order.user_id,
  );
  const [lookupState, setLookupState] = useState<
    "idle" | "searching" | "found" | "new"
  >(customer ? "found" : "idle");

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
        "X-XSRF-TOKEN": getCsrfToken(),  // ← cookie-based, header name matches
        Accept: "application/json",
      },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (data.found) {
      setFoundUser(data.user);
      setResolvedUserId(data.user.id);
      setLookupState("found");
    } else {
      setLookupState("new");
    }
  } catch (err) {
    console.error("Lookup fetch error:", err);
    setLookupState("new");
  }
};
  // ── Items ──
  const [items, setItems] = useState<LineItem[]>(order.items);
  const [status, setStatus] = useState(order.status);
  const [isPaid, setIsPaid] = useState(order.is_paid);
  const [payMethod, setPayMethod] = useState(
  order.payment_method || (order.payment_intent ? "stripe" : "cash")
);
  const [notes, setNotes] = useState(order.notes || "");
  const [productSearch, setProductSearch] = useState("");
  const [selectedPid, setSelectedPid] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Booking ──
  const [hasBooking, setHasBooking] = useState(!!order.booking);
  const [bookingDate, setBookingDate] = useState(
  order.booking?.booking_date
    ? order.booking.booking_date.split('T')[0]
    : new Date().toISOString().split("T")[0],
);
  const [bookingSlot, setBookingSlot] = useState(
    order.booking?.time_slot ?? "09:00 - 09:30",
  );
  const [assignedStaffId, setAssignedStaffId] = useState<string>(
    order.booking?.assigned_staff_id ? String(order.booking.assigned_staff_id) : "",
  );
  const timeSlots = vendor
    ? generateTimeSlots(vendor.business_start_time, vendor.business_end_time, vendor.slot_interval_minutes)
    : generateTimeSlots("09:00", "20:00", 30); // fallback

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const addItem = () => {
    const p = products.find((x) => x.id === Number(selectedPid));
    if (!p) return;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product_id === p.id);
      if (idx >= 0) {
        const u = [...prev];
        u[idx].quantity += 1;
        return u;
      }
      return [
        ...prev,
        { product_id: p.id, title: p.title, quantity: 1, price: p.price },
      ];
    });
    setSelectedPid("");
    setProductSearch("");
  };

  const updateItem = (idx: number, field: "quantity" | "price", val: number) =>
    setItems((prev) => {
      const u = [...prev];
      u[idx][field] = val;
      return u;
    });

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);

  const handleSubmit = () => {
    setSubmitting(true);
    const payload: Record<string, any> = {
      _method: "PUT",
      status,
      is_paid: isPaid,
      payment_method: payMethod,
      notes,
      user_id: resolvedUserId,
      items: items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        price: i.price,
      })),
    };
    if (hasBooking) {
      payload.booking_date = bookingDate;
      payload.booking_time_slot = bookingSlot;
      payload.assigned_staff_id = assignedStaffId ? Number(assignedStaffId) : null;
    }
    if (lookupState === "new" && newName) {
      payload.new_customer = { name: newName, email: newEmail, phone };
    }

    router.post(route("admin.orders.update", order.id), payload, {
      onFinish: () => setSubmitting(false),
    });
  };
if (!order) {
    console.warn("order is undefined! Full props was:", props);
    return (
      <AdminLayout>
        <div style={{ padding: "3rem", textAlign: "center" }}>Loading order…</div>
      </AdminLayout>
    );
  }
  return (
    <>
      <Head title={`Edit Order #${order.id}`} />
      <AdminLayout>
        <AdminPageHeader
          eyebrow="Commerce"
          title={
            <>
              Edit Order <em style={{ fontStyle: "italic" }}>#{order.id}</em>
            </>
          }
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <AdminBtn
                as="a"
                href={route("admin.orders.show", order.id)}
                variant="ghost"
              >
                <Icons.View /> View
              </AdminBtn>
              <AdminBtn
                as="a"
                href={route("admin.orders.index")}
                variant="ghost"
              >
                <Icons.Back /> Orders
              </AdminBtn>
            </div>
          }
        />

        <FlashMessage flash={flash} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 300px",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* ── Customer ── */}
            <Card title="Customer">
              {/* Current customer display */}
              {lookupState === "found" && foundUser && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(58,125,68,0.06)",
                    border: "1px solid rgba(58,125,68,0.2)",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
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
                      ✓ {foundUser.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        color: "var(--color-text-muted)",
                        marginTop: 3,
                      }}
                    >
                      {foundUser.email}
                      {foundUser.phone ? ` · ${foundUser.phone}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLookupState("idle");
                      setFoundUser(null);
                      setPhone("");
                      setResolvedUserId(null);
                    }}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "10px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-accent)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Phone search */}
              {lookupState === "idle" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePhoneLookup()}
                    placeholder="Search by phone number"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handlePhoneLookup}
                    style={{
                      padding: "9px 16px",
                      background: "var(--color-primary)",
                      color: "white",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    Search
                  </button>
                </div>
              )}

              {lookupState === "searching" && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Searching…
                </p>
              )}

              {lookupState === "new" && (
                <div style={{ marginTop: 8 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                      marginBottom: 12,
                    }}
                  >
                    No customer found for <strong>{phone}</strong> — fill in
                    details to create one.
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label style={labelStyle}>Name *</label>
                      <input
                        style={inputStyle}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Full name"
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label style={labelStyle}>Email</label>
                      <input
                        style={inputStyle}
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLookupState("idle");
                        setPhone("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        color: "var(--color-text-muted)",
                        textAlign: "left",
                        padding: 0,
                      }}
                    >
                      ← Search again
                    </button>
                  </div>
                </div>
              )}
            </Card>

            {/* ── Items ── */}
            <Card title="Order Items">
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setSelectedPid("");
                    }}
                    placeholder="Search products…"
                    style={{ ...inputStyle, paddingLeft: 30 }}
                  />
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
                  {productSearch && filtered.length > 0 && (
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
                        maxHeight: 200,
                        overflowY: "auto",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      }}
                    >
                      {filtered.map((p) => (
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
                            justifyContent: "space-between",
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

              {items.length === 0 ? (
                <div
                  style={{
                    padding: "28px 0",
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                    fontSize: 13,
                    fontFamily: "var(--font-body)",
                    opacity: 0.6,
                  }}
                >
                  No items — add a product above
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
                                ...inputStyle,
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
                                ...inputStyle,
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
                          Total
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontFamily: "var(--font-display)",
                            fontSize: "1.2rem",
                            color: "var(--color-primary)",
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
              {errors.items && <span style={errStyle}>{errors.items}</span>}
            </Card>

            {/* ── Booking ── */}
            <Card title="Booking">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: hasBooking ? 16 : 0,
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
                    {order.booking ? "Update booking" : "Add a booking"}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      color: "var(--color-text-muted)",
                      marginTop: 2,
                    }}
                  >


{order.booking
  ? `Currently: ${order.booking.booking_date.split('T')[0]} · ${order.booking.time_slot}${order.booking.assigned_staff ? ` · ${order.booking.assigned_staff}` : ""}`
  : "No booking linked"}
                  </div>
                </div>
                <Toggle checked={hasBooking} onChange={setHasBooking} />
              </div>
              {hasBooking && (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label style={labelStyle}>Date</label>
                      <input
                        type="date"
                        value={bookingDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setBookingDate(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label style={labelStyle}>Time Slot</label>
                      <select
                        value={bookingSlot}
                        onChange={(e) => setBookingSlot(e.target.value)}
                        style={inputStyle}
                      >
                        {timeSlots.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
                    <label style={labelStyle}>Assigned Staff</label>
                    <select
                      value={assignedStaffId}
                      onChange={(e) => setAssignedStaffId(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">— Unassigned —</option>
                      {staffOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </Card>

            {/* ── Notes ── */}
            <Card title="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Staff notes…"
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            </Card>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card title="Status">
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={labelStyle}>Order Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={inputStyle}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
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
                      Paid
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "10px",
                        color: "var(--color-text-muted)",
                        marginTop: 1,
                      }}
                    >
                      Payment received
                    </div>
                  </div>
                  <Toggle checked={isPaid} onChange={setIsPaid} />
                </div>
              </div>
            </Card>

            <Card title="Payment Method">
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
    {(order.payment_intent
      ? (["stripe", "card"] as const)
      : (["cash", "eftpos", "other"] as const)
    ).map((m) => (
      <button
        key={m}
        type="button"
        onClick={() => setPayMethod(m)}
        style={{
          padding: "9px 0",
          fontFamily: "var(--font-body)",
          fontSize: "10px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          cursor: "pointer",
          border: `1px solid ${payMethod === m ? "var(--color-accent)" : "var(--color-border)"}`,
          background: payMethod === m ? "rgba(201,169,110,0.1)" : "transparent",
          color: payMethod === m ? "var(--color-accent)" : "var(--color-text-muted)",
          borderRadius: "var(--radius-sm)",
          transition: "all 150ms",
        }}
      >
        {m}
      </button>
    ))}
  </div>
  {order.payment_intent && (
    <p style={{
      fontFamily: "var(--font-body)",
      fontSize: "10px",
      color: "var(--color-text-muted)",
      marginTop: 8,
      letterSpacing: "0.05em",
    }}>
      This order was paid via Stripe — method is locked to card/stripe.
    </p>
  )}
</Card>

            <Card title="Summary">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["Items", `${items.length}`],
                  ["Total", `A$${total.toFixed(2)}`],
                  ["Status", status],
                  ["Paid", isPaid ? "Yes" : "No"],
                  ["Method", payMethod.toUpperCase()],
                  ["Booking", hasBooking ? `${bookingDate}` : "None"],
                  ["Customer", foundUser?.name ?? customer?.name ?? "—"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {k}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: "var(--color-text)",
                        fontWeight: k === "Total" ? 500 : 400,
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
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
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-text-muted)",
            }}
          >
            Order #{order.id} · {items.length} item(s) · A${total.toFixed(2)}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn
              as="a"
              href={route("admin.orders.show", order.id)}
              variant="ghost"
              size="sm"
            >
              Cancel
            </AdminBtn>
            <AdminBtn
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
              variant="accent"
            >
              <Icons.Check /> {submitting ? "Saving…" : "Save Changes"}
            </AdminBtn>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
