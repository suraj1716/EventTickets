import { Head, router } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  ActionBtn,
  AdminPageHeader,
  AdminTable,
  FilterBar,
  Pagination,
  StatusBadge,
  Td,
} from "../../../Components/Admin/AdminComponents";

type User = {
  is_read: any;
  id: number;
  name: string;
  email: string;
  orders_count: number;
  roles: string[];
  referral_code: string;
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
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "0.15em",
                  color: "var(--color-text-muted)",
                }}
              >
                {u.referral_code ?? "—"}
              </span>
            </Td>
            <Td muted>{u.created_at}</Td>
          </tr>
        ))}
      </AdminTable>

      <Pagination links={users.links} />
    </AdminLayout>
  );
}
