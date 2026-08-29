import { Head } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import { SlideOver, SlideOverActions } from "@/Components/Admin/AdminComponents";
import { useAdminForm, Field, AdminInput, AdminSelect, AdminTextarea } from "@/Components/Admin/useAdminForm";

type User = { id: number; name: string; email: string };
type Order = { id: number; label: string };
type Props = { users: User[]; orders: Order[] };

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00",
];

export default function BookingCreate({ users, orders }: Props) {
  const indexHref = route("admin.bookings.index");
  const { data, set, errors, processing, post } = useAdminForm({
    user_id: "",
    order_id: "",
    booking_date: "",
    time_slot: "",
    notes: "",
  });

  const handleSubmit = () => {
    post(route("admin.bookings.store"));
  };

  return (
    <>
      <Head title="New Booking" />
      <AdminLayout>
        <SlideOver
          eyebrow="Operations"
          title="New Booking"
          subtitle="Schedule a booking for a customer."
          closeHref={indexHref}
          footer={
            <SlideOverActions
              onCancel={() => (window.location.href = indexHref)}
              onSubmit={handleSubmit}
              processing={processing}
              submitLabel="Create Booking"
            />
          }
        >
          <Field label="Customer" required error={errors.user_id}>
            <AdminSelect value={data.user_id} onChange={(e) => set("user_id", e.target.value)} error={!!errors.user_id} autoFocus>
              <option value="">Select customer…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
            </AdminSelect>
          </Field>

          <Field label="Link to Order" error={errors.order_id} help="Optional">
            <AdminSelect value={data.order_id} onChange={(e) => set("order_id", e.target.value)} error={!!errors.order_id}>
              <option value="">No linked order</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </AdminSelect>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Date" required error={errors.booking_date}>
              <AdminInput type="date" value={data.booking_date} onChange={(e) => set("booking_date", e.target.value)} error={!!errors.booking_date} />
            </Field>
            <Field label="Time Slot" required error={errors.time_slot}>
              <AdminSelect value={data.time_slot} onChange={(e) => set("time_slot", e.target.value)} error={!!errors.time_slot}>
                <option value="">Select time…</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </AdminSelect>
            </Field>
          </div>

          <Field label="Notes" error={errors.notes} help="Optional">
            <AdminTextarea
              value={data.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={4}
              placeholder="Any notes about this booking…"
              error={!!errors.notes}
            />
          </Field>
        </SlideOver>
      </AdminLayout>
    </>
  );
}
