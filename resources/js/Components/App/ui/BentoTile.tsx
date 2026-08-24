// resources/js/Components/App/ui/BentoTile.tsx
//
// Consolidates the "image tile → dark gradient → bottom title block" pattern
// that was independently hand-rolled in two places:
//   - Home.tsx's "Our Services" bento grid — CSS `group`/`group-hover`,
//     count subtitle, "Explore" pill badge in the corner.
//   - Gallery/Index.tsx's local `BentoTile` — framer-motion hover state,
//     "Our Work" eyebrow, corner brackets, sliding view-arrow icon.
// Visually these are the same tile with different trims, so this version
// uses framer-motion + useInView throughout and exposes the differences as
// props, instead of two near-identical implementations drifting apart.
//
// Usage (Home services grid — subtitle + corner "Explore" pill):
//   <BentoTile
//     image={`/storage/${cat.image}`}
//     title={cat.name}
//     subtitle={`${cat.products_count} treatments`}
//     size={idx === 0 || idx === 5 ? "hero" : "normal"}
//     footer="Explore"
//     onOpen={() => setActiveCategory(cat)}
//     index={idx}
//     style={{ gridColumn: idx === 0 || idx === 5 ? "span 2" : "span 1" }}
//   />
//
// Usage (Gallery grid — eyebrow + corner brackets + view icon):
//   <BentoTile
//     image={image.url}
//     title={title}
//     eyebrow="Our Work"
//     size={isHero ? "hero" : "normal"}
//     cornerBrackets
//     viewIcon
//     onOpen={onOpen}
//     index={index}
//     className={SPANS[index % SPANS.length]}
//   />

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

type Size = "hero" | "normal";

interface BentoTileProps {
  image: string;
  title: string;
  onOpen: () => void;
  index?: number;
  size?: Size;
  /** Small uppercase label above the title, e.g. "Our Work" (Gallery) */
  eyebrow?: string;
  /** Small uppercase line under the title, e.g. "12 treatments" (Home services) */
  subtitle?: string;
  /** Short label pill in the top-right corner that fades in on hover, e.g. "Explore" (Home services) */
  footer?: string;
  /** Thin accent corner brackets (Gallery) */
  cornerBrackets?: boolean;
  /** Arrow-icon box that slides in on hover, next to the title (Gallery) */
  viewIcon?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function BentoTile({
  image,
  title,
  onOpen,
  index = 0,
  size = "normal",
  eyebrow,
  subtitle,
  footer,
  cornerBrackets = false,
  viewIcon = false,
  className = "",
  style,
}: BentoTileProps) {
  const [hovered, setHovered] = useState(false);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.08 });
  const isHero = size === "hero";

  return (
    <motion.div
      ref={ref}
      className={["overflow-hidden relative cursor-pointer", className]
        .filter(Boolean)
        .join(" ")}
      style={{ background: "var(--color-surface)", minHeight: 180, ...style }}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, delay: (index % 5) * 0.07, ease: "easeOut" },
        },
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      {/* image */}
      <motion.img
        src={image}
        alt={title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          position: "absolute",
          inset: 0,
        }}
        animate={{ scale: hovered ? 1.07 : 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        loading="lazy"
        draggable={false}
      />

      {/* base gradient — always visible at bottom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(12,10,8,0.72) 0%, rgba(12,10,8,0.1) 45%, transparent 100%)",
          zIndex: 1,
        }}
      />

      {/* hover tint */}
      <motion.div
        style={{ position: "absolute", inset: 0, background: "rgba(201,169,110,0.08)", zIndex: 2 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      />

      {/* accent border on hover */}
      <motion.div
        style={{ position: "absolute", inset: 0, zIndex: 3, border: "1px solid rgba(201,169,110,0)" }}
        animate={{ borderColor: hovered ? "rgba(201,169,110,0.5)" : "rgba(201,169,110,0)" }}
        transition={{ duration: 0.25 }}
      />

      {/* corner brackets */}
      {cornerBrackets && (
        <>
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              width: 18,
              height: 18,
              borderTop: "1px solid var(--color-accent-light)",
              borderLeft: "1px solid var(--color-accent-light)",
              zIndex: 4,
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              width: 18,
              height: 18,
              borderBottom: "1px solid var(--color-accent-light)",
              borderRight: "1px solid var(--color-accent-light)",
              zIndex: 4,
              opacity: 0.5,
            }}
          />
        </>
      )}

      {/* corner "footer" pill, e.g. "Explore" — fades in on hover */}
      {footer && (
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 6 }}
        >
          <span
            style={{
              border: "1px solid rgba(201,169,110,0.6)",
              color: "var(--color-accent-light)",
              padding: "4px 14px",
              fontSize: "0.62rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {footer}
          </span>
        </motion.div>
      )}

      {/* title block */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: isHero ? "1.5rem 1.5rem" : "0.875rem 1rem",
          zIndex: 5,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <div>
          {eyebrow && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 20, height: 1, background: "var(--color-accent)", opacity: 0.8 }} />
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.58rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--color-accent-light)",
                  opacity: 0.8,
                }}
              >
                {eyebrow}
              </span>
            </div>
          )}
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: isHero ? "clamp(1.3rem, 2.5vw, 1.75rem)" : "1rem",
              fontWeight: 300,
              fontStyle: eyebrow ? "italic" : "normal",
              color: "white",
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: "0.01em",
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.5)",
                marginTop: 4,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {viewIcon && (
          <motion.div
            animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 6 }}
            transition={{ duration: 0.25 }}
            style={{
              width: 32,
              height: 32,
              flexShrink: 0,
              border: "1px solid rgba(201,169,110,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-accent-light)"
              strokeWidth="1.5"
              style={{ width: 14, height: 14 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
