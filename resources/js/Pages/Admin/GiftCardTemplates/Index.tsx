import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { Head, Link } from "@inertiajs/react";
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

type GiftCardTemplate = {
  id: number;
  title: string;
  description: string | null;
  amount: number;
  image_url: string;
  active: boolean;
  sort_order: number;
  vouchers_count: number;
  vendor_user_id: number;
  vendor: {
    id: number;
    name: string;
    email: string;
  } | null;
};

interface Vendor {
  id: number;
  name: string;
}

interface Props {
  templates: {
    data: GiftCardTemplate[];
    links: any;
  };

  vendors: Vendor[];

  filters: {
    search?: string;
    active?: string;
    vendor_user_id?: string;
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

function TemplateModal({
  template,
  vendors,
  onClose,
}: {
  template?: GiftCardTemplate;
  vendors: Vendor[];
  onClose: () => void;
}) {
  const isEdit = !!template;
const { data, set, errors, processing, post } = useAdminForm({
  vendor_user_id: template?.vendor_user_id ?? "",
  title: template?.title ?? "",
  description: template?.description ?? "",
  amount: template?.amount ?? "",
  sort_order: template?.sort_order ?? 0,
  active: template?.active ?? true,
  image: null as File | null,
});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (file: File | null) => {
    set("image", file);

    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };
  const handleSubmit = () => {
    const url = isEdit
      ? route("admin.gift-card-templates.update", template!.id)
      : route("admin.gift-card-templates.store");

    post(url, {
      onSuccess: () => {
        toast.success(isEdit ? "Template updated" : "Template created");
        onClose();
      },
    });
  };
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
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
          {isEdit ? "Edit Gift Card Template" : "New Gift Card Template"}
        </h3>

        <Field label="Vendor">
  <select
    value={data.vendor_user_id}
    onChange={(e) =>
      set("vendor_user_id", Number(e.target.value))
    }
    style={inputClass(errors, "vendor_user_id")}
  >
    <option value="">Select vendor</option>

    {vendors.map((vendor) => (
      <option key={vendor.id} value={vendor.id}>
        {vendor.name}
      </option>
    ))}
  </select>

  {errors.vendor_user_id && (
    <ErrorText>{errors.vendor_user_id}</ErrorText>
  )}
</Field>

        <Field label="Title">
          <input
            type="text"
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
            style={inputClass(errors, "title")}
          />
          {errors.title && <ErrorText>{errors.title}</ErrorText>}
        </Field>

        <Field label="Description">
          <textarea
            value={data.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            style={{ ...inputClass(errors, "description"), resize: "vertical" }}
          />
          {errors.description && <ErrorText>{errors.description}</ErrorText>}
        </Field>

        <Field label="Amount (AUD)">
          <input
            type="number"
            min={1}
            step="0.01"
            value={data.amount}
            onChange={(e) => set("amount", e.target.value)}
            style={inputClass(errors, "amount")}
          />
          {errors.amount && <ErrorText>{errors.amount}</ErrorText>}
        </Field>

        <Field label="Sort Order">
          <input
            type="number"
            min={0}
            value={data.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value))}
            style={inputClass(errors, "sort_order")}
          />
          {errors.sort_order && <ErrorText>{errors.sort_order}</ErrorText>}
        </Field>

        <Field label="Image">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
            style={inputClass(errors, "image")}
          />

          {errors.image && <ErrorText>{errors.image}</ErrorText>}

          {(imagePreview || template?.image_url) && (
            <img
              src={imagePreview ?? template?.image_url}
              alt=""
              style={{
                width: 56,
                height: 56,
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
                checked={data.active}
                onChange={(e) => set("active", e.target.checked)}
              />
              Active (visible in shop)
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
                : "Create Template"}
          </AdminBtn>
        </div>
      </div>
    </div>
  );
}

export default function GiftCardTemplatesIndex({ templates, filters,vendors }: Props) {
  const [modalTarget, setModalTarget] = useState<
    "new" | GiftCardTemplate | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<GiftCardTemplate | null>(
    null,
  );

  console.log(templates.data);
  const handleToggle = (id: number) => {
    router.patch(
      route("admin.gift-card-templates.toggle", id),
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
    router.delete(route("admin.gift-card-templates.destroy", deleteTarget.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Template deleted");
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Could not delete — it may already have vouchers issued");
        setDeleteTarget(null);
      },
    });
  };

  return (
    <AdminLayout>
      <Head title="Admin — Gift Card Templates" />

      {modalTarget && (
  <TemplateModal
    template={modalTarget === "new" ? undefined : modalTarget}
    vendors={vendors}
    onClose={() => setModalTarget(null)}
  />
)}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Gift Card Template"
          description={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <AdminPageHeader
        eyebrow="Manage"
        title="Gift Card Templates"
        action={
          <AdminBtn variant="primary" onClick={() => setModalTarget("new")}>
            + New Template
          </AdminBtn>
        }
      />

     <FilterBar
  routeName="admin.gift-card-templates.index"
  filters={filters}
  fields={[
    {
      key: "search",
      placeholder: "Search title…",
    },
    {
      key: "vendor_user_id",
      type: "select",
      placeholder: "All vendors",
      options: vendors.map((vendor) => ({
        value: String(vendor.id),
        label: vendor.name,
      })),
    },
    {
      key: "active",
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
        headers={[
          "Image",
          "Title",
          "Created By",
          "Amount",
          "Sort",
          "Issued",
          "Status",
          "Actions",
        ]}
      >
        {templates.data.map((t) => (
          <tr key={t.id}>
            <Td>
              <img
                src={t.image_url}
                alt={t.title}
                style={{
                  width: 44,
                  height: 44,
                  objectFit: "cover",
                  borderRadius: "var(--radius-sm)",
                }}
              />
            </Td>
            <Td>
              <span style={{ fontWeight: 600 }}>{t.title}</span>
            </Td>
            <Td>
              {t.vendor_email ? (
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {t.vendor_email}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  —
                </span>
              )}
            </Td>
            <Td>
              <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                A${t.amount.toFixed(2)}
              </span>
            </Td>
            <Td muted>{t.sort_order}</Td>
            <Td muted>{t.vouchers_count}</Td>
            <Td>
              <button
                onClick={() => handleToggle(t.id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <StatusBadge status={t.active ? "active" : "inactive"} />
              </button>
            </Td>
            <Td>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn
                  variant="edit"
                  title="Edit"
                  onClick={() => setModalTarget(t)}
                >
                  <Icons.Edit />
                </ActionBtn>
                <ActionBtn
                  variant="delete"
                  title="Delete"
                  onClick={() => setDeleteTarget(t)}
                >
                  <Icons.Delete />
                </ActionBtn>
              </div>
            </Td>
          </tr>
        ))}
      </AdminTable>

      <Pagination links={templates.links} />
    </AdminLayout>
  );
}
