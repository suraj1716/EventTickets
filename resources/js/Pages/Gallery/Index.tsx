import React, { useEffect, useState } from "react";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { motion, AnimatePresence } from "framer-motion";
import PageHero from "@/Components/Page/PageHero";
import IconButton from "@/Components/App/ui/IconButton";
import BentoTile from "@/Components/App/ui/BentoTile";
import { InertiaPage } from "@/types/InertiaPage";

interface GalleryImage {
  id: number;
  url: string;
}

interface GalleryItem {
  id: number;
  title: string;
  images: GalleryImage[];
}

interface Props extends PageProps {
  galleryItems: GalleryItem[];
}

/* ─────────────────────────────────────────────
   Lightbox
───────────────────────────────────────────── */
function Lightbox({
  image,
  title,
  onClose,
  onPrev,
  onNext,
}: {
  image: GalleryImage;
  title: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(12,10,8,0.94)",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* prev */}
        <IconButton
          onClick={e => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous image"
          size={48}
          style={{ position: "absolute", left: "2rem", top: "50%", transform: "translateY(-50%)", zIndex: 10 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </IconButton>

        {/* image */}
        <motion.div
          key={image.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={e => e.stopPropagation()}
          style={{ position: "relative", maxWidth: "min(900px, 88vw)", maxHeight: "80vh" }}
        >
          {/* corner accents */}
          {[
            { top: 0, left: 0, borderTop: "1px solid var(--color-accent)", borderLeft: "1px solid var(--color-accent)" },
            { top: 0, right: 0, borderTop: "1px solid var(--color-accent)", borderRight: "1px solid var(--color-accent)" },
            { bottom: 0, left: 0, borderBottom: "1px solid var(--color-accent)", borderLeft: "1px solid var(--color-accent)" },
            { bottom: 0, right: 0, borderBottom: "1px solid var(--color-accent)", borderRight: "1px solid var(--color-accent)" },
          ].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: 20, height: 20, zIndex: 2, ...s }} />
          ))}
          <img
            src={image.url}
            alt={title}
            style={{ display: "block", maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
          />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "1rem 1.25rem",
            background: "linear-gradient(to top, rgba(12,10,8,0.7), transparent)",
          }}>
            <span style={{
              fontFamily: "var(--font-display)", fontStyle: "italic",
              fontSize: "1rem", fontWeight: 300, color: "rgba(255,255,255,0.7)",
            }}>{title}</span>
          </div>
        </motion.div>

        {/* next */}
        <IconButton
          onClick={e => { e.stopPropagation(); onNext(); }}
          aria-label="Next image"
          size={48}
          style={{ position: "absolute", right: "2rem", top: "50%", transform: "translateY(-50%)", zIndex: 10 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </IconButton>

        {/* close */}
        <IconButton
          onClick={onClose}
          aria-label="Close"
          size={40}
          style={{ position: "absolute", top: "1.5rem", right: "1.5rem", fontSize: "1.1rem" }}
        >
          ×
        </IconButton>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   Bento tile
───────────────────────────────────────────── */
/*
  Bento span pattern per section (repeats every 5 tiles):
  0 → col-span-2 row-span-2  (hero)
  1 → col-span-1 row-span-1
  2 → col-span-1 row-span-1
  3 → col-span-1 row-span-2  (tall)
  4 → col-span-2 row-span-1  (wide)
*/
const SPANS = [
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-2",
  "col-span-2 row-span-1",
];


/* ─────────────────────────────────────────────
   Gallery section
───────────────────────────────────────────── */
function GallerySection({
  gallery,
  index: sectionIndex,
}: {
  gallery: GalleryItem;
  index: number;
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const openAt = (i: number) => setLightbox(i);
  const close = () => setLightbox(null);
  const prev = () => setLightbox(i => i !== null ? (i - 1 + gallery.images.length) % gallery.images.length : null);
  const next = () => setLightbox(i => i !== null ? (i + 1) % gallery.images.length : null);

  return (
    <div style={{ marginBottom: "5rem", padding: "0 clamp(1rem, 4vw, 3rem)" }}>

      {/* Section title bar */}
      {gallery.title && (
        <div style={{
          display: "flex", alignItems: "center", gap: "1.25rem",
          marginBottom: "1.5rem",
        }}>
          <div style={{ width: 3, height: 28, background: "var(--color-accent)", flexShrink: 0 }} />
          <h3 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(1.25rem, 2vw, 1.6rem)",
            fontWeight: 300, color: "var(--color-text)", margin: 0,
          }}>{gallery.title}</h3>
          <div style={{ height: 1, flex: 1, background: "var(--color-border)" }} />
          <span style={{
            fontFamily: "var(--font-body)", fontSize: "0.62rem",
            letterSpacing: "0.18em", textTransform: "uppercase",
            color: "var(--color-text-muted)",
            whiteSpace: "nowrap",
          }}>{gallery.images.length} images</span>
        </div>
      )}

      {/* Bento grid */}
      <div
        className="grid grid-cols-3 gap-[10px]"
        style={{ gridAutoRows: "clamp(120px, 16vw, 220px)" }}
      >
        {gallery.images.map((image, i) => (
          <BentoTile
            key={image.id}
            image={image.url}
            title={gallery.title}
            eyebrow="Our Work"
            size={i % SPANS.length === 0 ? "hero" : "normal"}
            cornerBrackets
            viewIcon
            onOpen={() => openAt(i)}
            index={i}
            className={SPANS[i % SPANS.length]}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox
          image={gallery.images[lightbox]}
          title={gallery.title}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  );
}
/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */


interface GalleryImage {
  id: number;
  url: string;
}

interface GalleryItem {
  id: number;
  title: string;
  images: GalleryImage[];
}

interface Props {
  galleryItems: GalleryItem[];
}

const Gallery: InertiaPage<Props> = ({ galleryItems }) => {
  return (
    <>
      <Head title="Gallery" />

      <PageHero
        eyebrow="Our Work"
        title={<>The Gallery <em></em></>}
        subtitle="A curated collection of our finest work — colour transformations, precision cuts, and restorative treatments."
        breadcrumbs={[{ label: "Home", href: route("home") }, { label: "Gallery" }]}
      />

      <section
        style={{
          width: "100%",
          paddingTop: "6rem",
          paddingBottom: "6rem",
          background: "var(--color-bg)",
          fontFamily: "var(--font-body)",
        }}
      >
        {galleryItems.map((gallery, i) => (
          <GallerySection key={gallery.id} gallery={gallery} index={i} />
        ))}
      </section>
    </>
  );
};

Gallery.layout = (page: React.ReactNode) => <AuthenticatedLayout>{page}</AuthenticatedLayout>;

export default Gallery;
