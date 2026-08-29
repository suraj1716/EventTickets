import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "../AdminLayout";
import {
  ActionBtn,
  AdminPageHeader,
  AdminTable,
  AdminBtn,
  ConfirmModal,
  FilterBar,
  Icons,
  Pagination,
  SlideOver,
  SlideOverActions,
  StatusBadge,
  Tr,
  Td,
  C,
  fontBody,
} from "../../../Components/Admin/AdminComponents";
import {
  useAdminForm,
  Field,
  AdminInput,
  AdminSelect,
  AdminCheckbox,
} from "../../../Components/Admin/useAdminForm";

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

  const { data, set, errors, processing, post, put } = useAdminForm({
    name: editing?.name ?? "",
    email: editing?.email ?? "",
    phone: editing?.phone ?? "",
    position: editing?.position ?? "",
    employment_type: editing?.employment_type ?? "",
    is_active: editing?.is_active ?? true,
    category_ids: editing?.category_ids ?? ([] as number[]),
    photo: null as File | null,
  });

  const toggleCategory = (id: number) => {
    set(
      "category_ids",
      data.category_ids.includes(id)
        ? data.category_ids.filter((c) => c !== id)
        : [...data.category_ids, id],
    );
  };

  const handleSubmit = () => {
    const onSuccess = () => {
      toast.success(isEdit ? "Staff member updated" : "Staff member added");
      onClose();
    };
    const onError = () => toast.error("Please check the form for errors");

    if (isEdit) {
      put(route("admin.vendor.staff.update", editing!.id), {
        transform: (d) => ({ ...d, _method: "put" }),
        onSuccess,
      });
    } else {
      post(route("admin.vendor.staff.store"), { onSuccess });
    }
    // errors surface via useAdminForm's page-prop errors; onError above
    // covers the toast, this keeps parity with the rest of the modals.
  };

  return (
    <SlideOver
      eyebrow="Staff"
      title={isEdit ? "Edit Staff Member" : "Add Staff Member"}
      onClose={onClose}
      footer={
        <SlideOverActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          processing={processing}
          submitLabel={isEdit ? "Update Staff" : "Add Staff"}
        />
      }
    >
      <Field label="Name" required error={errors.name}>
        <AdminInput
          type="text"
          value={data.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Full name"
          error={!!errors.name}
          autoFocus
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Email" error={errors.email}>
          <AdminInput
            type="email"
            value={data.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="staff@example.com"
            error={!!errors.email}
          />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <AdminInput
            type="tel"
            value={data.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="0400 000 000"
            error={!!errors.phone}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Position" error={errors.position}>
          <AdminInput
            type="text"
            value={data.position}
            onChange={(e) => set("position", e.target.value)}
            placeholder="e.g. Senior Stylist"
            error={!!errors.position}
          />
        </Field>
        <Field label="Employment Type" error={errors.employment_type}>
          <AdminSelect
            value={data.employment_type}
            onChange={(e) => set("employment_type", e.target.value)}
            error={!!errors.employment_type}
          >
            <option value="">—</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contractor">Contractor</option>
          </AdminSelect>
        </Field>
      </div>

      {categories.length > 0 && (
        <Field label="Categories / Services">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {categories.map((c) => {
              const active = data.category_ids.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  style={{
                    padding: "6px 14px",
                    fontFamily: fontBody,
                    fontSize: 11,
                    borderRadius: 999,
                    border: `1px solid ${active ? C.amber : C.border}`,
                    background: active ? C.amber : "transparent",
                    color: active ? C.textInverse : C.textMuted,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      <Field label="Photo" error={errors.photo}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => set("photo", e.target.files?.[0] ?? null)}
          style={{ fontFamily: fontBody, fontSize: 13, color: C.text }}
        />
        {editing?.photo_url && !data.photo && (
          <img
            src={editing.photo_url}
            alt=""
            style={{ width: 56, height: 56, objectFit: "cover", marginTop: 8, borderRadius: "50%", border: `1px solid ${C.border}` }}
          />
        )}
      </Field>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AdminCheckbox
          checked={data.is_active}
          onChange={(e) => set("is_active", e.target.checked)}
          id="staff-active"
        />
        <label htmlFor="staff-active" style={{ fontFamily: fontBody, fontSize: 13, color: C.text, cursor: "pointer" }}>
          Active
        </label>
      </div>
    </SlideOver>
  );
}

export default function StaffIndex({ staff, filters, categories }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  const openCreate = () => {
    setEditingStaff(null);
    setShowModal(true);
  };

  const openEdit = (s: StaffMember) => {
    setEditingStaff(s);
    setShowModal(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    router.delete(route("admin.vendor.staff.destroy", deleteTarget.id), {
      preserveScroll: true,
      onSuccess: () => toast.success("Staff member deleted"),
      onError: () => toast.error("Failed to delete staff member"),
      onFinish: () => setDeleteTarget(null),
    });
  };

  return (
    <AdminLayout>
      <Head title="Staff" />

      {showModal && (
        <StaffModal
          onClose={() => setShowModal(false)}
          categories={categories}
          editing={editingStaff}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title={`Delete "${deleteTarget.name}"?`}
          description="This will permanently remove the staff member. This action cannot be undone."
          confirmLabel="Delete Staff"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <AdminPageHeader
        eyebrow="Team"
        title="Staff"
        meta={`${staff.data.length} records shown`}
        action={
          <AdminBtn variant="accent" onClick={openCreate}>
            <Icons.Plus />
            New Staff
          </AdminBtn>
        }
      />

      <FilterBar
        routeName="admin.vendor.staff.index"
        filters={filters}
        fields={[{ key: "search", placeholder: "Search name, email, position…", flex: true }]}
      />

      <AdminTable
        headers={["#", "Staff", "Position", "Employment", "Status", "Added", "Actions"]}
        empty="✦ No staff members found"
      >
        {staff.data.map((s) => (
          <Tr key={s.id}>
            <Td muted>{s.id}</Td>
            <Td>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {s.photo_url ? (
                  <img
                    src={s.photo_url}
                    alt={s.name}
                    style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: C.bgAlt, border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: C.textFaint, flexShrink: 0,
                  }}>
                    <Icons.Image />
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  {s.email && <div style={{ fontSize: 11, color: C.textMuted }}>{s.email}</div>}
                </div>
              </div>
            </Td>
            <Td muted>{s.position || "—"}</Td>
            <Td muted>{s.employment_type || "—"}</Td>
            <Td><StatusBadge status={s.is_active ? "active" : "inactive"} /></Td>
            <Td muted>{s.created_at}</Td>
            <Td>
              <div style={{ display: "flex", gap: 4 }}>
                <ActionBtn variant="edit" title="Edit" onClick={() => openEdit(s)}>
                  <Icons.Edit />
                </ActionBtn>
                <ActionBtn variant="delete" title="Delete" onClick={() => setDeleteTarget(s)}>
                  <Icons.Delete />
                </ActionBtn>
              </div>
            </Td>
          </Tr>
        ))}
      </AdminTable>

      <Pagination links={staff.links} />
    </AdminLayout>
  );
}
