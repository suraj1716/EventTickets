import { Head } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  SlideOver,
  SlideOverActions,
} from "@/Components/Admin/AdminComponents";
import {
  useAdminForm,
  Field,
  AdminInput,
  AdminSelect,
  AdminCheckbox,
} from "@/Components/Admin/useAdminForm";

type VoucherProp = {
  id: number;
  code: string;
  type: string;
  discount_type: string;
  amount: number;
  max_uses: number | null;
  expires_at: string | null;
  active: boolean;
  gifted_to_email: string;
};

type Props = { voucher: VoucherProp };

export default function VoucherEdit({ voucher }: Props) {
  const showHref = route("admin.vouchers.show", voucher.id);

  const { data, set, errors, processing, put } = useAdminForm({
    code:            voucher.code,
    type:            voucher.type,
    discount_type:   voucher.discount_type,
    amount:          String(voucher.amount),
    max_uses:        voucher.max_uses ? String(voucher.max_uses) : "",
    expires_at:      voucher.expires_at ?? "",
    active:          voucher.active,
    gifted_to_email: voucher.gifted_to_email ?? "",
  });

  const handleSubmit = () => {
    put(route("admin.vouchers.update", voucher.id));
  };

  return (
    <>
      <Head title={`Edit Voucher ${voucher.code}`} />
      <AdminLayout>
        <SlideOver
          eyebrow="Vouchers"
          title={`Edit ${voucher.code}`}
          subtitle="Update this voucher's details."
          closeHref={showHref}
          footer={
            <SlideOverActions
              onCancel={() => (window.location.href = showHref)}
              onSubmit={handleSubmit}
              processing={processing}
              submitLabel="Save Changes"
            />
          }
        >
          <Field label="Code" error={errors.code}>
            <AdminInput type="text" value={data.code} onChange={(e) => set("code", e.target.value)} error={!!errors.code} autoFocus />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Type" error={errors.type}>
              <AdminSelect value={data.type} onChange={(e) => set("type", e.target.value)} error={!!errors.type}>
                <option value="promo">Promo Code</option>
                <option value="gift">Gift Card</option>
              </AdminSelect>
            </Field>
            <Field label="Discount Type" error={errors.discount_type}>
              <AdminSelect value={data.discount_type} onChange={(e) => set("discount_type", e.target.value)} error={!!errors.discount_type}>
                <option value="fixed">Fixed ($)</option>
                <option value="percent">Percent (%)</option>
              </AdminSelect>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Amount" error={errors.amount}>
              <AdminInput type="number" min={0} step="0.01" value={data.amount} onChange={(e) => set("amount", e.target.value)} error={!!errors.amount} />
            </Field>
            <Field label="Max Uses" error={errors.max_uses}>
              <AdminInput type="number" min={1} value={data.max_uses} onChange={(e) => set("max_uses", e.target.value)} placeholder="Unlimited" error={!!errors.max_uses} />
            </Field>
          </div>

          <Field label="Expires At" error={errors.expires_at}>
            <AdminInput type="date" value={data.expires_at} onChange={(e) => set("expires_at", e.target.value)} error={!!errors.expires_at} />
          </Field>

          <Field label="Gifted To Email" error={errors.gifted_to_email} help="Optional">
            <AdminInput type="email" value={data.gifted_to_email} onChange={(e) => set("gifted_to_email", e.target.value)} placeholder="recipient@example.com" error={!!errors.gifted_to_email} />
          </Field>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AdminCheckbox checked={data.active} onChange={(e) => set("active", e.target.checked)} id="voucher-active" />
            <label htmlFor="voucher-active" style={{ fontSize: 13, cursor: "pointer" }}>Active</label>
          </div>
        </SlideOver>
      </AdminLayout>
    </>
  );
}
