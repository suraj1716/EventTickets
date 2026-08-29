import React from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  AdminTable,
  AdminBtn,
  ActionBtn,
  FlashMessage,
  StatusBadge,
  Tr,
  Td,
  Icons,
} from "../../../Components/Admin/AdminComponents";

interface GalleryItem {
  id: number;
  title: string;
  active: boolean;
  image_count: number;
  thumbnail: string;
  created_at: string;
}

interface Props {
  galleries: GalleryItem[];
  flash?: { success?: string; error?: string };
}

/* ── Confirm delete modal ── */
function DeleteModal({
  gallery,
  onConfirm,
  onCancel,
}: {
  gallery: GalleryItem;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(12,10,8,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "28px 32px",
          maxWidth: 420, width: "90%",
        }}
      >
        {/* corner accents */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <div style={{ position: "absolute", top: -28, left: -32, width: 16, height: 16, borderTop: "1px solid var(--color-accent)", borderLeft: "1px solid var(--color-accent)", opacity: 0.4 }} />
          <div style={{ position: "absolute", top: -28, right: -32, width: 16, height: 16, borderTop: "1px solid var(--color-accent)", borderRight: "1px solid var(--color-accent)", opacity: 0.4 }} />
          <span style={{
            display: "block", fontFamily: "var(--font-body)", fontSize: "10px",
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--color-error)", marginBottom: 8,
          }}>
            Confirm Deletion
          </span>
          <h3 style={{
            fontFamily: "var(--font-display)", fontSize: "1.25rem",
            fontWeight: 300, color: "var(--color-text)", margin: 0,
          }}>
            Delete <em style={{ fontStyle: "italic", color: "var(--color-accent)" }}>{gallery.title}</em>?
          </h3>
        </div>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "13px",
          color: "var(--color-text-muted)", lineHeight: 1.7,
          marginBottom: 24,
        }}>
          This will permanently delete the gallery and all {gallery.image_count} associated image{gallery.image_count !== 1 ? "s" : ""}. This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <AdminBtn variant="ghost" onClick={onCancel}>Cancel</AdminBtn>
          <AdminBtn variant="danger" onClick={onConfirm}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </AdminBtn>
        </div>
      </div>
    </div>
  );
}

export default function GalleryIndex({ galleries, flash }: Props) {
  const [deleteTarget, setDeleteTarget] = React.useState<GalleryItem | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    router.delete(route("admin.gallery.destroy", deleteTarget.id), {
      onFinish: () => setDeleteTarget(null),
    });
  };

  return (
    <AdminLayout>
      <Head title="Gallery" />


<AdminPageHeader
          eyebrow="Catalogue"
          title="Gallery"
          meta={`${galleries.length} records shown`}
          action={
            <AdminBtn as="a" href={route("admin.departments.create")} variant="accent">
              <Icons.Plus />
              New Gallery
            </AdminBtn>
          }
        />



      <FlashMessage flash={flash ?? {}} />

      <AdminTable
        headers={["#","", "Title", "Status", "Images", "Created", "Actions"]}
        empty="✦ No gallery collections yet"
      >
        {galleries.map((g) => (
          <Tr key={g.id} onClick={() => router.visit(route("admin.gallery.show", g.id))}>
                                        <Td muted>{g.id}</Td>

            {/* Thumbnail */}
            <Td>
              <div style={{
                width: 52, height: 38,
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                background: "var(--color-bg-alt)",
                border: "1px solid var(--color-border)",
                flexShrink: 0,
              }}>
                {g.thumbnail ? (
                  <img
                    src={g.thumbnail}
                    alt={g.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ width: 16, height: 16, color: "var(--color-text-muted)" }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
              </div>
            </Td>

            {/* Title */}
            <Td>
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: "14px",
                fontWeight: 300,
                color: "var(--color-text)",
              }}>
                {g.title}
              </span>
            </Td>

            {/* Status */}
            <Td>
              <StatusBadge status={g.active ? "active" : "draft"} />
            </Td>

            {/* Image count */}
            <Td muted>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                {g.image_count}
              </div>
            </Td>

            {/* Date */}
            <Td muted>{g.created_at}</Td>

            {/* Actions */}
            <Td right>
              <div
                style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}
                onClick={(e) => e.stopPropagation()}
              >

                <ActionBtn
                  variant="edit"
                  title="Edit"
                  as="a"
                  href={route("admin.gallery.edit", g.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </ActionBtn>
                <ActionBtn
                  variant="delete"
                  title="Delete"
                  onClick={() => setDeleteTarget(g)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </ActionBtn>
              </div>
            </Td>
          </Tr>
        ))}
      </AdminTable>

      {deleteTarget && (
        <DeleteModal
          gallery={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminLayout>
  );
}
