import { Head, Link, useForm } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  C,
  fontBody,
  fontMono,
} from "@/Components/Admin/AdminComponents";

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
    width: "100%", padding: "9px 12px",
    fontFamily: fontBody, fontSize: "13px",
    color: C.text, background: C.bg,
    border: `1px solid ${C.border}`, borderRadius: "8px", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: fontMono, fontSize: "10px",
    fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
    color: C.textMuted, marginBottom: "8px",
  };
  const errStyle: React.CSSProperties = {
    color: C.error, fontSize: "12px",
    marginTop: 4, fontFamily: fontBody,
  };
  const sectionStyle: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    marginBottom: "20px",
  };
  const sectionHead: React.CSSProperties = {
    padding: "14px 20px",
    borderBottom: `1px dashed ${C.borderDashed}`,
    fontFamily: fontMono, fontSize: "10px",
    letterSpacing: "0.15em", textTransform: "uppercase",
    color: C.textMuted, fontWeight: 700,
  };

  return (
    <AdminLayout>
      <Head title="Create Booking" />

      <AdminPageHeader eyebrow="Admin · Bookings" title="Create Booking" />

      <div style={{ marginBottom: 16 }}>
        <Link href={route("admin.bookings.index")} style={{ fontFamily: fontMono, fontSize: "10.5px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMuted, textDecoration: "none" }}>
          ← Bookings
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>
          <div>
            <div style={sectionStyle}>
              <div style={sectionHead}>Booking Details</div>
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
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
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
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

            <div style={{ display: "flex", gap: "10px" }}>
              <Link
                href={route("admin.bookings.index")}
                style={{ flex: 1, padding: "9px", fontFamily: fontMono, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: C.textFaint, border: `1px solid ${C.border}`, borderRadius: "8px", cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block" }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                style={{ flex: 2, padding: "9px", fontFamily: fontMono, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: C.amber, color: C.textInverse, border: `1px solid ${C.amber}`, borderRadius: "8px", cursor: processing ? "not-allowed" : "pointer", opacity: processing ? 0.6 : 1 }}
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
