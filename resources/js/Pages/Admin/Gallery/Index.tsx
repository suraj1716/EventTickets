import React from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  AdminTable,
  AdminBtn,
  ActionBtn,
  ConfirmModal,
  FlashMessage,
  StatusBadge,
  Tr,
  Td,
  Icons,
  C,
  fontDisplay,
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
          <AdminBtn as="a" href={route("admin.gallery.create")} variant="accent">
            <Icons.Plus />
            New Gallery
          </AdminBtn>
        }
      />

      <FlashMessage flash={flash ?? {}} />

      <AdminTable
        headers={["#", "", "Title", "Status", "Images", "Created", "Actions"]}
        empty="✦ No gallery collections yet"
      >
        {galleries.map((g) => (
          <Tr key={g.id} onClick={() => router.visit(route("admin.gallery.show", g.id))}>
            <Td muted>{g.id}</Td>

            <Td>
              <div style={{ width: 52, height: 38, borderRadius: 8, overflow: "hidden", background: C.bgAlt, border: `1px solid ${C.border}`, flexShrink: 0 }}>
                {g.thumbnail ? (
                  <img src={g.thumbnail} alt={g.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted }}>
                    <Icons.Image />
                  </div>
                )}
              </div>
            </Td>

            <Td>
              <span style={{ fontFamily: fontDisplay, fontSize: 14, fontWeight: 300, color: C.text }}>
                {g.title}
              </span>
            </Td>

            <Td>
              <StatusBadge status={g.active ? "active" : "draft"} />
            </Td>

            <Td muted>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Icons.Image />
                {g.image_count}
              </div>
            </Td>

            <Td muted>{g.created_at}</Td>

            <Td right>
              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                <ActionBtn variant="edit" title="Edit" as="a" href={route("admin.gallery.edit", g.id)}>
                  <Icons.Edit />
                </ActionBtn>
                <ActionBtn variant="delete" title="Delete" onClick={() => setDeleteTarget(g)}>
                  <Icons.Delete />
                </ActionBtn>
              </div>
            </Td>
          </Tr>
        ))}
      </AdminTable>

      {deleteTarget && (
        <ConfirmModal
          title={`Delete "${deleteTarget.title}"?`}
          description={`This will permanently delete the gallery and all ${deleteTarget.image_count} associated image${deleteTarget.image_count !== 1 ? "s" : ""}. This action cannot be undone.`}
          confirmLabel="Delete Gallery"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminLayout>
  );
}
