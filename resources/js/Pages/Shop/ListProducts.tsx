import React, { useState, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
  PageProps,
  PaginationProps,
  Product,
  Department,
  CategoryGroup,
  ProductGroup,
} from "@/types";
import { CurrencyFormatter } from "@/utils/CurrencyFormatter";
import { ChevronDown, ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import PageHero from "@/Components/Page/PageHero";

type ProfileProps = PageProps<{
  allProducts: PaginationProps<Product>;
  products: PaginationProps<Product>;
  searchedProducts?: PaginationProps<Product>;
  categoryGroups: CategoryGroup[];
  productGroups: ProductGroup[];
  department: Department;
  departments: Department[];
  filters: {
    department_id: string | null;
    category_id: string | null;
    max_price: string | null;
    sort_by: string | null;
    keyword?: string | null;
  };
}>;

interface CartItem {
  product: Product;
  quantity: number;
}

export default function ListProducts({
  allProducts,
  searchedProducts,
  departments,
  filters,
}: ProfileProps) {
  // All categories open by default
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [trayOpen, setTrayOpen] = useState(false);

  const uniqueProducts: Product[] = Array.from(
    new Map((allProducts?.data ?? []).map((p) => [p.id, p])).values(),
  );

  const displayedProducts =
    filters.keyword && searchedProducts?.data?.length
      ? searchedProducts.data
      : uniqueProducts;

  // Group: dept → category → products
  const grouped = useMemo<
    Record<
      string,
      {
        dept: Department;
        storeName: string;
        categories: Record<string, { catName: string; products: Product[] }>;
      }
    >
  >(() => {
    const map: Record<
      string,
      {
        dept: Department;
        storeName: string;
        categories: Record<string, { catName: string; products: Product[] }>;
      }
    > = {};

    displayedProducts.forEach((product) => {
      const deptId = String(product.department?.id ?? "unknown");
      const catId = String(product.category?.id ?? "unknown");

      if (!map[deptId]) {
        map[deptId] = {
          dept: product.department,
          storeName:
            product.user?.store_name ??
            product.user?.name ??
            "Glamour Hair Salon",
          categories: {},
        };
      }

      if (!map[deptId].categories[catId]) {
        map[deptId].categories[catId] = {
          catName: product.category?.name ?? "Other",
          products: [],
        };
      }

      map[deptId].categories[catId].products.push(product);
    });

    return map;
  }, [displayedProducts]);

  const toggleCat = (key: string) => {
    setOpenCats((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isCatOpen = (key: string) => openCats[key] === true; //close by default

  const toggleProduct = (product: Product) => {
    setCart((prev) => {
      if (prev[product.id]) {
        const next = { ...prev };
        delete next[product.id];
        return next;
      }
      return { ...prev, [product.id]: { product, quantity: 1 } };
    });
  };

  const changeQty = (id: number, delta: number) => {
    setCart((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...item, quantity: newQty } };
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItems.reduce(
    (s, i) => s + (i.product.price ?? 0) * i.quantity,
    0,
  );

  const handleAddAllToCart = () => {
    cartItems.forEach((item) => {
      router.post(
        route("cart.store", item.product.id),
        { product_id: item.product.id, quantity: item.quantity },
        { preserveScroll: true },
      );
    });
    setCart({});
    setTrayOpen(false);
  };

  const imageUrl = (product: Product) => {
    const img = product.image;
    if (!img) return "/placeholder.jpg";
    return img.includes("conversions")
      ? img.replace(/\/conversions\/(.+)-thumb\.(jpg|png|webp)/, "/$1.$2")
      : img;
  };

  const HIGHLIGHT_COLORS: Record<string, string> = {
    sale: "#C0392B",
    hot: "#C9650A",
    trending: "var(--color-primary)",
    new: "var(--color-accent-dark)",
  };

  return (
    <AuthenticatedLayout>
      <Head title="Services" />

      <style>{`
        /* PAGE */
        .sp-page { background: var(--color-bg); min-height: 100vh; }

        /* HERO */
        .sp-hero {
          background: var(--color-bg-dark);
          padding: 52px 0 44px;
          text-align: center;
          position: relative;
          overflow: hidden;
          z-index:1
        }
        .sp-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 100% at 50% 110%, rgba(201,169,110,0.15), transparent);
          pointer-events: none;
        }
        .sp-hero-eyebrow {
          display: block;
          font-family: var(--font-body);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--color-accent);
          margin-bottom: 10px;
        }
        .sp-hero-title {
          font-family: var(--font-display);
          font-size: clamp(2.2rem, 5vw, 3.5rem);
          font-weight: 300;
          color: white;
          line-height: 1.08;
          margin-bottom: 10px;
        }
        .sp-hero-title em { font-style: italic; color: var(--color-accent-light); }
        .sp-hero-sub {
          font-family: var(--font-body);
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.06em;
        }

        /* BODY */
        .sp-body {
          max-width: 860px;
          margin: 0 auto;
          padding: 40px 24px 120px;
        }

        /* SEARCH BANNER */
        .sp-search-banner {
          background: var(--color-bg-alt);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 12px 18px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--color-text-muted);
        }
        .sp-search-banner strong { color: var(--color-text); }

        /* DEPT BLOCK */
        .sp-dept {
          margin-bottom: 32px;
        }

        /* DEPT HEADER — store name banner */
        .sp-dept-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--color-border);
        }
        .sp-dept-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sp-dept-icon svg {
          width: 18px;
          height: 18px;
          stroke: white;
          fill: none;
          stroke-width: 1.6;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .sp-dept-meta {}
        .sp-dept-name {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: 400;
          color: var(--color-text);
          line-height: 1.1;
          letter-spacing: 0.01em;
        }
        .sp-dept-store {
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-accent);
          margin-top: 2px;
        }

        /* CATEGORY ACCORDION */
        .sp-cat {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          margin-bottom: 10px;
          background: var(--color-surface);
        }

        .sp-cat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          cursor: pointer;
          user-select: none;
          transition: background var(--transition-fast);
        }
        .sp-cat-header:hover { background: var(--color-surface-warm); }

        .sp-cat-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sp-cat-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--color-accent);
          flex-shrink: 0;
        }
        .sp-cat-name {
          font-family: var(--font-body);
          font-size: var(--text-base);
          font-weight: 500;
          color: var(--color-text);
          letter-spacing: 0.01em;
        }
        .sp-cat-count {
          font-family: var(--font-body);
          font-size: 11px;
          color: var(--color-text);
          background: var(--color-bg-alt);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          padding: 1px 8px;
        }
        .sp-chevron {
          color: var(--color-text-muted);
          transition: transform var(--transition-base);
          flex-shrink: 0;
        }
        .sp-chevron.open { transform: rotate(180deg); }

        /* PRODUCT LIST */
        .sp-products {
          border-top: 1px solid var(--color-border);
        }

        .sp-product-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 13px 20px;
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
          transition: background var(--transition-fast);
          position: relative;
        }
        .sp-product-row:last-child { border-bottom: none; }
        .sp-product-row:hover { background: var(--color-bg-alt); }
        .sp-product-row.selected { background: rgba(45,80,22,0.05); }

        /* Checkbox */
        .sp-checkbox {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border-radius: 5px;
          border: 1.5px solid var(--color-border-dark);
          background: var(--color-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .sp-checkbox.checked {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }
        .sp-check-icon {
          color: white;
          width: 11px;
          height: 11px;
          stroke-width: 3;
        }

        /* Thumbnail */
        .sp-thumb {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--color-bg-alt);
          border: 1px solid var(--color-border);
        }
        .sp-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-slow);
        }
        .sp-product-row:hover .sp-thumb img { transform: scale(1.07); }

        /* Info */
        .sp-info { flex: 1; min-width: 0; }
        .sp-info-name {
          font-family: var(--font-body);
          font-size: var(--text-base);
          font-weight: 500;
          color: var(--color-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }
        .sp-info-desc {
          font-family: var(--font-body);
          font-size: 12px;
          color: var(--color-text-light);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sp-badge {
          display: inline-flex;
          padding: 2px 7px;
          border-radius: var(--radius-full);
          font-family: var(--font-body);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: white;
          margin-top: 4px;
        }

        /* Price */
        .sp-price {
          font-family: var(--font-body);
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--color-primary);
          flex-shrink: 0;
          text-align: right;
          min-width: 68px;
        }

        /* EMPTY */
        .sp-empty {
          text-align: center;
          padding: 80px 20px;
        }
        .sp-empty-glyph {
          font-family: var(--font-display);
          font-size: 56px;
          color: var(--color-border-dark);
          margin-bottom: 14px;
        }
        .sp-empty-title {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: 300;
          color: var(--color-text-muted);
        }

        /* TRAY */
        .sp-tray {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 20000;
        }
        .sp-tray-bar {
          background: var(--color-bg-dark);
          padding: 13px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.28);
        }
        .sp-tray-bar-left { display: flex; align-items: center; gap: 12px; }
        .sp-tray-icon-wrap { position: relative; display: inline-flex; }
        .sp-tray-badge {
          position: absolute;
          top: -6px;
          right: -7px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-accent);
          color: var(--color-bg-dark);
          font-family: var(--font-body);
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sp-tray-label {
          font-family: var(--font-body);
          font-size: 13px;
          color: rgba(255,255,255,0.65);
        }
        .sp-tray-label strong { color: white; font-weight: 500; }
        .sp-tray-total {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: 300;
          color: var(--color-accent-light);
        }

        /* Tray expanded */
        .sp-tray-panel {
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
          box-shadow: 0 -8px 32px rgba(0,0,0,0.14);
          max-height: 58vh;
          overflow-y: auto;
        }
        .sp-tray-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
          background: var(--color-surface);
          z-index: 1;
        }
        .sp-tray-panel-title {
          font-family: var(--font-display);
          font-size: var(--text-xl);
          font-weight: 400;
          color: var(--color-text);
        }
        .sp-tray-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: color var(--transition-fast);
        }
        .sp-tray-close-btn:hover { color: var(--color-text); }

        .sp-tray-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 24px;
          border-bottom: 1px solid var(--color-border);
        }
        .sp-tray-item-thumb {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--color-bg-alt);
        }
        .sp-tray-item-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .sp-tray-item-name {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text);
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sp-qty {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .sp-qty-btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1px solid var(--color-border-dark);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: all var(--transition-fast);
        }
        .sp-qty-btn:hover { background: var(--color-bg-alt); color: var(--color-text); }
        .sp-qty-num {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text);
          min-width: 18px;
          text-align: center;
        }
        .sp-tray-item-price {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-primary);
          min-width: 54px;
          text-align: right;
          flex-shrink: 0;
        }
        .sp-tray-item-del {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-light);
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color var(--transition-fast);
          flex-shrink: 0;
        }
        .sp-tray-item-del:hover { color: var(--color-error); }

        .sp-tray-footer {
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          background: var(--color-surface-warm);
          border-top: 1px solid var(--color-border);
          position: sticky;
          bottom: 0;
        }
        .sp-tray-footer-total {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: 300;
          color: var(--color-text);
        }
        .sp-tray-footer-total span { color: var(--color-primary); font-weight: 400; }



/* Checkbox */
.sp-checkbox {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border: 1.5px solid var(--color-border-dark);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}
.sp-checkbox.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.sp-check-icon {
  color: white;
  width: 11px;
  height: 11px;
  stroke-width: 3;
}

/* Radio (product selection) */
.sp-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--color-border-dark);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color var(--transition-fast);
}
.sp-radio.checked {
  border-color: var(--color-primary);
}
.sp-radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
}


        /* RESPONSIVE */
       @media (max-width: 640px) {
  .sp-body { padding: 24px 14px 120px; }
  .sp-info-desc { display: none; }
  .sp-cat-header { padding: 12px 14px; }
  .sp-product-row { padding: 11px 14px; gap: 10px; }
  .sp-thumb { width: 42px; height: 42px; }
  .sp-tray-bar { padding: 11px 14px; }
  .sp-tray-item { padding: 10px 14px; }
  .sp-tray-panel-header { padding: 13px 14px; }

  .sp-tray-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px 14px;
  }
  .sp-tray-footer-total {
    text-align: right;
     padding-right: 35px;

  }
  .sp-tray-footer-actions {
    display: flex;
    gap: 10px;
  }
  .sp-tray-footer-actions .btn {
    flex: 1;
    justify-content: center;
    white-space: nowrap;
  }

}
      `}</style>

      <div className="sp-page">
        {/* Hero */}

        <PageHero
          eyebrow="Our Services"
          title={
            <>
              Book <em>Services</em>
            </>
          }
          subtitle="  Select services below, then add your entire selection to cart at once."
          breadcrumbs={[
            { label: "Home", href: route("home") },
            { label: "Shop" },
          ]}
        />
        <div className="sp-body">
          {/* Search banner */}
          {filters.keyword && searchedProducts?.data?.length ? (
            <div className="sp-search-banner">
              <span>
                Showing <strong>{searchedProducts.data.length}</strong> results
                for "<strong>{filters.keyword}</strong>"
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  router.get(route("shop.search"), {}, { preserveState: true })
                }
              >
                Clear search
              </button>
            </div>
          ) : null}

          {/* Departments */}
          {Object.keys(grouped).length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty-glyph">✦</div>
              <p className="sp-empty-title">No services available</p>
            </div>
          ) : (
            Object.entries(grouped).map(
              ([deptId, { dept, storeName, categories }]) => {
                const totalProducts = Object.values(categories).reduce(
                  (s, c) => s + c.products.length,
                  0,
                );

                return (
                  <div className="sp-dept" key={deptId}>
                    {/* Dept header: store name + dept name */}
                    <div className="sp-dept-header">
                      <div className="sp-dept-icon">
                        {/* scissors icon */}
                        <svg viewBox="0 0 24 24">
                          <circle cx="6" cy="6" r="3" />
                          <circle cx="6" cy="18" r="3" />
                          <line x1="20" y1="4" x2="8.12" y2="15.88" />
                          <line x1="14.47" y1="14.48" x2="20" y2="20" />
                          <line x1="8.12" y1="8.12" x2="12" y2="12" />
                        </svg>
                      </div>
                      <div className="sp-dept-meta">
                        <div className="sp-dept-store">{storeName}</div>
                        <div className="sp-dept-name">
                          {dept?.name ?? "Services"}
                        </div>
                      </div>
                    </div>

                    {/* Categories — each is a collapsible accordion */}
                    {Object.entries(categories).map(
                      ([catId, { catName, products: catProducts }]) => {
                        const catKey = `cat-${deptId}-${catId}`;
                        const isOpen = isCatOpen(catKey);

                        return (
                          <div className="sp-cat" key={catId}>
                            {/* Category header */}
                            <div
                              className="sp-cat-header"
                              onClick={() => toggleCat(catKey)}
                              role="button"
                              aria-expanded={isOpen}
                            >
                              <div className="sp-cat-header-left">
                                <span className="sp-cat-dot" />
                                <span className="sp-cat-name">{catName}</span>
                                <span className="sp-cat-count">
                                  {catProducts.length}
                                </span>
                              </div>
                              <ChevronDown
                                size={16}
                                className={`sp-chevron${isOpen ? " open" : ""}`}
                              />
                            </div>

                            {/* Products */}
                            {isOpen && (
                              <div className="sp-products">
                              {catProducts.map((product) => {
  const isSelected = !!cart[product.id];
  return (
    <div
      key={product.id}
      className={`sp-product-row${isSelected ? " selected" : ""}`}
      onClick={() => {
        // Deselect any other product in this category first
        catProducts.forEach((p) => {
          if (p.id !== product.id && cart[p.id]) {
            toggleProduct(p);
          }
        });
        toggleProduct(product);
      }}
    >
      {/* Radio dot */}
      <div className={`sp-radio${isSelected ? " checked" : ""}`}>
        {isSelected && <div className="sp-radio-dot" />}
      </div>

      {/* Thumb */}
      <div className="sp-thumb">
        <img
          src={imageUrl(product)}
          alt={product.title}
          onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
        />
      </div>

      {/* Info */}
      <div className="sp-info">
        <div className="sp-info-name">{product.title}</div>
        <div className="sp-info-desc">
          {product.description.replace(/<[^>]+>/g, "")}
        </div>
        {product.highlight && (
          <span
            className="sp-badge"
            style={{
              background: HIGHLIGHT_COLORS[product.highlight] ?? "var(--color-primary)",
            }}
          >
            {product.highlight}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="sp-price">
        <CurrencyFormatter amount={product.price ?? 0} currency="AUD" />
      </div>
    </div>
  );
})}
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                );
              },
            )
          )}
        </div>

        {/* TRAY */}
        {cartCount > 0 && (
          <div className="sp-tray">
            {trayOpen ? (
              <div className="sp-tray-panel">
                <div className="sp-tray-panel-header">
                  <span className="sp-tray-panel-title">Your Selection</span>
                  <button
                    className="sp-tray-close-btn"
                    onClick={() => setTrayOpen(false)}
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>

                {cartItems.map((item) => (
                  <div className="sp-tray-item" key={item.product.id}>
                    <div className="sp-tray-item-thumb">
                      <img
                        src={imageUrl(item.product)}
                        alt={item.product.title}
                        onError={(e) =>
                          (e.currentTarget.src = "/placeholder.jpg")
                        }
                      />
                    </div>
                    <span className="sp-tray-item-name">
                      {item.product.title}
                    </span>
                    {/* <div className="sp-qty">
                      <button className="sp-qty-btn" onClick={(e) => { e.stopPropagation(); changeQty(item.product.id, -1); }}>
                        <Minus size={11} />
                      </button>
                      <span className="sp-qty-num">{item.quantity}</span>
                      <button className="sp-qty-btn" onClick={(e) => { e.stopPropagation(); changeQty(item.product.id, 1); }}>
                        <Plus size={11} />
                      </button>
                    </div> */}
                    <span className="sp-tray-item-price">
                      <CurrencyFormatter
                        amount={(item.product.price ?? 0) * item.quantity}
                        currency="AUD"
                      />
                    </span>
                    <button
                      className="sp-tray-item-del"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.product.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <div className="sp-tray-footer">
                  <div className="sp-tray-footer-total">
                    Total&nbsp;&nbsp;
                    <span>
                      <CurrencyFormatter amount={cartTotal} currency="AUD" />
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "24px" }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setCart({});
                        setTrayOpen(false);
                      }}
                    >
                      Clear all
                    </button>
                    <button
                      className="btn btn-accent"
                      onClick={handleAddAllToCart}
                      style={{ gap: "8px" }}
                    >
                      <ShoppingBag size={15} />
                      Add {cartCount} item{cartCount !== 1 ? "s" : ""} to Cart
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sp-tray-bar" onClick={() => setTrayOpen(true)}>
                <div className="sp-tray-bar-left">
                  <div className="sp-tray-icon-wrap">
                    <ShoppingBag size={22} color="white" />
                    <span className="sp-tray-badge">{cartCount}</span>
                  </div>
                  <span className="sp-tray-label">
                    <strong>
                      {cartCount} service{cartCount !== 1 ? "s" : ""}
                    </strong>{" "}
                    selected — tap to review
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "14px" }}
                >
                  <span className="sp-tray-total">
                    <CurrencyFormatter amount={cartTotal} currency="AUD" />
                  </span>
                  <ChevronDown
                    size={16}
                    color="rgba(255,255,255,0.4)"
                    style={{ transform: "rotate(180deg)" }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
