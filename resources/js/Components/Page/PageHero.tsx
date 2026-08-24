import React from "react";

interface PageHeroProps {
  /** Small uppercase label above the title, e.g. "We'd love to hear from you" */
  eyebrow?: string;
  /** Main heading. Use <em>...</em> inside the string-as-JSX usage for the accent-italic word */
  title: React.ReactNode;
  /** Supporting paragraph under the title */
  subtitle?: string;
  /** Optional breadcrumb trail, e.g. [{ label: "Home", href: route("home") }, { label: "Gallery" }] */
  breadcrumbs?: { label: string; href?: string }[];
  /** Show the decorative line under the subtitle (default: true) */
  showDivider?: boolean;
  /** Optional background image URL — falls back to plain dark gradient if omitted */
  backgroundImage?: string;
}

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  breadcrumbs,
  showDivider = true,
  backgroundImage,
}: PageHeroProps) {
  return (
    <div
      className="page-hero"
      style={
        backgroundImage
          ? {
              backgroundImage: `linear-gradient(rgba(26,48,9,0.78), rgba(26,48,9,0.78)), url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="page-hero-inner">
        {/* {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="page-hero-breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="page-hero-breadcrumb-item">
                {b.href ? (
                  <a href={b.href} className="page-hero-breadcrumb-link">
                    {b.label}
                  </a>
                ) : (
                  <span className="page-hero-breadcrumb-current">{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && (
                  <span className="page-hero-breadcrumb-sep">/</span>
                )}
              </span>
            ))}
          </nav>
        )} */}

        {eyebrow && <p className="page-hero-eyebrow">{eyebrow}</p>}

        <h1 className="page-hero-title">{title}</h1>
        {/* ornament */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <div
            style={{ width: 48, height: 1, background: "var(--color-accent)" }}
          />
          <div
            style={{
              width: 5,
              height: 5,
              background: "var(--color-accent)",
              transform: "rotate(45deg)",
            }}
          />
          <div
            style={{ width: 48, height: 1, background: "var(--color-accent)" }}
          />
        </div>
        {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
