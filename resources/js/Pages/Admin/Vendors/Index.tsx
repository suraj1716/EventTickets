import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import AdminLayout from "../AdminLayout";
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


const STATUS_OPTIONS = [
  { value: "active", label: "Pending" },   // enum quirk: Pending's value is 'active'
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "var(--color-text-muted)",   // grey — Pending
  approved: "var(--color-success)",
  rejected: "var(--color-error)",
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
      }
    );
  };

  return (
    <select
      value={vendor.status}
      onChange={handleChange}
      disabled={updating}
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-xs)",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        color: STATUS_COLORS[vendor.status] ?? "var(--color-text)",
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        padding: "4px 8px",
        cursor: updating ? "default" : "pointer",
        opacity: updating ? 0.6 : 1,
      }}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}


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
const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--text-base)",
  fontWeight: 400,
  color: "var(--color-text)",
  marginBottom: "var(--space-md)",
  marginTop: "var(--space-lg)",
  paddingTop: "var(--space-lg)",
  borderTop: "1px solid var(--color-border)",
};

type CreateForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  store_name: string;
  store_address: string;
  vendor_type: string;
  booking_fee: string;
  status: string;
  business_start_time: string;
  business_end_time: string;
  slot_interval_minutes: string;
  recurring_closed_days: number[];
  closed_dates: string[];
  facebook_url: string;
  youtube_url: string;

  instagram_url: string;
  tiktok_url: string;
};

function CreateModal({
  onClose,
  statuses,
  types,
}: {
  onClose: () => void;
  statuses: string[];
  types: string[];
}) {
 const [form, setForm] = useState<CreateForm>({
  name: "",
  email: "",
  phone: "",
  password: "",
  store_name: "",
  store_address: "",
  vendor_type: types[0] ?? "ecommerce",
  booking_fee: "",
  status: statuses[0] ?? "active",
  business_start_time: "",
  business_end_time: "",
  slot_interval_minutes: "",
  recurring_closed_days: [],
  closed_dates: [],
  facebook_url: "",
  youtube_url: "",

  instagram_url: "",
  tiktok_url: "",
});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(route("admin.vendors.store"), form as any, {
      onSuccess: () => {
        toast.success("Vendor created");
        onClose();
      },
      onError: () => toast.error("Validation failed"),
    });
  };

  const toggleDay = (idx: number) => {
    setForm((f) => ({
      ...f,
      recurring_closed_days: f.recurring_closed_days.includes(idx)
        ? f.recurring_closed_days.filter((d) => d !== idx)
        : [...f.recurring_closed_days, idx],
    }));
  };

  const addClosedDate = (date: string) => {
    if (!date || form.closed_dates.includes(date)) return;
    setForm((f) => ({ ...f, closed_dates: [...f.closed_dates, date].sort() }));
  };

  const removeClosedDate = (date: string) => {
    setForm((f) => ({ ...f, closed_dates: f.closed_dates.filter((d) => d !== date) }));
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
          width: 600,
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
            Create Vendor
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
          {/* ── Owner Account ───────────────────────────── */}
          <div>
            <label style={labelStyle}>Owner Name</label>
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
                placeholder="vendor@example.com"
                style={inputStyle}
                required
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
                required
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 8 characters"
              style={inputStyle}
              required
            />
          </div>

          {/* ── Store Details ───────────────────────────── */}
          <div style={sectionTitleStyle}>Store Details</div>
          <div>
            <label style={labelStyle}>Store Name</label>
            <input
              type="text"
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              placeholder="e.g. Glamour Hair Salon"
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Store Address</label>
            <input
              type="text"
              value={form.store_address}
              onChange={(e) => setForm({ ...form, store_address: e.target.value })}
              placeholder="123 George Street, Sydney NSW"
              style={inputStyle}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-md)" }}>
            <div>
              <label style={labelStyle}>Vendor Type</label>
              <select
                value={form.vendor_type}
                onChange={(e) => setForm({ ...form, vendor_type: e.target.value })}
                style={inputStyle}
              >
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Booking Fee</label>
              <input
                type="number"
                value={form.booking_fee}
                onChange={(e) => setForm({ ...form, booking_fee: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={inputStyle}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Business Hours ──────────────────────────── */}
          <div style={sectionTitleStyle}>Business Hours</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-md)" }}>
            <div>
              <label style={labelStyle}>Opens</label>
              <input
                type="time"
                value={form.business_start_time}
                onChange={(e) => setForm({ ...form, business_start_time: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Closes</label>
              <input
                type="time"
                value={form.business_end_time}
                onChange={(e) => setForm({ ...form, business_end_time: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Slot Interval (min)</label>
              <input
                type="number"
                min="5"
                step="5"
                value={form.slot_interval_minutes}
                onChange={(e) => setForm({ ...form, slot_interval_minutes: e.target.value })}
                placeholder="30"
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Recurring Closed Days</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DAYS.map((label, idx) => {
                const active = form.recurring_closed_days.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    style={{
                      padding: "6px 14px",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-xs)",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      border: `1px solid ${active ? "var(--color-error)" : "var(--color-border)"}`,
                      background: active ? "var(--color-error)" : "transparent",
                      color: active ? "#fff" : "var(--color-text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>One-off Closed Dates</label>
            <input
              type="date"
              onChange={(e) => {
                addClosedDate(e.target.value);
                e.target.value = "";
              }}
              style={{ ...inputStyle, marginBottom: "var(--space-sm)" }}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {form.closed_dates.map((d) => (
                <span
                  key={d}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    border: "1px solid var(--color-border)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text)",
                  }}
                >
                  {d}
                  <button
                    type="button"
                    onClick={() => removeClosedDate(d)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-error)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {form.closed_dates.length === 0 && (
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-light)",
                  }}
                >
                  No closed dates set
                </span>
              )}
            </div>
          </div>
{/* ── Social Links ─────────────────────────────── */}
<div style={sectionTitleStyle}>Social Links</div>
<div>
  <label style={labelStyle}>Facebook</label>
  <input
    type="url"
    value={form.facebook_url}
    onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
    placeholder="https://facebook.com/yourpage"
    style={inputStyle}
  />
</div>
<div>
  <label style={labelStyle}>Youtube</label>
  <input
    type="url"
    value={form.youtube_url}
    onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
    placeholder="https://youtube.com/yourpage"
    style={inputStyle}
  />
</div>
<div>
  <label style={labelStyle}>Instagram</label>
  <input
    type="url"
    value={form.instagram_url}
    onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
    placeholder="https://instagram.com/yourhandle"
    style={inputStyle}
  />
</div>
<div>
  <label style={labelStyle}>TikTok</label>
  <input
    type="url"
    value={form.tiktok_url}
    onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })}
    placeholder="https://tiktok.com/@yourhandle"
    style={inputStyle}
  />
</div>
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
              Create Vendor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VendorsIndex({ vendors, filters, statuses, types }: Props) {
  const [showModal, setShowModal] = useState(false);

  const handleDelete = (id: number) => {
    if (!confirm("Delete this vendor and their user account permanently?")) return;
    router.delete(route("admin.vendors.destroy", id), {
      preserveScroll: true,
      onSuccess: () => toast.success("Vendor deleted"),
      onError: () => toast.error("Failed"),
    });
  };





  return (
    <AdminLayout>
      <Head title="Admin — Vendors" />
      {showModal && (
        <CreateModal onClose={() => setShowModal(false)} statuses={statuses} types={types} />
      )}

      <AdminPageHeader
        eyebrow="Manage"
        title="Vendors"
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
            + Create Vendor
          </button>
        }
      />

      <FilterBar
        routeName="admin.vendors.index"
        filters={filters}
        fields={[
          { key: "search", placeholder: "Search store or email…" },
          { key: "status", type: "select", placeholder: "All statuses", options: statuses.map((s) => ({ value: s, label: s })) },
          { key: "type", type: "select", placeholder: "All types", options: types.map((t) => ({ value: t, label: t })) },
        ]}
      />

      <AdminTable headers={["Store", "Email", "Type", "Products", "Booking Fee", "Status", "Created", "Actions"]}>
        {vendors.data.map((v) => (
          <tr key={v.user_id}>
            <Td>
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--color-primary)" }}>
                {v.store_name}
              </span>
            </Td>
            <Td muted>{v.email}</Td>
            <Td><StatusBadge status={v.vendor_type} /></Td>
            <Td muted>{v.products_count}</Td>
            <Td>
              <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>A${v.booking_fee}</span>
            </Td>
           <Td><StatusDropdown vendor={v} /></Td>
            <Td muted>{v.created_at}</Td>
            <Td>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn variant="edit" title="Edit" as={Link} href={route("admin.vendors.edit", v.user_id)}>
                  <Icons.Edit />
                </ActionBtn>
                <ActionBtn variant="delete" title="Delete" onClick={() => handleDelete(v.user_id)}>
                  <Icons.Delete />
                </ActionBtn>
              </div>
            </Td>
          </tr>
        ))}
      </AdminTable>

      <Pagination links={vendors.links} />
    </AdminLayout>
  );
}
