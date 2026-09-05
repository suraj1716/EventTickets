"use client";

import { Link, usePage } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Ticket, MapPin, Mail, Phone } from "lucide-react";
import { formatAustralianPhone } from "@/utils/PhoneFormat";
import { PageProps } from "@/types";

/*
|--------------------------------------------------------------------------
| Palette — matched 1:1 to Navbar.tsx so the site reads as one continuous
| box office, not two different products stitched together. Amber is the
| only accent; everything else stays quiet.
|--------------------------------------------------------------------------
*/

const C = {
  bg: "#0B0B10",
  surface: "#15141B",
  border: "#26232E",
  borderDashed: "#33303C",
  text: "#F7F5F2",
  textMuted: "#9C97A8",
  textFaint: "#6B6775",
  textFainter: "#565262",
  amber: "#FFB627",
  amberHover: "#ffc75c",
};

const EASE = [0.16, 1, 0.3, 1] as const;

type FooterProps = {
  vendor?: { data?: Record<string, any> | null };
};

export default function Footer() {
  const { vendor } = usePage<PageProps<FooterProps>>().props;
  const vendorData = vendor?.data ?? null;

  const NAV_COLS = [
    {
      heading: "Explore",
      links: [
        { label: "Events", href: route("events.index") },
            { label: "Resale", href: route("resale.index") },
        { label: "My Tickets", href: route("tickets.index") },
        { label: "Gift Vouchers", href: route("gift-voucher.shop") },
        { label: "Contact", href: route("contact.index") },
      ],
    },
    {
      heading: "Account",
      links: [
        { label: "My Tickets", href: route("tickets.index") },
        { label: "Resale Listings", href: route("resale.mine") },

        { label: "Orders", href: route("orders.history") },
        { label: "Vouchers", href: route("vouchers.index") },
        { label: "Profile", href: route("profile.edit") },
      ],
    },
    {
      heading: "Support",
      links: [
        { label: "Cancellation Policy", href: route("cancellation-policy") },
        { label: "FAQs", href: "/faqs" },
        { label: "Contact Us", href: route("contact.index") },
      ],
    },
  ];

  const SOCIALS = [
    {
      label: "Instagram",
      url: vendorData?.instagram_url,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      url: vendorData?.facebook_url,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </svg>
      ),
    },
    {
      label: "TikTok",
      url: vendorData?.tiktok_url,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.78a4.85 4.85 0 01-1-.09z" />
        </svg>
      ),
    },
    {
      label: "Youtube",
      url: vendorData?.youtube_url,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </svg>
      ),
    },
  ].filter((s) => s.url);

  const contactRows = [
    { icon: MapPin, value: vendorData?.store_address, type: "text" as const },
    { icon: Mail, value: vendorData?.email, type: "email" as const },
    { icon: Phone, value: vendorData?.phone, type: "phone" as const },
  ].filter((r) => r.value);

  // Studio / box-office hours, same day-collapsing logic as before
  const hoursRows = (() => {
    const closedDays: number[] = (vendorData?.recurring_closed_days ?? []).map((d: any) => Number(d));
    const startTime = vendorData?.business_start_time;
    const endTime = vendorData?.business_end_time;

    const formatTime = (time?: string) => {
      if (!time) return "—";
      const [hourStr, minuteStr] = time.split(":");
      const hour = parseInt(hourStr, 10);
      return `${hour % 24}:${minuteStr}`;
    };

    const hoursRange = `${formatTime(startTime)} – ${formatTime(endTime)}`;
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const rows: [string, string][] = [];
    let i = 0;

    while (i < 7) {
      if (closedDays.includes(i)) {
        rows.push([dayLabels[i], "Closed"]);
        i++;
        continue;
      }
      const start = i;
      while (i < 7 && !closedDays.includes(i)) i++;
      const end = i - 1;
      const label = start === end ? dayLabels[start] : `${dayLabels[start]} – ${dayLabels[end]}`;
      rows.push([label, hoursRange]);
    }
    return rows;
  })();

  return (
    <>
      <style>{`
        .ft-root {
          background: ${C.bg};
          color: ${C.text};
          position: relative;
        }

        /* ticket-perforation seam echoing the navbar's dashed rules */
        .ft-perf {
          position: relative;
          height: 1px;
          border-top: 1px dashed ${C.borderDashed};
        }
        .ft-perf::before, .ft-perf::after {
          content: '';
          position: absolute;
          top: -9px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--ft-notch-bg, #0d0d13);
        }
        .ft-perf::before { left: -9px; }
        .ft-perf::after { right: -9px; }

        .ft-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ── brand ── */
        .ft-brand-mark {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          margin-bottom: 16px;
        }
        .ft-brand-word {
          font-family: 'Anton', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          font-size: 22px;
          color: ${C.text};
        }
        .ft-brand-desc {
          font-family: 'Manrope', sans-serif;
          font-size: 13px;
          line-height: 1.75;
          color: ${C.textMuted};
          max-width: 320px;
          margin-bottom: 22px;
        }
        .ft-contact-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .ft-contact-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          letter-spacing: 0.02em;
          color: ${C.textMuted};
          line-height: 1.5;
        }
        .ft-contact-list a { color: inherit; text-decoration: none; }
        .ft-contact-list a:hover { color: ${C.amber}; }
        .ft-contact-icon { color: ${C.amber}; flex-shrink: 0; margin-top: 1px; }

        /* ── nav columns ── */
        .ft-col-heading {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: ${C.amber};
          margin: 0 0 18px;
        }
        .ft-nav-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ft-nav-list a {
          font-family: 'Manrope', sans-serif;
          font-size: 13.5px;
          color: ${C.textMuted};
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .ft-nav-list a:hover { color: ${C.text}; }

        /* ── socials ── */
        .ft-social-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .ft-social-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid ${C.border};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${C.textMuted};
          text-decoration: none;
          transition: color 0.15s ease, border-color 0.15s ease;
          flex-shrink: 0;
        }
        .ft-social-btn:hover { color: ${C.amber}; border-color: rgba(255,182,39,0.5); }

        /* ── newsletter ── */
        .ft-nl-desc {
          font-family: 'Manrope', sans-serif;
          font-size: 13px;
          color: ${C.textMuted};
          line-height: 1.7;
          margin: 0 0 14px;
        }
        .ft-nl-form { display: flex; gap: 8px; flex-wrap: wrap; }
        .ft-nl-input {
          flex: 1 1 180px;
          min-width: 0;
          padding: 11px 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          background: ${C.surface};
          border: 1px solid ${C.border};
          border-radius: 6px;
          color: ${C.text};
          outline: none;
          transition: border-color 0.15s ease;
        }
        .ft-nl-input::placeholder { color: ${C.textFainter}; }
        .ft-nl-input:focus { border-color: rgba(255,182,39,0.5); }
        .ft-nl-btn {
          padding: 11px 20px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          background: ${C.amber};
          color: ${C.bg};
          border: none;
          border-radius: 6px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease;
        }
        .ft-nl-btn:hover { background: ${C.amberHover}; }

        /* ── hours (ticket-stub style, echoes announcement strip) ── */
        .ft-hours {
          margin-top: 20px;
          border: 1px dashed ${C.borderDashed};
          border-radius: 8px;
          padding: 14px 16px;
        }
        .ft-hours-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${C.textFaint};
          margin-bottom: 10px;
        }
        .ft-hours-dot {
          width: 6px; height: 6px; border-radius: 50%; background: ${C.amber}; flex-shrink: 0;
        }
        .ft-hours-row {
          display: flex;
          justify-content: space-between;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: ${C.textMuted};
          padding: 3px 0;
        }
        .ft-hours-row span:last-child { color: ${C.text}; }

        /* ── bottom bar ── */
        .ft-bottom {
          border-top: 1px solid ${C.border};
        }
        .ft-bottom-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 20px 0;
        }
        .ft-copy {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.03em;
          color: ${C.textFainter};
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }
        .ft-copy a {
          color: ${C.textFainter};
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .ft-copy a:hover { color: ${C.textMuted}; }
        .ft-copy-sep { margin: 0 8px; color: ${C.border}; }
        .ft-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${C.textFainter};
        }
        .ft-badge-dot {
          width: 5px; height: 5px; border-radius: 50%; background: ${C.amber}; opacity: 0.6; flex-shrink: 0;
        }

        /* ── grid ── */
        .ft-main {
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr 1fr 1.4fr;
          gap: 40px;
          padding: 56px 0 48px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .ft-main { grid-template-columns: 1fr 1fr 1fr; gap: 32px; }
          .ft-brand-col, .ft-nl-col { grid-column: 1 / -1; }
        }
        @media (max-width: 640px) {
          .ft-main { grid-template-columns: 1fr 1fr; padding: 40px 0 36px; gap: 28px; }
          .ft-brand-col, .ft-nl-col { grid-column: 1 / -1; }
        }
      `}</style>

      <footer className="ft-root">
        <div className="ft-inner"><div className="ft-perf" /></div>

        <div className="ft-inner">
          <div className="ft-main">
            <div className="ft-brand-col">
              <Link href={route("home")} className="ft-brand-mark">
                <Ticket size={20} color={C.amber} strokeWidth={1.8} />
                <span className="ft-brand-word">Box Office</span>
              </Link>
              <p className="ft-brand-desc">
                Live events, instant e-tickets — nothing to print, nothing to queue for.
                Every seat, straight from the source.
              </p>
              {contactRows.length > 0 && (
                <ul className="ft-contact-list">
                  {contactRows.map((row) => (
                    <li key={row.value}>
                      <row.icon size={13} className="ft-contact-icon" strokeWidth={1.8} />
                      {row.type === "phone" ? (
                        <a href={`tel:${row.value}`}>{formatAustralianPhone(row.value)}</a>
                      ) : row.type === "email" ? (
                        <a href={`mailto:${row.value}`}>{row.value}</a>
                      ) : (
                        <span>{row.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {NAV_COLS.map((col) => (
              <div key={col.heading}>
                <p className="ft-col-heading">{col.heading}</p>
                <ul className="ft-nav-list">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
                {col.heading === "Explore" && SOCIALS.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <p className="ft-col-heading" style={{ marginBottom: 12 }}>Follow</p>
                    <div className="ft-social-row">
                      {SOCIALS.map((s) => (
                        <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="ft-social-btn">
                          {s.icon}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="ft-nl-col">
              <p className="ft-col-heading">Stay In The Loop</p>
              <p className="ft-nl-desc">
                New show announcements, presale codes, and last-minute drops — straight to your inbox.
              </p>
              <form className="ft-nl-form" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Your email address" className="ft-nl-input" />
                <button type="submit" className="ft-nl-btn">Subscribe</button>
              </form>

              {hoursRows.length > 0 && (
                <div className="ft-hours">
                  <span className="ft-hours-label">
                    <motion.span
                      animate={{ opacity: [1, 0.25, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      className="ft-hours-dot"
                    />
                    Box Office Hours
                  </span>
                  {hoursRows.map(([day, hrs]) => (
                    <div className="ft-hours-row" key={day}>
                      <span>{day}</span>
                      <span>{hrs}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ft-bottom">
          <div className="ft-inner">
            <div className="ft-bottom-inner">
              <p className="ft-copy">
                © {new Date().getFullYear()} Box Office. All rights reserved.
                <span className="ft-copy-sep">·</span>
                <Link href="/">Privacy Policy</Link>
                <span className="ft-copy-sep">·</span>
                <Link href="/">Terms of Service</Link>
              </p>
              <div className="ft-badge">
                <span className="ft-badge-dot" />
                Proudly Australian — Sydney, NSW
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
