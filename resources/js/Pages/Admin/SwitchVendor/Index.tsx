import { Head, router, usePage } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import { AdminPageHeader, C, fontBody } from "../../../Components/Admin/AdminComponents";

type Props = {
  vendors: { id: number; name: string; email: string }[];
  activeVendorId: number | null;
};

export default function SwitchVendor() {
  const { props } = usePage<{ [key: string]: any } & Props>();
  const { vendors, activeVendorId } = props as Props;

  return (
    <AdminLayout>
      <Head title="Switch Vendor" />
      <AdminPageHeader eyebrow="Staff" title="Switch Vendor" meta="Pick which vendor you're currently working for." />

      {vendors.length === 0 ? (
        <p style={{ fontFamily: fontBody, fontSize: 13, color: C.textFaint }}>
          You're not an active staff member for any vendor yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
          {vendors.map((v) => (
            <button
              key={v.id}
              onClick={() => router.post(route("admin.switch-vendor.update"), { vendor_id: v.id })}
              style={{
                textAlign: "left",
                fontFamily: fontBody,
                fontSize: 14,
                padding: "14px 18px",
                borderRadius: 10,
                border: `1px solid ${v.id === activeVendorId ? C.amber : C.border}`,
                background: v.id === activeVendorId ? "rgba(255,182,39,0.1)" : C.surface,
                color: C.text,
                cursor: "pointer",
              }}
            >
              {v.name}
              <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>{v.email}</div>
            </button>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
