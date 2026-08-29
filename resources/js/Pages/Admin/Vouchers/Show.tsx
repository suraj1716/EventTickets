import { Head, Link, router } from "@inertiajs/react";
import { toast } from "react-toastify";
import AdminLayout from "../AdminLayout";
import { StatusBadge, fontDisplay, fontBody, C } from "../../../Components/Admin/AdminComponents";

type Props = {
  voucher: {
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
    created_at: string;
    gifted_to_email: string | null;
    purchased_by: { id: number; name: string; email: string } | null;
  };
};

export default function VoucherShow({ voucher }: Props) {
  const handleToggle = () => {
    router.patch(route("admin.vouchers.toggle", voucher.id), {}, {
      preserveScroll: true,
      onSuccess: () => toast.success("Voucher updated"),
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this voucher permanently?")) return;
    router.delete(route("admin.vouchers.destroy", voucher.id), {
      onSuccess: () => toast.success("Voucher deleted"),
      onError: () => toast.error("Failed"),
    });
  };

  const sectionStyle: React.CSSProperties = {
    background: `${C.surface}`,
    border: `1px solid ${C.border}`,
    marginBottom: "24px",
  };
  const sectionHead: React.CSSProperties = {
    padding: "16px 32px",
    borderBottom: `1px solid ${C.border}`,
    fontFamily: `${fontBody}`, fontSize: "11px",
    letterSpacing: "0.15em", textTransform: "uppercase",
    color: `${C.textFaint}`, fontWeight: 500,
  };
  const sectionBody: React.CSSProperties = { padding: "32px" };
  const row: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "160px 1fr",
    gap: "8px", paddingBottom: "8px",
    borderBottom: `1px solid ${C.border}`, marginBottom: "8px",
  };
  const label: React.CSSProperties = {
    fontFamily: `${fontBody}`, fontSize: "11px",
    letterSpacing: "0.1em", textTransform: "uppercase", color: `${C.textFaint}`,
  };
  const value: React.CSSProperties = {
    fontFamily: `${fontBody}`, fontSize: "13px", color: `${C.text}`,
  };
  const btnStyle = (color: string): React.CSSProperties => ({
    background: "transparent", border: `1px solid ${color}`, color,
    fontFamily: `${fontBody}`, fontSize: "11px",
    letterSpacing: "0.1em", textTransform: "uppercase",
    padding: "0.6rem 1.25rem", cursor: "pointer", textDecoration: "none",
    display: "inline-block",
  });

  return (
    <AdminLayout>
      <Head title={`Voucher ${voucher.code}`} />

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "48px" }}>
        <div>
          <Link href={route("admin.vouchers.index")} style={{ fontFamily: `${fontBody}`, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: `${C.textFaint}`, textDecoration: "none", display: "inline-block", marginBottom: "8px" }}>
            ← Vouchers
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <h1 style={{ fontFamily: `${fontDisplay}`, fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 300, color: `${C.text}`, margin: 0, letterSpacing: "0.05em" }}>
              {voucher.code}
            </h1>
            <StatusBadge status={voucher.type} />
            <StatusBadge status={voucher.active ? "approved" : "rejected"} />
          </div>
          <span style={{ fontFamily: `${fontBody}`, fontSize: "11px", color: `${C.textFaint}` }}>
            Created {voucher.created_at}
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href={route("admin.vouchers.edit", voucher.id)} style={btnStyle(`${C.amber}`)}>Edit</Link>
          <button onClick={handleToggle} style={btnStyle(voucher.active ? `${C.amber}` : `${C.success}`)}>
            {voucher.active ? "Deactivate" : "Activate"}
          </button>
          <button onClick={handleDelete} style={btnStyle(`${C.error}`)}>Delete</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" }}>
        <div>
          <div style={sectionStyle}>
            <div style={sectionHead}>Voucher Details</div>
            <div style={sectionBody}>
              <div style={row}>
                <span style={label}>Code</span>
                <span style={{ ...value, fontWeight: 600, letterSpacing: "0.1em", color: `${C.amber}` }}>{voucher.code}</span>
              </div>
              <div style={row}>
                <span style={label}>Type</span>
                <StatusBadge status={voucher.type} />
              </div>
              <div style={row}>
                <span style={label}>Discount Type</span>
                <span style={value}>{voucher.discount_type}</span>
              </div>
              <div style={row}>
                <span style={label}>Amount</span>
                <span style={{ ...value, color: `${C.amber}`, fontWeight: 500 }}>
                  {voucher.discount_type === "percent" ? `${voucher.amount}%` : `A$${voucher.amount}`}
                </span>
              </div>
              {voucher.remaining_amount !== null && (
                <div style={row}>
                  <span style={label}>Remaining</span>
                  <span style={value}>A${voucher.remaining_amount}</span>
                </div>
              )}
              <div style={row}>
                <span style={label}>Uses</span>
                <span style={value}>{voucher.used_count}{voucher.max_uses ? ` / ${voucher.max_uses}` : " (unlimited)"}</span>
              </div>
              <div style={row}>
                <span style={label}>Expires</span>
                <span style={value}>{voucher.expires_at ?? "Never"}</span>
              </div>
              <div style={row}>
                <span style={label}>Status</span>
                <StatusBadge status={voucher.active ? "approved" : "rejected"} />
              </div>
              {voucher.gifted_to_email && (
                <div style={{ ...row, borderBottom: "none", marginBottom: 0 }}>
                  <span style={label}>Gifted To</span>
                  <span style={value}>{voucher.gifted_to_email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: purchased by */}
        {voucher.purchased_by && (
          <div style={sectionStyle}>
            <div style={sectionHead}>Purchased By</div>
            <div style={sectionBody}>
              <div style={row}>
                <span style={label}>Name</span>
                <span style={value}>{voucher.purchased_by.name}</span>
              </div>
              <div style={{ ...row, borderBottom: "none", marginBottom: 0 }}>
                <span style={label}>Email</span>
                <span style={value}>{voucher.purchased_by.email}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
