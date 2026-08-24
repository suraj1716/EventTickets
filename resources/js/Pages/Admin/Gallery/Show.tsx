import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";

import {
  AdminPageHeader,
  AdminBtn,
  ActionBtn,
  FlashMessage,
  StatusBadge,
} from "../../../Components/Admin/AdminComponents";

interface GalleryImage {
  id: number;
  url: string;
  thumb: string;
  name: string;
  size: string;
  order: number;
}

interface Gallery {
  id: number;
  title: string;
  active: boolean;
  created_at: string;
  images: GalleryImage[];
}

interface Props {
  gallery: Gallery;
  flash?: { success?: string; error?: string };
}

/* ── Lightbox ── */
function Lightbox({
  images,
  index,
  onClose,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
}) {
  const [cur, setCur] = useState(index);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCur((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setCur((i) => (i + 1) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  const img = images[cur];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(12,10,8,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Prev */}
      <button
        onClick={(e) => { e.stopPropagation(); setCur((i) => (i - 1 + images.length) % images.length); }}
        style={{
          position: "absolute", left: "2rem", top: "50%", transform: "translateY(-50%)",
          width: 44, height: 44,
          background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.3)",
          color: "white", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
      </button>

      {/* Image */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "min(900px, 88vw)", maxHeight: "80vh", position: "relative" }}
      >
        <img
          src={img.url}
          alt={img.name}
          style={{ display: "block", maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
        />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "1rem 1.25rem",
          background: "linear-gradient(to top, rgba(12,10,8,0.65), transparent)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        }}>
          <span style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontSize: "0.9rem", color: "rgba(255,255,255,0.7)",
          }}>
            {img.name}
          </span>
          <span style={{
            fontFamily: "var(--font-body)", fontSize: "10px",
            letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)",
          }}>
            {cur + 1} / {images.length}
          </span>
        </div>
      </div>

      {/* Next */}
      <button
        onClick={(e) => { e.stopPropagation(); setCur((i) => (i + 1) % images.length); }}
        style={{
          position: "absolute", right: "2rem", top: "50%", transform: "translateY(-50%)",
          width: 44, height: 44,
          background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.3)",
          color: "white", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: "1.5rem", right: "1.5rem",
          width: 36, height: 36,
          background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.25)",
          color: "white", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.1rem",
        }}
      >
        ×
      </button>
    </div>
  );
}

/* ── Image tile ── */
function ImageTile({
  image,
  onOpen,
  onDelete,
}: {
  image: GalleryImage;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        aspectRatio: "4/3",
        borderRadius: "var(--radius-sm)",
        overflow: "hidden",
        background: "var(--color-bg-alt)",
        border: `1px solid ${hovered ? "rgba(201,169,110,0.4)" : "var(--color-border)"}`,
        cursor: "pointer",
        transition: "border-color 200ms ease",
      }}
    >
      <img
        src={image.thumb || image.url}
        alt={image.name}
        onClick={onOpen}
        style={{
          width: "100%", height: "100%",
          objectFit: "cover", display: "block",
          transition: "transform .5s ease",
          transform: hovered ? "scale(1.06)" : "scale(1)",
        }}
      />

      {/* Hover overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(12,10,8,0.45)",
        opacity: hovered ? 1 : 0,
        transition: "opacity 200ms ease",
        display: "flex", alignItems: "flex-end",
        padding: "8px",
        gap: 6,
        justifyContent: "flex-end",
      }}>
        {/* View */}
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          style={{
            width: 28, height: 28,
            background: "rgba(201,169,110,0.15)",
            border: "1px solid rgba(201,169,110,0.4)",
            borderRadius: "var(--radius-sm)",
            color: "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            width: 28, height: 28,
            background: "rgba(192,57,43,0.15)",
            border: "1px solid rgba(192,57,43,0.4)",
            borderRadius: "var(--radius-sm)",
            color: "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* File size badge */}
      <div style={{
        position: "absolute", top: 6, left: 6,
        background: "rgba(12,10,8,0.6)",
        padding: "2px 7px",
        borderRadius: "var(--radius-full)",
        fontFamily: "var(--font-body)", fontSize: "9px",
        letterSpacing: "0.06em",
        color: "rgba(255,255,255,0.55)",
      }}>
        {image.size}
      </div>
    </div>
  );
}

/* ── Page ── */
export default function GalleryShow({ gallery, flash }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const deleteImage = (mediaId: number) => {
    if (!confirm("Remove this image?")) return;
    router.delete(route("admin.gallery.destroyImage", { gallery: gallery.id, media: mediaId }));
  };

  const deleteGallery = () => {
    if (!confirm(`Delete "${gallery.title}" and all its images?`)) return;
    router.delete(route("admin.gallery.destroy", gallery.id));
  };

  return (
    <AdminLayout>
      <Head title={gallery.title} />

      <AdminPageHeader
        eyebrow="Admin · Gallery"
        title={<em style={{ fontStyle: "italic" }}>{gallery.title}</em>}
        meta={`${gallery.images.length} image${gallery.images.length !== 1 ? "s" : ""} · Created ${gallery.created_at}`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn variant="ghost" as="a" href={route("admin.gallery.index")}>
              ← Back
            </AdminBtn>
            <AdminBtn variant="ghost" as="a" href={route("admin.gallery.edit", gallery.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </AdminBtn>
            <AdminBtn variant="danger" onClick={deleteGallery}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </AdminBtn>
          </div>
        }
      />

      <FlashMessage flash={flash ?? {}} />

      {/* Meta row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        marginBottom: 24,
        padding: "12px 16px",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
      }}>
        <StatusBadge status={gallery.active ? "active" : "draft"} />
        <div style={{ width: 1, height: 16, background: "var(--color-border)" }} />
        <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-text-muted)" }}>
          {gallery.images.length} image{gallery.images.length !== 1 ? "s" : ""}
        </span>
        <div style={{ flex: 1 }} />
        <AdminBtn variant="accent" size="sm" as="a" href={route("admin.gallery.edit", gallery.id)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 11, height: 11 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Images
        </AdminBtn>
      </div>

      {/* Image grid */}
      {gallery.images.length === 0 ? (
        <div style={{
          background: "var(--color-surface)",
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "64px 20px",
          textAlign: "center",
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
            style={{ width: 40, height: 40, color: "var(--color-text-muted)", margin: "0 auto 12px", display: "block" }}>
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
          </svg>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 300, color: "var(--color-text-muted)", margin: "0 0 16px" }}>
            No images yet
          </p>
          <AdminBtn variant="accent" as="a" href={route("admin.gallery.edit", gallery.id)}>
            Upload Images
          </AdminBtn>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 10,
        }}>
          {gallery.images.map((img, i) => (
            <ImageTile
              key={img.id}
              image={img}
              onOpen={() => setLightboxIndex(i)}
              onDelete={() => deleteImage(img.id)}
            />
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={gallery.images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </AdminLayout>
  );
}
