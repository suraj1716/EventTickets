import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ProductItem from "@/Components/App/ProductItem";
import {
  Vendor,
  PageProps,
  PaginationProps,
  Product,
  Department,
} from "@/types";
import { Plus, Minus, X, SlidersHorizontal } from "lucide-react";

const C = {
  bg: "#0B0B10",
  surface: "#15141B",
  border: "#26232E",
  borderDashed: "#33303C",
  text: "#F7F5F2",
  textMuted: "#9C97A8",
  textFaint: "#6B6775",
  textFainter: "#565262",
  amber: "#FFB627",
  amberHover: "#ffc75c",
  overlay: "rgba(11,11,16,0.7)",
};

type VendorWrapper = {
  data: Vendor;
};
type ProfileProps = PageProps<{
  vendor: VendorWrapper;
  products: PaginationProps<Product>;
  departments: Department[];
  filters: {
    department_id: string | null;
    category_id: string | null;
    max_price: string | null;
    sort_by: string | null;
  };
}>;

export default function ListProducts({
  vendor,
  products,
  departments,
  filters,
}: ProfileProps) {
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [maxPrice, setMaxPrice] = useState<number>(
    filters.max_price ? parseInt(filters.max_price) : 3000
  );
  const [sortBy, setSortBy] = useState<string>(filters.sort_by || "default");

  const onDepartmentClick = (id: string) => {
    setSelectedDepartment(id);
    setSelectedCategory("");
    setExpandedDepartments([id]);
  };

  const toggleDepartment = (id: string) => {
    setExpandedDepartments((prev) => {
      if (prev.includes(id)) {
        return prev.filter((deptId) => deptId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleFilterChange = () => {
    router.get(
      route("vendor.profile", { vendor: vendor.data.store_name }),
      {
        department_id: selectedDepartment,
        category_id: selectedCategory,
        max_price: maxPrice.toString(),
        sort_by: sortBy,
      },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleResetFilters = () => {
    setSelectedDepartment(null);
    setSelectedCategory("");
    setExpandedDepartments([]);
    setMaxPrice(3000);
    setSortBy("default");

    router.get(
      route("vendor.profile", { vendor: vendor.data.store_name }),
      {
        department_id: null,
        category_id: null,
        max_price: "3",
        sort_by: "default",
      },
      { preserveState: true, preserveScroll: true }
    );
  };

  const DEFAULT_MAX_PRICE = 5000;
  const ShowAllProducts = () => {
    setSelectedDepartment(null);
    setSelectedCategory("");
    setExpandedDepartments([]);
    setMaxPrice(DEFAULT_MAX_PRICE);
    setSortBy("default");

    router.get(route("shop.search"), {}, { preserveState: true, preserveScroll: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title={`${vendor.data.store_name} Profile Page`}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style>{`
        .vp-page {
          background: ${C.bg};
          color: ${C.text};
          font-family: 'Manrope', sans-serif;
          min-height: 100%;
        }

        .vp-hero {
          background: ${C.surface};
          border-bottom: 1px solid ${C.border};
          padding: 4rem 24px 3rem;
          text-align: center;
        }
        .vp-eyebrow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${C.amber};
          margin-bottom: 14px;
        }
        .vp-eyebrow-dot {
          display: inline-block;
          height: 6px;
          width: 6px;
          border-radius: 50%;
          background: ${C.amber};
        }
        .vp-store-name {
          font-family: 'Anton', sans-serif;
          text-transform: uppercase;
          font-size: 2.25rem;
          line-height: 1.15;
          letter-spacing: 0.01em;
          color: ${C.text};
          margin: 0;
        }
        .vp-ornament {
          margin: 18px auto 0;
          width: 48px;
          height: 2px;
          background: ${C.amber};
        }

        .vp-layout {
          display: flex;
          gap: 2rem;
          padding: 2.5rem 24px;
          max-width: 1280px;
          margin: 0 auto;
          align-items: flex-start;
        }

        /* ── Sidebar (desktop) ── */
        .vp-sidebar {
          display: none;
          width: 280px;
          flex-shrink: 0;
          background: ${C.surface};
          border: 1px solid ${C.border};
          border-radius: 14px;
          padding: 1.75rem;
          position: sticky;
          top: 1.5rem;
        }
        .vp-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid ${C.border};
        }
        .vp-sidebar-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${C.text};
        }
        .vp-chip-btn {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${C.amber};
          background: rgba(255,182,39,0.06);
          border: 1px solid rgba(255,182,39,0.3);
          border-radius: 999px;
          padding: 6px 12px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .vp-chip-btn:hover {
          background: ${C.amber};
          color: ${C.bg};
        }

        .vp-section-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${C.textFaint};
          margin-bottom: 0.9rem;
          display: block;
        }

        .vp-dept-list { list-style: none; margin: 0; padding: 0; }
        .vp-dept-item { border-bottom: 1px solid ${C.border}; }
        .vp-dept-item:last-child { border-bottom: none; }
        .vp-dept-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0;
        }
        .vp-dept-name-btn {
          font-family: 'Manrope', sans-serif;
          font-size: 0.82rem;
          letter-spacing: 0.02em;
          color: ${C.text};
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          padding: 0;
          flex: 1;
          transition: color 0.15s ease;
        }
        .vp-dept-name-btn:hover { color: ${C.amber}; }
        .vp-dept-toggle {
          background: none;
          border: none;
          cursor: pointer;
          color: ${C.amber};
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          flex-shrink: 0;
        }

        .vp-cat-list { list-style: none; margin: 0.4rem 0 0.75rem 0.9rem; padding: 0; }
        .vp-cat-item { padding: 0.4rem 0; }
        .vp-cat-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Manrope', sans-serif;
          font-size: 0.78rem;
          color: ${C.textMuted};
          cursor: pointer;
        }
        .vp-cat-label:hover { color: ${C.text}; }
        .vp-radio { accent-color: ${C.amber}; width: 14px; height: 14px; flex-shrink: 0; }

        .vp-price-slider { width: 100%; accent-color: ${C.amber}; }
        .vp-price-value {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.75rem;
          color: ${C.textMuted};
          margin-top: 0.5rem;
        }

        .vp-select {
          width: 100%;
          font-family: 'Manrope', sans-serif;
          font-size: 0.82rem;
          color: ${C.text};
          background: ${C.bg};
          border: 1px solid ${C.border};
          border-radius: 8px;
          padding: 9px 10px;
          outline: none;
        }
        .vp-select:focus { border-color: ${C.amberHover}; }
        .vp-select option { background: ${C.bg}; color: ${C.text}; }

        .vp-btn-primary {
          width: 100%;
          padding: 12px 0;
          background: ${C.amber};
          color: ${C.bg};
          border: none;
          border-radius: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .vp-btn-primary:hover { background: ${C.amberHover}; }

        .vp-btn-ghost {
          width: 100%;
          padding: 12px 0;
          background: transparent;
          color: ${C.textMuted};
          border: 1px solid ${C.border};
          border-radius: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .vp-btn-ghost:hover { border-color: rgba(255,182,39,0.5); color: ${C.text}; }

        .vp-filter-block { margin-bottom: 1.75rem; }
        .vp-filter-block:last-of-type { margin-bottom: 1.5rem; }
        .vp-btn-stack { display: flex; flex-direction: column; gap: 8px; }

        /* ── Mobile trigger ── */
        .vp-mobile-trigger-wrap { display: block; padding: 0 24px 1.25rem; }
        .vp-mobile-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 0;
          background: ${C.surface};
          border: 1px solid ${C.border};
          border-radius: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${C.text};
          cursor: pointer;
        }
        .vp-mobile-trigger:hover { border-color: rgba(255,182,39,0.5); color: ${C.amber}; }

        /* ── Mobile filter modal ── */
        .vp-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: ${C.overlay};
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .vp-modal-card {
          width: 100%;
          max-height: 88vh;
          overflow-y: auto;
          background: ${C.surface};
          border-top: 1px solid ${C.border};
          border-radius: 16px 16px 0 0;
          padding: 1.5rem 1.5rem 2rem;
          position: relative;
        }
        .vp-modal-close {
          position: absolute;
          top: 1rem;
          right: 1.25rem;
          background: none;
          border: none;
          color: ${C.textMuted};
          cursor: pointer;
          display: flex;
        }
        .vp-modal-close:hover { color: ${C.amber}; }
        .vp-modal-title {
          font-family: 'Anton', sans-serif;
          text-transform: uppercase;
          font-size: 1.3rem;
          color: ${C.text};
          margin: 0 0 1.25rem;
        }

        /* ── Product grid ── */
        .vp-main { flex: 1; min-width: 0; }
        .vp-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .vp-result-count {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${C.textFaint};
        }
        .vp-empty {
          text-align: center;
          padding: 5rem 1rem;
          font-family: 'Manrope', sans-serif;
          font-size: 0.85rem;
          letter-spacing: 0.02em;
          color: ${C.textMuted};
          border: 1px dashed ${C.borderDashed};
          border-radius: 14px;
        }
        .vp-product-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        /* ── Pagination ── */
        .vp-pagination {
          margin-top: 3rem;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 6px;
        }
        .vp-page-link {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          letter-spacing: 0.05em;
          padding: 8px 13px;
          border: 1px solid ${C.border};
          border-radius: 8px;
          color: ${C.textMuted};
          text-decoration: none;
          transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
        }
        .vp-page-link:hover { border-color: rgba(255,182,39,0.5); color: ${C.text}; }
        .vp-page-link.active {
          background: ${C.amber};
          border-color: ${C.amber};
          color: ${C.bg};
          font-weight: 700;
        }
        .vp-page-link.disabled {
          color: ${C.textFainter};
          cursor: not-allowed;
        }

        @media (min-width: 1025px) {
          .vp-sidebar { display: block; }
          .vp-mobile-trigger-wrap { display: none; }
          .vp-layout { padding: 3rem 40px; }
          .vp-hero { padding: 5rem 40px 3.5rem; }
          .vp-product-grid { grid-template-columns: repeat(3, 1fr); gap: 1.75rem; }
        }

        @media (min-width: 640px) and (max-width: 1024px) {
          .vp-product-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 1024px) {
          .vp-layout { flex-direction: column; padding: 2rem 20px; }
        }
      `}</style>

      <div className="vp-page">
        {/* ── Hero ── */}
        <div className="vp-hero">
          <div className="vp-eyebrow">
            <span className="vp-eyebrow-dot" />
            Shop the Collection
          </div>
          <h1 className="vp-store-name">{vendor.data.store_name}</h1>
          <div className="vp-ornament" />
        </div>

        {/* ── Mobile filter trigger ── */}
        <div className="vp-mobile-trigger-wrap">
          <button
            className="vp-mobile-trigger"
            onClick={() => setShowFilterModal(true)}
          >
            <SlidersHorizontal size={14} strokeWidth={1.5} />
            Filter &amp; Sort
          </button>
        </div>

        <div className="vp-layout">
          {/* ── Sidebar (desktop) ── */}
          <aside className="vp-sidebar">
            <div className="vp-sidebar-header">
              <span className="vp-sidebar-title">Filters</span>
              <button className="vp-chip-btn" onClick={ShowAllProducts}>
                All Products
              </button>
            </div>

            {/* Department filter */}
            <div className="vp-filter-block">
              <span className="vp-section-label">Departments &amp; Categories</span>
              <ul className="vp-dept-list">
                {departments.map((department) => {
                  const isExpanded = expandedDepartments.includes(
                    department.id.toString()
                  );

                  return (
                    <li key={department.id} className="vp-dept-item">
                      <div className="vp-dept-row">
                        <button
                          type="button"
                          onClick={() => {
                            toggleDepartment(department.id.toString());
                            setSelectedDepartment(department.id.toString());
                            setSelectedCategory("");
                          }}
                          className="vp-dept-name-btn"
                        >
                          {department.name}
                        </button>
                        <button
                          type="button"
                          className="vp-dept-toggle"
                          onClick={() => toggleDepartment(department.id.toString())}
                          aria-label={
                            isExpanded ? "Collapse department" : "Expand department"
                          }
                        >
                          {isExpanded ? <Minus size={15} /> : <Plus size={15} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <ul className="vp-cat-list">
                          {department.categories.map((category) => (
                            <li key={category.id} className="vp-cat-item">
                              <label className="vp-cat-label">
                                <input
                                  type="radio"
                                  name="category"
                                  className="vp-radio"
                                  value={category.id}
                                  checked={selectedCategory === category.id.toString()}
                                  onChange={() =>
                                    setSelectedCategory(category.id.toString())
                                  }
                                />
                                <span>{category.name}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Price */}
            <div className="vp-filter-block">
              <span className="vp-section-label">Price Range</span>
              <input
                type="range"
                min={0}
                max={6000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="vp-price-slider"
              />
              <p className="vp-price-value">Up to ${maxPrice}</p>
            </div>

            {/* Sort */}
            <div className="vp-filter-block">
              <span className="vp-section-label">Sort By</span>
              <select
                className="vp-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="default">Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Actions */}
            <div className="vp-btn-stack">
              <button className="vp-btn-primary" onClick={handleFilterChange}>
                Apply Filters
              </button>
              <button className="vp-btn-ghost" onClick={handleResetFilters}>
                Reset Filters
              </button>
            </div>
          </aside>

          {/* ── Mobile filter modal ── */}
          {showFilterModal && (
            <div
              className="vp-modal-overlay"
              onClick={() => setShowFilterModal(false)}
            >
              <div className="vp-modal-card" onClick={(e) => e.stopPropagation()}>
                <button
                  className="vp-modal-close"
                  onClick={() => setShowFilterModal(false)}
                  aria-label="Close filters"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>

                <h2 className="vp-modal-title">Filters</h2>

                <div className="vp-filter-block">
                  <span className="vp-section-label">Departments &amp; Categories</span>
                  <ul className="vp-dept-list">
                    {departments.map((department) => {
                      const idStr = department.id.toString();
                      const isExpanded = expandedDepartments.includes(idStr);
                      return (
                        <li key={idStr} className="vp-dept-item">
                          <div className="vp-dept-row">
                            <button
                              className="vp-dept-name-btn"
                              onClick={() => onDepartmentClick(idStr)}
                            >
                              {department.name}
                            </button>
                            <button
                              type="button"
                              className="vp-dept-toggle"
                              onClick={() => toggleDepartment(idStr)}
                              aria-label={
                                isExpanded ? "Collapse department" : "Expand department"
                              }
                            >
                              {isExpanded ? <Minus size={15} /> : <Plus size={15} />}
                            </button>
                          </div>

                          {isExpanded && (
                            <ul className="vp-cat-list">
                              {department.categories.map((category) => {
                                const catIdStr = category.id.toString();
                                return (
                                  <li key={catIdStr} className="vp-cat-item">
                                    <label className="vp-cat-label">
                                      <input
                                        key={catIdStr + selectedCategory}
                                        type="radio"
                                        name="category"
                                        className="vp-radio"
                                        value={catIdStr}
                                        checked={selectedCategory === catIdStr}
                                        onChange={() => setSelectedCategory(catIdStr)}
                                      />
                                      <span>{category.name}</span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="vp-filter-block">
                  <span className="vp-section-label">Price Range</span>
                  <input
                    type="range"
                    min={0}
                    max={6000}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="vp-price-slider"
                  />
                  <p className="vp-price-value">Up to ${maxPrice}</p>
                </div>

                <div className="vp-filter-block">
                  <span className="vp-section-label">Sort By</span>
                  <select
                    className="vp-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="default">Default</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>

                <div className="vp-btn-stack" style={{ flexDirection: "row" }}>
                  <button
                    className="vp-btn-primary"
                    onClick={() => {
                      handleFilterChange();
                      setShowFilterModal(false);
                    }}
                  >
                    Apply
                  </button>
                  <button
                    className="vp-btn-ghost"
                    onClick={() => {
                      handleResetFilters();
                      setShowFilterModal(false);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Product list ── */}
          <main className="vp-main">
            <div className="vp-toolbar">
              <span className="vp-result-count">
                {products.meta?.total ?? products.data.length} Results
              </span>
            </div>

            {products.data.length === 0 ? (
              <div className="vp-empty">No products found.</div>
            ) : (
              <div className="vp-product-grid">
                {products.data.map((product) => (
                  <ProductItem key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="vp-pagination">
              {products.meta.links.map((link, index) =>
                link.url ? (
                  <Link
                    key={index}
                    href={link.url}
                    className={`vp-page-link${link.active ? " active" : ""}`}
                  >
                    {link.label.replace("&laquo;", "«").replace("&raquo;", "»")}
                  </Link>
                ) : (
                  <span
                    key={index}
                    className="vp-page-link disabled"
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                )
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
