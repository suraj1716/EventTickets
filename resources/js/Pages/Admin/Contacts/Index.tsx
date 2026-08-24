import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader, AdminTable, ActionBtn,
  FilterBar, Pagination, StatusBadge, Tr, Td,
  FlashMessage, ConfirmModal, Icons,
} from "../../../Components/Admin/AdminComponents";

interface Contact {
  id: number;
  name: string;
  email: string;
  reason: string | null;
  message: string;
  is_read: boolean;
  file_path: string | null;
  department: { name: string } | null;
  category: { name: string } | null;
  product: { name: string } | null;
  quantity: number | null;
  created_at: string;
}

interface Props {
  contacts: { data: Contact[]; links: any[] };
  filters: Record<string, string>;
  reasons: { value: string; label: string }[];
  flash: { success?: string; error?: string };
}

export default function ContactsIndex({ contacts, filters, reasons, flash }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    router.delete(route("admin.contacts.destroy", deleteTarget.id), {
      onFinish: () => setDeleteTarget(null),
    });
  };

  const handleToggleRead = (contact: Contact) => {
    const routeName = contact.is_read
      ? "admin.contacts.unread"
      : "admin.contacts.read";
    router.patch(route(routeName, contact.id), {}, { preserveScroll: true });
  };

  return (
    <>
      <Head title="Contacts" />
      <AdminLayout>
        <AdminPageHeader
          eyebrow="CRM"
          title="Contact Submissions"
          meta={`${contacts.data.length} records shown`}
        />

        <FlashMessage flash={flash} />

        <FilterBar
          routeName="admin.contacts.index"
          filters={filters}
          fields={[
            { key: "search", placeholder: "Search name, email, reason…", flex: true },
           { key: "is_read", type: "select", placeholder: "Read / Unread", options: [{ value: "1", label: "Read" }, { value: "0", label: "Unread" }] },

            {
              key: "reason",
              type: "select",
              placeholder: "All Reasons",
              options: reasons,
            },
            {
              key: "is_read",
              type: "select",
              placeholder: "Read / Unread",
              options: [
                { value: "1", label: "Read" },
                { value: "0", label: "Unread" },
              ],
            },
          ]}
        />

        <AdminTable
          headers={["#", "Name", "Reason", "Department / Product", "Message", "Status", "Read", "Date", "Actions"]}
          empty="✦ No contact submissions"
        >
          {contacts.data.map((c) => (
            <Tr
              key={c.id}
              onClick={() => router.visit(route("admin.contacts.show", c.id))}
              style={{ opacity: c.is_read ? 0.7 : 1 }}
            >
              <Td muted>#{c.id}</Td>

              <Td>
                <div style={{ fontWeight: c.is_read ? 400 : 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 1 }}>
                  {c.email}
                </div>
              </Td>

              <Td muted>
                {c.reason ? (
                  <span style={{
                    fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                    background: "var(--color-bg-alt)", border: "1px solid var(--color-border)",
                    padding: "2px 7px", borderRadius: "var(--radius-sm)",
                  }}>
                    {c.reason.replace(/_/g, " ")}
                  </span>
                ) : "—"}
              </Td>

              <Td muted>
                <div style={{ fontSize: 11 }}>
                  {c.department?.name && <div>{c.department.name}</div>}
                  {c.category?.name && <div>{c.category.name}</div>}
                  {c.product?.name && <div>{c.product.name}</div>}
                  {c.quantity && <div>Qty: {c.quantity}</div>}
                  {!c.department && !c.product && "—"}
                </div>
              </Td>

              <Td>
                <div style={{
                  fontSize: 12,
                  color: "var(--color-text-muted)",
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {c.message}
                </div>
              </Td>

              <Td>
                <StatusBadge status={c.is_read ? "active" : "draft"} />
              </Td>

              <Td onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => handleToggleRead(c)}
                  title={c.is_read ? "Mark unread" : "Mark read"}
                  style={{
                    background: "none",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: 11,
                    color: c.is_read ? "var(--color-text-muted)" : "var(--color-accent)",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.08em",
                  }}
                >
                  {c.is_read ? "✓ Read" : "● Unread"}
                </button>
              </Td>

              <Td muted>
                <div style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                  {new Date(c.created_at).toLocaleDateString("en-AU", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </div>
              </Td>

              <Td onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", gap: 4 }}>
                  <ActionBtn variant="view" title="View" as="a" href={route("admin.contacts.show", c.id)}>
                    <Icons.View />
                  </ActionBtn>
                  <ActionBtn variant="delete" title="Delete" onClick={() => setDeleteTarget(c)}>
                    <Icons.Delete />
                  </ActionBtn>
                </div>
              </Td>
            </Tr>
          ))}
        </AdminTable>

        <Pagination links={contacts.links} />

        {deleteTarget && (
          <ConfirmModal
            title={`Delete contact from ${deleteTarget.name}?`}
            description="This will permanently delete this contact submission and any uploaded file. This cannot be undone."
            confirmLabel="Delete Contact"
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AdminLayout>
    </>
  );
}
