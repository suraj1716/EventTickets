import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ProductItem from "@/Components/App/ProductItem";
import { Eyebrow, Ornament } from "@/Components/App/ui/SectionHeading";
import {
  Vendor,
  PageProps,
  PaginationProps,
  Product,
  Department,
} from "@/types";
import { Plus, Minus, X, SlidersHorizontal } from "lucide-react";

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

/* ── page title (h1), distinct from SectionHeading's <em>-accented h2 ── */
function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 300,
        fontSize: "2.25rem",
        color: "var(--color-text)",
        margin: 0,
        lineHeight: 1.15,
      }}
    >
      {children}
    </h1>
  );
}

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
      <Head title={`${vendor.data.store_name} Profile Page`} />

      <style>{`
        .vp-page {
          background: var(--color-bg);
          min-height: 100%;
        }

        .vp-hero {
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          padding: 4rem 24px 3rem;
          text-align: center;
        }

        .vp-layout {
          display: flex;
          gap: 2rem;
          padding: 2.5rem 24px;
          max-width: var(--container-max, 1280px);
          margin: 0 auto;
          align-items: flex-start;
        }

        /* ── Sidebar (desktop) ── */
        .vp-sidebar {
          display: none;
          width: 280px;
          flex-shrink: 0;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
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
          border-bottom: 1px solid var(--color-border);
        }
        .vp-sidebar-title {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 300;
          color: var(--color-text);
        }
        .vp-chip-btn {
          font-family: var(--font-body);
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-accent-dark);
          background: none;
          border: 1px solid var(--color-accent);
          padding: 6px 12px;
          cursor: pointer;
          transition: background var(--transition-fast, 200ms), color var(--transition-fast, 200ms);
        }
        .vp-chip-btn:hover {
          background: var(--color-accent);
          color: var(--color-bg-dark, #fff);
        }

        .vp-section-label {
          font-family: var(--font-body);
          font-size: 0.68rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin-bottom: 0.9rem;
          display: block;
        }

        .vp-dept-list { list-style: none; margin: 0; padding: 0; }
        .vp-dept-item { border-bottom: 1px solid var(--color-border); }
        .vp-dept-item:last-child { border-bottom: none; }
        .vp-dept-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0;
        }
        .vp-dept-name-btn {
          font-family: var(--font-body);
          font-size: 0.82rem;
          letter-spacing: 0.02em;
          color: var(--color-text);
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          padding: 0;
          flex: 1;
          transition: color var(--transition-fast, 200ms);
        }
        .vp-dept-name-btn:hover { color: var(--color-accent-dark); }
        .vp-dept-toggle {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-accent);
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
          font-family: var(--font-body);
          font-size: 0.78rem;
          color: var(--color-text-muted);
          cursor: pointer;
        }
        .vp-cat-label:hover { color: var(--color-text); }
        .vp-radio { accent-color: var(--color-accent); width: 14px; height: 14px; flex-shrink: 0; }

        .vp-price-slider { width: 100%; accent-color: var(--color-accent); }
        .vp-price-value {
          font-family: var(--font-body);
          font-size: 0.78rem;
          color: var(--color-text-muted);
          margin-top: 0.4rem;
        }

        .vp-select {
          width: 100%;
          font-family: var(--font-body);
          font-size: 0.8rem;
          color: var(--color-text);
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          padding: 8px 10px;
        }

        .vp-btn-primary {
          width: 100%;
          padding: 12px 0;
          background: var(--color-accent);
          color: var(--color-bg-dark, #1c1a17);
          border: 1px solid var(--color-accent);
          font-family: var(--font-body);
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background var(--transition-fast, 200ms);
        }
        .vp-btn-primary:hover { background: var(--color-accent-dark); }

        .vp-btn-ghost {
          width: 100%;
          padding: 12px 0;
          background: transparent;
          color: var(--color-text-muted);
          border: 1px solid var(--color-border);
          font-family: var(--font-body);
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color var(--transition-fast, 200ms), color var(--transition-fast, 200ms);
        }
        .vp-btn-ghost:hover { border-color: var(--color-accent); color: var(--color-text); }

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
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          font-family: var(--font-body);
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-text);
          cursor: pointer;
        }

        /* ── Mobile filter modal ── */
        .vp-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: var(--color-overlay, rgba(18,16,13,0.5));
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .vp-modal-card {
          width: 100%;
          max-height: 88vh;
          overflow-y: auto;
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
          padding: 1.5rem 1.5rem 2rem;
          position: relative;
        }
        .vp-modal-close {
          position: absolute;
          top: 1rem;
          right: 1.25rem;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
        }
        .vp-modal-title {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 300;
          color: var(--color-text);
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
          font-family: var(--font-body);
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }
        .vp-empty {
          text-align: center;
          padding: 5rem 1rem;
          font-family: var(--font-body);
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
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
          font-family: var(--font-body);
          font-size: 0.72rem;
          letter-spacing: 0.05em;
          padding: 8px 13px;
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          text-decoration: none;
          transition: border-color var(--transition-fast, 200ms), color var(--transition-fast, 200ms), background var(--transition-fast, 200ms);
        }
        .vp-page-link:hover { border-color: var(--color-accent); color: var(--color-text); }
        .vp-page-link.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: var(--color-text-inverse, #fff);
        }
        .vp-page-link.disabled {
          color: var(--color-border);
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
          <div style={{ marginBottom: "0.75rem" }}>
            <Eyebrow center>Shop the Collection</Eyebrow>
          </div>
          <Heading>{vendor.data.store_name}</Heading>
          <Ornament center />
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
