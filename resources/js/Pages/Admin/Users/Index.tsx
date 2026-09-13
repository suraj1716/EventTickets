import { Head, router } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import { ActionBtn, AdminPageHeader, AdminTable, FilterBar, Pagination, StatusBadge, Td, fontBody, C } from "../../../Components/Admin/AdminComponents";

type User = {
  is_read: any;
  id: number;
  name: string;
  email: string;
  orders_count: number;
  roles: string[];
  referral_code: string;
  stripe_account_id: string | null;
  stripe_account_active: boolean;
  created_at: string;
};

type Props = {
  users: { data: User[]; links: any[] };
  filters: Record<string, string>;
  roles: string[];
};

export default function UsersIndex({ users, filters, roles }: Props) {
  return (
    <AdminLayout>
      <Head title="Admin — Users" />

      <AdminPageHeader eyebrow="Manage" title="Users" />

      <FilterBar
        routeName="admin.users.index"
        filters={filters}
        fields={[
          { key: "search", placeholder: "Search name or email…" },
          {
            key: "role",
            type: "select",
            placeholder: "All roles",
            options: roles.map((r) => ({ value: r, label: r })),
          },
          {
            key: "is_read",
            type: "select",
            placeholder: "All / Unread",
            options: [
              { value: "0", label: "New (Unread)" },
              { value: "1", label: "Read" },
            ],
          },
          {
            key: "stripe_status",
            type: "select",
            placeholder: "All / Stripe status",
            options: [
              { value: "connected", label: "Stripe Connected" },
              { value: "pending", label: "Stripe Pending" },
              { value: "none", label: "Not Connected" },
            ],
          },
        ]}
      />

      <AdminTable
        headers={[
          "Actions",
          "#",
          "Name",
          "Email",
          "Roles",
          "Orders",
          "Referral Code",
          "Stripe Connect",
          "Joined",
        ]}
      >
        {users.data.map((u) => (
          <tr key={u.id}>
          <Td onClick={(e) => e.stopPropagation()}>
  <ActionBtn
    variant={u.is_read ? "edit" : "view"}
    title={u.is_read ? "Read" : "New"}
    onClick={() => {
      if (!u.is_read) {
        router.patch(route("admin.users.read", u.id), {}, { preserveScroll: true });
      }
    }}
  >
    {u.is_read ? "✓" : "🔵"}
  </ActionBtn>
</Td>
            <Td muted>#{u.id}</Td>
            <Td>{u.name}</Td>
            <Td muted>{u.email}</Td>
            <Td>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {u.roles.map((r) => (
                  <StatusBadge key={r} status={r.toLowerCase()} />
                ))}
              </div>
            </Td>
            <Td muted>{u.orders_count}</Td>
            <Td>
              <span
                style={{
                  fontFamily: `${fontBody}`,
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  color: `${C.textMuted}`,
                }}
              >
                {u.referral_code ?? "—"}
              </span>
            </Td>
            <Td>
              {u.stripe_account_active ? (
                <StatusBadge status="approved" label="Connected" />
              ) : u.stripe_account_id ? (
                <StatusBadge status="pending" label="Pending" />
              ) : (
                <span style={{ color: `${C.textFaint}`, fontSize: "12px" }}>
                  Not connected
                </span>
              )}
            </Td>
            <Td muted>{u.created_at}</Td>
          </tr>
        ))}
      </AdminTable>

      <Pagination links={users.links} />
    </AdminLayout>
  );
}
