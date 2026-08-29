import { Head } from "@inertiajs/react";
import toast from "react-hot-toast";
import AdminLayout from "../AdminLayout";
import { SlideOver, SlideOverActions } from "../../../Components/Admin/AdminComponents";
import { useAdminForm } from "../../../Components/Admin/useAdminForm";
import { VendorFormFields, VendorFormData } from "./VendorFormFields";

type Props = {
  vendor: VendorFormData & { user_id: number };
  types: string[];
  statuses: string[];
};

export default function VendorEdit({ vendor, types, statuses }: Props) {
  const indexHref = route("admin.vendors.index");

  const { data, set, errors, processing, put } = useAdminForm<VendorFormData>({
    name: vendor.name ?? "",
    email: vendor.email ?? "",
    phone: vendor.phone ?? "",
    store_name: vendor.store_name ?? "",
    store_address: vendor.store_address ?? "",
    vendor_type: vendor.vendor_type ?? types[0],
    booking_fee: vendor.booking_fee ?? "",
    status: vendor.status ?? statuses[0],
    business_start_time: vendor.business_start_time?.slice(0, 5) ?? "09:00",
    business_end_time: vendor.business_end_time?.slice(0, 5) ?? "18:00",
    slot_interval_minutes: vendor.slot_interval_minutes ?? 30,
    recurring_closed_days: Array.isArray(vendor.recurring_closed_days) ? vendor.recurring_closed_days : [],
    closed_dates: Array.isArray(vendor.closed_dates) ? vendor.closed_dates : [],
    facebook_url: vendor.facebook_url ?? "",
    youtube_url: vendor.youtube_url ?? "",
    instagram_url: vendor.instagram_url ?? "",
    tiktok_url: vendor.tiktok_url ?? "",
  });

  const handleSubmit = () => {
    put(route("admin.vendors.update", vendor.user_id), {
      onSuccess: () => toast.success("Vendor updated"),
    });
  };

  return (
    <>
      <Head title={`Edit Vendor — ${vendor.store_name}`} />
      <AdminLayout>
        <SlideOver
          eyebrow="Vendors"
          title={`Edit ${vendor.store_name}`}
          subtitle="Update this vendor's account and store profile."
          width={600}
          closeHref={indexHref}
          footer={
            <SlideOverActions
              onCancel={() => (window.location.href = indexHref)}
              onSubmit={handleSubmit}
              processing={processing}
              submitLabel="Save Changes"
            />
          }
        >
          <VendorFormFields data={data} set={set} errors={errors} types={types} statuses={statuses} />
        </SlideOver>
      </AdminLayout>
    </>
  );
}
