import React, { useState, useRef, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  AdminBtn,
  FlashMessage,
  Icons,
} from "../../../Components/Admin/AdminComponents";
import { useAdminForm, inputClass } from "../../../Components/Admin/useAdminForm";

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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "10px", fontWeight: 500,
  letterSpacing: "0.18em", textTransform: "uppercase",
  color: "var(--color-text-muted)", marginBottom: 6,
};
const fieldWrap: React.CSSProperties = { display: "flex", flexDirection: "column" };
const hintStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "10px",
  color: "var(--color-text-muted)", marginTop: 4, lineHeight: 1.5,
};
const errorStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "11px",
  color: "#c0392b", marginTop: 4,
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-alt)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 3, height: 16, background: "var(--color-accent)", borderRadius: 2 }} />
        <span style={{ fontFamily: "var(--font-body)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{
      width: 44, height: 24, borderRadius: "var(--radius-full)",
      background: checked ? "var(--color-primary)" : "var(--color-border)",
      border: "none", cursor: "pointer", position: "relative",
      transition: "background 200ms ease", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "white",
        transition: "left 200ms ease", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function SlugChip({ slug }: { slug: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "var(--color-bg-alt)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", marginTop: 6 }}>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "10px", color: "var(--color-text-muted)" }}>/departments/</span>
      <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: slug ? "var(--color-primary)" : "var(--color-text-muted)" }}>
        {slug || "auto-generated"}
      </span>
    </div>
  );
}

function SaveBar({ isEdit, departmentName, processing, onSubmit, cancelHref }: {
  isEdit: boolean; departmentName?: string; processing: boolean; onSubmit: () => void; cancelHref: string;
}) {
  return (
    <div style={{
      position: "sticky", bottom: 0, zIndex: 40,
      background: "var(--color-surface)", borderTop: "1px solid var(--color-border)",
      padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      margin: "24px -28px -32px",
    }}>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--color-text-muted)", letterSpacing: "0.04em" }}>
        {isEdit ? `Editing: ${departmentName}` : "New department — unsaved"}
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <AdminBtn as="a" href={cancelHref} variant="ghost" size="sm">Cancel</AdminBtn>
        <AdminBtn onClick={onSubmit} disabled={processing} variant="accent">
          <Icons.Check />
          {processing ? "Saving…" : isEdit ? "Update Department" : "Create Department"}
        </AdminBtn>
      </div>
    </div>
  );
}

export default function DepartmentForm({ department, flash }: Props) {
  const isEdit = !!department;

  const { data, set, errors, processing, post, put } = useAdminForm({
    name:             department?.name             ?? "",
    slug:             department?.slug             ?? "",
    meta_title:       department?.meta_title       ?? "",
    meta_description: department?.meta_description ?? "",
    active:           department ? Boolean(department.active) : true,
    image:            null as File | null,
    _remove_image:    false,
  });
const page = usePage();

  const [imagePreview, setImagePreview] = useState<string | null>(
    department?.image_url ?	department.image_url : null
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
      setImagePreview(department?.image_url ? 	department.image_url : null);
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
        <AdminPageHeader
          eyebrow="Catalogue"
          title={isEdit ? <><em style={{ fontStyle: "italic" }}>{department!.name}</em></> : "New Department"}
          action={
            <AdminBtn as="a" href={route("admin.departments.index")} variant="ghost">
              <Icons.Back /> Back
            </AdminBtn>
          }
        />

        <FlashMessage flash={flash} />

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 20, alignItems: "start" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <Card title="Details">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={fieldWrap}>
                  <label style={{ ...labelStyle, color: errors.name ? "#c0392b" : "var(--color-text-muted)" }}>
                    Department Name *
                  </label>
                  <input
                    type="text" value={data.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Colour Services" maxLength={255}
                    style={inputClass(errors, "name")}
                  />
                  {errors.name && <span style={errorStyle}>{errors.name}</span>}
                </div>

                <div style={fieldWrap}>
                  <label style={{ ...labelStyle, color: errors.slug ? "#c0392b" : "var(--color-text-muted)" }}>
                    URL Slug
                  </label>
                  <input
                    type="text" value={data.slug}
                    onChange={(e) => {
                      setSlugManual(true);
                      set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"));
                    }}
                    placeholder="auto-generated from name" maxLength={255}
                    style={{ ...inputClass(errors, "slug"), fontFamily: "var(--font-mono, monospace)" }}
                  />
                  <SlugChip slug={data.slug} />
                  {!slugManual && <span style={hintStyle}>Auto-generated from name. Click to customise.</span>}
                  {errors.slug && <span style={errorStyle}>{errors.slug}</span>}
                </div>
              </div>
            </Card>

            <Card title="SEO / Meta">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={fieldWrap}>
                  <label style={{ ...labelStyle, color: errors.meta_title ? "#c0392b" : "var(--color-text-muted)" }}>
                    Meta Title
                  </label>
                  <input
                    type="text" value={data.meta_title ?? ""}
                    onChange={(e) => set("meta_title", e.target.value)}
                    placeholder="Overrides page title in search results" maxLength={60}
                    style={inputClass(errors, "meta_title")}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    {errors.meta_title ? <span style={errorStyle}>{errors.meta_title}</span> : <span />}
                    <span style={{ ...hintStyle, margin: 0, color: (data.meta_title?.length ?? 0) > 60 ? "orange" : "var(--color-text-muted)" }}>
                      {data.meta_title?.length ?? 0}/60
                    </span>
                  </div>
                </div>

                <div style={fieldWrap}>
                  <label style={{ ...labelStyle, color: errors.meta_description ? "#c0392b" : "var(--color-text-muted)" }}>
                    Meta Description
                  </label>
                  <textarea
                    value={data.meta_description ?? ""}
                    onChange={(e) => set("meta_description", e.target.value)}
                    placeholder="Short description shown in search engine results…"
                    rows={3} maxLength={500}
                    style={{ ...inputClass(errors, "meta_description"), resize: "vertical", lineHeight: 1.6 }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    {errors.meta_description ? <span style={errorStyle}>{errors.meta_description}</span> : <span />}
                    <span style={{ ...hintStyle, margin: 0, color: (data.meta_description?.length ?? 0) > 160 ? "orange" : "var(--color-text-muted)" }}>
                      {data.meta_description?.length ?? 0}/160
                    </span>
                  </div>
                </div>

                {(data.meta_title || data.name) && (
                  <div style={{ padding: "14px 16px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                    <p style={{ margin: "0 0 2px", fontFamily: "var(--font-body)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Search preview</p>
                    <p style={{ margin: "4px 0 2px", fontFamily: "var(--font-body)", fontSize: "14px", color: "#1a0dab", fontWeight: 500 }}>{data.meta_title || data.name}</p>
                    <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "12px", color: "#006621" }}>yoursite.com/departments/{data.slug || "slug"}</p>
                    {data.meta_description && (
                      <p style={{ margin: "4px 0 0", fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                        {data.meta_description.slice(0, 160)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card title="Status">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-text)", fontWeight: 500 }}>Active</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--color-text-muted)", marginTop: 2 }}>Visible on the storefront</div>
                  </div>
                  <Toggle checked={data.active} onChange={(v) => set("active", v)} />
                </div>
                <div style={{ padding: "10px 14px", background: "var(--color-bg-alt)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--color-text-muted)" }}>Status</span>
                  <span style={{
                    fontFamily: "var(--font-body)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase",
                    color: data.active ? "var(--color-success)" : "var(--color-text-muted)",
                    background: data.active ? "rgba(58,125,68,0.08)" : "var(--color-bg)",
                    padding: "3px 10px", borderRadius: "var(--radius-full)",
                    border: `1px solid ${data.active ? "rgba(58,125,68,0.25)" : "var(--color-border)"}`,
                  }}>
                    {data.active ? "● Active" : "○ Inactive"}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Department Image">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ width: "100%", aspectRatio: "16/9", background: "var(--color-bg-alt)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button type="button" onClick={removeImage} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, background: "rgba(12,10,8,0.7)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--radius-sm)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>×</button>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                      <div style={{ opacity: 0.3, marginBottom: 8 }}><Icons.Image /></div>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", opacity: 0.5 }}>No image uploaded</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                <AdminBtn variant="ghost" onClick={() => fileRef.current?.click()}>
                  <Icons.Upload />
                  {imagePreview ? "Replace Image" : "Upload Image"}
                </AdminBtn>
                {errors.image && <span style={errorStyle}>{errors.image}</span>}
                <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
                  JPEG, PNG or WebP · Max 2 MB · Recommended 1200 × 675 px
                </p>
              </div>
            </Card>
          </div>
        </div>

        <SaveBar
          isEdit={isEdit}
          departmentName={department?.name}
          processing={processing}
          onSubmit={handleSubmit}
          cancelHref={route("admin.departments.index")}
        />
      </AdminLayout>
    </>
  );
}
