import { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Pages/Admin/AdminLayout";
import { CurrencyFormatter } from "@/utils/CurrencyFormatter";
import { AdminPageHeader, AdminBtn, AdminTable, Tr, Td, ActionBtn, FilterBar, Pagination, FlashMessage, StatusBadge, ConfirmModal, Icons, fontDisplay, fontBody, C } from "../../../Components/Admin/AdminComponents";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface Product {
  thumb: string;
  id: number;
  title: string;
  slug: string;
  price: number;
  quantity: number;
  status: string;
  highlight: string | null;
  variations_count: number;
  department: { name: string } | null;
  category: { name: string } | null;
  media: { id: number; original_url: string; thumb: string }[];
}

interface PaginationMeta<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  from: number;
  to: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface Department {
  id: number;
  name: string;
}

interface Props {
  products: PaginationMeta<Product>;
  departments: Department[];
  filters: { search?: string; status?: string; department_id?: string };
  flash?: { success?: string; error?: string };
}

/* ─────────────────────────────────────────────
   Highlight badge
───────────────────────────────────────────── */
const HIGHLIGHT_COLORS: Record<string, string> = {
  sale:     "#C0392B",
  hot:      "#C9650A",
  trending: `${C.amber}`,
  new:      `${C.amberDark}`,
};

function HighlightBadge({ value }: { value: string }) {
  const bg = HIGHLIGHT_COLORS[value] ?? `${C.amber}`;
  return (
    <span style={{
      display: "inline-flex",
      padding: "2px 8px",
      borderRadius: "999px",
      fontSize: "9px", fontWeight: 600,
      letterSpacing: "0.1em", textTransform: "uppercase",
      color: "white", background: bg,
      fontFamily: `${fontBody}`,
    }}>
      {value}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function Index({ products, departments, filters, flash }: Props) {
  const { props } = usePage();
  const pageFlash = flash ?? (props as any).flash ?? {};
console.log('products',products)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    router.delete(route("admin.products.destroy", deleteTarget.id), {
      onFinish: () => setDeleteTarget(null),
    });
  };

  return (
    <AdminLayout>
      <Head title="Products — Admin" />

      {/* ── Header ── */}
    <AdminPageHeader
              eyebrow="Catalogue"
              title="Products"
              meta={`${products.data.length} records shown`}
              action={
                <AdminBtn as="a" href={route("admin.departments.create")} variant="accent">
                  <Icons.Plus />
                  New Product
                </AdminBtn>
              }
            />

      {/* ── Flash ── */}
      <FlashMessage flash={pageFlash} />

      {/* ── Filters ── */}
      <FilterBar
        routeName="admin.products.index"
        filters={{
          search: filters.search ?? "",
          status: filters.status ?? "",
          department_id: filters.department_id ?? "",
        }}
        fields={[
          { key: "search", placeholder: "Search products…", flex: true },
          {
            key: "status", type: "select", placeholder: "All Status",
            options: [
              { value: "published", label: "Published" },
              { value: "draft",     label: "Draft" },
            ],
          },
          {
            key: "department_id", type: "select", placeholder: "All Departments",
            options: departments.map((d) => ({ value: String(d.id), label: d.name })),
          },
        ]}
      />

      {/* ── Table ── */}
      <AdminTable
        headers={["#","", "Product", "Dept / Category", "Price", "Qty", "Status", "Highlight", "Variations", "Actions"]}

        empty="✦ No products found"
      >
        {products.data.map((product) => (
          <Tr
            key={product.id}
            onClick={() => router.visit(route("admin.products.edit", product.id))}
          >
            <Td muted>{product.id}</Td>
            {/* Thumb */}
            <Td>
              <div style={{
                width: 44, height: 44,
                borderRadius: "8px",
                overflow: "hidden", flexShrink: 0,
                background: `${C.bgAlt}`,
                border: `1px solid ${C.border}`,
              }}>
                {product.thumb ? (
                  <img
                    src={product.thumb}
                    alt={product.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icons.Image />
                  </div>
                )}
              </div>
            </Td>

            {/* Product name + slug */}
            <Td>
              <div style={{
                fontFamily: `${fontDisplay}`, fontSize: 15,
                fontWeight: 400, color: `${C.text}`, lineHeight: 1.2,
              }}>
                {product.title}
              </div>
              <div style={{
                fontSize: 11, color: `${C.textFaint}`,
                letterSpacing: "0.02em", marginTop: 2,
              }}>
                {product.slug}
              </div>
            </Td>

            {/* Dept / Category */}
            <Td muted>
              {product.department?.name ?? "—"}
              {product.category ? ` / ${product.category.name}` : ""}
            </Td>

            {/* Price */}
            <Td>
              <span style={{
                fontWeight: 500, color: `${C.amber}`,
                fontFamily: `${fontDisplay}`, fontSize: 15,
              }}>
                <CurrencyFormatter amount={product.price} currency="AUD" />
              </span>
            </Td>

            {/* Qty */}
            <Td muted>{product.quantity}</Td>

            {/* Status */}
            <Td>
              <StatusBadge status={product.status} />
            </Td>

            {/* Highlight */}
            <Td>
              {product.highlight
                ? <HighlightBadge value={product.highlight} />
                : <span style={{ color: `${C.textFaint}`, fontSize: 11 }}>—</span>
              }
            </Td>

            {/* Variations */}
            <Td muted>{product.variations_count} combos</Td>

            {/* Actions */}
            <Td right>
              <div
                style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}
                onClick={(e) => e.stopPropagation()}
              >
                <ActionBtn
                  variant="edit"
                  title="Edit"
                  as={Link}
                  href={route("admin.products.edit", product.id)}
                >
                  <Icons.Edit />
                </ActionBtn>
                <ActionBtn
                  variant="delete"
                  title="Delete"
                  onClick={() => setDeleteTarget(product)}
                >
                  <Icons.Delete />
                </ActionBtn>
              </div>
            </Td>
          </Tr>
        ))}
      </AdminTable>

      {/* ── Pagination ── */}
      {products.last_page > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 0", flexWrap: "wrap", gap: 12,
          fontFamily: `${fontBody}`, fontSize: 12,
          color: `${C.textMuted}`,
        }}>
          <span>Showing {products.from}–{products.to} of {products.total}</span>
          <Pagination links={products.links} />
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <ConfirmModal
          title={
            <>Delete <em style={{ fontStyle: "italic", color: `${C.amber}` }}>{deleteTarget.title}</em>?</>
          }
          description={`This will permanently delete "${deleteTarget.title}" and all its data. This action cannot be undone.`}
          confirmLabel="Delete Product"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminLayout>
  );
}
