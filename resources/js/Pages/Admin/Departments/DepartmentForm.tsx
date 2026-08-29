import React, { useState, useRef, useEffect } from "react";
import { Head } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  SlideOver,
  SlideOverActions,
  FlashMessage,
  Icons,
  AdminBtn,
  C,
  fontBody,
} from "../../../Components/Admin/AdminComponents";
import {
  useAdminForm,
  Field,
  AdminInput,
  AdminTextarea,
  AdminToggle,
} from "../../../Components/Admin/useAdminForm";

interface Department {
  image_url: string | (() => string | null) | null;
  id: number;
  name: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  active: boolean | number;
}

interface Props {
  department?: Department;
  flash: { success?: string; error?: string };
}

function SlugChip({ slug }: { slug: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: "8px", marginTop: 6 }}>
      <span style={{ fontFamily: fontBody, fontSize: "10px", color: C.textMuted }}>/departments/</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: slug ? C.amber : C.textMuted }}>
        {slug || "auto-generated"}
      </span>
    </div>
  );
}

export default function DepartmentForm({ department, flash }: Props) {
  const isEdit = !!department;
  const indexHref = route("admin.departments.index");

  const { data, set, errors, processing, post, put } = useAdminForm({
    name:             department?.name             ?? "",
    slug:             department?.slug             ?? "",
    meta_title:       department?.meta_title       ?? "",
    meta_description: department?.meta_description ?? "",
    active:           department ? Boolean(department.active) : true,
    image:            null as File | null,
    _remove_image:    false,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(
    department?.image_url ? department.image_url as string : null
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    set("image", file);
    set("_remove_image", false);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(department?.image_url ? department.image_url as string : null);
    }
  };

  const removeImage = () => {
    set("image", null);
    set("_remove_image", true);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const [slugManual, setSlugManual] = useState(false);
  useEffect(() => {
    if (!slugManual) {
      const generated = data.name
        .toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      set("slug", generated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.name, slugManual]);

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("name",             data.name);
    fd.append("slug",             data.slug);
    fd.append("meta_title",       data.meta_title       ?? "");
    fd.append("meta_description", data.meta_description ?? "");
    fd.append("active",           data.active ? "1" : "0");
    if (data.image)         fd.append("image",          data.image);
    if (data._remove_image) fd.append("_remove_image",  "1");
    return fd;
  };

  const handleSubmit = () => {
    if (isEdit) {
      put(route("admin.departments.update", department!.id), { transform: buildFormData });
    } else {
      post(route("admin.departments.store"), { transform: buildFormData });
    }
  };

  return (
    <>
      <Head title={isEdit ? `Edit — ${department!.name}` : "New Department"} />
      <AdminLayout>
        <FlashMessage flash={flash} />

        <SlideOver
          eyebrow="Catalogue"
          title={isEdit ? `Edit ${department!.name}` : "New Department"}
          subtitle={isEdit ? "Update this department's details." : "Add a department to the catalogue."}
          closeHref={indexHref}
          footer={
            <SlideOverActions
              onCancel={() => (window.location.href = indexHref)}
              onSubmit={handleSubmit}
              processing={processing}
              disabled={!data.name.trim()}
              submitLabel={isEdit ? "Save Changes" : "Create Department"}
            />
          }
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Field label="Department Name" required error={errors.name}>
              <AdminInput
                type="text" value={data.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Colour Services" maxLength={255}
                error={!!errors.name}
                autoFocus
              />
            </Field>

            <Field label="URL Slug" error={errors.slug}>
              <AdminInput
                type="text" value={data.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"));
                }}
                placeholder="auto-generated from name" maxLength={255}
                error={!!errors.slug}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              <SlugChip slug={data.slug} />
              {!slugManual && (
                <p style={{ fontFamily: fontBody, fontSize: "10px", color: C.textFaint, marginTop: 4, lineHeight: 1.5 }}>
                  Auto-generated from name. Click to customise.
                </p>
              )}
            </Field>

            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: "12px 14px", background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: 8,
              }}
            >
              <div>
                <div style={{ fontFamily: fontBody, fontSize: 13, color: C.text, fontWeight: 500 }}>Active</div>
                <div style={{ fontFamily: fontBody, fontSize: 11, color: C.textMuted, marginTop: 2 }}>Visible on the storefront</div>
              </div>
              <AdminToggle checked={data.active} onChange={(v) => set("active", v)} />
            </div>

            <Field label="Department Image" error={errors.image}>
              <div style={{ width: "100%", aspectRatio: "16/9", background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", marginBottom: 10 }}>
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button type="button" onClick={removeImage} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>×</button>
                  </>
                ) : (
                  <div style={{ textAlign: "center", color: C.textMuted }}>
                    <div style={{ opacity: 0.3, marginBottom: 8 }}><Icons.Image /></div>
                    <span style={{ fontFamily: fontBody, fontSize: "11px", opacity: 0.5 }}>No image uploaded</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              <AdminBtn variant="ghost" onClick={() => fileRef.current?.click()}>
                <Icons.Upload />
                {imagePreview ? "Replace Image" : "Upload Image"}
              </AdminBtn>
              <p style={{ fontFamily: fontBody, fontSize: "10px", color: C.textMuted, margin: "8px 0 0", lineHeight: 1.6 }}>
                JPEG, PNG or WebP · Max 2 MB · Recommended 1200 × 675 px
              </p>
            </Field>

            <div style={{ borderTop: `1px dashed ${C.borderDashed}`, paddingTop: 16 }}>
              <span style={{ display: "block", fontFamily: fontBody, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.textFaint, marginBottom: 12 }}>
                SEO / Meta
              </span>

              <Field label="Meta Title" error={errors.meta_title}>
                <AdminInput
                  type="text" value={data.meta_title ?? ""}
                  onChange={(e) => set("meta_title", e.target.value)}
                  placeholder="Overrides page title in search results" maxLength={60}
                  error={!!errors.meta_title}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                  <span style={{ fontFamily: fontBody, fontSize: "10px", color: (data.meta_title?.length ?? 0) > 60 ? C.amber : C.textFaint }}>
                    {data.meta_title?.length ?? 0}/60
                  </span>
                </div>
              </Field>

              <Field label="Meta Description" error={errors.meta_description}>
                <AdminTextarea
                  value={data.meta_description ?? ""}
                  onChange={(e) => set("meta_description", e.target.value)}
                  placeholder="Short description shown in search engine results…"
                  rows={3} maxLength={500}
                  error={!!errors.meta_description}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                  <span style={{ fontFamily: fontBody, fontSize: "10px", color: (data.meta_description?.length ?? 0) > 160 ? C.amber : C.textFaint }}>
                    {data.meta_description?.length ?? 0}/160
                  </span>
                </div>
              </Field>

              {(data.meta_title || data.name) && (
                <div style={{ padding: "14px 16px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "8px" }}>
                  <p style={{ margin: "0 0 2px", fontFamily: fontBody, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.textFaint }}>Search preview</p>
                  <p style={{ margin: "4px 0 2px", fontFamily: fontBody, fontSize: "14px", color: C.info, fontWeight: 500 }}>{data.meta_title || data.name}</p>
                  <p style={{ margin: 0, fontFamily: fontBody, fontSize: "12px", color: C.success }}>yoursite.com/departments/{data.slug || "slug"}</p>
                  {data.meta_description && (
                    <p style={{ margin: "4px 0 0", fontFamily: fontBody, fontSize: "12px", color: C.textMuted, lineHeight: 1.5 }}>
                      {data.meta_description.slice(0, 160)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </SlideOver>
      </AdminLayout>
    </>
  );
}
