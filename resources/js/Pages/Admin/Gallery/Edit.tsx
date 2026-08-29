import React, { useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  SlideOver,
  SlideOverActions,
  FlashMessage,
  ConfirmModal,
  Icons,
  AdminBtn,
  C,
  fontBody,
} from "../../../Components/Admin/AdminComponents";
import { useAdminForm, Field, AdminInput, AdminToggle } from "../../../Components/Admin/useAdminForm";

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "block", fontFamily: fontBody, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.textFaint, margin: "4px 0 10px" }}>
      {children}
    </span>
  );
}

function ImageDropZone({ previews, onChange, onRemove }: { previews: NewPreview[]; onChange: (files: File[]) => void; onRemove: (index: number) => void; }) {
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
          border: `1px dashed ${dragging ? C.amber : C.border}`,
          borderRadius: 8,
          padding: "24px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(201,169,110,0.06)" : C.bgAlt,
          transition: "all 200ms ease",
          marginBottom: previews.length ? 12 : 0,
        }}
      >
        <div style={{ opacity: 0.4, marginBottom: 8 }}><Icons.Upload /></div>
        <p style={{ fontFamily: fontBody, fontSize: 12, color: C.textMuted, margin: 0 }}>
          Add more images — <span style={{ color: C.amber }}>click or drop</span>
        </p>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => addFiles(e.target.files)} />
      </div>

      {previews.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
          {previews.map((p, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "1" }}>
              <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: 8, border: `1px solid ${C.border}` }} />
              <button type="button" onClick={() => onRemove(i)} style={{
                position: "absolute", top: 4, right: 4, width: 18, height: 18,
                background: "rgba(12,10,8,0.75)", border: "1px solid rgba(201,169,110,0.3)",
                borderRadius: "50%", color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9,
              }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExistingImageGrid({ images, onDelete }: { images: ExistingImage[]; onDelete: (id: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (images.length === 0) {
    return <p style={{ fontFamily: fontBody, fontSize: 12, color: C.textMuted, margin: "8px 0" }}>No images uploaded yet.</p>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
      {images.map((img) => (
        <div
          key={img.id}
          onMouseEnter={() => setHovered(img.id)}
          onMouseLeave={() => setHovered(null)}
          style={{ position: "relative", aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", border: `1px solid ${hovered === img.id ? C.error : C.border}`, transition: "border-color 150ms ease" }}
        >
          <img src={img.thumb || img.url} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .4s ease", transform: hovered === img.id ? "scale(1.05)" : "scale(1)" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(12,10,8,0.5)", opacity: hovered === img.id ? 1 : 0, transition: "opacity 150ms ease", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button type="button" onClick={() => onDelete(img.id)} style={{ width: 30, height: 30, background: "rgba(192,57,43,0.2)", border: "1px solid rgba(192,57,43,0.5)", borderRadius: 8, color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icons.Delete />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GalleryEdit({ gallery, flash }: Props) {
  const indexHref = route("admin.gallery.index");
  const { data, set, errors, processing, put } = useAdminForm({
    title: gallery.title,
    active: gallery.active,
  });

  const [existingImages, setExistingImages] = useState<ExistingImage[]>(gallery.images);
  const [newPreviews, setNewPreviews] = useState<NewPreview[]>([]);
  const [imageToDelete, setImageToDelete] = useState<ExistingImage | null>(null);

  const addImages = (files: File[]) => {
    const next = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setNewPreviews((prev) => [...prev, ...next]);
  };

  const removeNewPreview = (index: number) => {
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const confirmDeleteExisting = () => {
    if (!imageToDelete) return;
    router.delete(
      route("admin.gallery.destroyImage", { gallery: gallery.id, media: imageToDelete.id }),
      {
        preserveState: true,
        onSuccess: () => setExistingImages((imgs) => imgs.filter((i) => i.id !== imageToDelete.id)),
        onFinish: () => setImageToDelete(null),
      },
    );
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("active", data.active ? "1" : "0");
    newPreviews.forEach((p) => fd.append("images[]", p.file));
    return fd;
  };

  const handleSubmit = () => {
    put(route("admin.gallery.update", gallery.id), {
      transform: buildFormData,
      onSuccess: () => setNewPreviews([]),
    });
  };

  return (
    <>
      <Head title={`Edit · ${gallery.title}`} />
      <AdminLayout>
        <FlashMessage flash={flash ?? {}} />

        {imageToDelete && (
          <ConfirmModal
            title="Remove Image"
            description="Remove this image from the gallery? This cannot be undone."
            confirmLabel="Remove"
            onConfirm={confirmDeleteExisting}
            onCancel={() => setImageToDelete(null)}
          />
        )}

        <SlideOver
          eyebrow="Gallery"
          title={`Edit ${gallery.title}`}
          subtitle="Update details and manage this collection's images."
          width={560}
          closeHref={indexHref}
          footer={
            <SlideOverActions
              onCancel={() => (window.location.href = indexHref)}
              onSubmit={handleSubmit}
              processing={processing}
              disabled={!data.title.trim()}
              submitLabel="Save Changes"
            />
          }
        >
          <Field label="Title" required error={errors.title}>
            <AdminInput type="text" value={data.title} onChange={(e) => set("title", e.target.value)} error={!!errors.title} autoFocus />
          </Field>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: fontBody, fontSize: 13, color: C.text, fontWeight: 500 }}>Active</div>
              <div style={{ fontFamily: fontBody, fontSize: 11, color: C.textMuted, marginTop: 2 }}>Show on the public gallery page</div>
            </div>
            <AdminToggle checked={data.active} onChange={(v) => set("active", v)} />
          </div>

          <div style={{ borderTop: `1px dashed ${C.borderDashed}`, paddingTop: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <SectionLabel>Current Images</SectionLabel>
              <span style={{ fontFamily: fontBody, fontSize: 11, color: C.textMuted }}>
                {existingImages.length} image{existingImages.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ExistingImageGrid images={existingImages} onDelete={(id) => setImageToDelete(existingImages.find((i) => i.id === id) ?? null)} />
          </div>

          <div style={{ borderTop: `1px dashed ${C.borderDashed}`, paddingTop: 16 }}>
            <SectionLabel>Add New Images</SectionLabel>
            <ImageDropZone previews={newPreviews} onChange={addImages} onRemove={removeNewPreview} />
            {newPreviews.length > 0 && (
              <p style={{ fontFamily: fontBody, fontSize: 11, color: C.textFaint, marginTop: 10 }}>
                {newPreviews.length} new image{newPreviews.length !== 1 ? "s" : ""} will upload with "Save Changes".
              </p>
            )}
          </div>
        </SlideOver>
      </AdminLayout>
    </>
  );
}
