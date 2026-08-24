import { Head, useForm, Link } from "@inertiajs/react";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import AdminLayout from "../AdminLayout";
import { AdminPageHeader } from "../../../Components/Admin/AdminComponents";

type VendorForm = {
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

type Props = {
  vendor: VendorForm & { user_id: number };
  types: string[];
  statuses: string[];
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
const sectionStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  padding: "var(--space-xl)",
  marginBottom: "var(--space-lg)",
};
const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--text-lg)",
  fontWeight: 400,
  color: "var(--color-text)",
  marginBottom: "var(--space-lg)",
};

export default function VendorEdit({ vendor, types, statuses }: Props) {
  const { data, setData, put, processing, errors } = useForm<VendorForm>({
    name: vendor.name ?? "",
    email: vendor.email ?? "",
    phone: vendor.phone ?? "",
    store_name: vendor.store_name ?? "",
    store_address: vendor.store_address ?? "",
    vendor_type: vendor.vendor_type ?? types[0],
    booking_fee: vendor.booking_fee ?? "",
    status: vendor.status ?? statuses[0],
    business_start_time: vendor.business_start_time?.slice(0, 5) ?? "09:00",
    business_end_time: vendor.business_end_time?.slice(0, 5) ?? "18:00",
    slot_interval_minutes: vendor.slot_interval_minutes ?? 30,
    recurring_closed_days: Array.isArray(vendor.recurring_closed_days)
      ? vendor.recurring_closed_days
      : [],
    closed_dates: Array.isArray(vendor.closed_dates) ? vendor.closed_dates : [],
    facebook_url: vendor.facebook_url ?? "",
    youtube_url: vendor.youtube_url ?? "",

    instagram_url: vendor.instagram_url ?? "",
    tiktok_url: vendor.tiktok_url ?? "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route("admin.vendors.update", vendor.user_id), {
      onSuccess: () => toast.success("Vendor updated"),
      onError: () => toast.error("Validation failed"),
    });
  };

  const toggleDay = (idx: number) => {
    setData(
      "recurring_closed_days",
      data.recurring_closed_days.includes(idx)
        ? data.recurring_closed_days.filter((d) => d !== idx)
        : [...data.recurring_closed_days, idx],
    );
  };

  const addClosedDate = (date: string) => {
    if (!date || data.closed_dates.includes(date)) return;
    setData("closed_dates", [...data.closed_dates, date].sort());
  };

  const removeClosedDate = (date: string) => {
    setData(
      "closed_dates",
      data.closed_dates.filter((d) => d !== date),
    );
  };

  return (
    <AdminLayout>
      <Head title={`Edit Vendor — ${vendor.store_name}`} />

      <AdminPageHeader
        eyebrow="Manage"
        title={`Edit ${vendor.store_name}`}
        action={
          <Link
            href={route("admin.vendors.index")}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              textDecoration: "none",
            }}
          >
            ← Back to Vendors
          </Link>
        }
      />

      <form onSubmit={submit} style={{ maxWidth: 720 }}>
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Owner Account</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "var(--space-md)",
            }}
          >
            <div>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
                style={inputStyle}
              />
              {errors.name && (
                <div
                  style={{
                    color: "var(--color-error)",
                    fontSize: "var(--text-xs)",
                    marginTop: 4,
                  }}
                >
                  {errors.name}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
                style={inputStyle}
              />
              {errors.email && (
                <div
                  style={{
                    color: "var(--color-error)",
                    fontSize: "var(--text-xs)",
                    marginTop: 4,
                  }}
                >
                  {errors.email}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => setData("phone", e.target.value)}
                style={inputStyle}
              />
              {errors.phone && (
                <div
                  style={{
                    color: "var(--color-error)",
                    fontSize: "var(--text-xs)",
                    marginTop: 4,
                  }}
                >
                  {errors.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Store Details</div>
          <div style={{ marginBottom: "var(--space-md)" }}>
            <label style={labelStyle}>Store Name</label>
            <input
              type="text"
              value={data.store_name}
              onChange={(e) => setData("store_name", e.target.value)}
              style={inputStyle}
            />
            {errors.store_name && (
              <div
                style={{
                  color: "var(--color-error)",
                  fontSize: "var(--text-xs)",
                  marginTop: 4,
                }}
              >
                {errors.store_name}
              </div>
            )}
          </div>
          <div style={{ marginBottom: "var(--space-md)" }}>
            <label style={labelStyle}>Store Address</label>
            <input
              type="text"
              value={data.store_address}
              onChange={(e) => setData("store_address", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: "var(--space-md)" }}>
            <label style={labelStyle}>Facebook Link</label>
            <input
              type="text"
              value={data.facebook_url}
              onChange={(e) => setData("facebook_url", e.target.value)}
              style={inputStyle}
            />
          </div>
            <div style={{ marginBottom: "var(--space-md)" }}>
            <label style={labelStyle}>Youtube Link</label>
            <input
              type="text"
              value={data.youtube_url}
              onChange={(e) => setData("youtube_url", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: "var(--space-md)" }}>
            <label style={labelStyle}>Instagram Link</label>
            <input
              type="text"
              value={data.instagram_url}
              onChange={(e) => setData("instagram_url", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: "var(--space-md)" }}>
            <label style={labelStyle}>TikTok Link</label>
            <input
              type="text"
              value={data.tiktok_url}
              onChange={(e) => setData("tiktok_url", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "var(--space-md)",
            }}
          >
            <div>
              <label style={labelStyle}>Vendor Type</label>
              <select
                value={data.vendor_type}
                onChange={(e) => setData("vendor_type", e.target.value)}
                style={inputStyle}
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Booking Fee</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={data.booking_fee}
                onChange={(e) => setData("booking_fee", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={data.status}
                onChange={(e) => setData("status", e.target.value)}
                style={inputStyle}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Business Hours</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "var(--space-md)",
            }}
          >
            <div>
              <label style={labelStyle}>Opens</label>
              <input
                type="time"
                value={data.business_start_time}
                onChange={(e) => setData("business_start_time", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Closes</label>
              <input
                type="time"
                value={data.business_end_time}
                onChange={(e) => setData("business_end_time", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Slot Interval (min)</label>
              <input
                type="number"
                min="5"
                step="5"
                value={data.slot_interval_minutes}
                onChange={(e) =>
                  setData("slot_interval_minutes", e.target.value)
                }
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: "var(--space-lg)" }}>
            <label style={labelStyle}>Recurring Closed Days</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DAYS.map((label, idx) => {
                const active = data.recurring_closed_days.includes(idx);
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

          <div style={{ marginTop: "var(--space-lg)" }}>
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
              {data.closed_dates.map((d) => (
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
              {data.closed_dates.length === 0 && (
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
        </div>

        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <Link
            href={route("admin.vendors.index")}
            style={{
              padding: "0.75rem 1.5rem",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "transparent",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
              textDecoration: "none",
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={processing}
            style={{
              padding: "0.75rem 2rem",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "var(--color-primary)",
              color: "#fff",
              border: "none",
              cursor: processing ? "default" : "pointer",
              opacity: processing ? 0.6 : 1,
            }}
          >
            {processing ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
