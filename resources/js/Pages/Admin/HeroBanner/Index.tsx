import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { Head } from "@inertiajs/react";
import {
  AdminTable,
  AdminPageHeader,
  FilterBar,
  Pagination,
  StatusBadge,
  ActionBtn,
  AdminBtn,
  Icons,
  ConfirmModal,
} from "@/Components/Admin/AdminComponents";
import toast from "react-hot-toast";
import AdminLayout from "../AdminLayout";
import { useAdminForm, inputClass } from "@/Components/Admin/useAdminForm";

type HeroBanner = {
  id: number;
  title: string;
  subtitle: string | null;
  button_text: string | null;
  button_link: string | null;
  image_url: string | null;
  is_active: boolean;
};

interface Props {
  banners: {
    data: HeroBanner[];
    links: any;
  };
  filters: {
    search?: string;
    is_active?: string;
  };
}

function Td({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <td
      style={{
        padding: "0.85rem 1rem",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-sm)",
        color: muted ? "var(--color-text-muted)" : "var(--color-text)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {children}
    </td>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "var(--space-md)" }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "var(--text-xs)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            marginBottom: 4,
          }}
        >
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        color: "var(--color-error)",
        fontSize: "var(--text-xs)",
        marginTop: 4,
      }}
    >
      {children}
    </p>
  );
}

function BannerModal({
  banner,
  onClose,
}: {
  banner?: HeroBanner;
  onClose: () => void;
}) {
  const isEdit = !!banner;

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (file: File | null) => {
    set("image", file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

const { data, set, errors, processing, post, put } = useAdminForm({
  title: banner?.title ?? "",
  subtitle: banner?.subtitle ?? "",
  button_text: banner?.button_text ?? "",
  button_link: banner?.button_link ?? "",
  is_active: banner?.is_active ?? true,
  image: null as File | null,
});

const handleSubmit = () => {
  if (isEdit) {
    put(route("admin.hero-banner.update", banner!.id), {
      onSuccess: () => {
        toast.success("Banner updated");
        onClose();
      },
    });
  } else {
    post(route("admin.hero-banner.store"), {
      onSuccess: () => {
        toast.success("Banner created");
        onClose();
      },
    });
  }
};

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(12,10,8,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
          width: "480px",
          maxWidth: "90vw",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.2rem",
            fontWeight: 300,
            color: "var(--color-text)",
            margin: "0 0 20px",
          }}
        >
          {isEdit ? "Edit Hero Banner" : "New Hero Banner"}
        </h3>

        <Field label="Title">
          <input
            type="text"
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
            style={inputClass(errors, "title")}
          />
          {errors.title && <ErrorText>{errors.title}</ErrorText>}
        </Field>

        <Field label="Subtitle">
          <input
            type="text"
            value={data.subtitle ?? ""}
            onChange={(e) => set("subtitle", e.target.value)}
            style={inputClass(errors, "subtitle")}
          />
          {errors.subtitle && <ErrorText>{errors.subtitle}</ErrorText>}
        </Field>

        <Field label="Button Text">
          <input
            type="text"
            value={data.button_text ?? ""}
            onChange={(e) => set("button_text", e.target.value)}
            style={inputClass(errors, "button_text")}
          />
          {errors.button_text && <ErrorText>{errors.button_text}</ErrorText>}
        </Field>

        <Field label="Button Link">
          <input
            type="text"
            value={data.button_link ?? ""}
            onChange={(e) => set("button_link", e.target.value)}
            placeholder="/shop or https://…"
            style={inputClass(errors, "button_link")}
          />
          {errors.button_link && <ErrorText>{errors.button_link}</ErrorText>}
        </Field>

        <Field label="Image">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
            style={inputClass(errors, "image")}
          />
          {errors.image && <ErrorText>{errors.image}</ErrorText>}

          {(imagePreview || banner?.image_url) && (
            <img
              src={imagePreview ?? banner?.image_url ?? ""}
              alt=""
              style={{
                width: 120,
                height: 60,
                objectFit: "cover",
                marginTop: 8,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
              }}
            />
          )}
        </Field>

        {isEdit && (
          <Field label="">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "var(--text-sm)",
                color: "var(--color-text)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={data.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
              />
              Active (visible on site)
            </label>
          </Field>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: "var(--space-lg)",
          }}
        >
          <AdminBtn variant="ghost" onClick={onClose}>
            Cancel
          </AdminBtn>
          <AdminBtn
            variant="primary"
            onClick={handleSubmit}
            disabled={processing}
          >
            {processing
              ? "Saving…"
              : isEdit
                ? "Save Changes"
                : "Create Banner"}
          </AdminBtn>
        </div>
      </div>
    </div>
  );
}

export default function HeroBannerIndex({ banners, filters }: Props) {
  const [modalTarget, setModalTarget] = useState<"new" | HeroBanner | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<HeroBanner | null>(null);

  const handleToggle = (id: number) => {
    router.patch(
      route("admin.hero-banner.toggle", id),
      {},
      {
        preserveScroll: true,
        onSuccess: () => toast.success("Status updated"),
        onError: () => toast.error("Failed"),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    router.delete(route("admin.hero-banner.destroy", deleteTarget.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Banner deleted");
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Could not delete banner");
        setDeleteTarget(null);
      },
    });
  };

  return (
    <AdminLayout>
      <Head title="Admin — Hero Banners" />

      {modalTarget && (
        <BannerModal
          banner={modalTarget === "new" ? undefined : modalTarget}
          onClose={() => setModalTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Hero Banner"
          description={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <AdminPageHeader
        eyebrow="Manage"
        title="Hero Banners"
        action={
          <AdminBtn variant="primary" onClick={() => setModalTarget("new")}>
            + New Banner
          </AdminBtn>
        }
      />

      <FilterBar
        routeName="admin.hero-banner.index"
        filters={filters}
        fields={[
          { key: "search", placeholder: "Search title…" },
          {
            key: "is_active",
            type: "select",
            placeholder: "All statuses",
            options: [
              { value: "1", label: "Active" },
              { value: "0", label: "Inactive" },
            ],
          },
        ]}
      />

      <AdminTable
        headers={["Image", "Title", "Subtitle", "Button", "Status", "Actions"]}
      >
        {banners.data.map((b) => (
          <tr key={b.id}>
            <Td>
              {b.image_url ? (
                <img
                  src={b.image_url}
                  alt={b.title}
                  style={{
                    width: 72,
                    height: 40,
                    objectFit: "cover",
                    borderRadius: "var(--radius-sm)",
                  }}
                />
              ) : (
                <span style={{ color: "var(--color-text-muted)" }}>—</span>
              )}
            </Td>
            <Td>
              <span style={{ fontWeight: 600 }}>{b.title}</span>
            </Td>
            <Td muted>{b.subtitle || "—"}</Td>
            <Td muted>
              {b.button_text ? `${b.button_text} → ${b.button_link}` : "—"}
            </Td>
            <Td>
              <button
                onClick={() => handleToggle(b.id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <StatusBadge status={b.is_active ? "active" : "inactive"} />
              </button>
            </Td>
            <Td>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn
                  variant="edit"
                  title="Edit"
                  onClick={() => setModalTarget(b)}
                >
                  <Icons.Edit />
                </ActionBtn>
                <ActionBtn
                  variant="delete"
                  title="Delete"
                  onClick={() => setDeleteTarget(b)}
                >
                  <Icons.Delete />
                </ActionBtn>
              </div>
            </Td>
          </tr>
        ))}
      </AdminTable>

      <Pagination links={banners.links} />
    </AdminLayout>
  );
}
