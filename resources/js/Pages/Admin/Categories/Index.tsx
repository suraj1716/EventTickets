import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  AdminTable,
  AdminBtn,
  ActionBtn,
  FilterBar,
  Pagination,
  StatusBadge,
  Tr,
  Td,
  FlashMessage,
  ConfirmModal,
  Icons,
} from "../../../Components/Admin/AdminComponents";

/* ── Types ── */
interface Department {
  id: number;
  name: string;
}

interface Category {
  image_url: any;
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  image: string | null;
  parent: { id: number; name: string } | null;
  department: Department | null;
  products_count: number;
}

interface Props {
  categories: {
    data: Category[];
    links: any[];
  };
  departments: Department[];
  filters: Record<string, string>;
  flash: { success?: string; error?: string };
}

export default function CategoriesIndex({ categories, departments, filters, flash }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    router.delete(route("admin.categories.destroy", deleteTarget.id), {
      preserveState: true,
      onFinish: () => setDeleteTarget(null),
    });
  };

  return (
    <>
      <Head title="Categories" />
      <AdminLayout>
        <AdminPageHeader
          eyebrow="Catalogue"
          title="Categories"
          meta={`${categories.data.length} records shown`}
          action={
            <AdminBtn
              as="a"
              href={route("admin.categories.create")}
              variant="accent"
            >
              <Icons.Plus />
              New Category
            </AdminBtn>
          }
        />

        <FlashMessage flash={flash} />

        <FilterBar
          routeName="admin.categories.index"
          filters={filters}
          fields={[
            { key: "search", placeholder: "Search name…", flex: true },
            {
              key: "department_id",
              type: "select",
              placeholder: "All Departments",
              options: departments.map((d) => ({ value: String(d.id), label: d.name })),
            },
            {
              key: "active",
              type: "select",
              placeholder: "All Status",
              options: [
                { value: "1", label: "Active" },
                { value: "0", label: "Inactive" },
              ],
            },
          ]}
        />

        <AdminTable
          headers={["#","", "Name", "Department", "Parent", "Products", "Status", "Actions"]}
          empty="✦ No categories found"
        >
          {categories.data.map((cat) => (
            <Tr key={cat.id}>
                            <Td muted>{cat.id}</Td>

              {/* Thumbnail */}
              <Td>
                <div style={{
                  width: 38, height: 38,
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  background: "var(--color-bg-alt)",
                  border: "1px solid var(--color-border)",
                  flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ color: "var(--color-text-muted)", opacity: 0.4 }}>
                      <Icons.Image />
                    </span>
                  )}
                </div>
              </Td>

              <Td>
                <div>
                  <span style={{ fontWeight: 500 }}>{cat.name}</span>
                  {cat.description && (
                    <div style={{
                      fontSize: "11px",
                      color: "var(--color-text-muted)",
                      marginTop: 2,
                      maxWidth: 240,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {cat.description}
                    </div>
                  )}
                </div>
              </Td>

              <Td muted>{cat.department?.name ?? "—"}</Td>

              <Td muted>
                {cat.parent ? (
                  <span style={{
                    fontSize: "11px",
                    background: "var(--color-bg-alt)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "2px 8px",
                    color: "var(--color-text-muted)",
                  }}>
                    {cat.parent.name}
                  </span>
                ) : (
                  <span style={{ color: "var(--color-text-muted)", opacity: 0.4, fontSize: 11 }}>Root</span>
                )}
              </Td>

              <Td muted>{cat.products_count}</Td>

              <Td>
                <StatusBadge status={cat.active ? "active" : "draft"} />
              </Td>

              <Td>
                <div style={{ display: "flex", gap: 4 }}>
                  <ActionBtn
                    variant="edit"
                    title="Edit"
                    as="a"
                    href={route("admin.categories.edit", cat.id)}
                  >
                    <Icons.Edit />
                  </ActionBtn>
                  <ActionBtn
                    variant="delete"
                    title="Delete"
                    onClick={() => setDeleteTarget(cat)}
                  >
                    <Icons.Delete />
                  </ActionBtn>
                </div>
              </Td>
            </Tr>
          ))}
        </AdminTable>

        <Pagination links={categories.links} />

        {deleteTarget && (
          <ConfirmModal
            title={`Delete "${deleteTarget.name}"?`}
            description="This will permanently remove the category. Products assigned to it will become uncategorised. This action cannot be undone."
            confirmLabel="Delete Category"
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AdminLayout>
    </>
  );
}
