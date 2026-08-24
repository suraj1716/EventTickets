// resources/js/Components/App/Card.tsx
import React from "react";

export default function Card({
  title,
  titleSize = "10px",
  badge,
  children,
}: {
  title: string;
  /** Font size of the header label. Default: "10px" (matches existing usage everywhere). */
  titleSize?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg-alt)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 3,
              height: 16,
              background: "var(--color-accent)",
              borderRadius: 2,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: titleSize,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              fontWeight: 500,
            }}
          >
            {title}
          </span>
        </div>
        {badge && (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              background: "rgba(201,169,110,0.1)",
              border: "1px solid rgba(201,169,110,0.25)",
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}
