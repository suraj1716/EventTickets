import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  AdminBtn,
  FlashMessage,
  StatusBadge,
  Icons,
  fontBody,
  C,
} from "../../../Components/Admin/AdminComponents";
import { AdminInput, AdminSelect, AdminToggle, Field } from "../../../Components/Admin/useAdminForm";

interface OrderItem {
  id: number;
  type: "ticket" | "product";
  title: string;
  quantity: number;
  price: number;
}
interface IssuedTicket {
  id: number;
  code: string;
  status: string;
  seat_label: string | null;
}
interface OrderProps {
  id: number;
  user_id: number | null;
  status: string;
  is_paid: boolean;
  payment_intent: string | null;
  payment_method: string;
  total_price: number;
  notes: string;
  items: OrderItem[];
  tickets: IssuedTicket[];
}
interface UserOption {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}
interface Props {
  order: OrderProps;
  users: UserOption[];
  statuses: string[];
  flash: { success?: string; error?: string };
  errors?: Record<string, string>;
}

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

export default function OrderEdit({ order, users, statuses, flash, errors }: Props) {
  const [userId, setUserId] = useState<number | "">(order.user_id ?? "");
  const [status, setStatus] = useState(order.status);
  const [isPaid, setIsPaid] = useState(order.is_paid);
  const [paymentMethod, setPaymentMethod] = useState(order.payment_method);
  const [notes, setNotes] = useState(order.notes);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = () => {
    setProcessing(true);
    router.put(
      route("admin.orders.update", order.id),
      { user_id: userId || undefined, status, is_paid: isPaid, payment_method: paymentMethod, notes },
      { onFinish: () => setProcessing(false) }
    );
  };

  return (
    <AdminLayout>
      <Head title={`Edit Order #${order.id}`} />
      <AdminPageHeader
        eyebrow="Orders"
        title={`Edit Order #${order.id}`}
        action={
          <AdminBtn as="a" href={route("admin.orders.show", order.id)} variant="ghost">
            <Icons.Back /> Back to Order
          </AdminBtn>
        }
      />
      <FlashMessage flash={{ ...flash, error: errors?.error }} />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 20, alignItems: "start" }}>
        {/* ── LEFT: read-only line items + tickets ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Section title="Items (not editable here)">
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>
              Line items can't be changed once an order exists — tickets may already be issued with a
              locked seat and QR code. To fix a mistaken sale, refund it from the order page and create
              a new one.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {order.items.map((item) => (
                <div
                  key={item.id}
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
                  <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    {item.type === "ticket" ? <Icons.Ticket /> : <Icons.Image />}
                    {item.title} ×{item.quantity}
                  </div>
                  <span style={{ color: C.amber, fontSize: 13 }}>
                    A${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {order.tickets.length > 0 && (
            <Section title="Tickets Issued">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {order.tickets.map((t) => (
                  <div
                    key={t.id}
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
                      {t.code}
                      {t.seat_label && <span style={{ color: C.textMuted }}> — Seat {t.seat_label}</span>}
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── RIGHT: editable order-level fields ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Section title="Buyer">
            <Field label="Customer">
              <AdminSelect value={userId} onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </option>
                ))}
              </AdminSelect>
            </Field>
          </Section>

          <Section title="Payment">
            <Field label="Status">
              <AdminSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </AdminSelect>
            </Field>
            <Field label="Method">
              <AdminSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="eftpos">EFTPOS</option>
                <option value="other">Other</option>
                <option value="stripe">Stripe</option>
                <option value="card">Card</option>
              </AdminSelect>
            </Field>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span style={{ fontSize: 13, color: C.text }}>Mark as paid</span>
              <AdminToggle checked={isPaid} onChange={setIsPaid} />
            </div>
            {!order.is_paid && isPaid && order.items.some((i) => i.type === "ticket") && (
              <div style={{ fontSize: 11, color: C.amber, marginBottom: 14 }}>
                Saving this will issue real tickets (QR codes + seat locks) for this order.
              </div>
            )}
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
            <div style={{ fontSize: 24, color: C.amber, fontWeight: 500, marginBottom: 16 }}>
              A${Number(order.total_price).toFixed(2)}
            </div>
            <AdminBtn variant="primary" onClick={handleSubmit} disabled={processing} style={{ width: "100%", justifyContent: "center" }}>
              {processing ? "Saving…" : "Save Changes"}
            </AdminBtn>
          </Section>
        </div>
      </div>
    </AdminLayout>
  );
}
