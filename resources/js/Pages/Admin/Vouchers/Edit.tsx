import { Head, Link, useForm } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  AdminBtn,
  C,
  fontBody,
  fontMono,
} from "@/Components/Admin/AdminComponents";

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
  const { data, setData, put, processing, errors } = useForm({
    code:            voucher.code,
    type:            voucher.type,
    discount_type:   voucher.discount_type,
    amount:          String(voucher.amount),
    max_uses:        voucher.max_uses ? String(voucher.max_uses) : "",
    expires_at:      voucher.expires_at ?? "",
    active:          voucher.active,
    gifted_to_email: voucher.gifted_to_email ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route("admin.vouchers.update", voucher.id));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    fontFamily: fontBody, fontSize: "13px",
    color: C.text, background: C.bg,
    border: `1px solid ${C.border}`, borderRadius: "8px", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: fontMono, fontSize: "10px",
    fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
    color: C.textMuted, marginBottom: "8px",
  };
  const errStyle: React.CSSProperties = {
    color: C.error, fontSize: "12px",
    marginTop: 4, fontFamily: fontBody,
  };
  const sectionStyle: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    marginBottom: "20px",
  };
  const sectionHead: React.CSSProperties = {
    padding: "14px 20px",
    borderBottom: `1px dashed ${C.borderDashed}`,
    fontFamily: fontMono, fontSize: "10px",
    letterSpacing: "0.15em", textTransform: "uppercase",
    color: C.textMuted, fontWeight: 700,
  };

  return (
    <AdminLayout>
      <Head title={`Edit Voucher ${voucher.code}`} />

      <AdminPageHeader
        eyebrow="Admin · Vouchers"
        title="Edit Voucher"
        meta={voucher.code}
      />

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>

          {/* Left */}
          <div>
            <div style={sectionStyle}>
              <div style={sectionHead}>Voucher Details</div>
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>

                <div>
                  <label style={labelStyle}>Code</label>
                  <input type="text" value={data.code} onChange={e => setData("code", e.target.value)} style={inputStyle} />
                  {errors.code && <p style={errStyle}>{errors.code}</p>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select value={data.type} onChange={e => setData("type", e.target.value)} style={inputStyle}>
                      <option value="promo">Promo Code</option>
                      <option value="gift">Gift Card</option>
                    </select>
                    {errors.type && <p style={errStyle}>{errors.type}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Discount Type</label>
                    <select value={data.discount_type} onChange={e => setData("discount_type", e.target.value)} style={inputStyle}>
                      <option value="fixed">Fixed ($)</option>
                      <option value="percent">Percent (%)</option>
                    </select>
                    {errors.discount_type && <p style={errStyle}>{errors.discount_type}</p>}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={labelStyle}>Amount</label>
                    <input type="number" min="0" step="0.01" value={data.amount} onChange={e => setData("amount", e.target.value)} style={inputStyle} />
                    {errors.amount && <p style={errStyle}>{errors.amount}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Max Uses</label>
                    <input type="number" min="1" value={data.max_uses} onChange={e => setData("max_uses", e.target.value)} placeholder="Unlimited" style={inputStyle} />
                    {errors.max_uses && <p style={errStyle}>{errors.max_uses}</p>}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Expires At</label>
                  <input type="date" value={data.expires_at} onChange={e => setData("expires_at", e.target.value)} style={inputStyle} />
                  {errors.expires_at && <p style={errStyle}>{errors.expires_at}</p>}
                </div>

                <div>
                  <label style={labelStyle}>Gifted To Email (optional)</label>
                  <input type="email" value={data.gifted_to_email} onChange={e => setData("gifted_to_email", e.target.value)} placeholder="recipient@example.com" style={inputStyle} />
                  {errors.gifted_to_email && <p style={errStyle}>{errors.gifted_to_email}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div>
            <div style={sectionStyle}>
              <div style={sectionHead}>Status</div>
              <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    id="active"
                    type="checkbox"
                    checked={data.active}
                    onChange={e => setData("active", e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <label htmlFor="active" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>
                    Active
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <AdminBtn as={Link} href={route("admin.vouchers.show", voucher.id)} variant="ghost">
                Cancel
              </AdminBtn>
              <div style={{ flex: 1 }}>
                <button
                  type="submit"
                  disabled={processing}
                  style={{
                    width: "100%", padding: "9px 18px",
                    fontFamily: fontMono, fontSize: "11px", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    background: C.amber, color: C.textInverse,
                    border: `1px solid ${C.amber}`, borderRadius: "8px",
                    cursor: processing ? "not-allowed" : "pointer",
                    opacity: processing ? 0.6 : 1,
                  }}
                >
                  {processing ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
