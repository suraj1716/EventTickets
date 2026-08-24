import { Head, Link, router } from "@inertiajs/react";
import { toast } from "react-toastify";
import AdminLayout from "../AdminLayout";
import { StatusBadge } from "../../../Components/Admin/AdminComponents";

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
  const sectionBody: React.CSSProperties = { padding: "var(--space-xl)" };
  const row: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "160px 1fr",
    gap: "var(--space-sm)", paddingBottom: "var(--space-sm)",
    borderBottom: "1px solid var(--color-border)", marginBottom: "var(--space-sm)",
  };
  const label: React.CSSProperties = {
    fontFamily: "var(--font-body)", fontSize: "var(--text-xs)",
    letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-light)",
  };
  const value: React.CSSProperties = {
    fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text)",
  };
  const btnStyle = (color: string): React.CSSProperties => ({
    background: "transparent", border: `1px solid ${color}`, color,
    fontFamily: "var(--font-body)", fontSize: "var(--text-xs)",
    letterSpacing: "0.1em", textTransform: "uppercase",
    padding: "0.6rem 1.25rem", cursor: "pointer", textDecoration: "none",
    display: "inline-block",
  });

  return (
    <AdminLayout>
      <Head title={`Voucher ${voucher.code}`} />

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "var(--space-2xl)" }}>
        <div>
          <Link href={route("admin.vouchers.index")} style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-light)", textDecoration: "none", display: "inline-block", marginBottom: "var(--space-sm)" }}>
            ← Vouchers
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 300, color: "var(--color-text)", margin: 0, letterSpacing: "0.05em" }}>
              {voucher.code}
            </h1>
            <StatusBadge status={voucher.type} />
            <StatusBadge status={voucher.active ? "approved" : "rejected"} />
          </div>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-text-light)" }}>
            Created {voucher.created_at}
          </span>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <Link href={route("admin.vouchers.edit", voucher.id)} style={btnStyle("var(--color-primary)")}>Edit</Link>
          <button onClick={handleToggle} style={btnStyle(voucher.active ? "var(--color-warning)" : "var(--color-success)")}>
            {voucher.active ? "Deactivate" : "Activate"}
          </button>
          <button onClick={handleDelete} style={btnStyle("var(--color-error)")}>Delete</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "var(--space-lg)", alignItems: "start" }}>
        <div>
          <div style={sectionStyle}>
            <div style={sectionHead}>Voucher Details</div>
            <div style={sectionBody}>
              <div style={row}>
                <span style={label}>Code</span>
                <span style={{ ...value, fontWeight: 600, letterSpacing: "0.1em", color: "var(--color-primary)" }}>{voucher.code}</span>
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
                <span style={{ ...value, color: "var(--color-primary)", fontWeight: 500 }}>
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
