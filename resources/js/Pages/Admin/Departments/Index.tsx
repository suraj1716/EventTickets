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

interface Department {
  image_url: string | undefined;
  id: number;
  name: string;
  slug: string;
  meta_title: string | null;
  image: string | null;
  active: boolean | number;
  categories_count: number;
  products_count: number;
}

interface Props {
  departments: { data: Department[]; links: any[] };
  filters: Record<string, string>;
  flash: { success?: string; error?: string };
}

export default function DepartmentsIndex({ departments, filters, flash }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    router.delete(route("admin.departments.destroy", deleteTarget.id), {
      preserveState: true,
      onFinish: () => setDeleteTarget(null),
    });
  };

  return (
    <>
      <Head title="Departments" />
      <AdminLayout>
        <AdminPageHeader
          eyebrow="Catalogue"
          title="Departments"
          meta={`${departments.data.length} records shown`}
          action={
            <AdminBtn as="a" href={route("admin.departments.create")} variant="accent">
              <Icons.Plus />
              New Department
            </AdminBtn>
          }
        />

        <FlashMessage flash={flash} />

        <FilterBar
          routeName="admin.departments.index"
          filters={filters}
          fields={[
            { key: "search", placeholder: "Search name or slug…", flex: true },
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
          headers={["#","", "Name", "Slug", "Categories", "Products", "Status", "Actions"]}
          empty="✦ No departments found"
        >
          {departments.data.map((dept) => (
            <Tr key={dept.id}>
              <Td muted>{dept.id}</Td>
              {/* Thumbnail */}
              <Td>
                <div style={{
                  width: 38, height: 38,
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  background: "var(--color-bg-alt)",
                  border: "1px solid var(--color-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {dept.image ? (
                    <img
                      src={dept.image_url}
                      alt={dept.name}
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
                  <span style={{ fontWeight: 500 }}>{dept.name}</span>
                  {dept.meta_title && (
                    <div style={{
                      fontSize: "11px", color: "var(--color-text-muted)",
                      marginTop: 2, maxWidth: 260,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {dept.meta_title}
                    </div>
                  )}
                </div>
              </Td>

              <Td muted>
                <span style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "11px",
                  background: "var(--color-bg-alt)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "2px 8px",
                  color: "var(--color-text-muted)",
                }}>
                  {dept.slug}
                </span>
              </Td>

              <Td muted>{dept.categories_count}</Td>
              <Td muted>{dept.products_count}</Td>

              <Td>
                <StatusBadge status={Boolean(dept.active) ? "active" : "draft"} />
              </Td>

              <Td>
                <div style={{ display: "flex", gap: 4 }}>
                  <ActionBtn
                    variant="edit"
                    title="Edit"
                    as="a"
                    href={route("admin.departments.edit", dept.id)}
                  >
                    <Icons.Edit />
                  </ActionBtn>
                  <ActionBtn
                    variant="delete"
                    title="Delete"
                    onClick={() => setDeleteTarget(dept)}
                  >
                    <Icons.Delete />
                  </ActionBtn>
                </div>
              </Td>
            </Tr>
          ))}
        </AdminTable>

        <Pagination links={departments.links} />

        {deleteTarget && (
          <ConfirmModal
            title={`Delete "${deleteTarget.name}"?`}
            description={
              deleteTarget.categories_count > 0
                ? `This department has ${deleteTarget.categories_count} categories. You must reassign or delete them first.`
                : "This will permanently remove the department. This action cannot be undone."
            }
            confirmLabel="Delete Department"
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AdminLayout>
    </>
  );
}
