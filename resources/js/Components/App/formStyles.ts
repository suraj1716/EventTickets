// resources/js/Components/App/formStyles.ts
import React from "react";

export const label: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "10px",
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  marginBottom: 6,
};

export const input: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  fontFamily: "var(--font-body)",
  fontSize: "13px",
  color: "var(--color-text)",
  background: "var(--color-bg-alt)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 150ms",
};

export const err: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "11px",
  color: "var(--color-error)",
  marginTop: 4,
};

export const fieldWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

export const btnPrimary: React.CSSProperties = {
  padding: "9px 18px",
  fontFamily: "var(--font-body)",
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--color-bg-dark)",
  background: "var(--color-accent)",
  border: "1px solid var(--color-accent)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  transition: "background 150ms",
};

export const btnGhost: React.CSSProperties = {
  padding: "9px 18px",
  fontFamily: "var(--font-body)",
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  background: "transparent",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
};
