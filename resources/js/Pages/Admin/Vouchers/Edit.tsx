import { Head, Link, useForm } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";

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
    width: "100%", padding: "0.75rem 1rem",
    fontFamily: "var(--font-body)", fontSize: "var(--text-sm)",
    color: "var(--color-text)", background: "var(--color-bg)",
    border: "1px solid var(--color-border)", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)",
    fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "var(--color-text-muted)", marginBottom: "var(--space-xs)",
  };
  const errStyle: React.CSSProperties = {
    color: "var(--color-error)", fontSize: "var(--text-xs)",
    marginTop: 4, fontFamily: "var(--font-body)",
  };
  const sectionStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    marginBottom: "var(--space-lg)",
  };
  const sectionHead: React.CSSProperties = {
    padding: "var(--space-md) var(--space-xl)",
    borderBottom: "1px solid var(--color-border)",
    fontFamily: "var(--font-body)", fontSize: "var(--text-xs)",
    letterSpacing: "0.15em", textTransform: "uppercase",
    color: "var(--color-text-light)", fontWeight: 500,
  };

  return (
    <AdminLayout>
      <Head title={`Edit Voucher ${voucher.code}`} />

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)", marginBottom: "var(--space-2xl)" }}>
        <Link href={route("admin.vouchers.show", voucher.id)} style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-light)", textDecoration: "none" }}>
          ← {voucher.code}
        </Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 300, color: "var(--color-text)", margin: 0 }}>
          Edit Voucher
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "var(--space-lg)", alignItems: "start" }}>

          {/* Left */}
          <div>
            <div style={sectionStyle}>
              <div style={sectionHead}>Voucher Details</div>
              <div style={{ padding: "var(--space-xl)", display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>

                <div>
                  <label style={labelStyle}>Code</label>
                  <input type="text" value={data.code} onChange={e => setData("code", e.target.value)} style={inputStyle} />
                  {errors.code && <p style={errStyle}>{errors.code}</p>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
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
              <div style={{ padding: "var(--space-xl)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
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

            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <Link
                href={route("admin.vouchers.show", voucher.id)}
                style={{ flex: 1, padding: "0.75rem", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block" }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                style={{ flex: 2, padding: "0.75rem", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", background: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer" }}
              >
                {processing ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
