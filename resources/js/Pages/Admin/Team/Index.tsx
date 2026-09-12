// resources/js/Pages/Admin/Team/Index.tsx
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  AdminTable,
  AdminBtn,
  ActionBtn,
  ConfirmModal,
  Icons,
  SlideOver,
  SlideOverActions,
  StatusBadge,
  Tr,
  Td,
  C,
} from "../../../Components/Admin/AdminComponents";
import { useAdminForm, Field, AdminInput, AdminSelect } from "../../../Components/Admin/useAdminForm";

type TeamMember = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  photo: string | null;
  status: "invited" | "active" | "suspended";
  invited_at: string | null;
  joined_at: string | null;
};

type VendorOption = { user_id: number; store_name: string };

type Props = {
  team: TeamMember[];
  vendorId: number | null;
  requiresVendorSelection: boolean;
  vendors: VendorOption[] | null;
};

function InviteForm({ vendorId, onClose }: { vendorId: number | null; onClose: () => void }) {
  const { data, set, errors, processing, post } = useAdminForm({
    name: "",
    email: "",
    phone: "",
    photo: null as File | null,
  });

  const handleSubmit = () => {
    post(route("admin.vendor.team.store"), {
      transform: (d) => (vendorId ? { ...d, vendor_id: vendorId } : d),
      onSuccess: () => {
        toast.success("Invitation sent");
        onClose();
      },
    });
  };

  return (
    <SlideOver
      eyebrow="Team"
      title="Invite Staff Member"
      onClose={onClose}
      footer={
        <SlideOverActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          processing={processing}
          submitLabel="Send Invite"
        />
      }
    >
      <Field label="Name" error={errors.name}>
        <AdminInput
          type="text"
          value={data.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Optional — used if they don't have an account yet"
          error={!!errors.name}
          autoFocus
        />
      </Field>
      <Field label="Email" required error={errors.email}>
        <AdminInput
          type="email"
          value={data.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="staff@example.com"
          error={!!errors.email}
        />
      </Field>
      <Field label="Phone" error={errors.phone}>
        <AdminInput
          type="tel"
          value={data.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="0400 000 000"
          error={!!errors.phone}
        />
      </Field>
      <Field label="Photo" error={errors.photo}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => set("photo", e.target.files?.[0] ?? null)}
          style={{ fontFamily: "inherit", fontSize: 13, color: C.text }}
        />
        <div style={{ fontSize: 11, color: C.textFaint, marginTop: 4 }}>
          Only used if this person doesn't have an account yet.
        </div>
      </Field>
    </SlideOver>
  );
}

export default function TeamIndex({ team, vendorId, requiresVendorSelection, vendors }: Props) {
  const [showInvite, setShowInvite] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  const act = (member: TeamMember, action: "resend" | "suspend" | "reactivate") => {
    const verb = { resend: "post", suspend: "patch", reactivate: "patch" } as const;
    const url = route(`admin.vendor.team.${action}`, member.id);
    const opts = {
      preserveScroll: true,
      onSuccess: () => toast.success("Done"),
      onError: () => toast.error("Something went wrong"),
    };
    if (verb[action] === "post") router.post(url, {}, opts);
    else router.patch(url, {}, opts);
  };

  const handleRemove = () => {
    if (!removeTarget) return;
    router.delete(route("admin.vendor.team.destroy", removeTarget.id), {
      preserveScroll: true,
      onSuccess: () => toast.success("Team member removed"),
      onFinish: () => setRemoveTarget(null),
    });
  };

  return (
    <AdminLayout>
      <Head title="Team" />

      {showInvite && <InviteForm vendorId={vendorId} onClose={() => setShowInvite(false)} />}

      {removeTarget && (
        <ConfirmModal
          title={`Remove "${removeTarget.name}"?`}
          description="They'll lose access immediately. This can't be undone — you'd need to re-invite them."
          confirmLabel="Remove"
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}

      <AdminPageHeader
        eyebrow="Team"
        title="Staff Access"
        meta={`${team.length} member${team.length === 1 ? "" : "s"}`}
        action={
          <AdminBtn
            variant="accent"
            onClick={() => setShowInvite(true)}
            disabled={requiresVendorSelection}
          >
            <Icons.Plus />
            Invite Staff
          </AdminBtn>
        }
      />

      {requiresVendorSelection && vendors && (
        <div style={{ marginBottom: 16, maxWidth: 320 }}>
          <AdminSelect
            value=""
            onChange={(e) =>
              router.get(route("admin.vendor.team.index"), { vendor_id: e.target.value })
            }
          >
            <option value="">Select a vendor…</option>
            {vendors.map((v) => (
              <option key={v.user_id} value={v.user_id}>
                {v.store_name}
              </option>
            ))}
          </AdminSelect>
        </div>
      )}

      <AdminTable
        headers={["Name", "Phone", "Status", "Invited", "Joined", "Actions"]}
        empty={requiresVendorSelection ? "✦ Select a vendor to view their team" : "✦ No team members yet"}
      >
        {team.map((m) => (
          <Tr key={m.id}>
            <Td>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {m.photo ? (
                  <img
                    src={m.photo}
                    alt={m.name}
                    style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: C.bgAlt, border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: C.textFaint, flexShrink: 0, fontSize: 11,
                  }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{m.email}</div>
                </div>
              </div>
            </Td>
            <Td muted>{m.phone ?? "—"}</Td>
            <Td>
              <StatusBadge status={m.status === "invited" ? "pending" : m.status} label={m.status} />
            </Td>
            <Td muted>{m.invited_at ?? "—"}</Td>
            <Td muted>{m.joined_at ?? "—"}</Td>
            <Td>
              <div style={{ display: "flex", gap: 4 }}>
                {m.status === "invited" && (
                  <AdminBtn variant="ghost" onClick={() => act(m, "resend")}>
                    Resend
                  </AdminBtn>
                )}
                {m.status === "active" && (
                  <AdminBtn variant="ghost" onClick={() => act(m, "suspend")}>
                    Suspend
                  </AdminBtn>
                )}
                {m.status === "suspended" && (
                  <AdminBtn variant="ghost" onClick={() => act(m, "reactivate")}>
                    Reactivate
                  </AdminBtn>
                )}
                <ActionBtn variant="delete" title="Remove" onClick={() => setRemoveTarget(m)}>
                  <Icons.Delete />
                </ActionBtn>
              </div>
            </Td>
          </Tr>
        ))}
      </AdminTable>
    </AdminLayout>
  );
}
