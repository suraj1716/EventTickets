import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { InertiaPage } from "@/types/InertiaPage";
import { Link, useForm, usePage } from "@inertiajs/react";
import React, { useMemo, useRef } from "react";
import {
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  ChevronDown,
  Paperclip,
  X,
  Ticket as TicketIcon,
} from "lucide-react";

const C = {
  bg: "#0B0B10",
  bgAlt: "#1A1922",
  surface: "#15141B",
  surfaceWarm: "#201C14",
  border: "#26232E",
  borderDashed: "#33303C",
  text: "#F7F5F2",
  textInverse: "#0B0B10",
  textMuted: "#9C97A8",
  textFaint: "#6B6775",
  textFainter: "#565262",
  amber: "#FFB627",
  amberHover: "#ffc75c",
  amberDark: "#e2a220",
  error: "#FF6B6B",
};

interface DepartmentOption {
  id: number;
  name: string;
  slug: string;
  categories: {
    id: number;
    name: string;
    products: { id: number; title: string }[];
  }[];
}

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatTime(time?: string) {
  if (!time) return "—";
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

const Contact: InertiaPage = () => {
  const {
    departments: rawDepartments = [],
    contactReasons,
    vendor = null,
  } = usePage<PageProps>().props;

  const departments: DepartmentOption[] = useMemo(
    () =>
      rawDepartments.map((dept: any) => ({
        id: dept.id,
        name: dept.name,
        slug: dept.slug,
        categories: (dept.categories || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          products: (cat.products || []).map((prod: any) => ({
            id: prod.id,
            title: prod.title,
          })),
        })),
      })),
    [rawDepartments]
  );

  const reasonOptions = useMemo(
    () => (contactReasons as { value: string; label: string }[]) || [],
    [contactReasons]
  );

  const { data, setData, post, processing, errors, reset } = useForm({
    name: "",
    email: "",
    phone: "",
    reason: "",
    department: "",
    category: "",
    product: "",
    quantity: "",
    file: null as File | null,
    message: "",
    preferredContact: "email",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGettingQuote = data.reason === "getting_quote";

  const selectedDepartment = departments.find(
    (d) => d.id.toString() === data.department
  );
  const selectedCategory = selectedDepartment?.categories.find(
    (c) => c.id.toString() === data.category
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/contact", {
      forceFormData: true,
      preserveState: true,
      onSuccess: () => reset(),
    });
  };

  const closedDays: number[] = useMemo(
    () => (vendor?.data?.recurring_closed_days ?? []).map(Number),
    [vendor]
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500;700&family=Manrope:wght@300;400;500;600;700&display=swap');

        /*
        |------------------------------------------------------------------
        | Box Office contact page. Fully self-contained — no shared
        | Card/Button/Select/FormField/etc components — so nothing here
        | leaks into or depends on the rest of the site's design system.
        |------------------------------------------------------------------
        */
        .cf-page { min-height: 100vh; background: ${C.bg}; color: ${C.text}; font-family: 'Manrope', sans-serif; }
        .cf-page * { box-sizing: border-box; }

        /* ── hero ── */
        .cf-hero { padding: 56px 20px 40px; border-bottom: 1px dashed ${C.borderDashed}; }
        .cf-hero-inner { max-width: 1200px; margin: 0 auto; }
        .cf-back {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${C.textFaint};
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.15s ease;
        }
        .cf-back:hover { color: ${C.text}; }
        .cf-eyebrow {
          margin-top: 26px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${C.amber};
          background: rgba(255,182,39,0.1);
          border-radius: 999px;
          padding: 5px 12px;
        }
        .cf-title {
          font-family: 'Anton', sans-serif;
          text-transform: uppercase;
          font-size: clamp(2.4rem, 5vw, 3.6rem);
          line-height: 1.05;
          letter-spacing: 0.01em;
          margin: 16px 0 12px;
        }
        .cf-subtitle {
          max-width: 540px;
          font-size: 15px;
          line-height: 1.6;
          color: ${C.textMuted};
        }

        /* ── layout ── */
        .cf-body { padding: 48px 20px 80px; }
        .cf-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .cf-grid { grid-template-columns: 1fr; }
        }

        /* ── form stub ── */
        .cf-form-card {
          border-radius: 16px;
          border: 1px solid ${C.border};
          background: ${C.surface};
          overflow: hidden;
        }
        .cf-form-top { padding: 28px 28px 8px; }
        .cf-form-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${C.amber};
          margin: 0 0 8px;
        }
        .cf-form-heading {
          font-family: 'Anton', sans-serif;
          text-transform: uppercase;
          font-size: 1.6rem;
          margin: 0 0 24px;
        }

        .cf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 560px) { .cf-row { grid-template-columns: 1fr; } }

        .cf-field { margin-bottom: 20px; }
        .cf-field label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${C.textMuted};
          margin-bottom: 8px;
        }
        .cf-field input,
        .cf-field select,
        .cf-field textarea {
          width: 100%;
          background: ${C.bg};
          border: 1px solid ${C.border};
          border-radius: 8px;
          padding: 0.85rem 1rem;
          font-family: 'Manrope', sans-serif;
          font-size: 14.5px;
          color: ${C.text};
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          appearance: none;
          -webkit-appearance: none;
        }
        .cf-field input::placeholder,
        .cf-field textarea::placeholder { color: ${C.textFainter}; }
        .cf-field input:focus,
        .cf-field select:focus,
        .cf-field textarea:focus {
          border-color: ${C.amberHover};
          box-shadow: 0 0 0 3px rgba(255,182,39,0.15);
        }
        .cf-field textarea { resize: vertical; min-height: 140px; line-height: 1.6; }
        .cf-error { font-size: 11.5px; color: ${C.error}; margin-top: 6px; font-family: 'IBM Plex Mono', monospace; }

        .cf-select-wrap { position: relative; }
        .cf-select-wrap svg {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: ${C.amber};
          pointer-events: none;
        }
        .cf-select-wrap select { padding-right: 2.5rem; cursor: pointer; }
        .cf-select-wrap select option { background: ${C.bg}; color: ${C.text}; }

        /* preferred-contact pills */
        .cf-pill-group { display: flex; gap: 8px; }
        .cf-pill { flex: 1; position: relative; }
        .cf-pill input { position: absolute; opacity: 0; width: 0; height: 0; }
        .cf-pill label {
          display: block;
          text-align: center;
          margin: 0;
          padding: 0.65rem 1rem;
          border: 1px solid ${C.border};
          border-radius: 8px;
          cursor: pointer;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px !important;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${C.textMuted};
          background: ${C.bg};
          transition: all 0.15s ease;
        }
        .cf-pill input:checked + label {
          background: ${C.amber};
          border-color: ${C.amber};
          color: ${C.textInverse};
        }
        .cf-pill input:focus-visible + label { outline: 2px solid ${C.amberHover}; outline-offset: 2px; }

        /* quote section divider — echoes the ticket-stub perforation */
        .cf-perf {
          position: relative;
          height: 1px;
          border-top: 1px dashed ${C.borderDashed};
          margin: 8px 0 24px;
        }
        .cf-perf::before, .cf-perf::after {
          content: '';
          position: absolute;
          top: -9px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${C.bg};
        }
        .cf-perf::before { left: -28px; }
        .cf-perf::after { right: -28px; }
        .cf-form-top .cf-perf::before,
        .cf-form-top .cf-perf::after { background: ${C.surface}; }

        .cf-divider { display: flex; align-items: center; gap: 12px; margin: 4px 0 24px; }
        .cf-divider span {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: ${C.amber};
          font-weight: 500;
          white-space: nowrap;
        }
        .cf-divider::before, .cf-divider::after { content: ''; flex: 1; height: 1px; background: ${C.border}; }

        /* file dropzone */
        .cf-drop {
          border: 1.5px dashed ${C.borderDashed};
          border-radius: 8px;
          padding: 1.1rem;
          text-align: center;
          cursor: pointer;
          background: ${C.bg};
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .cf-drop:hover { border-color: ${C.amber}; background: ${C.bgAlt}; }
        .cf-drop input { display: none; }
        .cf-drop-text { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: ${C.textMuted}; }
        .cf-drop-text span { color: ${C.amber}; font-weight: 500; }
        .cf-drop-file {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: ${C.text};
        }
        .cf-drop-file button {
          background: none;
          border: none;
          color: ${C.textFaint};
          cursor: pointer;
          display: flex;
          padding: 2px;
        }
        .cf-drop-file button:hover { color: ${C.error}; }

        /* submit */
        .cf-submit {
          width: 100%;
          background: ${C.amber};
          color: ${C.textInverse};
          border: 1px solid ${C.amber};
          border-radius: 8px;
          padding: 1rem 1.5rem;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.05s ease;
          margin-top: 4px;
        }
        .cf-submit:hover:not(:disabled) { background: ${C.amberDark}; border-color: ${C.amberDark}; }
        .cf-submit:active:not(:disabled) { transform: translateY(1px); }
        .cf-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .cf-form-bottom { padding: 4px 28px 28px; }

        /* ── sidebar ── */
        .cf-sidebar { display: flex; flex-direction: column; gap: 20px; }

        .cf-info-card {
          border-radius: 16px;
          border: 1px solid ${C.border};
          background: ${C.surface};
          overflow: hidden;
        }
        .cf-info-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 20px;
          border-bottom: 1px dashed ${C.borderDashed};
        }
        .cf-info-header h3 {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${C.amber};
          margin: 0;
        }
        .cf-info-body { padding: 18px 20px; }

        .cf-info-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px 0;
          border-bottom: 1px dashed ${C.borderDashed};
        }
        .cf-info-row:first-child { padding-top: 0; }
        .cf-info-row:last-child { border-bottom: none; padding-bottom: 0; }
        .cf-info-icon {
          width: 34px;
          height: 34px;
          background: ${C.bgAlt};
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${C.amber};
          flex-shrink: 0;
        }
        .cf-info-content strong {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${C.textFaint};
          margin-bottom: 3px;
        }
        .cf-info-content span, .cf-info-content a {
          font-size: 13.5px;
          color: ${C.text};
          text-decoration: none;
          line-height: 1.5;
        }
        .cf-info-content a:hover { color: ${C.amberHover}; }

        .cf-social-row { display: flex; gap: 8px; padding-top: 14px; }
        .cf-social-btn {
          flex: 1;
          padding: 8px;
          border: 1px solid ${C.border};
          border-radius: 8px;
          background: ${C.bg};
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${C.textMuted};
          text-align: center;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .cf-social-btn:hover { border-color: ${C.amberHover}; color: ${C.amber}; background: ${C.surfaceWarm}; }

        .cf-hours-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 9px 20px;
          font-size: 13px;
        }
        .cf-hours-day { color: ${C.textMuted}; font-weight: 300; }
        .cf-hours-time { color: ${C.text}; font-weight: 500; text-align: right; }
        .cf-hours-closed { color: ${C.textFainter}; }

        .cf-map-card {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid ${C.border};
          height: 200px;
          filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9);
        }
        .cf-map-card iframe { display: block; }
      `}</style>

      <div className="cf-page">
        {/* Hero */}
        <div className="cf-hero">
          <div className="cf-hero-inner">
            <Link href={route("home")} className="cf-back">
              <ArrowLeft size={13} strokeWidth={2} />
              Back to home
            </Link>
            <div>
              <span className="cf-eyebrow">
                <TicketIcon size={11} />
                We'd love to hear from you
              </span>
            </div>
            <h1 className="cf-title">Get in Touch</h1>
            <p className="cf-subtitle">
              Whether you're after a quote, have a question, or simply want to
              say hello — our team is ready to help.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="cf-body">
          <div className="cf-grid">
            {/* Form */}
            <div className="cf-form-card">
              <div className="cf-form-top">
                <p className="cf-form-label">Contact Form</p>
                <h2 className="cf-form-heading">Send Us a Message</h2>

                <form onSubmit={handleSubmit} encType="multipart/form-data" noValidate>
                  <div className="cf-field">
                    <label htmlFor="reason">Reason for Contact</label>
                    <div className="cf-select-wrap">
                      <select
                        id="reason"
                        value={data.reason}
                        onChange={(e) => setData("reason", e.target.value)}
                        required
                      >
                        <option value="" disabled>Select reason</option>
                        {reasonOptions.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={15} strokeWidth={2} />
                    </div>
                    {errors.reason && <p className="cf-error">{errors.reason}</p>}
                  </div>

                  <div className="cf-row">
                    <div className="cf-field" style={{ marginBottom: 0 }}>
                      <label htmlFor="name">Full Name</label>
                      <input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        placeholder="Jane Smith"
                        required
                      />
                      {errors.name && <p className="cf-error">{errors.name}</p>}
                    </div>
                    <div className="cf-field" style={{ marginBottom: 0 }}>
                      <label htmlFor="email">Email Address</label>
                      <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                      {errors.email && <p className="cf-error">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="cf-row" style={{ marginTop: 20 }}>
                    <div className="cf-field" style={{ marginBottom: 0 }}>
                      <label htmlFor="phone">Phone (optional)</label>
                      <input
                        id="phone"
                        type="tel"
                        value={data.phone}
                        onChange={(e) => setData("phone", e.target.value)}
                        placeholder="+61 4XX XXX XXX"
                      />
                    </div>
                    <div className="cf-field" style={{ marginBottom: 0 }}>
                      <label>Preferred Contact Method</label>
                      <div className="cf-pill-group">
                        {["email", "phone"].map((v) => (
                          <div className="cf-pill" key={v}>
                            <input
                              type="radio"
                              id={`pref-${v}`}
                              name="preferredContact"
                              checked={data.preferredContact === v}
                              onChange={() => setData("preferredContact", v)}
                            />
                            <label htmlFor={`pref-${v}`}>{v}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {isGettingQuote && (
                    <>
                      <div className="cf-divider" style={{ marginTop: 24 }}>
                        <span>Quote Details</span>
                      </div>

                      <div className="cf-field">
                        <label htmlFor="department">Department</label>
                        <div className="cf-select-wrap">
                          <select
                            id="department"
                            value={data.department}
                            onChange={(e) => {
                              setData("department", e.target.value);
                              setData("category", "");
                              setData("product", "");
                            }}
                            required
                          >
                            <option value="" disabled>Select Department</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={15} strokeWidth={2} />
                        </div>
                        {errors.department && <p className="cf-error">{errors.department}</p>}
                      </div>

                      {selectedDepartment && (
                        <div className="cf-field">
                          <label htmlFor="category">Category</label>
                          <div className="cf-select-wrap">
                            <select
                              id="category"
                              value={data.category}
                              onChange={(e) => {
                                setData("category", e.target.value);
                                setData("product", "");
                              }}
                              required
                            >
                              <option value="" disabled>Select Category</option>
                              {selectedDepartment.categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <ChevronDown size={15} strokeWidth={2} />
                          </div>
                          {errors.category && <p className="cf-error">{errors.category}</p>}
                        </div>
                      )}

                      {selectedCategory && (
                        <div className="cf-field">
                          <label htmlFor="product">Product</label>
                          <div className="cf-select-wrap">
                            <select
                              id="product"
                              value={data.product}
                              onChange={(e) => setData("product", e.target.value)}
                              required
                            >
                              <option value="" disabled>Select Product</option>
                              {selectedCategory.products.map((p) => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                              ))}
                            </select>
                            <ChevronDown size={15} strokeWidth={2} />
                          </div>
                          {errors.product && <p className="cf-error">{errors.product}</p>}
                        </div>
                      )}

                      <div className="cf-row">
                        <div className="cf-field" style={{ marginBottom: 0 }}>
                          <label htmlFor="quantity">Quantity</label>
                          <input
                            id="quantity"
                            type="number"
                            min={1}
                            value={data.quantity}
                            onChange={(e) => setData("quantity", e.target.value)}
                            placeholder="e.g. 50"
                            required
                          />
                          {errors.quantity && <p className="cf-error">{errors.quantity}</p>}
                        </div>
                        <div className="cf-field" style={{ marginBottom: 0 }}>
                          <label htmlFor="file-input">Upload File (optional)</label>
                          <div
                            className="cf-drop"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <input
                              ref={fileInputRef}
                              id="file-input"
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => setData("file", e.target.files?.[0] ?? null)}
                            />
                            {data.file ? (
                              <div className="cf-drop-file">
                                <span style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                                  <Paperclip size={13} color={C.amber} strokeWidth={1.8} />
                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {data.file.name}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setData("file", null);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                  }}
                                >
                                  <X size={13} strokeWidth={2} />
                                </button>
                              </div>
                            ) : (
                              <p className="cf-drop-text">
                                <span>Choose a file</span> or drag it here — PDF, JPG, PNG
                              </p>
                            )}
                          </div>
                          {errors.file && <p className="cf-error">{errors.file}</p>}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="cf-field" style={{ marginTop: 20 }}>
                    <label htmlFor="message">Your Message</label>
                    <textarea
                      id="message"
                      value={data.message}
                      onChange={(e) => setData("message", e.target.value)}
                      placeholder="Tell us how we can help..."
                      required
                    />
                    {errors.message && <p className="cf-error">{errors.message}</p>}
                  </div>

                  <div className="cf-perf" />

                  <button type="submit" disabled={processing} className="cf-submit">
                    {processing ? "Sending…" : "Send Message →"}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="cf-sidebar">
              <div className="cf-info-card">
                <div className="cf-info-header">
                  <TicketIcon size={13} color={C.amber} strokeWidth={1.8} />
                  <h3>Contact Information</h3>
                </div>
                <div className="cf-info-body">
                  {[
                    {
                      Icon: MapPin,
                      label: "Address",
                      content: vendor?.data?.store_address || "Address not set",
                    },
                    {
                      Icon: Phone,
                      label: "Phone",
                      content: vendor?.data?.phone || "Phone not set",
                      href: vendor?.data?.phone
                        ? `tel:${vendor?.data?.phone.replace(/\s+/g, "")}`
                        : undefined,
                    },
                    {
                      Icon: Mail,
                      label: "Email",
                      content: vendor?.data?.email || "Email not set",
                      href: vendor?.data?.email ? `mailto:${vendor?.data?.email}` : undefined,
                    },
                  ].map(({ Icon, label, content, href }) => (
                    <div className="cf-info-row" key={label}>
                      <div className="cf-info-icon">
                        <Icon size={15} strokeWidth={1.8} />
                      </div>
                      <div className="cf-info-content">
                        <strong>{label}</strong>
                        {href ? <a href={href}>{content}</a> : <span>{content}</span>}
                      </div>
                    </div>
                  ))}

                  <div className="cf-social-row">
                    {[
                      { label: "Facebook", url: vendor?.data?.facebook_url },
                      { label: "Instagram", url: vendor?.data?.instagram_url },
                      { label: "TikTok", url: vendor?.data?.tiktok_url },
                    ]
                      .filter((s) => s.url)
                      .map((s) => (

                         <a key={s.label}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cf-social-btn"
                        >
                          {s.label}
                        </a>
                      ))}
                  </div>
                </div>
              </div>

              <div className="cf-info-card">
                <div className="cf-info-header">
                  <TicketIcon size={13} color={C.amber} strokeWidth={1.8} />
                  <h3>Business Hours</h3>
                </div>
                <div className="cf-info-body">
                  <div className="cf-hours-grid">
                    {dayNames.map((day, index) => {
                      const isClosed = closedDays.includes(index);
                      return (
                        <React.Fragment key={day}>
                          <span className="cf-hours-day">
                            {day} {isClosed ? "(Closed)" : "(Open)"}
                          </span>
                          <span className={isClosed ? "cf-hours-time cf-hours-closed" : "cf-hours-time"}>
                            {isClosed
                              ? "Closed"
                              : `${formatTime(vendor?.data?.business_start_time)} – ${formatTime(vendor?.data?.business_end_time)}`}
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="cf-map-card">
                <iframe
                  title="Location"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    vendor?.data?.store_address ?? ""
                  )}&output=embed`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

Contact.layout = (page) => <AuthenticatedLayout>{page}</AuthenticatedLayout>;

export default Contact;
