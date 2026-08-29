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
import {
  useAdminForm,
  Field,
  AdminInput,
  AdminSelect,
} from "../../../Components/Admin/useAdminForm";

type Voucher = {
  id: number;
  code: string;
  type: string;
  discount_type: string;
  amount: number;
  remaining_amount: number | null;
  used_count: number;
  max_uses: number | null;
  active: boolean;
  expires_at: string | null;
  purchased_by: string;
};

type Props = {
  vouchers: { data: Voucher[]; links: any[] };
  filters: Record<string, string>;
};

function CreateModal({ onClose }: { onClose: () => void }) {
  const { data, set, errors, processing, post } = useAdminForm({
    code: "",
    type: "promo",
    discount_type: "fixed",
    amount: "",
    max_uses: "",
    expires_at: "",
  });

  const handleSubmit = () => {
    post(route("admin.vouchers.store"), {
      onSuccess: () => {
        toast.success("Voucher created");
        onClose();
      },
    });
  };

  return (
    <SlideOver
      eyebrow="Vouchers"
      title="New Voucher"
      onClose={onClose}
      footer={
        <SlideOverActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          processing={processing}
          submitLabel="Create Voucher"
        />
      }
    >
      <Field label="Code" error={errors.code} help="Auto-generated if left blank">
        <AdminInput
          type="text"
          value={data.code}
          onChange={(e) => set("code", e.target.value)}
          placeholder="Auto-generated if blank"
          error={!!errors.code}
          autoFocus
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Type" error={errors.type}>
          <AdminSelect value={data.type} onChange={(e) => set("type", e.target.value)} error={!!errors.type}>
            <option value="promo">Promo Code</option>
            <option value="gift">Gift Card</option>
          </AdminSelect>
        </Field>
        <Field label="Discount Type" error={errors.discount_type}>
          <AdminSelect
            value={data.discount_type}
            onChange={(e) => set("discount_type", e.target.value)}
            error={!!errors.discount_type}
          >
            <option value="fixed">Fixed ($)</option>
            <option value="percent">Percent (%)</option>
          </AdminSelect>
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Amount" required error={errors.amount}>
          <AdminInput
            type="number"
            value={data.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="0.00"
            min={0}
            step="0.01"
            error={!!errors.amount}
          />
        </Field>
        <Field label="Max Uses" error={errors.max_uses}>
          <AdminInput
            type="number"
            value={data.max_uses}
            onChange={(e) => set("max_uses", e.target.value)}
            placeholder="Unlimited"
            min={1}
            error={!!errors.max_uses}
          />
        </Field>
      </div>

      <Field label="Expires At" error={errors.expires_at}>
        <AdminInput
          type="date"
          value={data.expires_at}
          onChange={(e) => set("expires_at", e.target.value)}
          error={!!errors.expires_at}
        />
      </Field>
    </SlideOver>
  );
}

export default function VouchersIndex({ vouchers, filters }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);

  const handleToggle = (id: number) => {
    router.patch(
      route("admin.vouchers.toggle", id),
      {},
      {
        preserveScroll: true,
        onSuccess: () => toast.success("Voucher status updated"),
        onError: () => toast.error("Failed"),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    router.delete(route("admin.vouchers.destroy", deleteTarget.id), {
      preserveScroll: true,
      onSuccess: () => toast.success("Voucher deleted"),
      onError: () => toast.error("Failed to delete voucher"),
      onFinish: () => setDeleteTarget(null),
    });
  };

  return (
    <AdminLayout>
      <Head title="Vouchers" />
      {showModal && <CreateModal onClose={() => setShowModal(false)} />}

      {deleteTarget && (
        <ConfirmModal
          title={`Delete "${deleteTarget.code}"?`}
          description="This will permanently remove the voucher. This action cannot be undone."
          confirmLabel="Delete Voucher"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <AdminPageHeader
        eyebrow="Sales"
        title="Vouchers"
        meta={`${vouchers.data.length} records shown`}
        action={
          <AdminBtn variant="accent" onClick={() => setShowModal(true)}>
            <Icons.Plus />
            New Voucher
          </AdminBtn>
        }
      />

      <FilterBar
        routeName="admin.vouchers.index"
        filters={filters}
        fields={[
          { key: "search", placeholder: "Search code…", flex: true },
          {
            key: "type",
            type: "select",
            placeholder: "All types",
            options: [
              { value: "gift", label: "Gift" },
              { value: "promo", label: "Promo" },
            ],
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
          "#",
          "Code",
          "Type",
          "Amount",
          "Remaining",
          "Used",
          "Max Uses",
          "Status",
          "Expires",
          "Purchased By",
          "Actions",
        ]}
        empty="✦ No vouchers found"
      >
        {vouchers.data.map((v) => (
          <Tr key={v.id}>
            <Td muted>{v.id}</Td>
            <Td>
              <Link
                href={route("admin.vouchers.show", v.id)}
                style={{ fontWeight: 600, color: C.amber, textDecoration: "none" }}
              >
                {v.code}
              </Link>
            </Td>
            <Td>
              <StatusBadge status={v.type} />
            </Td>
            <Td>
              <span style={{ color: C.amber, fontWeight: 500 }}>
                {v.discount_type === "percent" ? `${v.amount}%` : `A$${v.amount}`}
              </span>
            </Td>
            <Td muted>{v.remaining_amount !== null ? `A$${v.remaining_amount}` : "—"}</Td>
            <Td muted>{v.used_count}</Td>
            <Td muted>{v.max_uses ?? "Unlimited"}</Td>
            <Td>
              <button
                onClick={() => handleToggle(v.id)}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                <StatusBadge status={v.active ? "active" : "inactive"} />
              </button>
            </Td>
            <Td muted>{v.expires_at ?? "Never"}</Td>
            <Td muted>{v.purchased_by}</Td>
            <Td>
              <div style={{ display: "flex", gap: 4 }}>
                <ActionBtn variant="edit" title="Edit" as="a" href={route("admin.vouchers.edit", v.id)}>
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

      <Pagination links={vouchers.links} />
    </AdminLayout>
  );
}
