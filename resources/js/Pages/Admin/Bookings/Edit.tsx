import { Head, Link, useForm, router } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import { AdminBtn, AdminPageHeader, ConfirmModal, Icons } from "@/Components/Admin/AdminComponents";
import { useState } from "react";
import { toast } from "react-toastify";

type User = { id: number; name: string; email: string };
type Order = { id: number; label: string };

type BookingProp = {
  id: number;
  user_id: number;
  order_id: number | null;
  booking_date: string;
  time_slot: string;
  notes: string | null;
   created_at: string;
     customer: { name: string; email: string; phone: string };
};
type VendorProp = {
  business_start_time: string;
  business_end_time: string;
  slot_interval_minutes: number;
} | null;

type Props = {
  booking: BookingProp;
  users: User[];
  orders: Order[];
  vendor: VendorProp;
};

function generateTimeSlots(
  start: string,
  end: string,
  intervalMinutes: number,
): string[] {
  const slots: string[] = [];
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  let current = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  const fmt = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const ampm = h < 12 ? "am" : "pm";
    const hour = h % 12 === 0 ? 12 : h % 12;
    const min = String(m).padStart(2, "0");
    return `${hour}:${min} ${ampm}`;
  };

  while (current < endTotal) {
    const next = current + intervalMinutes;
    slots.push(`${fmt(current)} - ${fmt(next)}`);
    current = next;
  }

  return slots;
}

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
export default function BookingEdit({ booking, users, orders, vendor }: Props) {
  const [showDelete, setShowDelete] = useState(false);

  const { data, setData, put, processing, errors } = useForm({
    user_id: String(booking.user_id),
    order_id: booking.order_id ? String(booking.order_id) : "",
    booking_date: booking.booking_date.split("T")[0],
    time_slot: booking.time_slot,
    notes: booking.notes ?? "",
  });

  const timeSlots = vendor
    ? generateTimeSlots(
        vendor.business_start_time,
        vendor.business_end_time,
        vendor.slot_interval_minutes,
      )
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route("admin.bookings.update", booking.id));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-sm)",
    color: "var(--color-text)",
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-xs)",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--color-text-muted)",
    marginBottom: "var(--space-xs)",
  };
  const errStyle: React.CSSProperties = {
    color: "var(--color-error)",
    fontSize: "var(--text-xs)",
    marginTop: 4,
    fontFamily: "var(--font-body)",
  };

  const handleCancel = (id: number) => {
    if (
      !confirm("Cancel this booking? The linked order will also be cancelled.")
    )
      return;
    router.post(
      route("admin.bookings.cancel", id),
      {},
      {
        preserveScroll: true,
        onSuccess: () => toast.success("Booking cancelled"),
        onError: () => toast.error("Failed"),
      },
    );
  };

  const handleDelete = () => {
    if (!confirm("Delete this booking permanently?")) return;
    router.delete(route("admin.bookings.destroy", booking.id), {
      onSuccess: () => toast.success("Booking deleted"),
      onError: () => toast.error("Failed"),
    });
  };

  const selectedUser = users.find((u) => String(u.id) === data.user_id);
  const selectedOrder = orders.find((o) => String(o.id) === data.order_id);

  return (
    <>
      <Head title={`Edit Booking #${booking.id}`} />
      <AdminLayout>
        <AdminPageHeader
          eyebrow="Commerce"
          title={
            <>
              Edit Booking <em style={{ fontStyle: "italic" }}>#{booking.id}</em>
            </>
          }
          meta={`Created ${booking.created_at}`}
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <AdminBtn
                as="a"
                href={route("admin.bookings.show", booking.id)}
                variant="ghost"
              >
                <Icons.View /> View
              </AdminBtn>
              <AdminBtn
                as="a"
                href={route("admin.bookings.index")}
                variant="ghost"
              >
                <Icons.Back /> Bookings
              </AdminBtn>
            </div>
          }
        />

        <form onSubmit={handleSubmit}>
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
              {/* ── Booking Details ── */}
              <Card title="Booking Details">
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
                      value={data.booking_date}
                      onChange={(e) => setData("booking_date", e.target.value)}
                      style={inputStyle}
                    />
                    {errors.booking_date && (
                      <span style={errStyle}>{errors.booking_date}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={labelStyle}>Time Slot</label>
                    <select
                      value={data.time_slot}
                      onChange={(e) => setData("time_slot", e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Select time…</option>
                      {timeSlots.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {errors.time_slot && (
                      <span style={errStyle}>{errors.time_slot}</span>
                    )}
                  </div>
                </div>
              </Card>

              {/* ── Notes ── */}
              <Card title="Notes">
                <textarea
                  value={data.notes}
                  onChange={(e) => setData("notes", e.target.value)}
                  rows={4}
                  placeholder="Any notes about this booking…"
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                />
                {errors.notes && <span style={errStyle}>{errors.notes}</span>}
              </Card>

              {/* ── Customer & Order ── */}
              <Card title="Customer & Order">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={labelStyle}>Customer</label>
                    <select
                      value={data.user_id}
                      onChange={(e) => setData("user_id", e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Select customer…</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.email}
                        </option>
                      ))}
                    </select>
                    {errors.user_id && (
                      <span style={errStyle}>{errors.user_id}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={labelStyle}>Link to Order (optional)</label>
                    <select
                      value={data.order_id}
                      onChange={(e) => setData("order_id", e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">No linked order</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {errors.order_id && (
                      <span style={errStyle}>{errors.order_id}</span>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* RIGHT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Card title="Summary">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {[
                    ["Booking", `#${booking.id}`],
                    ["Date", data.booking_date || "—"],
                    ["Time", data.time_slot || "—"],
                    ["Customer", selectedUser?.name ?? "—"],
                    ["Order", selectedOrder?.label ?? "None"],
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
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Actions">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <AdminBtn
                    type="button"
                    variant="ghost"
                    onClick={() => handleCancel(booking.id)}
                  >
                    <Icons.Edit /> Cancel Booking
                  </AdminBtn>
                  <AdminBtn
                    type="button"
                    variant="danger"
                    onClick={() => setShowDelete(true)}
                  >
                    <Icons.Delete /> Delete Booking
                  </AdminBtn>
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
              Booking #{booking.id} · {data.booking_date || "no date"} ·{" "}
              {data.time_slot || "no time"}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <AdminBtn
                as="a"
                href={route("admin.bookings.show", booking.id)}
                variant="ghost"
                size="sm"
              >
                Cancel
              </AdminBtn>
              <AdminBtn
                type="submit"
                disabled={processing}
                variant="accent"
              >
                <Icons.Check /> {processing ? "Saving…" : "Save Changes"}
              </AdminBtn>
            </div>
          </div>
        </form>

        {showDelete && (
          <ConfirmModal
            title={`Delete Booking #${booking.id}?`}
            description={`This will permanently delete the order for ${booking.customer} including all items and any linked booking.`}
            confirmLabel="Delete Booking"
            onConfirm={handleDelete}
            onCancel={() => setShowDelete(false)}
          />
        )}
      </AdminLayout>
    </>
  );
}
