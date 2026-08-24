import React, { useState, useRef } from "react";
import { Head } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  AdminBtn,
  FlashMessage,
  Icons,
} from "../../../Components/Admin/AdminComponents";
import { useAdminForm, inputClass } from "../../../Components/Admin/useAdminForm";

/* ── Types ── */
interface Department { id: number; name: string; }
interface ParentCategory { id: number; name: string; department_id: number | null; }
interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parent_id: string;
  department_id: string;
  active: boolean;
  image: File | null;
  _remove_image: boolean;
}
interface Category {
  image_url: string | (() => string | null) | null;
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  department_id: number | null;
  active: boolean | number; // PHP returns 0/1
}
interface Props {
  category?: Category;
  departments: Department[];
  parentCategories: ParentCategory[];
  flash: { success?: string; error?: string };
}

/* ── Slug helper ── */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "")    // strip invalid chars
    .replace(/\s+/g, "-")            // spaces -> hyphens
    .replace(/-+/g, "-")             // collapse hyphens
    .replace(/^-+|-+$/g, "");        // trim leading/trailing hyphens
}

/* ── Styles ── */
const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "10px", fontWeight: 500,
  letterSpacing: "0.18em", textTransform: "uppercase",
  color: "var(--color-text-muted)", marginBottom: 6,
};
const errorStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "11px",
  color: "var(--color-error)", marginTop: 4,
};
const fieldWrap: React.CSSProperties = { display: "flex", flexDirection: "column" };

/* ── Card ── */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-md)", overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 20px", borderBottom: "1px solid var(--color-border)",
        background: "var(--color-bg-alt)", display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{ width: 3, height: 16, background: "var(--color-accent)", borderRadius: 2 }} />
        <span style={{
          fontFamily: "var(--font-body)", fontSize: "10px",
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--color-text-muted)", fontWeight: 500,
        }}>{title}</span>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

/* ── Toggle ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: "var(--radius-full)",
        background: checked ? "var(--color-primary)" : "var(--color-border)",
        border: "none", cursor: "pointer", position: "relative",
        transition: "background 200ms ease", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "white",
        transition: "left 200ms ease", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

/* ── Main ── */
export default function CategoryForm({ category, departments, parentCategories, flash }: Props) {
  const isEdit = !!category;

  // Normalise active: PHP sends 0/1, we need boolean
  const initialActive = category ? Boolean(category.active) : true;

  const { data, set, errors, processing, post, put } = useAdminForm<CategoryFormData>({
    name:          category?.name ?? "",
    slug:          category?.slug ?? "",
    description:   category?.description ?? "",
    parent_id:     category?.parent_id ? String(category.parent_id) : "",
    department_id: category?.department_id ? String(category.department_id) : "",
    active:        initialActive,
    image:         null,
    _remove_image: false,
  });

  // Tracks whether the user has manually edited the slug — once true,
  // typing in Name no longer overwrites it.
  const [slugTouched, setSlugTouched] = useState(isEdit && !!category?.slug);

  const [imagePreview, setImagePreview] = useState<string | null>(
    category?.image_url ? category.image_url : null
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const parentOptions = parentCategories.filter(
    (c) => !isEdit || c.id !== category!.id
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    set("name", newName);
    if (!slugTouched) {
      set("slug", slugify(newName));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    set("slug", slugify(e.target.value));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    set("image", file);
    set("_remove_image", false);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(category?.image_url ? 	category.image_url : null);
    }
  };

  const removeImage = () => {
    set("image", null);
    set("_remove_image", true);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("name",          data.name);
    fd.append("slug",          data.slug);
    fd.append("description",   data.description);
    fd.append("department_id", data.department_id);
    fd.append("parent_id",     data.parent_id);
    fd.append("active",        data.active ? "1" : "0");
    if (data.image)         fd.append("image", data.image);
    if (data._remove_image) fd.append("_remove_image", "1");
    return fd;
  };

  const handleSubmit = () => {
    if (isEdit) {
      put(route("admin.categories.update", category!.id), {
        transform: buildFormData,
      });
    } else {
      post(route("admin.categories.store"), {
        transform: buildFormData,
      });
    }
  };

  /* ── SaveBar — always visible at bottom ── */
  const SaveBar = () => (
    <div style={{
      position: "sticky", bottom: 0, zIndex: 40,
      background: "var(--color-surface)",
      borderTop: "1px solid var(--color-border)",
      padding: "12px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      margin: "24px -28px -32px", // bleed to match AdminLayout padding
    }}>
      <span style={{
        fontFamily: "var(--font-body)", fontSize: "11px",
        color: "var(--color-text-muted)", letterSpacing: "0.04em",
      }}>
        {isEdit ? `Editing: ${category!.name}` : "New category — unsaved"}
      </span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <AdminBtn
          as="a"
          href={route("admin.categories.index")}
          variant="ghost"
          size="sm"
        >
          Cancel
        </AdminBtn>
        <AdminBtn
          onClick={handleSubmit}
          disabled={processing || !data.name.trim()}
          variant="accent"
        >
          <Icons.Check />
          {processing ? "Saving…" : isEdit ? "Update Category" : "Create Category"}
        </AdminBtn>
      </div>
    </div>
  );

  return (
    <>
      <Head title={isEdit ? `Edit — ${category!.name}` : "New Category"} />
      <AdminLayout>
        <AdminPageHeader
          eyebrow="Catalogue"
          title={isEdit
            ? <>Edit <em style={{ fontStyle: "italic" }}>{category!.name}</em></>
            : "New Category"
          }
          action={
            <AdminBtn as="a" href={route("admin.categories.index")} variant="ghost">
              <Icons.Back />
              Back
            </AdminBtn>
          }
        />

        <FlashMessage flash={flash} />

        {/* ── Two-column grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 300px",
          gap: 20,
          alignItems: "start",
        }}>

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <Card title="Details">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={fieldWrap}>
                  <label style={{
                    ...labelStyle,
                    color: errors.name ? "#c0392b" : "var(--color-text-muted)",
                  }}>
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Hair Colour"
                    style={inputClass(errors, "name")}
                  />
                  {errors.name && <span style={errorStyle}>{errors.name}</span>}
                </div>

                <div style={fieldWrap}>
                  <label style={{
                    ...labelStyle,
                    color: errors.slug ? "#c0392b" : "var(--color-text-muted)",
                  }}>
                    Slug
                  </label>
                  <input
                    type="text"
                    value={data.slug}
                    onChange={handleSlugChange}
                    placeholder="e.g. hair-colour"
                    style={{ ...inputClass(errors, "slug"), fontFamily: "monospace" }}
                  />
                  {errors.slug && <span style={errorStyle}>{errors.slug}</span>}
                  <span style={{
                    fontFamily: "var(--font-body)", fontSize: "10px",
                    color: "var(--color-text-muted)", marginTop: 4,
                  }}>
                    Auto-generated from name — edit to customise
                  </span>
                </div>

                <div style={fieldWrap}>
                  <label style={{
                    ...labelStyle,
                    color: errors.description ? "#c0392b" : "var(--color-text-muted)",
                  }}>
                    Description
                  </label>
                  <textarea
                    value={data.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Optional short description…"
                    rows={3}
                    style={{ ...inputClass(errors, "description"), resize: "vertical", lineHeight: 1.6 }}
                  />
                  {errors.description && <span style={errorStyle}>{errors.description}</span>}
                </div>
              </div>
            </Card>

            <Card title="Taxonomy">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={fieldWrap}>
                  <label style={{
                    ...labelStyle,
                    color: errors.department_id ? "#c0392b" : "var(--color-text-muted)",
                  }}>
                    Department
                  </label>
                  <select
                    value={data.department_id}
                    onChange={(e) => set("department_id", e.target.value)}
                    style={inputClass(errors, "department_id")}
                  >
                    <option value="">— None —</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {errors.department_id && <span style={errorStyle}>{errors.department_id}</span>}
                </div>
                <div style={fieldWrap}>
                  <label style={{
                    ...labelStyle,
                    color: errors.parent_id ? "#c0392b" : "var(--color-text-muted)",
                  }}>
                    Parent Category
                  </label>
                  <select
                    value={data.parent_id}
                    onChange={(e) => set("parent_id", e.target.value)}
                    style={inputClass(errors, "parent_id")}
                  >
                    <option value="">— Root (no parent) —</option>
                    {parentOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.parent_id && <span style={errorStyle}>{errors.parent_id}</span>}
                </div>
              </div>
            </Card>

          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            <Card title="Status">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-text)", fontWeight: 500 }}>
                      Active
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--color-text-muted)", marginTop: 2 }}>
                      Visible in catalogue
                    </div>
                  </div>
                  <Toggle checked={data.active} onChange={(v) => set("active", v)} />
                </div>
                <div style={{
                  padding: "10px 14px",
                  background: "var(--color-bg-alt)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--color-text-muted)" }}>
                    Status
                  </span>
                  <span style={{
                    fontFamily: "var(--font-body)", fontSize: "10px",
                    letterSpacing: "0.1em", textTransform: "uppercase",
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

            <Card title="Category Image">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{
                  width: "100%", aspectRatio: "16/9",
                  background: "var(--color-bg-alt)", border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button type="button" onClick={removeImage} style={{
                        position: "absolute", top: 8, right: 8,
                        width: 28, height: 28, background: "rgba(12,10,8,0.7)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "var(--radius-sm)", color: "white",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 14,
                      }}>×</button>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                      <div style={{ opacity: 0.3, marginBottom: 8 }}><Icons.Image /></div>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", opacity: 0.5 }}>
                        No image uploaded
                      </span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*"
                  onChange={handleImageChange} style={{ display: "none" }} />
                <AdminBtn variant="ghost" onClick={() => fileRef.current?.click()}>
                  <Icons.Upload />
                  {imagePreview ? "Replace Image" : "Upload Image"}
                </AdminBtn>
                {errors.image && <span style={errorStyle}>{errors.image}</span>}
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: "10px",
                  color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6,
                }}>
                  JPEG, PNG or WebP · Max 2 MB · Recommended 800 × 450 px
                </p>
              </div>
            </Card>

          </div>
        </div>

        {/* ── Sticky save bar — always visible ── */}
        <SaveBar />

      </AdminLayout>
    </>
  );
}
