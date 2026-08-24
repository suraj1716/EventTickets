import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../AdminLayout";
import {
  ActionBtn,
  AdminPageHeader,
  AdminTable,
  FilterBar,
  Icons,
  Pagination,
  StatusBadge,
  Td,
} from "../../../Components/Admin/AdminComponents";

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

const btnStyle = (color = "var(--color-primary)"): React.CSSProperties => ({
  background: "transparent",
  border: `1px solid ${color}`,
  color,
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-xs)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "4px 12px",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
});

function CreateModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    code: "",
    type: "promo",
    discount_type: "fixed",
    amount: "",
    max_uses: "",
    expires_at: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(route("admin.vouchers.store"), form as any, {
      onSuccess: () => {
        toast.success("Voucher created");
        onClose();
      },
      onError: () => toast.error("Validation failed"),
    });
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
          width: 480,
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
            Create Voucher
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-light)",
              fontSize: "1.1rem",
            }}
          >
            ✕
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
            <label style={labelStyle}>Code</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Auto-generated if blank"
              style={inputStyle}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-md)",
            }}
          >
            <div>
              <label style={labelStyle}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={inputStyle}
              >
                <option value="promo">Promo Code</option>
                <option value="gift">Gift Card</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Discount Type</label>
              <select
                value={form.discount_type}
                onChange={(e) =>
                  setForm({ ...form, discount_type: e.target.value })
                }
                style={inputStyle}
              >
                <option value="fixed">Fixed ($)</option>
                <option value="percent">Percent (%)</option>
              </select>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-md)",
            }}
          >
            <div>
              <label style={labelStyle}>Amount</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Max Uses</label>
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                placeholder="Unlimited"
                min="1"
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Expires At</label>
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: "var(--space-sm)",
              paddingTop: "var(--space-sm)",
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
              Create Voucher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VouchersIndex({ vouchers, filters }: Props) {
  const [showModal, setShowModal] = useState(false);

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

  const handleDelete = (id: number) => {
    if (!confirm("Delete this voucher permanently?")) return;
    router.delete(route("admin.vouchers.destroy", id), {
      preserveScroll: true,
      onSuccess: () => toast.success("Voucher deleted"),
      onError: () => toast.error("Failed"),
    });
  };

  return (
    <AdminLayout>
      <Head title="Admin — Vouchers" />
      {showModal && <CreateModal onClose={() => setShowModal(false)} />}

      <AdminPageHeader
        eyebrow="Manage"
        title="Vouchers"
        action={
          <button
            onClick={() => setShowModal(true)}
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
            + Create Voucher
          </button>
        }
      />

      <FilterBar
        routeName="admin.vouchers.index"
        filters={filters}
        fields={[
          { key: "search", placeholder: "Search code…" },
          {
            key: "type",
            type: "select",
            placeholder: "All types",
            options: [
              { value: "gift", label: "gift" },
              { value: "promo", label: "promo" },
            ],
          },
          {
            key: "active",
            type: "select",
            placeholder: "All statuses",
            options: [
              { value: "1", label: "active" },
              { value: "0", label: "inactive" },
            ],
          },
        ]}
      />

      <AdminTable
        headers={[
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
      >
        {vouchers.data.map((v) => (
          <tr key={v.id}>
            <Td>
              <Link
                href={route("admin.vouchers.show", v.id)}
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  textDecoration: "none",
                }}
              >
                {v.code}
              </Link>
            </Td>
            <Td>
              <StatusBadge status={v.type} />
            </Td>
            <Td>
              <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                {v.discount_type === "percent"
                  ? `${v.amount}%`
                  : `A$${v.amount}`}
              </span>
            </Td>
            <Td muted>
              {v.remaining_amount !== null ? `A$${v.remaining_amount}` : "—"}
            </Td>
            <Td muted>{v.used_count}</Td>
            <Td muted>{v.max_uses ?? "Unlimited"}</Td>
            <Td>
              <button
                onClick={() => handleToggle(v.id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <StatusBadge status={v.active ? "active" : "inactive"} />
              </button>
            </Td>
            <Td muted>{v.expires_at ?? "Never"}</Td>
            <Td muted>{v.purchased_by}</Td>
            <Td>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn
                  variant="edit"
                  title="Edit"
                  as="a"
                  href={route("admin.vouchers.edit", v.id)}
                >
                  <Icons.Edit />
                </ActionBtn>

                <ActionBtn
                  variant="delete"
                  title="Delete"
                  onClick={() => handleDelete(v.id)}
                >
                  <Icons.Delete />
                </ActionBtn>
              </div>
            </Td>
          </tr>
        ))}
      </AdminTable>

      <Pagination links={vouchers.links} />
    </AdminLayout>
  );
}
