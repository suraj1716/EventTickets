"use client";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
  Category,
  CategoryGroup,
  Department,
  PaginationProps,
  Product,
  ProductGroup,
} from "@/types";
import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { usePage } from "@inertiajs/react";
import HeroCarousel from "@/Components/App/Hero_Banner";
import CountUp from "react-countup";
import {
  FireIcon,
  TicketIcon,
  ShieldCheckIcon,
  BoltIcon,
  StarIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import axios from "axios";

/*
|--------------------------------------------------------------------------
| Palette — matched 1:1 to Navbar.tsx / Footer.tsx so the homepage reads
| as the same box office, not a different product. Amber is the only
| accent; everything else stays quiet and dark.
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

/* ─────────────────────────────────────────────
   Local heading primitives — hardcoded to the C
   palette rather than the salon site's CSS vars,
   so this page never inherits the wrong theme.
───────────────────────────────────────────── */
function Eyebrow({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <p
      className="font-['IBM_Plex_Mono']"
      style={{
        fontSize: 11,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        color: C.amber,
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        gap: 9,
        justifyContent: center ? "center" : "flex-start",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: C.amber,
          flexShrink: 0,
        }}
      />
      {children}
    </p>
  );
}

function Title({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <h2
      className="font-['Anton']"
      style={{
        textTransform: "uppercase",
        fontSize: "clamp(2rem, 4vw, 3.1rem)",
        fontWeight: 400,
        color: C.text,
        lineHeight: 1.08,
        textAlign: center ? "center" : "left",
        letterSpacing: "0.005em",
        margin: 0,
      }}
    >
      {children}
    </h2>
  );
}

function Ornament({ center = false }: { center?: boolean }) {
  return (
    <div
      style={{
        width: 42,
        height: 2,
        background: C.amber,
        margin: center ? "18px auto" : "18px 0",
      }}
    />
  );
}

function SectionButton({
  href,
  children,
  variant = "solid",
  onClick,
}: {
  href?: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  onClick?: () => void;
}) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "14px 28px",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    textDecoration: "none",
    borderRadius: 6,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 0.2s ease, border-color 0.2s ease, color 0.2s ease",
    border: "1px solid transparent",
  };
  const solid: React.CSSProperties = { background: C.amber, color: C.bg };
  const outline: React.CSSProperties = {
    background: "transparent",
    color: C.text,
    borderColor: C.border,
  };
  const style = { ...base, ...(variant === "solid" ? solid : outline) };

  const Tag = (href ? "a" : "button") as any;
  return (
    <Tag
      href={href}
      onClick={onClick}
      style={style}
      onMouseEnter={(e: any) => {
        if (variant === "solid") e.currentTarget.style.background = C.amberHover;
        else e.currentTarget.style.borderColor = "rgba(255,182,39,0.5)";
      }}
      onMouseLeave={(e: any) => {
        if (variant === "solid") e.currentTarget.style.background = C.amber;
        else e.currentTarget.style.borderColor = C.border;
      }}
    >
      {children}
    </Tag>
  );
}

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface HeroBannerProps {
  id: number;
  title: string;
  subtitle: string;
  image_path: string;
  image_url: string | null;
  button_text?: string;
  button_link?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PageProps {
  allproducts: PaginationProps<Product>;
  products: PaginationProps<Product>;
  categoryGroups: CategoryGroup[];
  productGroups: ProductGroup[];
  banners: HeroBannerProps[];
  departments: Department[];
  categories: Category[];
}

/* ─────────────────────────────────────────────
   Static content — reframed from salon copy to
   box-office / ticketing copy
───────────────────────────────────────────── */
const stats = [
  { end: 500, suffix: "+", label: "Events Hosted", Icon: CalendarDaysIcon },
  { end: 12, suffix: "k+", label: "Tickets Sold", Icon: TicketIcon },
  { end: 120, suffix: "+", label: "Partner Venues", Icon: MapPinIcon },
  { end: 8, suffix: "y", label: "Years Running", Icon: UserGroupIcon },
];

const pillars = [
  {
    Icon: TicketIcon,
    title: "Instant E-Tickets",
    body: "Your ticket lands straight in your inbox and your account the moment checkout completes — nothing to print, nothing to queue for.",
  },
  {
    Icon: ShieldCheckIcon,
    title: "Verified Sellers",
    body: "Every listing on Box Office comes from a verified promoter or venue, so the seat you buy is the seat you get.",
  },
  {
    Icon: BoltIcon,
    title: "Secure Checkout",
    body: "Card, voucher, or a split of both — every transaction runs through encrypted, PCI-compliant payment rails.",
  },
];

const marqueeItems = [
  "Live Music",
  "Comedy Nights",
  "Festivals",
  "Sydney & Beyond",
  "Instant E-Tickets",
  "Verified Sellers",
];

const testimonials = [
  {
    quote:
      "Checkout took under a minute and the tickets were in my inbox before I'd even left the site. Never going back to paper stubs.",
    name: "Jordan K.",
    service: "Laneway Sessions",
    stars: 5,
  },
  {
    quote:
      "Found a last-minute presale code through the newsletter and scored front row for half what resale sites were asking.",
    name: "Amara T.",
    service: "Comedy Underground",
    stars: 5,
  },
  {
    quote:
      "Support actually picked up when my QR code wouldn't scan at the door. Sorted in two minutes flat.",
    name: "Priya S.",
    service: "Harbourside Festival",
    stars: 5,
  },
];

export default function Home({
  products,
  banners,
  categories,
}: PageProps) {
  const { url } = usePage();
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (!activeCategory) {
      setCategoryProducts([]);
      return;
    }
    setLoadingProducts(true);
    axios
      .get(route("categories.products", activeCategory.id))
      .then((res) => setCategoryProducts(res.data.products))
      .catch(() => setCategoryProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [activeCategory]);

  useEffect(() => {
    AOS.init({ duration: 750, once: true, easing: "ease-out" });
  }, []);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get(
      "scrollToCategoryId",
    );
    if (id)
      document
        .getElementById(`category-group-${id}`)
        ?.scrollIntoView({ behavior: "smooth" });
  }, [url]);

  useEffect(() => {
    const el = document.getElementById("stats-section");
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* testimonial auto-rotate */
  useEffect(() => {
    const t = setInterval(
      () => setActiveTestimonial((i) => (i + 1) % testimonials.length),
      5000,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ fontFamily: "'Manrope', sans-serif", background: C.bg }} className="isolate">
      <style>{`
        .box-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }

        /* dashed ticket-perforation seam, reused from Footer */
        .box-perf {
          position: relative;
          height: 1px;
          border-top: 1px dashed ${C.borderDashed};
        }
        .box-perf::before, .box-perf::after {
          content: '';
          position: absolute;
          top: -9px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--notch-bg, ${C.bg});
        }
        .box-perf::before { left: -9px; }
        .box-perf::after { right: -9px; }

        /* ── split intro ── */
        .split-intro { background: ${C.bg}; padding: 7rem 0; overflow: hidden; }
        .split-intro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
        .split-intro-actions { display: flex; gap: 0.875rem; margin-top: 2.5rem; flex-wrap: wrap; }
        .split-intro-mosaic { position: relative; height: 480px; }
        .split-intro-accent-card {
          position: absolute; bottom: 20%; right: -1.5rem;
          background: ${C.surface}; border: 1px solid ${C.border};
          border-radius: 8px; padding: 1.25rem 1.5rem; min-width: 160px;
        }
        .split-intro-mosaic-mobile { display: none; }

        @media (max-width: 1024px) {
          .split-intro { padding: 4.5rem 0; }
          .split-intro-grid { grid-template-columns: 1fr; gap: 2.5rem; }
          .split-intro-mosaic { display: none; }
          .split-intro-mosaic-mobile {
            display: block; position: relative; order: -1;
          }
          .split-intro-mosaic-mobile-main {
            position: relative; width: 100%; aspect-ratio: 4/3;
            background: ${C.surface}; border: 1px solid ${C.border};
            border-radius: 8px; overflow: hidden;
          }
          .split-intro-mosaic-mobile-main img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .split-intro-mosaic-mobile-inset {
            position: absolute; bottom: -1.1rem; left: 1.1rem; width: 34%; aspect-ratio: 1/1;
            background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 8px;
            overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.4);
          }
          .split-intro-mosaic-mobile-inset img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .split-intro-mosaic-mobile-badge {
            position: absolute; top: 0.9rem; right: 0.9rem;
            background: ${C.bg}; border: 1px solid rgba(255,182,39,0.35); border-radius: 6px;
            padding: 0.55rem 0.85rem; text-align: center;
          }
        }
        @media (max-width: 640px) {
          .split-intro { padding: 3.25rem 0; }
          .split-intro-actions { flex-direction: column; gap: 0.625rem; }
        }

        /* ── stats ── */
        .stats-section { background: ${C.surface}; border-top: 1px dashed ${C.borderDashed}; border-bottom: 1px dashed ${C.borderDashed}; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 2rem; }

        /* ── bento ── */
        .box-bento-desktop { display: none; }
        .box-bento-mobile { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 8px; }
        @media (min-width: 1024px) {
          .box-bento-desktop { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 230px; gap: 10px; }
          .box-bento-mobile { display: none; }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .box-bento-mobile { grid-template-columns: repeat(3, 1fr); }
        }
        .box-tile {
          position: relative; border-radius: 8px; overflow: hidden; cursor: pointer;
          border: 1px solid ${C.border}; background: ${C.surface};
          height: 100%; min-height: 175px;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .box-tile:hover { border-color: rgba(255,182,39,0.45); transform: translateY(-2px); }
        .box-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .box-tile-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(11,11,16,0.92) 5%, rgba(11,11,16,0.15) 60%, transparent 100%);
        }
        .box-tile-content { position: absolute; left: 0; right: 0; bottom: 0; padding: 16px; }
        .box-tile-title { font-family: 'Anton', sans-serif; text-transform: uppercase; font-size: 1.05rem; color: ${C.text}; margin: 0 0 3px; }
        .box-tile-sub { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: ${C.textMuted}; }

        /* ── pillars ── */
        .pillars-section { background: ${C.bg}; border-top: 1px solid ${C.border}; border-bottom: 1px solid ${C.border}; padding: 7rem 0; }
        .pillars-heading-wrap { text-align: center; margin-bottom: 4rem; }
        .pillars-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1px; background: ${C.border}; }
        .pillar-card { background: ${C.surface}; padding: 3rem 2.5rem; position: relative; overflow: hidden; transition: background 0.3s ease; }
        .pillar-card:hover { background: #191821; }
        @media (max-width: 1024px) {
          .pillars-section { padding: 4.5rem 0; }
          .pillars-heading-wrap { margin-bottom: 2.75rem; }
          .pillars-grid { grid-template-columns: repeat(2, 1fr); }
          .pillar-card { padding: 2.25rem 1.75rem; }
        }
        @media (max-width: 640px) {
          .pillars-section { padding: 3.25rem 0; }
          .pillars-grid { grid-template-columns: 1fr; }
          .pillar-card { padding: 2rem 1.5rem; }
        }

        /* ── testimonials ── */
        .testimonials-section { background: ${C.surface}; padding: 7rem 0; overflow: hidden; }
        .testimonials-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 5rem; align-items: start; }
        .testimonials-intro-text { max-width: 280px; }
        .testimonials-card { padding: 2.5rem; border-radius: 8px; }
        .testimonials-quote { font-size: 1.3rem; margin-bottom: 2rem; }
        .testimonials-cards-wrap { position: relative; }
        @media (max-width: 1024px) {
          .testimonials-section { padding: 4.5rem 0; }
          .testimonials-grid { grid-template-columns: 1fr; gap: 2.5rem; }
          .testimonials-intro-text { max-width: 100%; }
        }
        @media (max-width: 640px) {
          .testimonials-section { padding: 3.25rem 0; }
          .testimonials-card { padding: 1.75rem 1.5rem; }
          .testimonials-quote { font-size: 1.05rem; margin-bottom: 1.5rem; }
        }

        /* ── CTA band ── */
        .cta-band { background: ${C.bg}; padding: 7rem 0; position: relative; overflow: hidden; border-top: 1px dashed ${C.borderDashed}; }
        .cta-trust-item { display: flex; align-items: center; gap: 7px; }
      `}</style>

      <AuthenticatedLayout>
        {/* ══ HERO ══ */}
        <div className="relative z-0">
          <HeroCarousel
            banners={(banners ?? []).map((b) => ({
              ...b,
              button_text: b.button_text ?? "",
              button_link: b.button_link ?? "",
            }))}
          />
        </div>

        {/* ══ MARQUEE ══ */}
        <div
          style={{
            background: C.surface,
            padding: "13px 0",
            overflow: "hidden",
            borderTop: `1px dashed ${C.borderDashed}`,
            borderBottom: `1px dashed ${C.borderDashed}`,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "2.5rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {marqueeItems.map((t) => (
              <span
                key={t}
                className="font-['IBM_Plex_Mono']"
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: C.textMuted,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <span style={{ color: C.amber, fontSize: "0.7rem" }}>✦</span>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ══ SPLIT INTRO — About Box Office ══ */}
        <section className="split-intro" data-aos="fade-up">
          <div className="box-container">
            <div className="split-intro-grid">
              {/* mobile image */}
              <div className="split-intro-mosaic-mobile" style={{ marginBottom: "2rem" }}>
                <div className="split-intro-mosaic-mobile-main">
                  {categories[2]?.image_url && <img src={categories[2].image_url} alt="" />}
                  <div style={{ position: "absolute", inset: 0, background: "rgba(11,11,16,0.35)" }} />
                  <div className="split-intro-mosaic-mobile-badge">
                    <div className="font-['Anton']" style={{ fontSize: "1.3rem", color: C.amber, lineHeight: 1 }}>8y</div>
                    <div className="font-['IBM_Plex_Mono']" style={{ fontSize: "0.5rem", letterSpacing: "0.14em", textTransform: "uppercase", color: C.textMuted, marginTop: 3, whiteSpace: "nowrap" }}>
                      Running Shows
                    </div>
                  </div>
                </div>
                {categories[4]?.image_url && (
                  <div className="split-intro-mosaic-mobile-inset">
                    <img src={categories[4].image_url} alt="" />
                  </div>
                )}
              </div>

              {/* left: text */}
              <div>
                <Eyebrow>Est. 2018 · Sydney</Eyebrow>
                <Title>
                  Every seat, <span style={{ color: C.amber }}>straight</span>{" "}
                  from the source
                </Title>
                <Ornament />
                <p style={{ color: C.textMuted, lineHeight: 1.85, fontSize: "0.97rem", marginTop: "1.75rem", maxWidth: 460 }}>
                  Box Office is Sydney's ticketing counter for live music, comedy, and festivals.
                  No resale markups, no scalpers in the queue — just verified sellers and
                  e-tickets that land the second checkout clears.
                </p>
                <p style={{ color: C.textMuted, lineHeight: 1.85, fontSize: "0.97rem", marginTop: "1rem", maxWidth: 460 }}>
                  We work directly with promoters and venues across the city, so what you
                  see listed is what actually happens on the night.
                </p>

                <div className="split-intro-actions">
                  <SectionButton href={route("events.index")} variant="solid">
                    Browse Events
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13, flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </SectionButton>
                  <SectionButton href={route("contact.index")} variant="outline">
                    About Us
                  </SectionButton>
                </div>
              </div>

              {/* right: mosaic */}
              <div className="split-intro-mosaic">
                <div style={{ position: "absolute", top: 0, right: 0, width: "78%", height: "78%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                  {categories[2]?.image_url && (
                    <img src={categories[2].image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <div style={{ position: "absolute", inset: 0, background: "rgba(11,11,16,0.35)" }} />
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, width: "52%", height: "52%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}>
                  {categories[4]?.image_url && (
                    <img src={categories[4].image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
                <div className="split-intro-accent-card">
                  <div className="font-['Anton']" style={{ fontSize: "2rem", color: C.amber, lineHeight: 1 }}>8y</div>
                  <div className="font-['IBM_Plex_Mono']" style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: C.textMuted, marginTop: 4 }}>
                    Running Shows
                  </div>
                </div>
                <div style={{ position: "absolute", top: "8%", left: "20%", width: 1, height: 60, background: C.amber, opacity: 0.35 }} />
              </div>
            </div>
          </div>
        </section>

        {/* ══ STATS ══ */}
        <section id="stats-section" className="stats-section">
          <div className="box-container" style={{ paddingBlock: "4.5rem" }}>
            <div className="stats-grid">
              {stats.map((s, i) => (
                <div key={i} style={{ textAlign: "center", position: "relative" }} data-aos="fade-up" data-aos-delay={i * 80}>
                  {i > 0 && (
                    <div className="max-sm:hidden" style={{ position: "absolute", left: 0, top: "20%", width: 1, height: "60%", background: C.border }} />
                  )}
                  <s.Icon style={{ width: 26, height: 26, margin: "0 auto 0.75rem", color: C.amber, opacity: 0.9 }} />
                  <div className="font-['Anton']" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", color: C.text, lineHeight: 1 }}>
                    {statsVisible ? <CountUp end={s.end} duration={2.5} separator="," suffix={s.suffix} /> : <span>0{s.suffix}</span>}
                  </div>
                  <p className="font-['IBM_Plex_Mono']" style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: C.textFaint, marginTop: "0.6rem" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ BROWSE BY CATEGORY ══ */}
        <section id="services" style={{ background: C.bg, padding: "7rem 0", scrollMarginTop: "100px" }} data-aos="fade-up">
          <div className="box-container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "0.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div className="mb-10">
                <Eyebrow>What's On</Eyebrow>
                <Title>Browse By <span style={{ color: C.amber }}>Category</span></Title>
                <Ornament />
              </div>
              <a
                href={route("events.index")}
                className="font-['IBM_Plex_Mono']"
                style={{
                  fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase",
                  color: C.text, textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                  borderBottom: `1px solid ${C.amber}`, paddingBottom: 2, marginBottom: 50,
                }}
              >
                View All Events
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>

            <div className="box-bento-desktop">
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="box-tile"
                  style={{ gridColumn: idx % 5 === 0 ? "span 2" : "span 1" }}
                  onClick={() => setActiveCategory(cat)}
                  data-aos="fade-up"
                  data-aos-delay={(idx % 6) * 60}
                >
                  <img src={cat.image_url ?? "/images/placeholder-category.jpg"} alt={cat.name} />
                  <div className="box-tile-overlay" />
                  <div className="box-tile-content">
                    <p className="box-tile-title">{cat.name}</p>
                    <p className="box-tile-sub">{cat.products_count} events · Explore</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="box-bento-mobile">
              {categories.map((cat) => (
                <div key={cat.id} className="box-tile" onClick={() => setActiveCategory(cat)} style={{ height: 175 }}>
                  <img src={cat.image_url ?? "/images/placeholder-category.jpg"} alt={cat.name} />
                  <div className="box-tile-overlay" />
                  <div className="box-tile-content">
                    <p className="box-tile-title" style={{ fontSize: "0.9rem" }}>{cat.name}</p>
                    <p className="box-tile-sub">{cat.products_count} events</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CATEGORY MODAL ══ */}
        {activeCategory && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(11,11,16,0.85)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
            onClick={() => setActiveCategory(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "min(520px, 90vw)", maxHeight: "90vh", overflowY: "auto", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}
            >
              <div style={{ height: 220, overflow: "hidden", position: "relative" }}>
                <img
                  src={activeCategory.image_url ? activeCategory.image_url : "/images/placeholder.png"}
                  alt={activeCategory.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,11,16,0.85), transparent 60%)" }} />
                <button
                  onClick={() => setActiveCategory(null)}
                  style={{ position: "absolute", top: "1rem", right: "1rem", width: 36, height: 36, borderRadius: "50%", background: "rgba(11,11,16,0.7)", border: `1px solid ${C.border}`, color: C.text, fontSize: "1.1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div style={{ padding: "2rem" }}>
                <Eyebrow>Category</Eyebrow>
                <h3 className="font-['Anton']" style={{ textTransform: "uppercase", fontSize: "1.8rem", color: C.text, margin: "0.4rem 0 0.875rem" }}>
                  {activeCategory.name}
                </h3>
                <p style={{ color: C.textMuted, lineHeight: 1.8, marginBottom: "1.75rem", fontSize: "0.93rem" }}>
                  Browse upcoming {activeCategory.name.toLowerCase()} events and grab your tickets.
                </p>

                <div style={{ marginBottom: "1.75rem" }}>
                  {loadingProducts ? (
                    <p style={{ color: C.textMuted, fontSize: "0.9rem" }}>Loading events…</p>
                  ) : categoryProducts.length > 0 ? (
                    <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {categoryProducts.map((product: any) => (
                        <li key={product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem", borderBottom: `1px dashed ${C.borderDashed}` }}>
                          <span style={{ color: C.text, fontSize: "0.9rem" }}>{product.title}</span>
                          <span className="font-['IBM_Plex_Mono']" style={{ color: C.amber, fontSize: "0.85rem" }}>${product.price}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: C.textMuted, fontSize: "0.9rem" }}>No events found in this category right now.</p>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <SectionButton onClick={() => (window.location.href = route("events.index", activeCategory.id))} variant="solid">
                    Get Tickets
                  </SectionButton>
                  <SectionButton onClick={() => setActiveCategory(null)} variant="outline">
                    Close
                  </SectionButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ PILLARS — Why book with us ══ */}
        <section className="pillars-section" data-aos="fade-up">
          <div className="box-container">
            <div className="pillars-heading-wrap">
              <Eyebrow center>The Box Office Difference</Eyebrow>
              <Title center>Why Book <span style={{ color: C.amber }}>With Us</span></Title>
              <Ornament center />
            </div>

            <div className="pillars-grid">
              {pillars.map((p, i) => (
                <div key={i} className="pillar-card" data-aos="fade-up" data-aos-delay={i * 100}>
                  <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: `linear-gradient(${C.amber}, transparent)`, opacity: 0.5 }} />
                  <div style={{ width: 52, height: 52, marginBottom: "1.75rem", border: `1px solid ${C.border}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p.Icon style={{ width: 22, height: 22, color: C.amber }} />
                  </div>
                  <h3 className="font-['Anton']" style={{ textTransform: "uppercase", fontSize: "1.2rem", color: C.text, marginBottom: "0.875rem", letterSpacing: "0.01em" }}>
                    {p.title}
                  </h3>
                  <p style={{ color: C.textMuted, lineHeight: 1.8, fontSize: "0.9rem" }}>{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIALS ══ */}
        <section className="testimonials-section" data-aos="fade-up">
          <div className="box-container">
            <div className="testimonials-grid">
              <div style={{ paddingTop: "0.5rem" }}>
                <Eyebrow>Fan Love</Eyebrow>
                <Title>What fans <span style={{ color: C.amber }}>say</span></Title>
                <Ornament />
                <p className="testimonials-intro-text" style={{ color: C.textMuted, fontSize: "0.9rem", lineHeight: 1.8, marginTop: "1.5rem" }}>
                  Thousands of five-star reviews from people who trust us with their night out.
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: "2.5rem" }}>
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTestimonial(i)}
                      style={{ width: i === activeTestimonial ? 28 : 8, height: 8, borderRadius: 4, background: i === activeTestimonial ? C.amber : C.border, border: "none", cursor: "pointer", padding: 0, transition: "width 300ms ease, background 300ms ease", flexShrink: 0 }}
                      aria-label={`Testimonial ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="testimonials-cards-wrap">
                {testimonials.map((t, i) => (
                  <div
                    key={i}
                    className="testimonials-card"
                    style={{
                      position: i === 0 ? "relative" : "absolute",
                      top: 0, left: 0, right: 0,
                      opacity: i === activeTestimonial ? 1 : 0,
                      transform: `translateY(${i === activeTestimonial ? 0 : 16}px)`,
                      transition: "opacity 500ms ease, transform 500ms ease",
                      pointerEvents: i === activeTestimonial ? "all" : "none",
                      background: C.bg, border: `1px solid ${C.border}`,
                    }}
                  >
                    <div style={{ display: "flex", gap: 2, marginBottom: "1.5rem" }}>
                      {Array.from({ length: t.stars }).map((_, si) => (
                        <StarIcon key={si} style={{ width: 13, height: 13, color: C.amber, flexShrink: 0 }} />
                      ))}
                    </div>
                    <p className="testimonials-quote" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500, color: C.text, lineHeight: 1.6, fontStyle: "italic" }}>
                      "{t.quote}"
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: 1, height: 32, background: C.amber, opacity: 0.5, flexShrink: 0 }} />
                      <div>
                        <p className="font-['IBM_Plex_Mono']" style={{ fontSize: "0.8rem", fontWeight: 500, color: C.text, letterSpacing: "0.04em" }}>
                          {t.name}
                        </p>
                        <p className="font-['IBM_Plex_Mono']" style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: C.textFaint, marginTop: 2 }}>
                          {t.service}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ CTA BAND ══ */}
        <section className="cta-band">
          <div
            style={{
              position: "absolute", right: "-2rem", top: "50%", transform: "translateY(-50%)",
              fontFamily: "'Anton', sans-serif", fontSize: "clamp(18rem, 30vw, 26rem)",
              color: "rgba(255,182,39,0.035)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
            }}
          >
            B
          </div>

          {[380, 250, 160].map((sz, i) => (
            <div key={i} style={{ position: "absolute", right: `${-sz / 2 + i * 24}px`, top: `${-sz / 2 + i * 18}px`, width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(255,182,39,${0.1 - i * 0.025})`, pointerEvents: "none" }} />
          ))}
          {[220, 140].map((sz, i) => (
            <div key={i} style={{ position: "absolute", left: `${-sz / 2 + i * 16}px`, bottom: `${-sz / 2 + i * 14}px`, width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(255,182,39,${0.07 - i * 0.02})`, pointerEvents: "none" }} />
          ))}

          <div className="box-container" style={{ textAlign: "center", position: "relative", zIndex: 1 }} data-aos="fade-up">
            <Eyebrow center>Don't Miss Out</Eyebrow>
            <h2 className="font-['Anton']" style={{ textTransform: "uppercase", fontSize: "clamp(2.2rem, 5vw, 3.75rem)", color: C.text, lineHeight: 1.1, maxWidth: 680, margin: "0 auto 1.5rem" }}>
              Never miss the <span style={{ color: C.amber }}>show</span>
            </h2>
            <p style={{ color: C.textMuted, fontSize: "1rem", lineHeight: 1.8, maxWidth: 460, margin: "0 auto 3rem" }}>
              New listings drop every week. Get your ticket before the room fills up.
            </p>

            <div style={{ display: "flex", gap: "2.5rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" }}>
              {["Verified Sellers", "Instant E-Tickets", "Sydney Wide", "Secure Checkout"].map((badge) => (
                <div key={badge} className="cta-trust-item">
                  <div style={{ width: 4, height: 4, background: C.amber, transform: "rotate(45deg)" }} />
                  <span className="font-['IBM_Plex_Mono']" style={{ fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: C.textFaint }}>
                    {badge}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <SectionButton href={route("events.index")} variant="solid">Get Tickets</SectionButton>
              <SectionButton href={route("contact.index")} variant="outline">Contact Us</SectionButton>
            </div>
          </div>
        </section>
      </AuthenticatedLayout>
    </div>
  );
}
