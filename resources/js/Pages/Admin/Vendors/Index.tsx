import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "../AdminLayout";
import {
  ActionBtn,
  AdminBtn,
  AdminPageHeader,
  AdminTable,
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
} from "../../../Components/Admin/AdminComponents";
import { useAdminForm } from "../../../Components/Admin/useAdminForm";
import { VendorFormFields, VendorFormData } from "./VendorFormFields";

type Vendor = {
  user_id: number;
  store_name: string;
  email: string;
  status: string;
  vendor_type: string;
  products_count: number;
  booking_fee: number;
  created_at: string;
};

type Props = {
  vendors: { data: Vendor[]; links: any[] };
  filters: Record<string, string>;
  statuses: string[];
  types: string[];
};

const STATUS_OPTIONS = [
  { value: "active", label: "Pending" }, // enum quirk: Pending's value is 'active'
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_COLORS: Record<string, string> = {
  active: C.textMuted,
  approved: C.success,
  rejected: C.error,
};

function StatusDropdown({ vendor }: { vendor: Vendor }) {
  const [updating, setUpdating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setUpdating(true);
    router.patch(
      route("admin.vendors.status", vendor.user_id),
      { status: newStatus },
      {
        preserveScroll: true,
        onSuccess: () => toast.success("Status updated"),
        onError: () => toast.error("Failed to update status"),
        onFinish: () => setUpdating(false),
      },
    );
  };

  return (
    <select
      value={vendor.status}
      onChange={handleChange}
      disabled={updating}
      style={{
        fontFamily: "inherit",
        fontSize: 11,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: STATUS_COLORS[vendor.status] ?? C.text,
        background: C.bgAlt,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: "4px 8px",
        cursor: updating ? "default" : "pointer",
        opacity: updating ? 0.6 : 1,
      }}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function CreateModal({
  onClose,
  statuses,
  types,
}: {
  onClose: () => void;
  statuses: string[];
  types: string[];
}) {
  const { data, set, errors, processing, post } = useAdminForm<VendorFormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    store_name: "",
    store_address: "",
    vendor_type: types[0] ?? "ecommerce",
    booking_fee: "",
    status: statuses[0] ?? "active",
    business_start_time: "09:00",
    business_end_time: "18:00",
    slot_interval_minutes: "30",
    recurring_closed_days: [],
    closed_dates: [],
    facebook_url: "",
    youtube_url: "",
    instagram_url: "",
    tiktok_url: "",
  });

  const handleSubmit = () => {
    post(route("admin.vendors.store"), {
      onSuccess: () => {
        toast.success("Vendor created");
        onClose();
      },
    });
  };

  return (
    <SlideOver
      eyebrow="Vendors"
      title="New Vendor"
      subtitle="Create a vendor account and store profile."
      width={600}
      onClose={onClose}
      footer={
        <SlideOverActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          processing={processing}
          submitLabel="Create Vendor"
        />
      }
    >
      <VendorFormFields data={data} set={set} errors={errors} types={types} statuses={statuses} showPassword />
    </SlideOver>
  );
}

export default function VendorsIndex({ vendors, filters, statuses, types }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    router.delete(route("admin.vendors.destroy", deleteTarget.user_id), {
      preserveScroll: true,
      onSuccess: () => toast.success("Vendor deleted"),
      onError: () => toast.error("Failed to delete vendor"),
      onFinish: () => setDeleteTarget(null),
    });
  };

  return (
    <AdminLayout>
      <Head title="Vendors" />
      {showModal && (
        <CreateModal onClose={() => setShowModal(false)} statuses={statuses} types={types} />
      )}

      {deleteTarget && (
        <ConfirmModal
          title={`Delete "${deleteTarget.store_name}"?`}
          description="This permanently deletes the vendor and their user account. This action cannot be undone."
          confirmLabel="Delete Vendor"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <AdminPageHeader
        eyebrow="Marketplace"
        title="Vendors"
        meta={`${vendors.data.length} records shown`}
        action={
          <AdminBtn variant="accent" onClick={() => setShowModal(true)}>
            <Icons.Plus />
            New Vendor
          </AdminBtn>
        }
      />

      <FilterBar
        routeName="admin.vendors.index"
        filters={filters}
        fields={[
          { key: "search", placeholder: "Search store or email…", flex: true },
          { key: "status", type: "select", placeholder: "All statuses", options: statuses.map((s) => ({ value: s, label: s })) },
          { key: "type", type: "select", placeholder: "All types", options: types.map((t) => ({ value: t, label: t })) },
        ]}
      />

      <AdminTable headers={["Store", "Email", "Type", "Products", "Booking Fee", "Status", "Created", "Actions"]} empty="✦ No vendors found">
        {vendors.data.map((v) => (
          <Tr key={v.user_id}>
            <Td>
              <span style={{ fontWeight: 600, color: C.amber }}>{v.store_name}</span>
            </Td>
            <Td muted>{v.email}</Td>
            <Td><StatusBadge status={v.vendor_type} /></Td>
            <Td muted>{v.products_count}</Td>
            <Td>
              <span style={{ color: C.amber, fontWeight: 500 }}>A${v.booking_fee}</span>
            </Td>
            <Td><StatusDropdown vendor={v} /></Td>
            <Td muted>{v.created_at}</Td>
            <Td>
              <div style={{ display: "flex", gap: 4 }}>
                <ActionBtn variant="edit" title="Edit" as={Link} href={route("admin.vendors.edit", v.user_id)}>
                  <Icons.Edit />
                </ActionBtn>
                <ActionBtn variant="delete" title="Delete" onClick={() => setDeleteTarget(v)}>
                  <Icons.Delete />
                </ActionBtn>
              </div>
            </Td>
          </Tr>
        ))}
      </AdminTable>

      <Pagination links={vendors.links} />
    </AdminLayout>
  );
}
