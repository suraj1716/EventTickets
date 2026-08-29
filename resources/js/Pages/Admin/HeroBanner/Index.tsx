import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { Head } from "@inertiajs/react";
import {
  AdminTable,
  Tr,
  Td,
  AdminPageHeader,
  FilterBar,
  Pagination,
  StatusBadge,
  ActionBtn,
  AdminBtn,
  Icons,
  ConfirmModal,
  SlideOver,
  SlideOverActions,
  C,
  fontBody,
} from "@/Components/Admin/AdminComponents";
import toast from "react-hot-toast";
import AdminLayout from "../AdminLayout";
import {
  useAdminForm,
  Field,
  AdminInput,
  AdminCheckbox,
} from "@/Components/Admin/useAdminForm";

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

function BannerModal({
  banner,
  onClose,
}: {
  banner?: HeroBanner;
  onClose: () => void;
}) {
  const isEdit = !!banner;

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data, set, errors, processing, post, put } = useAdminForm({
    title: banner?.title ?? "",
    subtitle: banner?.subtitle ?? "",
    button_text: banner?.button_text ?? "",
    button_link: banner?.button_link ?? "",
    is_active: banner?.is_active ?? true,
    image: null as File | null,
  });

  const handleImageChange = (file: File | null) => {
    set("image", file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

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
    <SlideOver
      eyebrow="Storefront"
      title={isEdit ? "Edit Hero Banner" : "New Hero Banner"}
      onClose={onClose}
      footer={
        <SlideOverActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          processing={processing}
          submitLabel={isEdit ? "Save Changes" : "Create Banner"}
        />
      }
    >
        <Field label="Title" error={errors.title}>
          <AdminInput
            type="text"
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
            error={!!errors.title}
          />
        </Field>

        <Field label="Subtitle" error={errors.subtitle}>
          <AdminInput
            type="text"
            value={data.subtitle ?? ""}
            onChange={(e) => set("subtitle", e.target.value)}
            error={!!errors.subtitle}
          />
        </Field>

        <Field label="Button Text" error={errors.button_text}>
          <AdminInput
            type="text"
            value={data.button_text ?? ""}
            onChange={(e) => set("button_text", e.target.value)}
            error={!!errors.button_text}
          />
        </Field>

        <Field label="Button Link" error={errors.button_link}>
          <AdminInput
            type="text"
            value={data.button_link ?? ""}
            onChange={(e) => set("button_link", e.target.value)}
            placeholder="/shop or https://…"
            error={!!errors.button_link}
          />
        </Field>

        <Field label="Image" error={errors.image}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
            style={{ fontFamily: fontBody, fontSize: 13, color: C.text }}
          />

          {(imagePreview || banner?.image_url) && (
            <img
              src={imagePreview ?? banner?.image_url ?? ""}
              alt=""
              style={{
                width: 120,
                height: 60,
                objectFit: "cover",
                marginTop: 8,
                borderRadius: "8px",
                border: `1px solid ${C.border}`,
              }}
            />
          )}
        </Field>

        {isEdit && (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <AdminCheckbox
              checked={data.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              id="hero-banner-active"
            />
            <label htmlFor="hero-banner-active" style={{ fontFamily: fontBody, fontSize: 13, color: C.text, cursor: "pointer" }}>
              Active (visible on site)
            </label>
          </div>
        )}
    </SlideOver>
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
        eyebrow="Storefront"
        title="Hero Banners"
        meta={`${banners.data.length} records shown`}
        action={
          <AdminBtn variant="accent" onClick={() => setModalTarget("new")}>
            <Icons.Plus />
            New Banner
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
        headers={["#", "Image", "Title", "Subtitle", "Button", "Status", "Actions"]}
        empty="✦ No hero banners found"
      >
        {banners.data.map((b) => (
          <Tr key={b.id}>
            <Td muted>{b.id}</Td>
            <Td>
              {b.image_url ? (
                <img
                  src={b.image_url}
                  alt={b.title}
                  style={{
                    width: 72,
                    height: 40,
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              ) : (
                <span style={{ color: C.textFaint }}>—</span>
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
          </Tr>
        ))}
      </AdminTable>

      <Pagination links={banners.links} />
    </AdminLayout>
  );
}
