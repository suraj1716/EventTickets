import React, { useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
  SlideOver,
  SlideOverActions,
  FlashMessage,
  Icons,
  C,
  fontBody,
} from "../../../Components/Admin/AdminComponents";
import { useAdminForm, Field, AdminInput, AdminToggle } from "../../../Components/Admin/useAdminForm";
import AdminLayout from "../AdminLayout";

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
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        style={{
          border: `1px dashed ${dragging ? C.amber : C.border}`,
          borderRadius: 8,
          padding: "32px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(201,169,110,0.06)" : C.bgAlt,
          transition: "all 200ms ease",
          marginBottom: 12,
        }}
      >
        <div style={{ opacity: 0.4, marginBottom: 10 }}>
          <Icons.Upload />
        </div>
        <p style={{ fontFamily: fontBody, fontSize: 12, color: C.textMuted, margin: 0, lineHeight: 1.6 }}>
          Drop images here or <span style={{ color: C.amber }}>click to browse</span>
        </p>
        <p style={{ fontFamily: fontBody, fontSize: 10, color: C.textFaint, margin: "4px 0 0", letterSpacing: "0.05em" }}>
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

      {previews.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
          {previews.map((p, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "1" }}>
              <img
                src={p.url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, display: "block", border: `1px solid ${C.border}` }}
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={{
                  position: "absolute", top: 4, right: 4,
                  width: 20, height: 20,
                  background: "rgba(12,10,8,0.75)",
                  border: "1px solid rgba(201,169,110,0.3)",
                  borderRadius: "50%",
                  color: "white",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, lineHeight: 1,
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
  const indexHref = route("admin.gallery.index");
  const { data, set, errors, processing } = useAdminForm({
    title: "",
    active: true as boolean,
  });

  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = () => {
    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("active", data.active ? "1" : "0");
    previews.forEach((p) => fd.append("images[]", p.file));
    setSubmitting(true);
    router.post(route("admin.gallery.store"), fd, {
      forceFormData: true,
      onFinish: () => setSubmitting(false),
    });
  };

  return (
    <>
      <Head title="New Gallery" />
      <AdminLayout>
        <FlashMessage flash={flash ?? {}} />

        <SlideOver
          eyebrow="Gallery"
          title="New Collection"
          subtitle="Add a gallery collection with its images."
          closeHref={indexHref}
          footer={
            <SlideOverActions
              onCancel={() => (window.location.href = indexHref)}
              onSubmit={handleSubmit}
              processing={submitting || processing}
              disabled={!data.title.trim()}
              submitLabel="Create Gallery"
            />
          }
        >
          <Field label="Title" required error={errors.title}>
            <AdminInput
              type="text"
              value={data.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Spring Colour Transformations"
              error={!!errors.title}
              autoFocus
            />
          </Field>

          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              padding: "12px 14px", background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontFamily: fontBody, fontSize: 13, color: C.text, fontWeight: 500 }}>Active</div>
              <div style={{ fontFamily: fontBody, fontSize: 11, color: C.textMuted, marginTop: 2 }}>Visible on the public gallery page</div>
            </div>
            <AdminToggle checked={data.active} onChange={(v) => set("active", v)} />
          </div>

          <Field label="Images" error={errors.images}>
            <ImageDropZone previews={previews} onChange={addImages} onRemove={removeImage} />
          </Field>
        </SlideOver>
      </AdminLayout>
    </>
  );
}
