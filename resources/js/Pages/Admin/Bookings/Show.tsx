import { Head, Link, router } from "@inertiajs/react";
import { toast } from "react-toastify";
import AdminLayout from "../AdminLayout";
import {
  ActionBtn,
  AdminBtn,
  AdminPageHeader,
  ConfirmModal,
  Icons,
  StatusBadge,
} from "../../../Components/Admin/AdminComponents";
import { useState } from "react";
import { OrderItem } from "@/types";

type Props = {
  booking: {
    id: number;
    booking_date: string;
    time_slot: string;
    notes: string | null;
    created_at: string;
    customer: { name: string; email: string; phone: string };
    order: {
      id: number;
      status: string;
      is_paid: boolean;
      total_price: number;
      vendor: string;
      items: {
        id: number;
        title: string;
        quantity: number;
        price: number;
        subtotal: number;
      }[];
    } | null;
  };
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
export default function BookingShow({ booking }: Props) {
  const [showDelete, setShowDelete] = useState(false);

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
console.log('order items', booking.order?.items);
  const handleDelete = () => {
    if (!confirm("Delete this booking permanently?")) return;
    router.delete(route("admin.bookings.destroy", booking.id), {
      onSuccess: () => toast.success("Booking deleted"),
      onError: () => toast.error("Failed"),
    });
  };

  const row: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    gap: 8,
    paddingBottom: 10,
    borderBottom: "1px solid var(--color-border)",
    marginBottom: 10,
  };
  const label: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--color-text-muted)",
  };
  const value: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    color: "var(--color-text)",
  };

  return (
    <>
      <Head title={`Booking #${booking.id}`} />
      <AdminLayout>
        <AdminPageHeader
          eyebrow="Commerce"
          title={
            <>
              Booking{" "}
              <em
                style={{
                  fontStyle: "italic",
                  color: "var(--color-accent-light)",
                }}
              >
                #{booking.id}
              </em>
            </>
          }
          meta={`Created ${booking.created_at}`}
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <AdminBtn
                as="a"
                href={route("admin.bookings.index")}
                variant="ghost"
              >
                <Icons.Back /> Bookings
              </AdminBtn>
              <AdminBtn
                as="a"
                href={route("admin.bookings.edit", booking.id)}
                variant="ghost"
              >
                <Icons.Edit /> Edit
              </AdminBtn>
              <AdminBtn variant="ghost" onClick={() => handleCancel(booking.id)}>
                <Icons.Edit /> Cancel Booking
              </AdminBtn>
              <AdminBtn onClick={() => setShowDelete(true)} variant="danger">
                <Icons.Delete /> Delete Booking
              </AdminBtn>
            </div>
          }
        />

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
              <div style={row}>
                <span style={label}>Date</span>
                <span style={value}>{booking.booking_date}</span>
              </div>
              <div style={row}>
                <span style={label}>Time Slot</span>
                <span style={value}>{booking.time_slot}</span>
              </div>
              <div style={{ ...row, borderBottom: "none", marginBottom: 0 }}>
                <span style={label}>Notes</span>
                <span style={value}>{booking.notes || "—"}</span>
              </div>
            </Card>

            {/* ── Linked Order ── */}
            {booking.order && (
              <Card title="Linked Order">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 14,
                    marginBottom: 14,
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      #{booking.order.id}
                    </span>
                    <StatusBadge status={booking.order.status} />
                    {booking.order.is_paid && <StatusBadge status="paid" />}
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {booking.order.vendor}
                    </span>
                  </div>
                  <Link
                    href={route("admin.orders.show", booking.order.id)}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "10px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--color-primary)",
                      textDecoration: "none",
                    }}
                  >
                    View Order →
                  </Link>
                </div>

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
                        {["Product", "Price", "Subtotal"].map((h) => (
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
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {booking.order.items.map((item, i) => (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom:
                              i < booking.order!.items.length - 1
                                ? "1px solid var(--color-border)"
                                : "none",
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
                          <td
                            style={{
                              padding: "10px 12px",
                              fontFamily: "var(--font-body)",
                              fontSize: "13px",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            {item.quantity}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              fontFamily: "var(--font-body)",
                              fontSize: "13px",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            A${item.price}
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
                            A${item.subtotal}
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
                          A${booking.order.total_price}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card title="Customer">
              <div style={row}>
                <span style={label}>Name</span>
                <span style={value}>{booking.customer.name}</span>
              </div>
              <div style={row}>
                <span style={label}>Email</span>
                <span style={value}>{booking.customer.email}</span>
              </div>
              <div style={{ ...row, borderBottom: "none", marginBottom: 0 }}>
                <span style={label}>Phone</span>
                <span style={value}>{booking.customer.phone || "—"}</span>
              </div>
            </Card>
          </div>
        </div>

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
