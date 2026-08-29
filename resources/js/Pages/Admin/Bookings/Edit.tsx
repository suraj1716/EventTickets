import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../AdminLayout";
import {
  SlideOver,
  SlideOverActions,
  AdminBtn,
  ConfirmModal,
  Icons,
  C,
  fontBody,
} from "@/Components/Admin/AdminComponents";
import { useAdminForm, Field, AdminInput, AdminSelect, AdminTextarea } from "@/Components/Admin/useAdminForm";

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

function generateTimeSlots(start: string, end: string, intervalMinutes: number): string[] {
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "block", fontFamily: fontBody, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.textFaint, margin: "4px 0 10px" }}>
      {children}
    </span>
  );
}

export default function BookingEdit({ booking, users, orders, vendor }: Props) {
  const showHref = route("admin.bookings.show", booking.id);
  const [showDelete, setShowDelete] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const { data, set, errors, processing, put } = useAdminForm({
    user_id: String(booking.user_id),
    order_id: booking.order_id ? String(booking.order_id) : "",
    booking_date: booking.booking_date.split("T")[0],
    time_slot: booking.time_slot,
    notes: booking.notes ?? "",
  });

  const timeSlots = vendor
    ? generateTimeSlots(vendor.business_start_time, vendor.business_end_time, vendor.slot_interval_minutes)
    : [];

  const handleSubmit = () => {
    put(route("admin.bookings.update", booking.id));
  };

  const handleCancelBooking = () => {
    router.post(route("admin.bookings.cancel", booking.id), {}, {
      preserveScroll: true,
      onSuccess: () => toast.success("Booking cancelled"),
      onError: () => toast.error("Failed to cancel booking"),
      onFinish: () => setShowCancel(false),
    });
  };

  const handleDelete = () => {
    router.delete(route("admin.bookings.destroy", booking.id), {
      onSuccess: () => toast.success("Booking deleted"),
      onError: () => toast.error("Failed to delete booking"),
      onFinish: () => setShowDelete(false),
    });
  };

  const selectedUser = users.find((u) => String(u.id) === data.user_id);
  const selectedOrder = orders.find((o) => String(o.id) === data.order_id);

  return (
    <>
      <Head title={`Edit Booking #${booking.id}`} />
      <AdminLayout>
        {showDelete && (
          <ConfirmModal
            title={`Delete Booking #${booking.id}?`}
            description={`This will permanently delete the order for ${booking.customer.name} including all items and any linked booking.`}
            confirmLabel="Delete Booking"
            onConfirm={handleDelete}
            onCancel={() => setShowDelete(false)}
          />
        )}
        {showCancel && (
          <ConfirmModal
            title={`Cancel Booking #${booking.id}?`}
            description="The linked order will also be cancelled."
            confirmLabel="Cancel Booking"
            onConfirm={handleCancelBooking}
            onCancel={() => setShowCancel(false)}
          />
        )}

        <SlideOver
          eyebrow="Operations"
          title={`Edit Booking #${booking.id}`}
          subtitle={`Created ${booking.created_at}`}
          closeHref={showHref}
          footer={
            <SlideOverActions
              onCancel={() => (window.location.href = showHref)}
              onSubmit={handleSubmit}
              processing={processing}
              submitLabel="Save Changes"
            />
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Date" error={errors.booking_date}>
              <AdminInput type="date" value={data.booking_date} onChange={(e) => set("booking_date", e.target.value)} error={!!errors.booking_date} />
            </Field>
            <Field label="Time Slot" error={errors.time_slot}>
              <AdminSelect value={data.time_slot} onChange={(e) => set("time_slot", e.target.value)} error={!!errors.time_slot}>
                <option value="">Select time…</option>
                {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
              </AdminSelect>
            </Field>
          </div>

          <Field label="Notes" error={errors.notes} help="Optional">
            <AdminTextarea value={data.notes} onChange={(e) => set("notes", e.target.value)} rows={4} placeholder="Any notes about this booking…" error={!!errors.notes} />
          </Field>

          <div style={{ borderTop: `1px dashed ${C.borderDashed}`, paddingTop: 16 }}>
            <SectionLabel>Customer & Order</SectionLabel>

            <Field label="Customer" error={errors.user_id}>
              <AdminSelect value={data.user_id} onChange={(e) => set("user_id", e.target.value)} error={!!errors.user_id}>
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
          </div>

          <div style={{ borderTop: `1px dashed ${C.borderDashed}`, paddingTop: 16 }}>
            <SectionLabel>Summary</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                ["Booking", `#${booking.id}`],
                ["Date", data.booking_date || "—"],
                ["Time", data.time_slot || "—"],
                ["Customer", selectedUser?.name ?? "—"],
                ["Order", selectedOrder?.label ?? "None"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: fontBody, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: C.textMuted }}>{k}</span>
                  <span style={{ fontFamily: fontBody, fontSize: 12, color: C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: `1px dashed ${C.borderDashed}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <SectionLabel>Danger Zone</SectionLabel>
            <AdminBtn type="button" variant="ghost" onClick={() => setShowCancel(true)}>
              <Icons.Edit /> Cancel Booking
            </AdminBtn>
            <AdminBtn type="button" variant="danger" onClick={() => setShowDelete(true)}>
              <Icons.Delete /> Delete Booking
            </AdminBtn>
          </div>
        </SlideOver>
      </AdminLayout>
    </>
  );
}
