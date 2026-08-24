import { Head, Link, router } from "@inertiajs/react";
import { toast } from "react-toastify";
import AdminLayout from "../AdminLayout";
import {
  ActionBtn,
  AdminPageHeader,
  AdminTable,
  FilterBar,
  Icons,
  Pagination,
  StatusBadge,
  Td,
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
  filters: {
    search?: string;
    date?: string;
    status?: string;
    sort?: string;
    direction?: "asc" | "desc";
  };
};

const btnStyle = (color = "var(--color-primary)"): React.CSSProperties => ({
  background: "transparent",
  border: `1px solid ${color}`,
  color,
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-xs)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "4px 12px",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
});

export default function BookingsIndex({ bookings, filters }: Props) {
  const handleDelete = (id: number) => {
    if (!confirm("Delete this booking?")) return;
    router.delete(route("admin.bookings.destroy", id), {
      preserveScroll: true,
      onSuccess: () => toast.success("Booking deleted"),
      onError: () => toast.error("Failed"),
    });
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
  const sort = (key: string) => {
    const direction =
      filters.sort === key && filters.direction === "asc" ? "desc" : "asc";

    const params = {
      ...filters,
      sort: key,
      direction,
    };

    console.log("filters:", filters);
    console.log("params:", params);

    router.get(route("admin.bookings.index"), params, {
      preserveState: true,
      preserveScroll: true,
    });
  };
  return (
    <AdminLayout>
      <Head title="Admin — Bookings" />

      <AdminPageHeader
        eyebrow="Manage"
        title="Bookings"
        action={
          <Link
            href={route("admin.bookings.create")}
            style={{
              background: "var(--color-primary)",
              color: "#fff",
              border: "none",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.75rem 1.75rem",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            + Create Booking
          </Link>
        }
      />

      <FilterBar
        routeName="admin.bookings.index"
        filters={filters}
        fields={[
          { key: "search", placeholder: "Search customer…" },
          {
            key: "is_read",
            type: "select",
            placeholder: "New / Unread",
            options: [
              { value: "1", label: "New" },
              { value: "0", label: "Unread" },
            ],
          },
          { key: "date", type: "date", placeholder: "Booking date" },
          {
            key: "status",
            type: "select",
            placeholder: "All statuses",
            options: ["draft", "paid", "shipped", "delivered", "cancelled"].map(
              (s) => ({ value: s, label: s }),
            ),
          },
        ]}
      />

      <AdminTable
        headers={[
          "#",
          "Customer",
          <span
            key="date"
            onClick={() => sort("booking_date")}
            style={{ cursor: "pointer" }}
          >
            Booking Date ↕
          </span>,
          "Time Slot",
          "Order",
          "Order Status",
          <span
            key="total"
            onClick={() => sort("order_total")}
            style={{ cursor: "pointer" }}
          >
            Total ↕
          </span>,
          "Actions",
        ]}
      >
        {bookings.data.map((b) => (
          <tr key={b.id}>
            <Td muted>#{b.id}</Td>
            <Td>
              <div>{b.customer}</div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-light)",
                }}
              >
                {b.email}
              </div>
            </Td>
            <Td>{b.booking_date.split("T")[0]}</Td>
            <Td muted>{b.time_slot}</Td>
            <Td muted>{b.order_id ? `#${b.order_id}` : "—"}</Td>
            <Td>
              <StatusBadge status={b.order_status} />
            </Td>
            <Td>
              {b.order_total > 0 ? (
                <span
                  style={{ color: "var(--color-primary)", fontWeight: 500 }}
                >
                  A${b.order_total}
                </span>
              ) : (
                <span style={{ color: "var(--color-text-light)" }}>—</span>
              )}
            </Td>
            <Td>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn
                  variant="view"
                  title="View"
                  as="a"
                  href={route("admin.bookings.show", b.id)}
                >
                  <Icons.View />
                </ActionBtn>
                <ActionBtn
                  variant="edit"
                  title="Edit"
                  as="a"
                  href={route("admin.bookings.edit", b.id)}
                >
                  <Icons.Edit />
                </ActionBtn>
                <ActionBtn
                  variant="delete"
                  title="Cancel"
                  onClick={() => handleCancel(b.id)}
                >
                  ↩
                </ActionBtn>

                <ActionBtn
                  variant="delete"
                  title="Delete"
                  onClick={() => handleDelete(b.id)}
                >
                  <Icons.Delete />
                </ActionBtn>
              </div>
            </Td>
          </tr>
        ))}
      </AdminTable>

      <Pagination links={bookings.links} />
    </AdminLayout>
  );
}
