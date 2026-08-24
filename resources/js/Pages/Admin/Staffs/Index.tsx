import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
  ActionBtn,
  AdminPageHeader,
  AdminTable,
  FilterBar,
  Pagination,
  StatusBadge,
  Td,
  Icons,
} from "../../../Components/Admin/AdminComponents";
import AdminLayout from "../AdminLayout";

type Category = { id: number; name: string };

type StaffMember = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  employment_type: string | null;
  is_active: boolean;
  photo_url: string | null;
  category_ids: number[];
  created_at: string;
};

type Props = {
  staff: { data: StaffMember[]; links: any[] };
  filters: Record<string, string>;
  categories: Category[];
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text)",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-xs)",
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  marginBottom: "var(--space-xs)",
};

type StaffForm = {
  name: string;
  email: string;
  phone: string;
  position: string;
  employment_type: string;
  is_active: boolean;
  category_ids: number[];
  photo: File | null;
};

const emptyForm: StaffForm = {
  name: "",
  email: "",
  phone: "",
  position: "",
  employment_type: "",
  is_active: true,
  category_ids: [],
  photo: null,
};

function StaffModal({
  onClose,
  categories,
  editing,
}: {
  onClose: () => void;
  categories: Category[];
  editing: StaffMember | null;
}) {
  const isEdit = !!editing;

  const [form, setForm] = useState<StaffForm>(
    editing
      ? {
          name: editing.name,
          email: editing.email ?? "",
          phone: editing.phone ?? "",
          position: editing.position ?? "",
          employment_type: editing.employment_type ?? "",
          is_active: editing.is_active,
          category_ids: editing.category_ids ?? [],
          photo: null,
        }
      : emptyForm,
  );

  const toggleCategory = (id: number) => {
    setForm((f) => ({
      ...f,
      category_ids: f.category_ids.includes(id)
        ? f.category_ids.filter((c) => c !== id)
        : [...f.category_ids, id],
    }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, any> = { ...form, _method: isEdit ? "put" : "post" };

    const onSuccess = () => {
      toast.success(isEdit ? "Staff member updated" : "Staff member added");
      onClose();
    };
    const onError = () => toast.error("Please check the form for errors");

    if (isEdit) {
      router.post(route("admin.vendor.staff.update", editing!.id), payload, {
        forceFormData: true,
        onSuccess,
        onError,
      });
    } else {
      router.post(route("admin.vendor.staff.store"), payload, {
        forceFormData: true,
        onSuccess,
        onError,
      });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--color-overlay)",
        backdropFilter: "blur(4px)",
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-xl)",
          width: 520,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "calc(100vh - 64px)",
          overflowY: "auto",
          zIndex: 9999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "var(--space-xl)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: "var(--color-surface)",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 400,
              color: "var(--color-text)",
            }}
          >
            {isEdit ? "Edit Staff Member" : "Add Staff Member"}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-light)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={submit}
          style={{
            padding: "var(--space-xl)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-lg)",
          }}
        >
          <div>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="staff@example.com"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0400 000 000"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
            <div>
              <label style={labelStyle}>Position</label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="e.g. Senior Stylist"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Employment Type</label>
              <select
                value={form.employment_type}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                style={inputStyle}
              >
                <option value="">—</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <label style={labelStyle}>Categories / Services</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {categories.map((c) => {
                  const active = form.category_ids.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      style={{
                        padding: "6px 14px",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-xs)",
                        border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
                        background: active ? "var(--color-primary)" : "transparent",
                        color: active ? "#fff" : "var(--color-text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] ?? null })}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>

          <div
            style={{
              display: "flex",
              gap: "var(--space-sm)",
              paddingTop: "var(--space-sm)",
              position: "sticky",
              bottom: 0,
              background: "var(--color-surface)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.75rem",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: "transparent",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 2,
                padding: "0.75rem",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: "var(--color-primary)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              {isEdit ? "Update Staff" : "Add Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffIndex({ staff, filters, categories }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const openCreate = () => {
    setEditingStaff(null);
    setShowModal(true);
  };

  const openEdit = (s: StaffMember) => {
    setEditingStaff(s);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this staff member? This cannot be undone.")) return;
    router.delete(route("admin.vendor.staff.destroy", id), {
      preserveScroll: true,
      onSuccess: () => toast.success("Staff member deleted"),
      onError: () => toast.error("Failed"),
    });
  };

  return (
    <AdminLayout>
      <Head title="My Staff" />

      {showModal && (
        <StaffModal
          onClose={() => setShowModal(false)}
          categories={categories}
          editing={editingStaff}
        />
      )}

      <AdminPageHeader
        eyebrow="Manage"
        title="Staff"
        action={
          <button
            onClick={openCreate}
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
            }}
          >
            + Add Staff
          </button>
        }
      />

      <FilterBar
        routeName="admin.vendor.staff.index"
        filters={filters}
        fields={[{ key: "search", placeholder: "Search name, email, position…" }]}
      />

      <AdminTable headers={["Staff", "Position", "Employment", "Status", "Added", "Actions"]}>
        {staff.data.map((s) => (
          <tr key={s.id}>
            <Td>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {s.photo_url && (
                  <img
                    src={s.photo_url}
                    alt={s.name}
                    style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
                  />
                )}
                <div>
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--color-primary)" }}>
                    {s.name}
                  </span>
                  {s.email && (
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-light)" }}>{s.email}</div>
                  )}
                </div>
              </div>
            </Td>
            <Td muted>{s.position || "—"}</Td>
            <Td muted>{s.employment_type || "—"}</Td>
            <Td><StatusBadge status={s.is_active ? "active" : "inactive"} /></Td>
            <Td muted>{s.created_at}</Td>
            <Td>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn variant="edit" title="Edit" onClick={() => openEdit(s)}>
                  <Icons.Edit />
                </ActionBtn>
                <ActionBtn variant="delete" title="Delete" onClick={() => handleDelete(s.id)}>
                  <Icons.Delete />
                </ActionBtn>
              </div>
            </Td>
          </tr>
        ))}
      </AdminTable>

      <Pagination links={staff.links} />
    </AdminLayout>
  );
}
