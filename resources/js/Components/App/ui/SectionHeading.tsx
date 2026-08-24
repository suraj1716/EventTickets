// resources/js/Components/App/ui/SectionHeading.tsx
//
// Consolidates the "Eyebrow + gold ornament + serif title" pattern that was
// previously copy-pasted as local Eyebrow/Ornament/SectionHeading functions
// inside About.tsx, Home.tsx, Vendor/Profile.tsx, and Profile/Edit.tsx.
//
// Usage:
//   <SectionHeading eyebrow="Who We Are" title={<>Welcome to <em>RB Hair & Beauty Lounge</em></>} />
//   <SectionHeading eyebrow="Our Values" title="Our Values" center />
//   <SectionHeading eyebrow="Account" title={<>Your <em>Profile</em></>} tone="light" />

import React from "react";

interface SectionHeadingProps {
  /** Small uppercase gold label above the title, e.g. "Who We Are" */
  eyebrow: string;
  /** Main heading. Wrap the accent word in <em> for the italic-gold treatment */
  title: React.ReactNode;
  /** Center the heading (used on section-level headings). Default: false (left-aligned) */
  center?: boolean;
  /** "dark" = default text color for light backgrounds. "light" = white text for dark/hero backgrounds */
  tone?: "dark" | "light";
  /** Show the gold ornament divider between eyebrow and title. Default: true */
  showOrnament?: boolean;
  /** Extra margin-bottom below the whole block. Default: "3rem" */
  marginBottom?: string;
}

export function Ornament({ center = false  }: { center?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "1rem 0 1rem",
        justifyContent: center ? "center" : "flex-start",
      }}
    >
      <div style={{ width: 36, height: 1, background: "var(--color-accent)" }} />
      <div
        style={{
          width: 5,
          height: 5,
          background: "var(--color-accent)",
          transform: "rotate(45deg)",
        }}
      />
      <div style={{ width: 36, height: 1, background: "var(--color-accent)" }} />
    </div>
  );
}

export function Eyebrow({
  children,
  center = false,
  tone = "dark",
}: {
  children: React.ReactNode;
  center?: boolean;
  tone?: "dark" | "light";
}) {
  return (
    <span
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.68rem",
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: tone === "light" ? "var( --color-text-muted-light)" : "var( --color-text-muted)",
        display: "block",
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </span>
  );
}

export default function SectionHeading({
  eyebrow,
  title,
  center = false,
  tone = "dark",
  showOrnament = true,
  marginBottom = "3rem",
}: SectionHeadingProps) {
  return (
    <div style={{ textAlign: center ? "center" : "left", marginBottom }}>
      <Eyebrow center={center} tone={tone}>
        {eyebrow}
      </Eyebrow>
      {showOrnament && <Ornament center={center} />}
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
          fontWeight: 300,
          color: tone === "light" ? "white" : "var(--color-text)",
          lineHeight: 1.15,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

export function Title({
  children,
  tone = "dark",
  center = false,
}: {
  children: React.ReactNode;
  tone?: "dark" | "light";
  center?: boolean;
}) {
  return (
    <h2
      style={{
        margin: 0,
        fontFamily: "var(--font-display)",
        fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
        fontWeight: 300,
        color: tone === "light" ? "var(--color-text-muted)" : "var(--color-primary)",
        lineHeight: 1.15,
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </h2>
  );
}
