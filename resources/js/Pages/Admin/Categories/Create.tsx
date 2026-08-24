import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import AdminLayout from "@/Pages/Admin/AdminLayout";
import { AdminPageHeader, FlashMessage } from "@/Components/Admin/AdminComponents";
import CategoryForm from "./CategoryForm";

interface Department { id: number; name: string; }
interface ParentCat  { id: number; name: string; department_id: number; }

interface Props {
  departments: Department[];
  parents:     ParentCat[];
}

export default function Create({ departments, parents }: Props) {
  const { props } = usePage();
  const flash: any = (props as any).flash ?? {};

  const { data, setData, processing, errors } = useForm({
    name:          "",
    description:   "",
    department_id: "",
    parent_id:     "",
    active:        true,
    image:         null as File | null,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // useForm doesn't handle file uploads well — use router.post with FormData
    const formData = new FormData();
    formData.append("name",          data.name);
    formData.append("description",   data.description);
    formData.append("department_id", data.department_id);
    formData.append("parent_id",     data.parent_id);
    formData.append("active",        data.active ? "1" : "0");
    if (data.image) formData.append("image", data.image);

    router.post(route("admin.categories.store"), formData as any);
  };

  return (
    <AdminLayout>
      <Head title="New Category — Admin" />

      <AdminPageHeader
        eyebrow="Admin · Categories"
        title={<>New <em style={{ fontStyle: "italic", color: "var(--color-accent-light)" }}>Category</em></>}
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
            submitLabel="Create Category"
            cancelHref={route("admin.categories.index")}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
