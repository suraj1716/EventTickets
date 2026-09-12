import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  AdminBtn,
  FlashMessage,
  Icons,
  fontBody,
  C,
} from "../../../Components/Admin/AdminComponents";
import { AdminInput, AdminSelect, AdminToggle, Field } from "../../../Components/Admin/useAdminForm";

// ── Types ────────────────────────────────────────────────────

interface TicketTier {
  id: number;
  event_leg_id: number;
  name: string;
  price: number;
  remaining: number;
}
interface Seat {
  id: number;
  event_leg_id: number;
  ticket_tier_id: number | null;
  row_label: string | null;
  seat_number: number | null;
  label: string;
  status: string;
}
interface EventLeg {
  id: number;
  venue_name: string;
  event_date: string;
  seating_type: "general" | "reserved";
  ticket_tiers: TicketTier[];
  seats: Seat[];
}
interface EventOption {
  id: number;
  vendor_user_id: number;
  name: string;
  legs: EventLeg[];
}
interface Product {
  id: number;
  title: string;
  price: number;
  image: string | null;
}
interface UserOption {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}
interface VendorOption {
  user_id: number;
  store_name: string;
}

interface TicketLine {
  key: string;
  event_id: number;
  event_name: string;
  leg_id: number;
  tier_id: number;
  tier_name: string;
  price: number;
  quantity: number;
  seating_type: "general" | "reserved";
  seat_ids: number[];
}
interface ProductLine {
  key: string;
  product_id: number;
  title: string;
  price: number;
  quantity: number;
}

interface Props {
  events: EventOption[];
  products: Product[];
  users: UserOption[];
  statuses: string[];
  requiresVendorSelection: boolean;
  vendors: VendorOption[] | null;
  flash: { success?: string; error?: string };
  errors?: Record<string, string>;
}

// ── Small local layout helper (mirrors Show.tsx's SectionCard) ──

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div
        style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${C.border}`,
          background: C.bgAlt,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ width: 3, height: 16, background: C.amber, borderRadius: 2 }} />
        <span style={{ fontFamily: fontBody, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.textMuted, fontWeight: 500 }}>
          {title}
        </span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

let keyCounter = 0;
const nextKey = () => `line_${++keyCounter}`;

export default function OrderCreate({
  events,
  products,
  users,
  requiresVendorSelection,
  vendors,
  flash,
  errors,
}: Props) {
  // Buyer
  const [buyerMode, setBuyerMode] = useState<"existing" | "new">("new");
  const [userId, setUserId] = useState<number | "">("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [phoneLookup, setPhoneLookup] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "found" | "not_found">("idle");

  // Ticket line builder
  const [selEventId, setSelEventId] = useState<number | "">("");
  const [selLegId, setSelLegId] = useState<number | "">("");
  const [selTierId, setSelTierId] = useState<number | "">("");
  const [selQty, setSelQty] = useState(1);
  const [selSeatIds, setSelSeatIds] = useState<number[]>([]);

  // Product line builder
  const [selProductId, setSelProductId] = useState<number | "">("");
  const [selProductQty, setSelProductQty] = useState(1);

  const [ticketLines, setTicketLines] = useState<TicketLine[]>([]);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isPaid, setIsPaid] = useState(true);
  const [bookingFee, setBookingFee] = useState("0");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const selectedEvent = events.find((e) => e.id === selEventId);
  const selectedLeg = selectedEvent?.legs.find((l) => l.id === selLegId);
  const selectedTier = selectedLeg?.ticket_tiers.find((t) => t.id === selTierId);
  const availableSeats = selectedLeg?.seats.filter(
    (s) => s.status === "available" && (s.ticket_tier_id === null || s.ticket_tier_id === selTierId)
  ) ?? [];

  const handleLookup = async () => {
    if (!phoneLookup) return;
    const res = await fetch(route("admin.orders.walkin.lookup"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": (window as any).Laravel?.csrfToken ?? "" },
      body: JSON.stringify({ phone: phoneLookup }),
    });
    const data = await res.json();
    if (data.found) {
      setUserId(data.user.id);
      setLookupStatus("found");
    } else {
      setLookupStatus("not_found");
      setNewPhone(phoneLookup);
    }
  };

  const addTicketLine = () => {
    if (!selectedEvent || !selectedLeg || !selectedTier) return;
    if (selectedLeg.seating_type === "reserved" && selSeatIds.length !== selQty) {
      alert(`Select exactly ${selQty} seat(s).`);
      return;
    }
    setTicketLines((prev) => [
      ...prev,
      {
        key: nextKey(),
        event_id: selectedEvent.id,
        event_name: selectedEvent.name,
        leg_id: selectedLeg.id,
        tier_id: selectedTier.id,
        tier_name: selectedTier.name,
        price: selectedTier.price,
        quantity: selQty,
        seating_type: selectedLeg.seating_type,
        seat_ids: selSeatIds,
      },
    ]);
    setSelEventId("");
    setSelLegId("");
    setSelTierId("");
    setSelQty(1);
    setSelSeatIds([]);
  };

  const addProductLine = () => {
    const product = products.find((p) => p.id === selProductId);
    if (!product) return;
    setProductLines((prev) => [
      ...prev,
      { key: nextKey(), product_id: product.id, title: product.title, price: product.price, quantity: selProductQty },
    ]);
    setSelProductId("");
    setSelProductQty(1);
  };

  const removeTicketLine = (key: string) => setTicketLines((prev) => prev.filter((l) => l.key !== key));
  const removeProductLine = (key: string) => setProductLines((prev) => prev.filter((l) => l.key !== key));

  const total = useMemo(() => {
    const ticketTotal = ticketLines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const productTotal = productLines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    return ticketTotal + productTotal + (parseFloat(bookingFee) || 0);
  }, [ticketLines, productLines, bookingFee]);

  const handleSubmit = () => {
    if (ticketLines.length === 0 && productLines.length === 0) {
      alert("Add at least one ticket or product.");
      return;
    }
    setProcessing(true);
    router.post(
      route("admin.orders.store"),
      {
        user_id: buyerMode === "existing" ? userId || undefined : undefined,
        new_name: buyerMode === "new" ? newName : undefined,
        new_email: buyerMode === "new" ? newEmail : undefined,
        new_phone: buyerMode === "new" ? newPhone : undefined,
        payment_method: paymentMethod,
        is_paid: isPaid,
        booking_fee: parseFloat(bookingFee) || 0,
        notes,
        ticket_lines: ticketLines.map((l) => ({
          ticket_tier_id: l.tier_id,
          quantity: l.quantity,
          seat_ids: l.seat_ids.length > 0 ? l.seat_ids : undefined,
        })),
        product_lines: productLines.map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          price: l.price,
        })),
      },
      { onFinish: () => setProcessing(false) }
    );
  };

  if (requiresVendorSelection) {
    return (
      <AdminLayout>
        <Head title="New Order" />
        <AdminPageHeader eyebrow="Box Office" title="New Order" />
        <FlashMessage flash={{ ...flash, error: errors?.error }} />
        <Section title="Select a vendor">
          <AdminSelect
            value=""
            onChange={(e) => router.get(route("admin.orders.create"), { vendor_id: e.target.value })}
          >
            <option value="">Choose a vendor…</option>
            {vendors?.map((v) => (
              <option key={v.user_id} value={v.user_id}>
                {v.store_name}
              </option>
            ))}
          </AdminSelect>
        </Section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head title="New Order" />
      <AdminPageHeader
        eyebrow="Box Office"
        title="New Order"
        action={
          <AdminBtn as="a" href={route("admin.orders.index")} variant="ghost">
            <Icons.Back /> Orders
          </AdminBtn>
        }
      />
      <FlashMessage flash={{ ...flash, error: errors?.error }} />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 20, alignItems: "start" }}>
        {/* ── LEFT ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Buyer */}
          <Section title="Buyer">
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <AdminBtn variant={buyerMode === "existing" ? "primary" : "ghost"} onClick={() => setBuyerMode("existing")}>
                Existing Customer
              </AdminBtn>
              <AdminBtn variant={buyerMode === "new" ? "primary" : "ghost"} onClick={() => setBuyerMode("new")}>
                New Customer
              </AdminBtn>
            </div>

            {buyerMode === "existing" ? (
              <>
                <Field label="Look up by phone">
                  <div style={{ display: "flex", gap: 8 }}>
                    <AdminInput value={phoneLookup} onChange={(e) => setPhoneLookup(e.target.value)} placeholder="0400 000 000" />
                    <AdminBtn onClick={handleLookup}>Find</AdminBtn>
                  </div>
                  {lookupStatus === "found" && <div style={{ fontSize: 11, color: C.amber, marginTop: 4 }}>Customer found ✓</div>}
                  {lookupStatus === "not_found" && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>No match — switch to "New Customer" or pick below.</div>}
                </Field>
                <Field label="Or select">
                  <AdminSelect value={userId} onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">Select customer…</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.email}
                      </option>
                    ))}
                  </AdminSelect>
                </Field>
              </>
            ) : (
              <>
                <Field label="Name" required>
                  <AdminInput value={newName} onChange={(e) => setNewName(e.target.value)} />
                </Field>
                <Field label="Email" help="Tickets and receipts are sent here.">
                  <AdminInput type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </Field>
                <Field label="Phone" required>
                  <AdminInput value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                </Field>
              </>
            )}
          </Section>

          {/* Tickets */}
          <Section title="Tickets">
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.6fr auto", gap: 8, alignItems: "end", marginBottom: 14 }}>
              <Field label="Event" style={{ marginBottom: 0 }}>
                <AdminSelect
                  value={selEventId}
                  onChange={(e) => {
                    setSelEventId(e.target.value ? Number(e.target.value) : "");
                    setSelLegId("");
                    setSelTierId("");
                    setSelSeatIds([]);
                  }}
                >
                  <option value="">Select event…</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </AdminSelect>
              </Field>
              <Field label="Date / Venue" style={{ marginBottom: 0 }}>
                <AdminSelect
                  value={selLegId}
                  disabled={!selectedEvent}
                  onChange={(e) => {
                    setSelLegId(e.target.value ? Number(e.target.value) : "");
                    setSelTierId("");
                    setSelSeatIds([]);
                  }}
                >
                  <option value="">Select…</option>
                  {selectedEvent?.legs.map((leg) => (
                    <option key={leg.id} value={leg.id}>
                      {leg.event_date} — {leg.venue_name}
                    </option>
                  ))}
                </AdminSelect>
              </Field>
              <Field label="Ticket Tier" style={{ marginBottom: 0 }}>
                <AdminSelect
                  value={selTierId}
                  disabled={!selectedLeg}
                  onChange={(e) => {
                    setSelTierId(e.target.value ? Number(e.target.value) : "");
                    setSelSeatIds([]);
                  }}
                >
                  <option value="">Select…</option>
                  {selectedLeg?.ticket_tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} — A${Number(tier.price).toFixed(2)} ({tier.remaining} left)
                    </option>
                  ))}
                </AdminSelect>
              </Field>
              <Field label="Qty" style={{ marginBottom: 0 }}>
                <AdminInput
                  type="number"
                  min={1}
                  value={selQty}
                  onChange={(e) => {
                    setSelQty(Math.max(1, Number(e.target.value)));
                    setSelSeatIds([]);
                  }}
                />
              </Field>
              <AdminBtn variant="accent" onClick={addTicketLine} disabled={!selectedTier}>
                <Icons.Plus />
              </AdminBtn>
            </div>

            {selectedLeg?.seating_type === "reserved" && selectedTier && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>
                  Pick {selQty} seat{selQty === 1 ? "" : "s"} ({selSeatIds.length}/{selQty} selected)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 140, overflowY: "auto" }}>
                  {availableSeats.map((seat) => {
                    const checked = selSeatIds.includes(seat.id);
                    const disabled = !checked && selSeatIds.length >= selQty;
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          setSelSeatIds((prev) => (checked ? prev.filter((id) => id !== seat.id) : [...prev, seat.id]))
                        }
                        style={{
                          fontSize: 11,
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: `1px solid ${checked ? C.amber : C.border}`,
                          background: checked ? "rgba(201,169,110,0.15)" : C.bgAlt,
                          color: checked ? C.amber : C.text,
                          cursor: disabled ? "not-allowed" : "pointer",
                          opacity: disabled ? 0.4 : 1,
                        }}
                      >
                        {seat.label}
                      </button>
                    );
                  })}
                  {availableSeats.length === 0 && <span style={{ fontSize: 12, color: C.textMuted }}>No available seats for this tier.</span>}
                </div>
              </div>
            )}

            {ticketLines.length === 0 ? (
              <div style={{ fontSize: 12, color: C.textMuted, padding: "8px 0" }}>No tickets added yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ticketLines.map((l) => (
                  <div
                    key={l.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: C.bgAlt,
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div style={{ fontSize: 13 }}>
                      <strong>{l.event_name}</strong> — {l.tier_name} ×{l.quantity}
                      {l.seat_ids.length > 0 && (
                        <span style={{ color: C.textMuted, fontSize: 11 }}> (seats: {l.seat_ids.length})</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: C.amber, fontSize: 13 }}>A${(l.price * l.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => removeTicketLine(l.key)}
                        style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer" }}
                      >
                        <Icons.Delete />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Merch / products */}
          <Section title="Merch (optional)">
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8, alignItems: "end", marginBottom: 14 }}>
              <Field label="Product" style={{ marginBottom: 0 }}>
                <AdminSelect value={selProductId} onChange={(e) => setSelProductId(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — A${Number(p.price).toFixed(2)}
                    </option>
                  ))}
                </AdminSelect>
              </Field>
              <Field label="Qty" style={{ marginBottom: 0 }}>
                <AdminInput type="number" min={1} value={selProductQty} onChange={(e) => setSelProductQty(Math.max(1, Number(e.target.value)))} />
              </Field>
              <AdminBtn variant="accent" onClick={addProductLine} disabled={!selProductId}>
                <Icons.Plus />
              </AdminBtn>
            </div>

            {productLines.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {productLines.map((l) => (
                  <div
                    key={l.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: C.bgAlt,
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div style={{ fontSize: 13 }}>
                      {l.title} ×{l.quantity}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: C.amber, fontSize: 13 }}>A${(l.price * l.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => removeProductLine(l.key)}
                        style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer" }}
                      >
                        <Icons.Delete />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Section title="Payment">
            <Field label="Method">
              <AdminSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="eftpos">EFTPOS</option>
                <option value="other">Other</option>
              </AdminSelect>
            </Field>
            <Field label="Service fee (optional)">
              <AdminInput type="number" min={0} step="0.01" value={bookingFee} onChange={(e) => setBookingFee(e.target.value)} />
            </Field>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span style={{ fontSize: 13, color: C.text }}>Mark as paid</span>
              <AdminToggle checked={isPaid} onChange={setIsPaid} />
            </div>
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={{ width: "100%", boxSizing: "border-box", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontFamily: fontBody, fontSize: 13, color: C.text, resize: "vertical" }}
              />
            </Field>
          </Section>

          <Section title="Total">
            <div style={{ fontSize: 24, color: C.amber, fontWeight: 500, marginBottom: 16 }}>A${total.toFixed(2)}</div>
            <AdminBtn variant="primary" onClick={handleSubmit} disabled={processing} style={{ width: "100%", justifyContent: "center" }}>
              {processing ? "Creating…" : "Create Order"}
            </AdminBtn>
          </Section>
        </div>
      </div>
    </AdminLayout>
  );
}
