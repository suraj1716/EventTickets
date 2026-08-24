"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "@inertiajs/react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface Banner {
  image_url: string | null;
  id: number;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
}

interface Props {
  banners: Banner[];
}

/* ─────────────────────────────────────────────
   Ornament
───────────────────────────────────────────── */
function Ornament({ light = false }: { light?: boolean }) {
  const color = light ? "rgba(201,169,110,0.6)" : "var(--color-accent)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "1.25rem 0",
      }}
    >
      <div style={{ width: 36, height: 1, background: color }} />
      <div
        style={{
          width: 5,
          height: 5,
          background: color,
          transform: "rotate(45deg)",
        }}
      />
      <div style={{ width: 36, height: 1, background: color }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Slide
───────────────────────────────────────────── */
function Slide({
  banner,
  active,
  direction,
}: {
  banner: Banner;
  active: boolean;
  direction: "left" | "right";
}) {
  return (
   <div
  className="md:py-24 lg:py-32 xl:py-32 2xl:py-48"
  style={{
    position: "absolute",
    inset: 0,
    transition: "opacity 800ms ease, transform 800ms ease",
    opacity: active ? 1 : 0,
    transform: active
      ? "scale(1)"
      : direction === "right"
        ? "scale(1.03)"
        : "scale(0.97)",
    zIndex: active ? 1 : 0,
    pointerEvents: active ? "all" : "none",
  }}
>
      {/* background image */}
      <style>{`
  .hero-slide-img {
    object-position: center;
  }
  @media (max-width: 767px) {
    .hero-slide-img {
      object-position: 70% center; /* nudge toward subject; tune per your banner art */
    }
  }
`}</style>
      <img
        className="hero-slide-img"
        src={banner.image_url ?? "/images/placeholder-category.jpg"}
        alt={banner.title}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 6s ease",
          transform: active ? "scale(1.06)" : "scale(1)",
        }}
      />

      {/* layered overlays */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(28,26,23,0.72) 0%, rgba(28,26,23,0.38) 55%, rgba(28,26,23,0.15) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(28,26,23,0.55) 0%, transparent 50%)",
        }}
      />

      {/* content */}
     <div
  style={{
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    padding: "40px 6vw",
    boxSizing: "border-box",
    zIndex: 2,
  }}
>
        <div
          style={{
            maxWidth: 620,
            transform: active ? "translateY(0)" : "translateY(24px)",
            opacity: active ? 1 : 0,
            transition: "transform 900ms ease 200ms, opacity 900ms ease 200ms",
          }}
        >
          {/* eyebrow */}
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.68rem",
              fontWeight: 400,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "var(--color-accent-light)",
              display: "block",
            }}
          >
            Sydney&apos;s Luxury Hair Atelier
          </span>

          <Ornament light />

          {/* title */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.75rem, 6vw, 5rem)",
              fontWeight: 300,
              color: "white",
              lineHeight: 1.08,
              letterSpacing: "-0.01em",
              marginBottom: "0.5rem",
            }}
          >
            {banner.title.split(" ").map((word, wi, arr) =>
              wi === arr.length - 1 ? (
                <em
                  key={wi}
                  style={{
                    fontStyle: "italic",
                    color: "var(--color-accent-light)",
                  }}
                >
                  {" "}
                  {word}
                </em>
              ) : (
                <span key={wi}>{word} </span>
              ),
            )}
          </h1>

          {/* subtitle */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
              fontWeight: 300,
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.75,
              maxWidth: 460,
              marginBottom: "2.25rem",
            }}
          >
            {banner.subtitle}
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
            {banner.button_link && banner.button_text && (
              <a
                href={banner.button_link}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 28px",
                  background: "var(--color-accent)",
                  color: "var(--color-bg-dark)",
                  border: "1px solid var(--color-accent)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transition: "background 250ms ease, border-color 250ms ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "var(--color-accent-dark)";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor =
                    "var(--color-accent-dark)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "var(--color-accent)";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor =
                    "var(--color-accent)";
                }}
              >
                {banner.button_text}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ width: 14, height: 14 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </a>
            )}

            <a
              href={route("shop.search")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "13px 28px",
                background: "transparent",
                color: "white",
                border: "1px solid rgba(255,255,255,0.45)",
                fontFamily: "var(--font-body)",
                fontSize: "0.7rem",
                fontWeight: 400,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "background 250ms ease, border-color 250ms ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "white";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "rgba(255,255,255,0.45)";
              }}
            >
              Explore Services
            </a>
          </div>

          {/* trust badges */}
          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              marginTop: "2.5rem",
              flexWrap: "wrap",
            }}
          >
            {["5-Star Rated", "Est. 2009", "Sydney CBD"].map((badge) => (
              <div
                key={badge}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 4,
                    background: "var(--color-accent)",
                    transform: "rotate(45deg)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.65rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  {badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main carousel
───────────────────────────────────────────── */
export default function HeroCarousel({ banners }: Props) {
  const activeBanners = banners.filter((b) => b.is_active);
  const total = activeBanners.length;

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (idx: number, dir: "left" | "right" = "right") => {
      setDirection(dir);
      setCurrent((idx + total) % total);
    },
    [total],
  );

  const next = useCallback(() => goTo(current + 1, "right"), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1, "left"), [current, goTo]);

  /* auto-advance */
  useEffect(() => {
    if (total <= 1 || paused) return;
    intervalRef.current = setInterval(next, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [next, paused, total]);

  /* keyboard */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  if (!activeBanners.length) return null;

  /* single banner — no controls needed */
  if (total === 1) {
    return (
      <div
        style={{
          position: "relative",
          height: "min(92vh, 860px)",
          overflow: "hidden",
        }}
        aria-label="Hero banner"
      >
        <Slide banner={activeBanners[0]} active direction="right" />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        height: "clamp(520px, 78vh, 900px)", // shorter floor + ceiling than 92vh
        overflow: "hidden",
        userSelect: "none",
      }}
      aria-label="Hero carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* slides */}
      {activeBanners.map((banner, i) => (
        <Slide
          key={banner.id}
          banner={banner}
          active={i === current}
          direction={direction}
        />
      ))}

      {/* ── PREV / NEXT arrows ── */}
      {[
        { label: "Previous", action: prev, side: "left" as const },
        { label: "Next", action: next, side: "right" as const },
      ].map(({ label, action, side }) => (
        <button
          key={side}
          onClick={action}
          aria-label={label}
          style={{
            position: "absolute",
            top: "50%",
            [side]: 24,
            transform: "translateY(-50%)",
            zIndex: 10,
            width: 48,
            height: 48,
            background: "rgba(28,26,23,0.45)",
            border: "1px solid rgba(201,169,110,0.35)",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            transition: "background 200ms ease, border-color 200ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(201,169,110,0.25)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--color-accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(28,26,23,0.45)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(201,169,110,0.35)";
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{
              width: 18,
              height: 18,
              transform: side === "left" ? "rotate(180deg)" : "none",
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </button>
      ))}

      {/* ── bottom controls bar ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 6vw",
          background:
            "linear-gradient(to top, rgba(28,26,23,0.6) 0%, transparent 100%)",
        }}
      >
        {/* dot / index indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {activeBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? "right" : "left")}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === current ? 28 : 6,
                height: 6,
                borderRadius: 3,
                background:
                  i === current
                    ? "var(--color-accent)"
                    : "rgba(255,255,255,0.35)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 300ms ease, background 300ms ease",
              }}
            />
          ))}
        </div>

        {/* slide counter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--color-accent-light)",
            }}
          >
            {String(current + 1).padStart(2, "0")}
          </span>
          <div
            style={{
              width: 24,
              height: 1,
              background: "rgba(255,255,255,0.3)",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.1em",
            }}
          >
            {String(total).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* ── progress bar ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "rgba(255,255,255,0.12)",
          zIndex: 11,
        }}
      >
        <div
          key={current}
          style={{
            height: "100%",
            background: "var(--color-accent)",
            animation: paused ? "none" : "heroProgress 6s linear forwards",
            width: paused ? undefined : "0%",
          }}
        />
      </div>

      {/* progress keyframe */}
      <style>{`
        @keyframes heroProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
