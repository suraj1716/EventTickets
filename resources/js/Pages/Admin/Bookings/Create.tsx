import { Head, Link, useForm } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";

type User  = { id: number; name: string; email: string };
type Order = { id: number; label: string };
type Props = { users: User[]; orders: Order[] };

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00",
];

export default function BookingCreate({ users, orders }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    user_id:      "",
    order_id:     "",
    booking_date: "",
    time_slot:    "",
    notes:        "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route("admin.bookings.store"));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.75rem 1rem",
    fontFamily: "var(--font-body)", fontSize: "var(--text-sm)",
    color: "var(--color-text)", background: "var(--color-bg)",
    border: "1px solid var(--color-border)", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)",
    fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "var(--color-text-muted)", marginBottom: "var(--space-xs)",
  };
  const errStyle: React.CSSProperties = {
    color: "var(--color-error)", fontSize: "var(--text-xs)",
    marginTop: 4, fontFamily: "var(--font-body)",
  };
  const sectionStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    marginBottom: "var(--space-lg)",
  };
  const sectionHead: React.CSSProperties = {
    padding: "var(--space-md) var(--space-xl)",
    borderBottom: "1px solid var(--color-border)",
    fontFamily: "var(--font-body)", fontSize: "var(--text-xs)",
    letterSpacing: "0.15em", textTransform: "uppercase",
    color: "var(--color-text-light)", fontWeight: 500,
  };

  return (
    <AdminLayout>
      <Head title="Create Booking" />

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)", marginBottom: "var(--space-2xl)" }}>
        <Link href={route("admin.bookings.index")} style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-light)", textDecoration: "none" }}>
          ← Bookings
        </Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 300, color: "var(--color-text)", margin: 0 }}>
          Create Booking
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--space-lg)", alignItems: "start" }}>
          <div>
            <div style={sectionStyle}>
              <div style={sectionHead}>Booking Details</div>
              <div style={{ padding: "var(--space-xl)", display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-lg)" }}>
                  <div>
                    <label style={labelStyle}>Date</label>
                    <input type="date" value={data.booking_date} onChange={e => setData("booking_date", e.target.value)} style={inputStyle} />
                    {errors.booking_date && <p style={errStyle}>{errors.booking_date}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Time Slot</label>
                    <select value={data.time_slot} onChange={e => setData("time_slot", e.target.value)} style={inputStyle}>
                      <option value="">Select time…</option>
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.time_slot && <p style={errStyle}>{errors.time_slot}</p>}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Notes (optional)</label>
                  <textarea
                    value={data.notes}
                    onChange={e => setData("notes", e.target.value)}
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical" }}
                    placeholder="Any notes about this booking…"
                  />
                  {errors.notes && <p style={errStyle}>{errors.notes}</p>}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div style={sectionStyle}>
              <div style={sectionHead}>Customer & Order</div>
              <div style={{ padding: "var(--space-xl)", display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                <div>
                  <label style={labelStyle}>Customer</label>
                  <select value={data.user_id} onChange={e => setData("user_id", e.target.value)} style={inputStyle}>
                    <option value="">Select customer…</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
                  </select>
                  {errors.user_id && <p style={errStyle}>{errors.user_id}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Link to Order (optional)</label>
                  <select value={data.order_id} onChange={e => setData("order_id", e.target.value)} style={inputStyle}>
                    <option value="">No linked order</option>
                    {orders.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                  {errors.order_id && <p style={errStyle}>{errors.order_id}</p>}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <Link
                href={route("admin.bookings.index")}
                style={{ flex: 1, padding: "0.75rem", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block" }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                style={{ flex: 2, padding: "0.75rem", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", background: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer" }}
              >
                {processing ? "Creating…" : "Create Booking"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
