import React from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import { AdminPageHeader, AdminBtn, FlashMessage, Icons, StatusBadge, fontBody, C } from "../../../Components/Admin/AdminComponents";

interface Contact {
  id: number;
  name: string;
    phone: string;
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
  contact: Contact;
  flash: { success?: string; error?: string };
}

const row = (label: string, value: React.ReactNode) => value ? (
  <div style={{
    display: "flex", gap: 16, padding: "12px 0",
    borderBottom: `1px solid ${C.border}`,
  }}>
    <span style={{
      width: 160, flexShrink: 0,
      fontFamily: `${fontBody}`, fontSize: 10,
      letterSpacing: "0.14em", textTransform: "uppercase",
      color: `${C.textMuted}`, paddingTop: 1,
    }}>
      {label}
    </span>
    <span style={{ fontFamily: `${fontBody}`, fontSize: 13, color: `${C.text}`, lineHeight: 1.6 }}>
      {value}
    </span>
  </div>
) : null;

export default function ContactShow({ contact, flash }: Props) {
  const handleToggleRead = () => {
    const routeName = contact.is_read ? "admin.contacts.unread" : "admin.contacts.read";
    router.patch(route(routeName, contact.id), {}, { preserveScroll: true });
  };

  const handleDelete = () => {
    if (!confirm("Delete this contact submission?")) return;
    router.delete(route("admin.contacts.destroy", contact.id));
  };

  return (
    <>
      <Head title={`Contact #${contact.id}`} />
      <AdminLayout>
        <AdminPageHeader
          eyebrow="CRM / Contacts"
          title={`Message from ${contact.name}`}
          meta={new Date(contact.created_at).toLocaleDateString("en-AU", {
            day: "numeric", month: "long", year: "numeric",
          })}
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <AdminBtn onClick={handleToggleRead} variant="ghost">
                {contact.is_read ? "Mark Unread" : "Mark Read"}
              </AdminBtn>
              <AdminBtn onClick={handleDelete} variant="ghost">
                <Icons.Delete /> Delete
              </AdminBtn>
              <AdminBtn as="a" href={route("admin.contacts.index")} variant="ghost">
                <Icons.Back /> Back
              </AdminBtn>
            </div>
          }
        />

        <FlashMessage flash={flash} />

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: 20, alignItems: "start" }}>
          {/* Main */}
          <div style={{
            background: `${C.surface}`, border: `1px solid ${C.border}`,
            borderRadius: "12px", padding: 24,
          }}>
            <div style={{
              fontFamily: `${fontBody}`, fontSize: 10, letterSpacing: "0.18em",
              textTransform: "uppercase", color: `${C.textMuted}`,
              marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}`,
            }}>
              Contact Details
            </div>

            {row("Name", contact.name)}
             {row("Phone", contact.phone)}
            {row("Email", <a href={`mailto:${contact.email}`} style={{ color: `${C.amber}` }}>{contact.email}</a>)}
            {row("Reason", contact.reason?.replace(/_/g, " "))}
            {row("Department", contact.department?.name)}
            {row("Category", contact.category?.name)}
            {row("Product", contact.product?.name)}
            {row("Quantity", contact.quantity)}
            {row("Attachment", contact.file_path ? (

               <a href={`/storage/${contact.file_path}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: `${C.amber}` }}
              >
                View File ↗
              </a>
            ) : null)}

            {/* Message */}
            <div style={{ marginTop: 20 }}>
              <div style={{
                fontFamily: `${fontBody}`, fontSize: 10, letterSpacing: "0.14em",
                textTransform: "uppercase", color: `${C.textMuted}`, marginBottom: 10,
              }}>
                Message
              </div>
              <div style={{
                fontFamily: `${fontBody}`, fontSize: 13, color: `${C.text}`,
                lineHeight: 1.8, whiteSpace: "pre-wrap",
                background: `${C.bgAlt}`, padding: 16,
                borderRadius: "8px", border: `1px solid ${C.border}`,
              }}>
                {contact.message}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{
            background: `${C.surface}`, border: `1px solid ${C.border}`,
            borderRadius: "12px", padding: 20,
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <div style={{
              fontFamily: `${fontBody}`, fontSize: 10, letterSpacing: "0.18em",
              textTransform: "uppercase", color: `${C.textMuted}`,
            }}>
              Status
            </div>
            <StatusBadge status={contact.is_read ? "active" : "draft"} />
            <div style={{ fontFamily: `${fontBody}`, fontSize: 11, color: `${C.textMuted}` }}>
              {contact.is_read ? "This message has been read." : "This message is unread."}
            </div>
            <button
              onClick={handleToggleRead}
              style={{
                padding: "8px 0", fontFamily: `${fontBody}`, fontSize: 11,
                letterSpacing: "0.1em", textTransform: "uppercase",
                background: "none", border: `1px solid ${C.border}`,
                borderRadius: "8px", cursor: "pointer",
                color: `${C.textMuted}`,
              }}
            >
              {contact.is_read ? "↩ Mark Unread" : "✓ Mark Read"}
            </button>

            <div style={{ height: 1, background: `${C.border}` }} />


             <a href={`mailto:${contact.email}`}
              style={{
                display: "block", textAlign: "center",
                padding: "10px 0", fontFamily: `${fontBody}`, fontSize: 11,
                letterSpacing: "0.1em", textTransform: "uppercase",
                background: `${C.amber}`, color: `${C.textInverse}`,
                borderRadius: "8px", textDecoration: "none",
              }}
            >
              ✉ Reply via Email
            </a>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
