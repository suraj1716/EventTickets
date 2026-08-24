import { useState, useEffect } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Pages/Admin/AdminLayout";
import {
  Save, ArrowLeft, Upload, X, Plus, Trash2, RefreshCw,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { useAdminForm, inputClass } from "@/Components/Admin/useAdminForm";
import { AdminBtn, AdminPageHeader, Icons } from "@/Components/Admin/AdminComponents";

/* ── Types ── */
interface MediaItem { id: number; url: string; thumb: string; name: string; size: string; }
interface VTOption  { id?: number; name: string; price_modifier: number; image?: string; _file?: File; }
interface VarType   { id?: number; name: string; type: string; options: VTOption[]; _open?: boolean; }
interface Variation { id?: number; variation_type_option_ids: number[]; price: number; quantity: number; }
interface Dept      { id: number; name: string; categories: { id: number; name: string }[]; }
interface Product   {
  id?: number; title: string; slug: string; description: string;
  price: number; quantity: number; status: string;
  department_id: number | null; category_id: number | null; highlight: string | null;
}

interface Props {
  product: Product | null;
  departments: Dept[];
  statuses: { value: string; name: string }[];
  images?: MediaItem[];
  variationTypes?: VarType[];
  variations?: Variation[];
}

interface ProductFormData {
  title: string;
  slug: string;
  description: string;
  price: string | number;
  quantity: string | number;
  status: string;
  department_id: string | number;
  category_id: string | number;
  highlight: string;
}

const HIGHLIGHTS = ["", "sale", "hot", "trending", "new"];
const TABS = ["Details", "Images", "Variation Types", "Variations"];

export default function Form({
  product, departments, statuses, images = [], variationTypes = [], variations = [],
}: Props) {
  const { props } = usePage();
  const flash: any = (props as any).flash || {};
  const isEdit = !!product?.id;

  const [tab, setTab] = useState(0);

  /* ── Details form ── */
  const { data, set, errors, processing, post, put } = useAdminForm<ProductFormData>({
    title:         product?.title         ?? "",
    slug:          product?.slug          ?? "",
    description:   product?.description   ?? "",
    price:         product?.price         ?? "",
    quantity:      product?.quantity      ?? "",
    status:        product?.status        ?? "draft",
    department_id: product?.department_id ?? "",
    category_id:   product?.category_id   ?? "",
    highlight:     product?.highlight     ?? "",
  });

  const categories = departments.find((d) => String(d.id) === String(data.department_id))?.categories ?? [];

  const slugify = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // ── Auto slug — derives from title until user manually edits slug ──
  const [slugManual, setSlugManual] = useState(false);
  useEffect(() => {
    if (!slugManual) {
      set("slug", slugify(data.title));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.title, slugManual]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      put(route("admin.products.update", product!.id));
    } else {
      post(route("admin.products.store"));
    }
  };

  /* ── Images ── */
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleImageUpload = (files: FileList | null) => {
    if (!files || !isEdit) return;
    setUploadingImages(true);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("images[]", f));
    router.post(route("admin.products.images.upload", product!.id), formData as any, {
      onSuccess: () => setUploadingImages(false),
      onError:   () => setUploadingImages(false),
    });
  };

  const deleteImage = (mediaId: number) => {
    if (!confirm("Delete this image?")) return;
    router.delete(route("admin.products.images.delete", { product: product!.id, media: mediaId }));
  };

  /* ── Variation Types ── */
  const [vtypes, setVtypes] = useState<VarType[]>(variationTypes.map((vt) => ({ ...vt, _open: true })));

  const addVType    = () => setVtypes((p) => [...p, { name: "", type: "select", options: [], _open: true }]);
  const removeVType = (i: number) => setVtypes((p) => p.filter((_, idx) => idx !== i));
  const updateVType = (i: number, field: keyof VarType, value: any) =>
    setVtypes((p) => p.map((vt, idx) => idx === i ? { ...vt, [field]: value } : vt));
  const addOption   = (vi: number) =>
    setVtypes((p) => p.map((vt, i) => i === vi ? { ...vt, options: [...vt.options, { name: "", price_modifier: 0 }] } : vt));
  const removeOption = (vi: number, oi: number) =>
    setVtypes((p) => p.map((vt, i) => i === vi ? { ...vt, options: vt.options.filter((_, j) => j !== oi) } : vt));
  const updateOption = (vi: number, oi: number, field: keyof VTOption, value: any) =>
    setVtypes((p) => p.map((vt, i) => i === vi ? { ...vt, options: vt.options.map((o, j) => j === oi ? { ...o, [field]: value } : o) } : vt));

  const saveVTypes = () => {
    router.post(route("admin.products.variation-types.save", product!.id), {
      variation_types: vtypes.map((vt) => ({
        id: vt.id, name: vt.name, type: vt.type,
        options: vt.options.map((o) => ({ id: o.id, name: o.name, price_modifier: o.price_modifier })),
      })),
    } as any);
  };

  /* ── Variations ── */
  const [vars, setVars] = useState<Variation[]>(variations);

  const updateVar = (i: number, field: keyof Variation, value: any) =>
    setVars((p) => p.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  const removeVar = (i: number) => setVars((p) => p.filter((_, idx) => idx !== i));

  const generateCombinations = () => {
    router.post(route("admin.products.variations.generate", product!.id), {});
  };

  const saveVariations = () => {
    router.post(route("admin.products.variations.save", product!.id), { variations: vars } as any);
  };

  const getOptionName = (optionId: number) => {
    for (const vt of variationTypes) {
      const opt = vt.options?.find((o) => o.id === optionId);
      if (opt) return `${vt.name}: ${opt.name}`;
    }
    return `#${optionId}`;
  };

  /* ── Shared styles ── */
  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    fontFamily: "var(--font-body)", fontSize: "13px",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)", color: "var(--color-text)",
    outline: "none",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontFamily: "var(--font-body)",
    fontSize: "10px", fontWeight: 500, letterSpacing: "0.15em",
    textTransform: "uppercase", color: "var(--color-text-muted)",
    marginBottom: "6px",
  };
  const err: React.CSSProperties = { fontSize: "11px", color: "var(--color-error)", marginTop: "4px" };

  return (
    <AdminLayout>
      <Head title={isEdit ? `Edit: ${product!.title}` : "New Product"} />

      <style>{`
        .apf-page { font-family: var(--font-body); }

        .apf-header {
          background: var(--color-bg-dark);
          padding: 28px 28px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          margin: -32px -28px 0;
        }
        .apf-header-back {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--font-body); font-size: 11px;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.45); text-decoration: none;
          transition: color var(--transition-fast);
        }
        .apf-header-back:hover { color: white; }
        .apf-header-title {
          font-family: var(--font-display); font-size: 1.75rem;
          font-weight: 300; color: white;
        }
        .apf-header-title em { font-style: italic; color: var(--color-accent-light); }

        .apf-tabs {
          display: flex;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          margin: 0 -28px 28px;
          padding: 0 28px;
          overflow-x: auto; gap: 0;
        }
        .apf-tab {
          padding: 14px 18px;
          font-family: var(--font-body); font-size: 11px; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--color-text-muted); cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all var(--transition-fast); white-space: nowrap;
          background: none; border-top: none; border-left: none; border-right: none;
        }
        .apf-tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
        .apf-tab:hover:not(.active) { color: var(--color-text); }
        .apf-tab:disabled { opacity: 0.35; cursor: not-allowed; }

        .apf-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden; margin-bottom: 20px;
        }
        .apf-card-header {
          padding: 14px 20px;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-bg-alt);
          display: flex; align-items: center; justify-content: space-between;
        }
        .apf-card-title {
          font-family: var(--font-display); font-size: var(--text-xl);
          font-weight: 400; color: var(--color-text);
        }
        .apf-card-body { padding: 20px; }

        .apf-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .apf-span-2 { grid-column: span 2; }

        .apf-img-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 12px; margin-bottom: 16px;
        }
        .apf-img-item {
          position: relative; border-radius: var(--radius-sm);
          overflow: hidden; aspect-ratio: 1;
          border: 1px solid var(--color-border); background: var(--color-bg-alt);
        }
        .apf-img-item img { width: 100%; height: 100%; object-fit: cover; }
        .apf-img-delete {
          position: absolute; top: 4px; right: 4px;
          width: 22px; height: 22px; border-radius: 50%;
          background: rgba(192,57,43,0.85); color: white;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity var(--transition-fast);
        }
        .apf-img-item:hover .apf-img-delete { opacity: 1; }
        .apf-img-meta {
          font-family: var(--font-body); font-size: 10px;
          color: var(--color-text-light); padding: 4px 6px;
          background: var(--color-surface); border-top: 1px solid var(--color-border);
        }
        .apf-upload-zone {
          border: 2px dashed var(--color-border); border-radius: var(--radius-md);
          padding: 32px; text-align: center; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .apf-upload-zone:hover { border-color: var(--color-primary); background: rgba(45,80,22,0.03); }

        .apf-vtype {
          border: 1px solid var(--color-border); border-radius: var(--radius-md);
          overflow: hidden; margin-bottom: 12px;
        }
        .apf-vtype-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: var(--color-bg-alt);
          border-bottom: 1px solid var(--color-border); cursor: pointer;
        }
        .apf-vtype-body { padding: 16px; }

        .apf-opt-row {
          display: grid; grid-template-columns: 1fr 120px 32px;
          gap: 10px; align-items: center;
          padding: 8px 0; border-bottom: 1px solid var(--color-border);
        }
        .apf-opt-row:last-child { border-bottom: none; }

        .apf-var-row {
          display: grid; grid-template-columns: 1fr 120px 120px 32px;
          gap: 10px; align-items: center;
          padding: 10px 0; border-bottom: 1px solid var(--color-border);
        }
        .apf-var-row:last-child { border-bottom: none; }

        .apf-btn-row {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 10px; padding-top: 20px;
          border-top: 1px solid var(--color-border); margin-top: 20px;
        }

        .apf-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px;
          font-family: var(--font-body); font-size: 11px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          border-radius: var(--radius-sm); cursor: pointer;
          transition: all var(--transition-fast); border: 1px solid transparent;
        }
        .apf-btn.primary { background: var(--color-primary); color: white; border-color: var(--color-primary); }
        .apf-btn.primary:hover { background: var(--color-primary-light); }
        .apf-btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .apf-btn.accent { background: var(--color-accent); color: var(--color-bg-dark); border-color: var(--color-accent); }
        .apf-btn.accent:hover { background: var(--color-accent-dark); }
        .apf-btn.ghost { background: transparent; color: var(--color-text-muted); border-color: var(--color-border); }
        .apf-btn.ghost:hover { background: var(--color-bg-alt); }
        .apf-btn.danger { background: transparent; color: var(--color-error); border-color: var(--color-error); }
        .apf-btn.danger:hover { background: rgba(192,57,43,0.06); }
        .apf-btn.sm { padding: 6px 12px; font-size: 10px; }
        .apf-btn.icon-only { padding: 6px; width: 30px; height: 30px; justify-content: center; }

        .apf-flash { padding: 10px 16px; font-size: 13px; border-radius: var(--radius-sm); border: 1px solid; margin-bottom: 16px; }
        .apf-flash.success { background: rgba(58,125,68,0.08); color: var(--color-success); border-color: rgba(58,125,68,0.2); }

        .apf-note {
          font-family: var(--font-body); font-size: 12px; color: var(--color-text-muted);
          padding: 12px 16px; background: var(--color-bg-alt);
          border-radius: var(--radius-sm); border-left: 3px solid var(--color-accent);
        }

        @media (max-width: 640px) {
          .apf-header { margin: -24px -16px 0; padding: 20px 16px; }
          .apf-tabs   { margin: 0 -16px 20px; padding: 0 16px; }
          .apf-grid-2 { grid-template-columns: 1fr; }
          .apf-span-2 { grid-column: span 1; }
          .apf-var-row { grid-template-columns: 1fr 80px 32px; }
        }
      `}</style>

      <div className="apf-page">

        {/* Header */}
        <AdminPageHeader
                  eyebrow="Catalogue"
                  title={isEdit
                    ? <>Edit <em style={{ fontStyle: "italic" }}>{product!.title}</em></>
                    : "New Category"
                  }
                  action={
                    <AdminBtn as="a" href={route("admin.products.index")} variant="ghost">
                      <Icons.Back />
                      Back
                    </AdminBtn>
                  }
                />

        {flash.success && <div className="apf-flash success">{flash.success}</div>}

        {/* Tabs */}
        <div className="apf-tabs">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={`apf-tab ${tab === i ? "active" : ""}`}
              onClick={() => setTab(i)}
              disabled={i > 0 && !isEdit}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Max-width content wrapper */}
        <div style={{ maxWidth: 860 }}>

          {/* ══ TAB 0: Details ══ */}
          {tab === 0 && (
            <form onSubmit={handleSubmit}>
              <div className="apf-card">
                <div className="apf-card-header">
                  <span className="apf-card-title">Product Details</span>
                </div>
                <div className="apf-card-body">
                  <div className="apf-grid-2" style={{ marginBottom: 16 }}>

                    <div className="apf-span-2">
                      <label style={{ ...lbl, color: errors.title ? "#c0392b" : "var(--color-text-muted)" }}>Title *</label>
                      <input style={inputClass(errors, "title")} value={data.title}
                        onChange={(e) => set("title", e.target.value)}
                        placeholder="Product name" />
                      {errors.title && <p style={err}>{errors.title}</p>}
                    </div>

                    <div className="apf-span-2">
                      <label style={{ ...lbl, color: errors.slug ? "#c0392b" : "var(--color-text-muted)" }}>Slug *</label>
                      <input style={inputClass(errors, "slug")} value={data.slug}
                        onChange={(e) => {
                          setSlugManual(true);
                          set("slug", e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "-")
                            .replace(/-+/g, "-")
                          );
                        }}
                        placeholder="url-friendly-name" />
                      {!slugManual && <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>Auto-generated from title. Edit to customise.</p>}
                      {errors.slug && <p style={err}>{errors.slug}</p>}
                    </div>

                    <div className="apf-span-2">
                      <label style={{ ...lbl, color: errors.description ? "#c0392b" : "var(--color-text-muted)" }}>Description *</label>
                      <textarea style={{ ...inputClass(errors, "description"), minHeight: 110, resize: "vertical" }}
                        value={data.description}
                        onChange={(e) => set("description", e.target.value)}
                        placeholder="Product description…" />
                      {errors.description && <p style={err}>{errors.description}</p>}
                    </div>

                    <div>
                      <label style={{ ...lbl, color: errors.price ? "#c0392b" : "var(--color-text-muted)" }}>Price (AUD) *</label>
                      <input style={inputClass(errors, "price")} type="number" step="0.01" min="0"
                        value={data.price} onChange={(e) => set("price", e.target.value)} />
                      {errors.price && <p style={err}>{errors.price}</p>}
                    </div>

                    <div>
                      <label style={{ ...lbl, color: errors.quantity ? "#c0392b" : "var(--color-text-muted)" }}>Quantity *</label>
                      <input style={inputClass(errors, "quantity")} type="number" min="0"
                        value={data.quantity} onChange={(e) => set("quantity", e.target.value)} />
                      {errors.quantity && <p style={err}>{errors.quantity}</p>}
                    </div>

                    <div>
                      <label style={{ ...lbl, color: errors.department_id ? "#c0392b" : "var(--color-text-muted)" }}>Department *</label>
                      <select style={inputClass(errors, "department_id")} value={data.department_id}
                        onChange={(e) => { set("department_id", e.target.value); set("category_id", ""); }}>
                        <option value="">Select department</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      {errors.department_id && <p style={err}>{errors.department_id}</p>}
                    </div>

                    <div>
                      <label style={{ ...lbl, color: errors.category_id ? "#c0392b" : "var(--color-text-muted)" }}>Category *</label>
                      <select style={inputClass(errors, "category_id")} value={data.category_id}
                        onChange={(e) => set("category_id", e.target.value)}
                        disabled={!data.department_id}>
                        <option value="">Select category</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      {errors.category_id && <p style={err}>{errors.category_id}</p>}
                    </div>

                    <div>
                      <label style={lbl}>Status *</label>
                      <select style={inp} value={data.status} onChange={(e) => set("status", e.target.value)}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>

                    <div>
                      <label style={lbl}>Highlight</label>
                      <select style={inp} value={data.highlight} onChange={(e) => set("highlight", e.target.value)}>
                        {HIGHLIGHTS.map((h) => <option key={h} value={h}>{h || "None"}</option>)}
                      </select>
                    </div>

                  </div>
                </div>
              </div>

              <div className="apf-btn-row">
                <Link href={route("admin.products.index")} className="apf-btn ghost">Cancel</Link>
                <button type="submit" className="apf-btn primary" disabled={processing}>
                  <Save size={14} />
                  {processing ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          )}

          {/* ══ TAB 1: Images ══ */}
          {tab === 1 && isEdit && (
            <div className="apf-card">
              <div className="apf-card-header">
                <span className="apf-card-title">Product Images</span>
                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                  {images.length} image{images.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="apf-card-body">
                {images.length > 0 && (
                  <div className="apf-img-grid">
                    {images.map((img) => (
                      <div key={img.id} className="apf-img-item">
                        <img src={img.thumb || img.url} alt={img.name} />
                        <button className="apf-img-delete" onClick={() => deleteImage(img.id)}>
                          <X size={10} />
                        </button>
                        <div className="apf-img-meta">{img.size}</div>
                      </div>
                    ))}
                  </div>
                )}
                <label className="apf-upload-zone">
                  <input type="file" multiple accept="image/*" style={{ display: "none" }}
                    onChange={(e) => handleImageUpload(e.target.files)} />
                  <Upload size={26} style={{ color: "var(--color-text-light)", marginBottom: 8 }} />
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-text-muted)" }}>
                    {uploadingImages ? "Uploading…" : "Click or drag images here"}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-text-light)", marginTop: 4 }}>
                    PNG, JPG, WEBP · max 4MB each
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* ══ TAB 2: Variation Types ══ */}
          {tab === 2 && isEdit && (
            <div>
              <div className="apf-note" style={{ marginBottom: 20 }}>
                Define variation types (e.g. Size, Colour) and their options. Save before generating combinations.
              </div>

              {vtypes.map((vt, vi) => (
                <div className="apf-vtype" key={vi}>
                  <div className="apf-vtype-header" onClick={() => updateVType(vi, "_open", !vt._open)}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 400, color: "var(--color-text)" }}>
                      {vt.name || `Variation Type ${vi + 1}`}
                      <span style={{ fontSize: 11, color: "var(--color-text-light)", marginLeft: 8 }}>
                        ({vt.options.length} options)
                      </span>
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="apf-btn danger sm icon-only"
                        onClick={(e) => { e.stopPropagation(); removeVType(vi); }}>
                        <Trash2 size={12} />
                      </button>
                      {vt._open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </div>

                  {vt._open && (
                    <div className="apf-vtype-body">
                      <div className="apf-grid-2" style={{ marginBottom: 16 }}>
                        <div>
                          <label style={lbl}>Type Name *</label>
                          <input style={inp} value={vt.name}
                            onChange={(e) => updateVType(vi, "name", e.target.value)}
                            placeholder="e.g. Size, Colour" />
                        </div>
                        <div>
                          <label style={lbl}>Input Type</label>
                          <select style={inp} value={vt.type} onChange={(e) => updateVType(vi, "type", e.target.value)}>
                            <option value="select">Select</option>
                            <option value="radio">Radio</option>
                            <option value="color">Color Swatch</option>
                            <option value="image">Image</option>
                          </select>
                        </div>
                      </div>

                      <label style={{ ...lbl, marginBottom: 10 }}>Options</label>
                      {vt.options.map((opt, oi) => (
                        <div className="apf-opt-row" key={oi}>
                          <input style={inp} value={opt.name}
                            onChange={(e) => updateOption(vi, oi, "name", e.target.value)}
                            placeholder="Option name" />
                          <input style={inp} type="number" step="0.01"
                            value={opt.price_modifier}
                            onChange={(e) => updateOption(vi, oi, "price_modifier", parseFloat(e.target.value))}
                            placeholder="±Price" />
                          <button className="apf-btn danger sm icon-only" onClick={() => removeOption(vi, oi)}>
                            <X size={11} />
                          </button>
                        </div>
                      ))}

                      <button className="apf-btn ghost sm" style={{ marginTop: 10 }} onClick={() => addOption(vi)}>
                        <Plus size={12} /> Add Option
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button className="apf-btn ghost" onClick={addVType} style={{ marginBottom: 20 }}>
                <Plus size={14} /> Add Variation Type
              </button>

              <div className="apf-btn-row">
                <button className="apf-btn primary" onClick={saveVTypes}>
                  <Save size={14} /> Save Variation Types
                </button>
              </div>
            </div>
          )}

          {/* ══ TAB 3: Variations ══ */}
          {tab === 3 && isEdit && (
            <div>
              <div className="apf-note" style={{ marginBottom: 20 }}>
                Each row is a unique combination. Generate all combinations automatically or manage manually.
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                <button className="apf-btn accent" onClick={generateCombinations}>
                  <RefreshCw size={13} /> Generate All Combinations
                </button>
              </div>

              {vars.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "40px 20px",
                  fontFamily: "var(--font-display)", fontSize: "var(--text-xl)",
                  fontWeight: 300, color: "var(--color-text-muted)",
                }}>
                  No variations yet — generate combinations or add manually.
                </div>
              ) : (
                <div className="apf-card">
                  <div className="apf-card-header">
                    <span className="apf-card-title">Variations ({vars.length})</span>
                  </div>
                  <div className="apf-card-body">
                    <div className="apf-var-row" style={{ paddingTop: 0 }}>
                      <span style={{ ...lbl, marginBottom: 0 }}>Combination</span>
                      <span style={{ ...lbl, marginBottom: 0 }}>Price</span>
                      <span style={{ ...lbl, marginBottom: 0 }}>Qty</span>
                      <span />
                    </div>

                    {vars.map((v, i) => (
                      <div className="apf-var-row" key={i}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {v.variation_type_option_ids.map((oid) => (
                            <span key={oid} style={{
                              display: "inline-flex", padding: "2px 8px",
                              background: "var(--color-bg-alt)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--radius-full)",
                              fontSize: 11, color: "var(--color-text-muted)",
                            }}>
                              {getOptionName(oid)}
                            </span>
                          ))}
                        </div>
                        <input style={{ ...inp, padding: "7px 10px" }} type="number" step="0.01" min="0"
                          value={v.price} onChange={(e) => updateVar(i, "price", parseFloat(e.target.value))} />
                        <input style={{ ...inp, padding: "7px 10px" }} type="number" min="0"
                          value={v.quantity} onChange={(e) => updateVar(i, "quantity", parseInt(e.target.value))} />
                        <button className="apf-btn danger sm icon-only" onClick={() => removeVar(i)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="apf-btn-row">
                <button className="apf-btn primary" onClick={saveVariations} disabled={vars.length === 0}>
                  <Save size={14} /> Save Variations
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}
