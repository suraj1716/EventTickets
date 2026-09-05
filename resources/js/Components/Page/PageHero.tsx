import React from "react";

interface PageHeroProps {
  /** Small uppercase label above the title, e.g. "Your account" */
  eyebrow?: string;
  /** Main heading. Wrap the accent word in <em>...</em> to color it amber */
  title: React.ReactNode;
  /** Supporting paragraph under the title */
  subtitle?: string;
  /** Optional breadcrumb trail, e.g. [{ label: "Home", href: route("home") }, { label: "Gallery" }] */
  breadcrumbs?: { label: string; href?: string }[];
  /** Show the decorative amber divider under the subtitle (default: true) */
  showDivider?: boolean;
  /** Optional background image URL — falls back to plain dark background if omitted */
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
      className="relative bg-[#0B0B10]"
      style={
        backgroundImage
          ? {
              backgroundImage: `linear-gradient(rgba(11,11,16,0.85), rgba(11,11,16,0.85)), url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-1 pt-16 mb-12">
        {/* {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            className="flex items-start justify-start gap-2 font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-wider text-[#6B6775] mb-6"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                {b.href ? (
                  <a href={b.href} className="hover:text-[#FFB627] transition-colors">
                    {b.label}
                  </a>
                ) : (
                  <span className="text-[#9C97A8]">{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && (
                  <span className="text-[#26232E]">/</span>
                )}
              </span>
            ))}
          </nav>
        )} */}

        {eyebrow && (
          <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#FFB627] mb-3">
            {eyebrow}
          </p>
        )}

        <h1 className="font-['Anton'] uppercase leading-[0.95] text-4xl sm:text-5xl tracking-tight text-white [&_em]:not-italic [&_em]:text-[#FFB627]">
          {title}
        </h1>

        {subtitle && (
          <p className="text-sm text-[#9C97A8] mt-2 max-w-md">{subtitle}</p>
        )}

        {showDivider && (
          <div className="flex items-start justify-start gap-2.5 mt-5">
            <div className="h-px w-32" style={{ background: "#FFB627" }} />
          </div>
        )}
      </div>
    </div>
  );
}
