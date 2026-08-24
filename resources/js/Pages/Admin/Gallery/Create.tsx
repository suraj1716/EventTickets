import React, { useRef, useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import {
  AdminPageHeader,
  AdminBtn,
  FlashMessage,
} from "../../../Components/Admin/AdminComponents";
import AdminLayout from "../AdminLayout";

/* ─────────────────────────────────────────────
   Shared field / label styles
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
  fontFamily: "var(--font-body)",
  fontSize: "11px",
  color: "var(--color-error)",
  marginTop: 5,
};

/* ─────────────────────────────────────────────
   ImageDropZone
───────────────────────────────────────────── */
interface PreviewFile { file: File; url: string; }

function ImageDropZone({
  previews,
  onChange,
  onRemove,
}: {
  previews: PreviewFile[];
  onChange: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    onChange(valid);
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        style={{
          border: `1px dashed ${dragging ? "var(--color-accent)" : "var(--color-border)"}`,
          borderRadius: "var(--radius-sm)",
          padding: "32px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(201,169,110,0.04)" : "var(--color-bg-alt)",
          transition: "all 200ms ease",
          marginBottom: 12,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
          style={{ width: 32, height: 32, color: "var(--color-text-muted)", margin: "0 auto 10px", display: "block" }}>
          <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
        </svg>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
          Drop images here or <span style={{ color: "var(--color-accent)" }}>click to browse</span>
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", color: "var(--color-text-light)", margin: "4px 0 0", letterSpacing: "0.05em" }}>
          JPG · PNG · WEBP — multiple allowed
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
          gap: 8,
        }}>
          {previews.map((p, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "1" }}>
              <img
                src={p.url}
                alt=""
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover",
                  borderRadius: "var(--radius-sm)",
                  display: "block",
                  border: "1px solid var(--color-border)",
                }}
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={{
                  position: "absolute", top: 4, right: 4,
                  width: 20, height: 20,
                  background: "rgba(12,10,8,0.75)",
                  border: "1px solid rgba(201,169,110,0.3)",
                  borderRadius: "var(--radius-full)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
interface Props {
  flash?: { success?: string; error?: string };
}

export default function GalleryCreate({ flash }: Props) {
  const { data, setData, errors, processing } = useForm({
    title: "",
    active: true as boolean,
  });

  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);

  const addImages = (files: File[]) => {
    const next = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews((prev) => [...prev, ...next]);
  };

  const removeImage = (index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("active", data.active ? "1" : "0");
    previews.forEach((p) => fd.append("images[]", p.file));
    router.post(route("admin.gallery.store"), fd as any, {
      forceFormData: true,
    });
  };

  return (
    <AdminLayout>
      <Head title="New Gallery" />

      <AdminPageHeader
        eyebrow="Admin · Gallery"
        title={<>New <em style={{ fontStyle: "italic", color: "var(--color-accent)" }}>Collection</em></>}
      />

      <FlashMessage flash={flash ?? {}} />

      <div style={{ maxWidth: 640 }}>
        {/* Card */}
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "28px 28px",
        }}>
          <form onSubmit={submit}>

            {/* Title */}
            <div style={fieldWrap}>
              <label style={label}>Title *</label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData("title", e.target.value)}
                placeholder="e.g. Spring Colour Transformations"
                style={inputStyle}
              />
              {errors.title && <p style={errorStyle}>{errors.title}</p>}
            </div>

            {/* Active toggle */}
            <div style={{ ...fieldWrap, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ ...label, marginBottom: 2 }}>Active</span>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
                  Visible on the public gallery page
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
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 250ms ease",
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 3, left: data.active ? 22 : 3,
                  width: 16, height: 16,
                  background: data.active ? "white" : "var(--color-text-muted)",
                  borderRadius: "50%",
                  transition: "left 250ms ease",
                }} />
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0 20px" }} />

            {/* Images */}
            <div style={fieldWrap}>
              <label style={label}>Images</label>
              <ImageDropZone
                previews={previews}
                onChange={addImages}
                onRemove={removeImage}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <AdminBtn variant="ghost" as="a" href={route("admin.gallery.index")}>
                Cancel
              </AdminBtn>
              <AdminBtn variant="accent" type="submit" disabled={processing}>
                {processing ? (
                  "Saving…"
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Create Gallery
                  </>
                )}
              </AdminBtn>
            </div>

          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
