import React, { useRef, useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";

import {
  AdminPageHeader,
  AdminBtn,
  FlashMessage,
} from "../../../Components/Admin/AdminComponents";

/* ─────────────────────────────────────────────
   Style constants (same as Create)
───────────────────────────────────────────── */
const label: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "10px",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontFamily: "var(--font-body)",
  fontSize: "13px",
  color: "var(--color-text)",
  background: "var(--color-bg-alt)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  outline: "none",
  boxSizing: "border-box",
};

const fieldWrap: React.CSSProperties = { marginBottom: 20 };
const errorStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "11px",
  color: "var(--color-error)", marginTop: 5,
};

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface ExistingImage {
  id: number;
  url: string;
  thumb: string;
  name: string;
  order: number;
}

interface Gallery {
  id: number;
  title: string;
  active: boolean;
  images: ExistingImage[];
}

interface Props {
  gallery: Gallery;
  flash?: { success?: string; error?: string };
}

interface NewPreview { file: File; url: string; }

/* ─────────────────────────────────────────────
   ImageDropZone (same pattern as Create)
───────────────────────────────────────────── */
function ImageDropZone({
  previews,
  onChange,
  onRemove,
}: {
  previews: NewPreview[];
  onChange: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    onChange(Array.from(files).filter((f) => f.type.startsWith("image/")));
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        style={{
          border: `1px dashed ${dragging ? "var(--color-accent)" : "var(--color-border)"}`,
          borderRadius: "var(--radius-sm)",
          padding: "24px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(201,169,110,0.04)" : "var(--color-bg-alt)",
          transition: "all 200ms ease",
          marginBottom: previews.length ? 12 : 0,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
          style={{ width: 26, height: 26, color: "var(--color-text-muted)", margin: "0 auto 8px", display: "block" }}>
          <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
        </svg>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
          Add more images — <span style={{ color: "var(--color-accent)" }}>click or drop</span>
        </p>
        <input ref={inputRef} type="file" accept="image/*" multiple
          style={{ display: "none" }} onChange={(e) => addFiles(e.target.files)} />
      </div>

      {previews.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
          gap: 8,
        }}>
          {previews.map((p, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "1" }}>
              <img src={p.url} alt=""
                style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                }}
              />
              <button type="button" onClick={() => onRemove(i)} style={{
                position: "absolute", top: 4, right: 4,
                width: 18, height: 18,
                background: "rgba(12,10,8,0.75)",
                border: "1px solid rgba(201,169,110,0.3)",
                borderRadius: "var(--radius-full)",
                color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "9px",
              }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ExistingImageGrid
───────────────────────────────────────────── */
function ExistingImageGrid({
  images,
  onDelete,
}: {
  images: ExistingImage[];
  onDelete: (id: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (images.length === 0) return (
    <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-text-muted)", margin: "8px 0" }}>
      No images uploaded yet.
    </p>
  );

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
      gap: 8,
    }}>
      {images.map((img) => (
        <div
          key={img.id}
          onMouseEnter={() => setHovered(img.id)}
          onMouseLeave={() => setHovered(null)}
          style={{
            position: "relative", aspectRatio: "4/3",
            borderRadius: "var(--radius-sm)", overflow: "hidden",
            border: `1px solid ${hovered === img.id ? "rgba(192,57,43,0.4)" : "var(--color-border)"}`,
            transition: "border-color 150ms ease",
          }}
        >
          <img
            src={img.thumb || img.url}
            alt={img.name}
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              transition: "transform .4s ease",
              transform: hovered === img.id ? "scale(1.05)" : "scale(1)",
            }}
          />
          {/* overlay on hover */}
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(12,10,8,0.5)",
            opacity: hovered === img.id ? 1 : 0,
            transition: "opacity 150ms ease",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <button
              type="button"
              onClick={() => onDelete(img.id)}
              style={{
                width: 30, height: 30,
                background: "rgba(192,57,43,0.2)",
                border: "1px solid rgba(192,57,43,0.5)",
                borderRadius: "var(--radius-sm)",
                color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function GalleryEdit({ gallery, flash }: Props) {
  const { data, setData, errors, processing } = useForm({
    title: gallery.title,
    active: gallery.active,
  });

  const [existingImages, setExistingImages] = useState<ExistingImage[]>(gallery.images);
  const [newPreviews, setNewPreviews] = useState<NewPreview[]>([]);

  /* Add new files */
  const addImages = (files: File[]) => {
    const next = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setNewPreviews((prev) => [...prev, ...next]);
  };

  /* Remove new preview (not yet uploaded) */
  const removeNewPreview = (index: number) => {
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  /* Delete existing image via separate DELETE request */
  const deleteExisting = (mediaId: number) => {
    if (!confirm("Remove this image?")) return;
    router.delete(
      route("admin.gallery.destroyImage", { gallery: gallery.id, media: mediaId }),
      {
        preserveState: true,
        onSuccess: () => setExistingImages((imgs) => imgs.filter((i) => i.id !== mediaId)),
      }
    );
  };

  /* Submit form */
  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("active", data.active ? "1" : "0");
    fd.append("_method", "PUT");
    newPreviews.forEach((p) => fd.append("images[]", p.file));

    router.post(route("admin.gallery.update", gallery.id), fd as any, {
      forceFormData: true,
    });
  };

  return (
    <AdminLayout>
      <Head title={`Edit · ${gallery.title}`} />

      <AdminPageHeader
        eyebrow="Admin · Gallery"
        title={<>Edit <em style={{ fontStyle: "italic", color: "var(--color-accent)" }}>{gallery.title}</em></>}
        action={
          <AdminBtn variant="ghost" as="a" href={route("admin.gallery.index", gallery.id)}>
            ← Back to Gallery
          </AdminBtn>
        }
      />

      <FlashMessage flash={flash ?? {}} />

      <div style={{ maxWidth: 700, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Details card ── */}
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}>
          {/* Card header */}
          <div style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 3, height: 16, background: "var(--color-accent)", borderRadius: 2 }} />
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "10px",
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--color-text-muted)",
            }}>Gallery Details</span>
          </div>

          <form onSubmit={submit} style={{ padding: "20px 20px" }}>

            {/* Title */}
            <div style={fieldWrap}>
              <label style={label}>Title *</label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData("title", e.target.value)}
                style={inputStyle}
              />
              {errors.title && <p style={errorStyle}>{errors.title}</p>}
            </div>

            {/* Active toggle */}
            <div style={{ ...fieldWrap, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ ...label, marginBottom: 2 }}>Active</span>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
                  Show on the public gallery page
                </p>
              </div>
              <div
                onClick={() => setData("active", !data.active)}
                style={{
                  width: 44, height: 24,
                  background: data.active ? "var(--color-primary)" : "var(--color-bg-alt)",
                  border: "1px solid",
                  borderColor: data.active ? "var(--color-primary)" : "var(--color-border)",
                  borderRadius: "var(--radius-full)",
                  cursor: "pointer", position: "relative",
                  transition: "all 250ms ease", flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute", top: 3,
                  left: data.active ? 22 : 3,
                  width: 16, height: 16,
                  background: data.active ? "white" : "var(--color-text-muted)",
                  borderRadius: "50%",
                  transition: "left 250ms ease",
                }} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <AdminBtn variant="ghost" as="a" href={route("admin.gallery.index")}>
                Cancel
              </AdminBtn>
              <AdminBtn variant="accent" type="submit" disabled={processing}>
                {processing ? "Saving…" : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </AdminBtn>
            </div>
          </form>
        </div>

        {/* ── Existing images card ── */}
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 3, height: 16, background: "var(--color-accent)", borderRadius: 2 }} />
              <span style={{
                fontFamily: "var(--font-body)", fontSize: "10px",
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: "var(--color-text-muted)",
              }}>Current Images</span>
            </div>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "11px",
              color: "var(--color-text-muted)",
            }}>
              {existingImages.length} image{existingImages.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ padding: "16px 20px" }}>
            <ExistingImageGrid images={existingImages} onDelete={deleteExisting} />
          </div>
        </div>

        {/* ── Add new images card ── */}
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 3, height: 16, background: "var(--color-accent)", borderRadius: 2 }} />
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "10px",
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--color-text-muted)",
            }}>Add New Images</span>
          </div>
          <div style={{ padding: "16px 20px" }}>
            <ImageDropZone
              previews={newPreviews}
              onChange={addImages}
              onRemove={removeNewPreview}
            />
            {newPreviews.length > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <AdminBtn
                  variant="accent"
                  onClick={() => {
                    const fd = new FormData();
                    fd.append("title", data.title);
                    fd.append("active", data.active ? "1" : "0");
                    fd.append("_method", "PUT");
                    newPreviews.forEach((p) => fd.append("images[]", p.file));
                    router.post(route("admin.gallery.update", gallery.id), fd as any, {
                      forceFormData: true,
                      onSuccess: () => setNewPreviews([]),
                    });
                  }}
                  disabled={processing}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
                    <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                  </svg>
                  Upload {newPreviews.length} Image{newPreviews.length !== 1 ? "s" : ""}
                </AdminBtn>
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
