import React, { Children, useEffect, useMemo, useState } from "react";
import { router } from "@inertiajs/react";

/* ─────────────────────────────────────────────
   Box Office palette
───────────────────────────────────────────── */
export const C = {
  bg: "#0B0B10",
  bgAlt: "#1A1922",
  sidebar: "#111017",
  surface: "#15141B",
  border: "#26232E",
  borderDashed: "#33303C",
  text: "#F7F5F2",
  textInverse: "#0B0B10",
  textMuted: "#9C97A8",
  textFaint: "#6B6775",
  amber: "#FFB627",
  amberHover: "#ffc75c",
  amberDark: "#e2a220",
  hot: "#FF3E30",
  hotHover: "#ff6155",
  success: "#7CE0A8",
  info: "#7CA8E0",
  error: "#E08585",
};

export const fontBody = "'Inter', sans-serif";
export const fontDisplay = "'Anton', sans-serif";
export const fontMono = "'JetBrains Mono', monospace";

/* ─────────────────────────────────────────────
   Shared style constants
───────────────────────────────────────────── */
export const inputBase: React.CSSProperties = {
  padding: "8px 12px",
  fontFamily: fontBody,
  fontSize: "13px",
  color: C.text,
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: "8px",
  outline: "none",
  minWidth: "160px",
  transition: "border-color 150ms ease",
};

/* ─────────────────────────────────────────────
   StatusBadge
───────────────────────────────────────────── */
const COLORS: Record<string, string> = {
  draft: C.textFaint,
  paid: C.amber,
  shipped: C.info,
  delivered: C.success,
  cancelled: C.error,
  active: C.info,
  approved: C.success,
  rejected: C.error,
  ecommerce: C.amber,
  appointment: C.amberDark,
  gift: C.amberDark,
  promo: C.amber,
  published: C.success,
  pending: C.amber,
  refunded: C.error,
  proposed: C.amber,
  valid: C.info,
  used: C.success,
  void: C.error,
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const color = COLORS[status?.toLowerCase()] ?? C.textMuted;
  return (
    <span
      style={{
        fontFamily: fontMono,
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
        background: `${color}18`,
        padding: "3px 10px",
        borderRadius: "999px",
        border: `1px solid ${color}40`,
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {label ?? status}
    </span>
  );
}

/* ─────────────────────────────────────────────
   FilterBar
───────────────────────────────────────────── */
type FilterField = {
  key: string;
  placeholder?: string;
  type?: "text" | "select" | "date";
  options?: { value: string; label: string }[];
  flex?: boolean;
};

export function FilterBar({
  fields,
  filters,
  routeName,
}: {
  fields: FilterField[];
  filters: Record<string, string>;
  routeName: string;
}) {
  const [local, setLocal] = useState<Record<string, string>>(filters ?? {});

  const apply = () => {
    const clean: Record<string, string> = {};
    Object.entries(local).forEach(([k, v]) => {
      if (v) clean[k] = v;
    });
    router.get(route(routeName), clean, { preserveState: true, replace: true });
  };

  const reset = () => {
    setLocal({});
    router.get(route(routeName), {}, { preserveState: true, replace: true });
  };

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginBottom: "20px",
        alignItems: "center",
      }}
    >
      {fields.map((f) =>
        f.type === "select" ? (
          <select
            key={f.key}
            value={local[f.key] ?? ""}
            onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })}
            style={{ ...inputBase, flex: f.flex ? "1 1 160px" : undefined }}
          >
            <option value="">{f.placeholder ?? "All"}</option>
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <div
            key={f.key}
            style={{
              position: "relative",
              flex: f.flex ? "1 1 180px" : undefined,
            }}
          >
            {f.type !== "date" && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{
                  width: 13,
                  height: 13,
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: C.textFaint,
                  pointerEvents: "none",
                }}
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
            <input
              type={f.type ?? "text"}
              placeholder={f.placeholder}
              value={local[f.key] ?? ""}
              onChange={(e) => setLocal({ ...local, [f.key]: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              style={{
                ...inputBase,
                width: "100%",
                paddingLeft: f.type !== "date" ? 30 : 12,
              }}
            />
          </div>
        ),
      )}

      <button
        onClick={apply}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          background: C.amber,
          color: C.textInverse,
          border: `1px solid ${C.amber}`,
          borderRadius: "8px",
          fontFamily: fontMono,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          cursor: "pointer",
          transition: "all 150ms ease",
          whiteSpace: "nowrap",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ width: 12, height: 12 }}
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Filter
      </button>

      <button
        onClick={reset}
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "8px 14px",
          background: "transparent",
          color: C.textMuted,
          border: `1px solid ${C.border}`,
          borderRadius: "8px",
          fontFamily: fontMono,
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: "pointer",
          transition: "all 150ms ease",
          whiteSpace: "nowrap",
        }}
      >
        Reset
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Pagination
───────────────────────────────────────────── */
export function Pagination({ links }: { links: any[] }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        justifyContent: "center",
        paddingTop: "28px",
        flexWrap: "wrap",
      }}
    >
      {links.map((l, i) => (
        <button
          key={i}
          disabled={!l.url}
          onClick={() => l.url && router.visit(l.url, { preserveState: true })}
          dangerouslySetInnerHTML={{ __html: l.label }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 32,
            height: 32,
            padding: "0 10px",
            fontFamily: fontMono,
            fontSize: "12px",
            background: l.active ? C.amber : C.surface,
            color: l.active ? C.textInverse : C.textMuted,
            border: "1px solid",
            borderColor: l.active ? C.amber : C.border,
            borderRadius: "8px",
            cursor: l.url ? "pointer" : "default",
            opacity: l.url ? 1 : 0.4,
            transition: "all 150ms ease",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   AdminTable
───────────────────────────────────────────── */

export function AdminTable({
  headers,
  children,
  empty,
}: {
  headers: React.ReactNode[];
  children: React.ReactNode;
  empty?: string;
}) {
  const [reversed, setReversed] = useState(false);

  const rows = useMemo(() => {
    const arr = Children.toArray(children);
    return reversed ? arr.reverse() : arr;
  }, [children, reversed]);

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: `1px dashed ${C.borderDashed}`,
                background: C.bgAlt,
              }}
            >
              {headers.map((h, i) => {
                const isSerialColumn = h === "#";
                return (
                  <th
                    key={i}
                    onClick={
                      isSerialColumn ? () => setReversed((r) => !r) : undefined
                    }
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontFamily: fontMono,
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: C.textMuted,
                      whiteSpace: "nowrap",
                      cursor: isSerialColumn ? "pointer" : "default",
                      userSelect: "none",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {h}
                      {isSerialColumn && (
                        <span
                          style={{
                            fontSize: "9px",
                            opacity: 0.5,
                            color: C.amber,
                            transform: reversed ? "rotate(180deg)" : "none",
                            transition: "transform 150ms ease",
                          }}
                        >
                          ▲
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>

      {!children || (Array.isArray(children) && children.length === 0) ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            fontFamily: fontDisplay,
            textTransform: "uppercase",
            fontSize: "1.4rem",
            color: C.textFaint,
          }}
        >
          {empty ?? "No records found"}
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Tr — table row with hover
───────────────────────────────────────────── */
export function Tr({
  children,
  onClick,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: `1px dashed ${C.borderDashed}`,
        background: hovered ? C.bgAlt : "transparent",
        transition: "background 150ms ease",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </tr>
  );
}

/* ─────────────────────────────────────────────
   Td
───────────────────────────────────────────── */
export function Td({
  children,
  muted,
  right,
  nowrap = true,
  onClick,
  className,
}: {
  children: React.ReactNode;
  muted?: boolean;
  right?: boolean;
  nowrap?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <td
      onClick={onClick}
      className={className}
      style={{
        padding: "12px 16px",
        fontFamily: fontBody,
        fontSize: "13px",
        color: muted ? C.textMuted : C.text,
        textAlign: right ? "right" : "left",
        whiteSpace: nowrap ? "nowrap" : "normal",
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}

/* ─────────────────────────────────────────────
   AdminPageHeader
───────────────────────────────────────────── */
export function AdminPageHeader({
  eyebrow,
  title,
  action,
  meta,
}: {
  eyebrow: string;
  title: React.ReactNode;
  action?: React.ReactNode;
  meta?: string;
}) {
  return (
    <div
      style={{
        background: C.sidebar,
        padding: "32px 28px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        position: "relative",
        overflow: "hidden",
        margin: "-32px -28px 28px",
        borderBottom: `1px dashed ${C.borderDashed}`,
      }}
    >
      {/* subtle amber glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 120% at 80% 50%, rgba(255,182,39,0.08), transparent)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative" }}>
        <span
          style={{
            display: "block",
            fontFamily: fontMono,
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.amber,
            marginBottom: "6px",
          }}
        >
          {eyebrow}
        </span>
        <h1
          style={{
            fontFamily: fontDisplay,
            textTransform: "uppercase",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 400,
            color: C.text,
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {title}
        </h1>
        {meta && (
          <p
            style={{
              fontFamily: fontBody,
              fontSize: "12px",
              color: C.textFaint,
              marginTop: "6px",
              letterSpacing: "0.04em",
            }}
          >
            {meta}
          </p>
        )}
      </div>

      {action && <div style={{ position: "relative" }}>{action}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ActionBtn — edit / delete / view icon buttons
───────────────────────────────────────────── */
export function ActionBtn({
  onClick,
  variant = "default",
  title,
  children,
  as: Tag = "button",
  href,
}: {
  onClick?: (e?: React.MouseEvent) => void;
  variant?: "edit" | "delete" | "view" | "default";
  title?: string;
  children: React.ReactNode;
  as?: any;
  href?: string;
}) {
  const [hovered, setHovered] = useState(false);

  const colors = {
    edit: { border: C.amber, color: C.amber, bg: "rgba(255,182,39,0.08)" },
    delete: { border: C.error, color: C.error, bg: "rgba(224,133,133,0.08)" },
    view: { border: C.info, color: C.info, bg: "rgba(124,168,224,0.08)" },
    default: { border: C.border, color: C.textMuted, bg: C.bgAlt },
  };

  const c = colors[variant];

  return (
    <Tag
      href={href}
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: "8px",
        border: `1px solid ${hovered ? c.border : C.border}`,
        background: hovered ? c.bg : "transparent",
        color: hovered ? c.color : C.textMuted,
        cursor: "pointer",
        transition: "all 150ms ease",
        textDecoration: "none",
        flexShrink: 0,
      }}
    >
      {children}
    </Tag>
  );
}

/* ─────────────────────────────────────────────
   FlashMessage
───────────────────────────────────────────── */
export function FlashMessage({
  flash,
}: {
  flash: { success?: string; error?: string };
}) {
  if (!flash?.success && !flash?.error) return null;
  const isSuccess = !!flash.success;
  return (
    <div
      style={{
        padding: "10px 16px",
        fontFamily: fontBody,
        fontSize: "13px",
        borderRadius: "8px",
        border: "1px solid",
        marginBottom: "16px",
        background: isSuccess ? "rgba(124,224,168,0.08)" : "rgba(224,133,133,0.08)",
        color: isSuccess ? C.success : C.error,
        borderColor: isSuccess ? "rgba(124,224,168,0.25)" : "rgba(224,133,133,0.25)",
      }}
    >
      {flash.success ?? flash.error}
    </div>
  );
}

/* ─────────────────────────────────────────────
   AdminBtn
───────────────────────────────────────────── */
export function AdminBtn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  type = "button",
  as: Tag = "button",
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "accent" | "ghost" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  type?: "button" | "submit";
  as?: any;
  href?: string;
}) {
  const variants = {
    primary: { bg: C.amber, color: C.textInverse, border: C.amber },
    accent: { bg: "transparent", color: C.amber, border: C.amber },
    ghost: { bg: "transparent", color: C.textFaint, border: C.border },
    danger: { bg: C.error, color: C.textInverse, border: C.error },
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: "10px" },
    md: { padding: "9px 18px", fontSize: "11px" },
  };
  const v = variants[variant];
  const s = sizes[size];

  return (
    <Tag
      href={href}
      type={Tag === "button" ? type : undefined}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: s.padding,
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: "8px",
        fontFamily: fontMono,
        fontSize: s.fontSize,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "all 150ms ease",
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Tag>
  );
}

/* ─────────────────────────────────────────────
   Icons — use these everywhere, never inline SVG
   (kept as inline SVG components here deliberately —
   they use currentColor so they inherit whatever
   color the caller sets, no palette changes needed)
───────────────────────────────────────────── */
const iconStyle: React.CSSProperties = {
  width: 13,
  height: 13,
  display: "block",
};

export const Icons = {
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={iconStyle}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Delete: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={iconStyle}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  View: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={iconStyle}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={iconStyle}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={iconStyle}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Back: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={iconStyle}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={iconStyle}>
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={iconStyle}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Image: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={iconStyle}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={iconStyle}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   ConfirmModal — single delete modal for all pages
───────────────────────────────────────────── */
export function ConfirmModal({
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  title: React.ReactNode;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(11,11,16,0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "16px",
          padding: "28px 32px",
          maxWidth: 420,
          width: "90%",
          position: "relative",
        }}
      >
        {/* corner accents */}
        {[
          { top: 0, left: 0, borderTop: `1px solid ${C.hot}`, borderLeft: `1px solid ${C.hot}` },
          { top: 0, right: 0, borderTop: `1px solid ${C.hot}`, borderRight: `1px solid ${C.hot}` },
          { bottom: 0, left: 0, borderBottom: `1px solid ${C.hot}`, borderLeft: `1px solid ${C.hot}` },
          { bottom: 0, right: 0, borderBottom: `1px solid ${C.hot}`, borderRight: `1px solid ${C.hot}` },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 14,
              height: 14,
              opacity: 0.4,
              ...s,
            }}
          />
        ))}

        <span
          style={{
            display: "block",
            fontFamily: fontMono,
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.error,
            marginBottom: 8,
          }}
        >
          Confirm
        </span>

        <h3
          style={{
            fontFamily: fontDisplay,
            textTransform: "uppercase",
            fontSize: "1.3rem",
            fontWeight: 400,
            color: C.text,
            margin: "0 0 12px",
          }}
        >
          {title}
        </h3>

        <p
          style={{
            fontFamily: fontBody,
            fontSize: "13px",
            color: C.textMuted,
            lineHeight: 1.7,
            margin: "0 0 24px",
          }}
        >
          {description}
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <AdminBtn variant="ghost" onClick={onCancel}>
            Cancel
          </AdminBtn>
          <AdminBtn variant="danger" onClick={onConfirm}>
            <Icons.Delete />
            {confirmLabel}
          </AdminBtn>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SlideOver — the single left-sliding drawer used
   for EVERY admin create/edit flow.

   Two ways to close it, pick one:
   - onClose: local state toggle (index-managed modals
     like GiftCardTemplates / HeroBanner / Vendors)
   - closeHref: an Inertia route to visit (dedicated
     Create/Edit pages navigated to via routing)

   Usage:
     <SlideOver eyebrow="Catalogue" title="New Category" onClose={...}
       footer={<SlideOverActions onCancel={...} onSubmit={...} submitLabel="Create" processing={p} />}>
       ...fields...
     </SlideOver>
───────────────────────────────────────────── */
export function SlideOver({
  eyebrow,
  title,
  subtitle,
  onClose,
  closeHref,
  children,
  footer,
  width = 520,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose?: () => void;
  closeHref?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (closeHref) {
      setVisible(false);
      router.visit(closeHref);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9990, display: "flex" }}>
      {/* backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(11,11,16,0.72)",
          backdropFilter: "blur(3px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 240ms ease",
        }}
      />

      {/* panel — slides in from the left */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          height: "100%",
          width: `min(92vw, ${width}px)`,
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          boxShadow: "16px 0 48px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          transform: visible ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 280ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* header */}
        <div
          style={{
            padding: "24px 28px",
            borderBottom: `1px dashed ${C.borderDashed}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            {eyebrow && (
              <span
                style={{
                  display: "block",
                  fontFamily: fontMono,
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: C.amber,
                  marginBottom: "6px",
                }}
              >
                {eyebrow}
              </span>
            )}
            <h2
              style={{
                fontFamily: fontDisplay,
                textTransform: "uppercase",
                fontSize: "1.4rem",
                fontWeight: 400,
                color: C.text,
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  fontFamily: fontBody,
                  fontSize: "12px",
                  color: C.textFaint,
                  margin: "6px 0 0",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "8px",
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.textMuted,
              cursor: "pointer",
              flexShrink: 0,
              fontSize: 16,
              lineHeight: 1,
              transition: "all 150ms ease",
            }}
          >
            ×
          </button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {children}
        </div>

        {/* footer */}
        {footer && (
          <div
            style={{
              flexShrink: 0,
              borderTop: `1px dashed ${C.borderDashed}`,
              padding: "16px 28px",
              background: C.surface,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SlideOverActions — standard Cancel / Submit
   footer bar for a SlideOver form.
───────────────────────────────────────────── */
export function SlideOverActions({
  onCancel,
  onSubmit,
  submitLabel = "Save",
  processingLabel = "Saving…",
  processing,
  disabled,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  processingLabel?: string;
  processing?: boolean;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
      <AdminBtn variant="ghost" onClick={onCancel} disabled={processing}>
        Cancel
      </AdminBtn>
      <AdminBtn
        variant="accent"
        onClick={onSubmit}
        disabled={processing || disabled}
      >
        <Icons.Check />
        {processing ? processingLabel : submitLabel}
      </AdminBtn>
    </div>
  );
}
