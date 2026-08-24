import { Head, useForm, usePage } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import AdminLayout from "@/Pages/Admin/AdminLayout";
import { AdminPageHeader, FlashMessage } from "@/Components/Admin/AdminComponents";
import CategoryForm from "./CategoryForm";

interface Department { id: number; name: string; }
interface ParentCat  { id: number; name: string; department_id: number; }

interface Category {
  id: number;
  name: string;
  description: string | null;
  department_id: number;
  parent_id: number | null;
  active: boolean;
  image: string | null;
}

interface Props {
  category:    Category;
  departments: Department[];
  parents:     ParentCat[];
}

export default function Edit({ category, departments, parents }: Props) {
  const { props } = usePage();
  const flash: any = (props as any).flash ?? {};

  const { data, setData, processing, errors } = useForm({
    name:          category.name,
    description:   category.description ?? "",
    department_id: String(category.department_id),
    parent_id:     category.parent_id ? String(category.parent_id) : "",
    active:        category.active,
    image:         null as File | null,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("_method",       "PUT");
    formData.append("name",          data.name);
    formData.append("description",   data.description);
    formData.append("department_id", data.department_id);
    formData.append("parent_id",     data.parent_id);
    formData.append("active",        data.active ? "1" : "0");
    if (data.image) formData.append("image", data.image);

    router.post(route("admin.categories.update", category.id), formData as any);
  };

  return (
    <AdminLayout>
      <Head title={`Edit: ${category.name} — Admin`} />

      <AdminPageHeader
        eyebrow="Admin · Categories"
        title={<><em style={{ fontStyle: "italic", color: "var(--color-accent-light)" }}>Edit</em> Category</>}
      />

      <FlashMessage flash={flash} />

      <div style={{ maxWidth: 640 }}>
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "28px",
        }}>
          <CategoryForm
            data={data}
            setData={setData}
            errors={errors}
            processing={processing}
            onSubmit={submit}
            departments={departments}
            parents={parents}
            existingImage={category.image}
            submitLabel="Save Changes"
            cancelHref={route("admin.categories.index")}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
