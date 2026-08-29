import React from "react";
import { C, fontBody } from "../../../Components/Admin/AdminComponents";
import {
  Field,
  AdminInput,
  AdminSelect,
} from "../../../Components/Admin/useAdminForm";

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type VendorFormData = {
  name: string;
  email: string;
  phone: string;
  password?: string;
  store_name: string;
  store_address: string;
  vendor_type: string;
  booking_fee: string;
  status: string;
  business_start_time: string;
  business_end_time: string;
  slot_interval_minutes: string | number;
  recurring_closed_days: number[];
  closed_dates: string[];
  facebook_url: string;
  youtube_url: string;
  instagram_url: string;
  tiktok_url: string;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "block",
        fontFamily: fontBody,
        fontSize: 10,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: C.textFaint,
        margin: "4px 0 12px",
      }}
    >
      {children}
    </span>
  );
}

export function VendorFormFields<T extends VendorFormData>({
  data,
  set,
  errors,
  types,
  statuses,
  showPassword,
}: {
  data: T;
  set: <K extends keyof T>(key: K, value: T[K]) => void;
  errors: Partial<Record<string, string>>;
  types: string[];
  statuses: string[];
  showPassword?: boolean;
}) {
  const toggleDay = (idx: number) => {
    set(
      "recurring_closed_days",
      (data.recurring_closed_days.includes(idx)
        ? data.recurring_closed_days.filter((d) => d !== idx)
        : [...data.recurring_closed_days, idx]) as T["recurring_closed_days"],
    );
  };

  const addClosedDate = (date: string) => {
    if (!date || data.closed_dates.includes(date)) return;
    set("closed_dates", [...data.closed_dates, date].sort() as T["closed_dates"]);
  };

  const removeClosedDate = (date: string) => {
    set("closed_dates", data.closed_dates.filter((d) => d !== date) as T["closed_dates"]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <SectionLabel>Owner Account</SectionLabel>

      <Field label="Owner Name" required error={errors.name}>
        <AdminInput type="text" value={data.name} onChange={(e) => set("name", e.target.value as T["name"])} placeholder="Full name" error={!!errors.name} autoFocus />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Email" required error={errors.email}>
          <AdminInput type="email" value={data.email} onChange={(e) => set("email", e.target.value as T["email"])} placeholder="vendor@example.com" error={!!errors.email} />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <AdminInput type="tel" value={data.phone} onChange={(e) => set("phone", e.target.value as T["phone"])} placeholder="0400 000 000" error={!!errors.phone} />
        </Field>
      </div>

      {showPassword && (
        <Field label="Password" required error={errors.password}>
          <AdminInput type="password" value={data.password ?? ""} onChange={(e) => set("password", e.target.value as T["password"])} placeholder="Min 8 characters" error={!!errors.password} />
        </Field>
      )}

      <div style={{ borderTop: `1px dashed ${C.borderDashed}`, paddingTop: 16 }}>
        <SectionLabel>Store Details</SectionLabel>

        <Field label="Store Name" required error={errors.store_name}>
          <AdminInput type="text" value={data.store_name} onChange={(e) => set("store_name", e.target.value as T["store_name"])} placeholder="e.g. Glamour Hair Salon" error={!!errors.store_name} />
        </Field>

        <Field label="Store Address" error={errors.store_address}>
          <AdminInput type="text" value={data.store_address} onChange={(e) => set("store_address", e.target.value as T["store_address"])} placeholder="123 George Street, Sydney NSW" error={!!errors.store_address} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Vendor Type" error={errors.vendor_type}>
            <AdminSelect value={data.vendor_type} onChange={(e) => set("vendor_type", e.target.value as T["vendor_type"])} error={!!errors.vendor_type}>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </AdminSelect>
          </Field>
          <Field label="Status" error={errors.status}>
            <AdminSelect value={data.status} onChange={(e) => set("status", e.target.value as T["status"])} error={!!errors.status}>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </AdminSelect>
          </Field>
        </div>

        <Field label="Booking Fee" required error={errors.booking_fee}>
          <AdminInput type="number" min={0} step="0.01" value={data.booking_fee} onChange={(e) => set("booking_fee", e.target.value as T["booking_fee"])} placeholder="0.00" error={!!errors.booking_fee} />
        </Field>
      </div>

      <div style={{ borderTop: `1px dashed ${C.borderDashed}`, paddingTop: 16 }}>
        <SectionLabel>Business Hours</SectionLabel>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Opens" error={errors.business_start_time}>
            <AdminInput type="time" value={data.business_start_time} onChange={(e) => set("business_start_time", e.target.value as T["business_start_time"])} error={!!errors.business_start_time} />
          </Field>
          <Field label="Closes" error={errors.business_end_time}>
            <AdminInput type="time" value={data.business_end_time} onChange={(e) => set("business_end_time", e.target.value as T["business_end_time"])} error={!!errors.business_end_time} />
          </Field>
        </div>

        <Field label="Slot Interval (minutes)" error={errors.slot_interval_minutes}>
          <AdminInput type="number" min={5} step={5} value={data.slot_interval_minutes} onChange={(e) => set("slot_interval_minutes", e.target.value as T["slot_interval_minutes"])} placeholder="30" error={!!errors.slot_interval_minutes} />
        </Field>

        <Field label="Recurring Closed Days">
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
                    fontFamily: fontBody,
                    fontSize: 11,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    borderRadius: 999,
                    border: `1px solid ${active ? C.error : C.border}`,
                    background: active ? C.error : "transparent",
                    color: active ? C.textInverse : C.textMuted,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="One-off Closed Dates">
          <AdminInput
            type="date"
            onChange={(e) => {
              addClosedDate(e.target.value);
              e.target.value = "";
            }}
            style={{ marginBottom: 10 }}
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
                  border: `1px solid ${C.border}`,
                  borderRadius: 999,
                  fontFamily: fontBody,
                  fontSize: 11,
                  color: C.text,
                }}
              >
                {d}
                <button
                  type="button"
                  onClick={() => removeClosedDate(d)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.error, display: "flex", alignItems: "center", padding: 0 }}
                >
                  ×
                </button>
              </span>
            ))}
            {data.closed_dates.length === 0 && (
              <span style={{ fontFamily: fontBody, fontSize: 11, color: C.textFaint }}>No closed dates set</span>
            )}
          </div>
        </Field>
      </div>

      <div style={{ borderTop: `1px dashed ${C.borderDashed}`, paddingTop: 16 }}>
        <SectionLabel>Social Links</SectionLabel>
        <Field label="Facebook" error={errors.facebook_url}>
          <AdminInput type="url" value={data.facebook_url} onChange={(e) => set("facebook_url", e.target.value as T["facebook_url"])} placeholder="https://facebook.com/yourpage" error={!!errors.facebook_url} />
        </Field>
        <Field label="YouTube" error={errors.youtube_url}>
          <AdminInput type="url" value={data.youtube_url} onChange={(e) => set("youtube_url", e.target.value as T["youtube_url"])} placeholder="https://youtube.com/yourpage" error={!!errors.youtube_url} />
        </Field>
        <Field label="Instagram" error={errors.instagram_url}>
          <AdminInput type="url" value={data.instagram_url} onChange={(e) => set("instagram_url", e.target.value as T["instagram_url"])} placeholder="https://instagram.com/yourhandle" error={!!errors.instagram_url} />
        </Field>
        <Field label="TikTok" error={errors.tiktok_url}>
          <AdminInput type="url" value={data.tiktok_url} onChange={(e) => set("tiktok_url", e.target.value as T["tiktok_url"])} placeholder="https://tiktok.com/@yourhandle" error={!!errors.tiktok_url} />
        </Field>
      </div>
    </div>
  );
}
