import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../AdminLayout";
import {
  ActionBtn,
  AdminBtn,
  AdminPageHeader,
  AdminTable,
  ConfirmModal,
  FilterBar,
  Icons,
  Pagination,
  StatusBadge,
  Tr,
  Td,
  C,
} from "../../../Components/Admin/AdminComponents";

type Booking = {
  id: number;
  customer: string;
  email: string;
  booking_date: string;
  time_slot: string;
  order_id: number | null;
  order_status: string;
  order_total: number;
  created_at: string;
};

type Props = {
  bookings: { data: Booking[]; links: any[] };
  filters: {
    search?: string;
    date?: string;
    status?: string;
    sort?: string;
    direction?: "asc" | "desc";
  };
};

export default function BookingsIndex({ bookings, filters }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    router.delete(route("admin.bookings.destroy", deleteTarget.id), {
      preserveScroll: true,
      onSuccess: () => toast.success("Booking deleted"),
      onError: () => toast.error("Failed to delete booking"),
      onFinish: () => setDeleteTarget(null),
    });
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    router.post(
      route("admin.bookings.cancel", cancelTarget.id),
      {},
      {
        preserveScroll: true,
        onSuccess: () => toast.success("Booking cancelled"),
        onError: () => toast.error("Failed to cancel booking"),
        onFinish: () => setCancelTarget(null),
      },
    );
  };

  const sort = (key: string) => {
    const direction = filters.sort === key && filters.direction === "asc" ? "desc" : "asc";
    router.get(route("admin.bookings.index"), { ...filters, sort: key, direction }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  return (
    <AdminLayout>
      <Head title="Bookings" />

      {deleteTarget && (
        <ConfirmModal
          title={`Delete booking #${deleteTarget.id}?`}
          description="This will permanently remove the booking. This action cannot be undone."
          confirmLabel="Delete Booking"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {cancelTarget && (
        <ConfirmModal
          title={`Cancel booking #${cancelTarget.id}?`}
          description="The linked order will also be cancelled."
          confirmLabel="Cancel Booking"
          onConfirm={handleCancel}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      <AdminPageHeader
        eyebrow="Operations"
        title="Bookings"
        meta={`${bookings.data.length} records shown`}
        action={
          <AdminBtn as={Link} href={route("admin.bookings.create")} variant="accent">
            <Icons.Plus />
            New Booking
          </AdminBtn>
        }
      />

      <FilterBar
        routeName="admin.bookings.index"
        filters={filters}
        fields={[
          { key: "search", placeholder: "Search customer…", flex: true },
          { key: "date", type: "date", placeholder: "Booking date" },
          {
            key: "status",
            type: "select",
            placeholder: "All statuses",
            options: ["draft", "paid", "shipped", "delivered", "cancelled"].map((s) => ({ value: s, label: s })),
          },
        ]}
      />

      <AdminTable
        headers={[
          "#",
          "Customer",
          <span key="date" onClick={() => sort("booking_date")} style={{ cursor: "pointer" }}>
            Booking Date ↕
          </span>,
          "Time Slot",
          "Order",
          "Order Status",
          <span key="total" onClick={() => sort("order_total")} style={{ cursor: "pointer" }}>
            Total ↕
          </span>,
          "Actions",
        ]}
        empty="✦ No bookings found"
      >
        {bookings.data.map((b) => (
          <Tr key={b.id}>
            <Td muted>#{b.id}</Td>
            <Td>
              <div>{b.customer}</div>
              <div style={{ fontSize: 11, color: C.textFaint }}>{b.email}</div>
            </Td>
            <Td>{b.booking_date.split("T")[0]}</Td>
            <Td muted>{b.time_slot}</Td>
            <Td muted>{b.order_id ? `#${b.order_id}` : "—"}</Td>
            <Td>
              <StatusBadge status={b.order_status} />
            </Td>
            <Td>
              {b.order_total > 0 ? (
                <span style={{ color: C.amber, fontWeight: 500 }}>A${b.order_total}</span>
              ) : (
                <span style={{ color: C.textFaint }}>—</span>
              )}
            </Td>
            <Td>
              <div style={{ display: "flex", gap: 4 }}>
                <ActionBtn variant="view" title="View" as="a" href={route("admin.bookings.show", b.id)}>
                  <Icons.View />
                </ActionBtn>
                <ActionBtn variant="edit" title="Edit" as="a" href={route("admin.bookings.edit", b.id)}>
                  <Icons.Edit />
                </ActionBtn>
                <ActionBtn variant="delete" title="Cancel Booking" onClick={() => setCancelTarget(b)}>
                  ↩
                </ActionBtn>
                <ActionBtn variant="delete" title="Delete" onClick={() => setDeleteTarget(b)}>
                  <Icons.Delete />
                </ActionBtn>
              </div>
            </Td>
          </Tr>
        ))}
      </AdminTable>

      <Pagination links={bookings.links} />
    </AdminLayout>
  );
}
