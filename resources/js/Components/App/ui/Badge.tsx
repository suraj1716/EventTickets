// resources/js/Components/App/ui/Badge.tsx
//
// Wraps the .badge / .badge-primary / .badge-accent / .badge-success classes
// from index.css and adds warning/error variants (not yet in the CSS file —
// see note below) so status pills (vendor status, order status, etc.) look
// consistent everywhere instead of being hand-rolled per page, e.g. the
// inline statusBadgeStyle object previously built ad hoc in VendorDetails.tsx.
//
// Usage:
//   <Badge variant="success">Approved</Badge>
//   <Badge variant="warning">Pending</Badge>
//   <Badge variant="error">Rejected</Badge>

import React from "react";

type Variant = "primary" | "accent" | "success" | "warning" | "error";

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

// Only primary/accent/success exist as classes in index.css today.
// warning/error are provided here as inline-style fallbacks using the
// existing --color-warning / --color-error tokens, so they're visually
// consistent even before matching .badge-warning/.badge-error classes
// are added to index.css.
const inlineFallback: Partial<Record<Variant, React.CSSProperties>> = {
  warning: {
    background: "rgba(201,162,0,0.1)",
    color: "var(--color-warning)",
  },
  error: {
    background: "rgba(192,57,43,0.08)",
    color: "var(--color-error)",
  },
};

const classVariant: Partial<Record<Variant, string>> = {
  primary: "badge-primary",
  accent: "badge-accent",
  success: "badge-success",
};

export default function Badge({ variant = "accent", children, className = "" }: BadgeProps) {
  const cls = classVariant[variant];

  if (cls) {
    return <span className={["badge", cls, className].filter(Boolean).join(" ")}>{children}</span>;
  }

  return (
    <span className={["badge", className].filter(Boolean).join(" ")} style={inlineFallback[variant]}>
      {children}
    </span>
  );
}
