import { Head, router, usePage } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  StatusBadge,
  C,
  fontBody,
  fontMono,
} from "../../../Components/Admin/AdminComponents";

type CheckRow = {
  event: { id: number; name: string; vendor_user_id: number };
  relationship: string;
  expected: "allow" | "deny";
  abilities: {
    "manage-event": boolean;
    "delete-event": boolean;
    "publish-event": boolean;
  };
};

type Props = {
  user: { id: number; name: string; roles: string[] };
  actingVendorId: number | null;
  isStaff: boolean;
  vendors: { id: number; name: string }[];
  checks: CheckRow[];
};

function Pill({ ok, expected }: { ok: boolean; expected: "allow" | "deny" }) {
  const correct = expected === "allow" ? ok : !ok;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: fontMono,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 999,
        color: ok ? "#22c55e" : "#ef4444",
        background: ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
        border: `1px solid ${correct ? "transparent" : C.error}`,
      }}
      title={correct ? "" : "Unexpected result — check the policy/gate"}
    >
      {ok ? "ALLOW" : "DENY"}
      {!correct && " ⚠"}
    </span>
  );
}

export default function PermissionsTest() {
  const { props } = usePage<{ [key: string]: any } & Props>();
  const { user, actingVendorId, isStaff, vendors, checks } = props as Props;

  return (
    <AdminLayout>
      <Head title="Permissions Test" />

      <AdminPageHeader
        eyebrow="RBAC"
        title="Permissions Test"
        meta="Live Gate checks run against real events in your database — not a simulation."
      />

      {/* Identity card */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Logged in as
          </div>
          <div style={{ fontFamily: fontBody, fontSize: 14, fontWeight: 600, marginTop: 4 }}>
            {user.name} <span style={{ color: C.textFaint, fontWeight: 400 }}>(#{user.id})</span>
          </div>
        </div>

        <div>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Role(s)
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            {user.roles.map((r) => (
              <StatusBadge key={r} status={r} label={r} />
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Acting vendor id
          </div>
          <div style={{ fontFamily: fontMono, fontSize: 14, marginTop: 4 }}>
            {actingVendorId ?? "— (no vendor context)"}
          </div>
        </div>

        {/* Vendor switcher — only rendered for Staff users working for >1 vendor */}
        {isStaff && vendors.length > 0 && (
          <div style={{ marginLeft: "auto" }}>
            <div style={{ fontFamily: fontMono, fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>
              Switch vendor context
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {vendors.map((v) => (
                <button
                  key={v.id}
                  onClick={() =>
                    router.post(
                      route("admin.switch-vendor.update"),
                      { vendor_id: v.id },
                      { preserveScroll: true }
                    )
                  }
                  style={{
                    fontFamily: fontBody,
                    fontSize: 12,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${v.id === actingVendorId ? C.amber : C.border}`,
                    background: v.id === actingVendorId ? "rgba(255,182,39,0.1)" : "transparent",
                    color: v.id === actingVendorId ? C.amber : C.textMuted,
                    cursor: "pointer",
                  }}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checks */}
      {checks.length === 0 ? (
        <div
          style={{
            background: C.surface,
            border: `1px dashed ${C.borderDashed}`,
            borderRadius: 12,
            padding: 24,
            fontFamily: fontBody,
            fontSize: 13,
            color: C.textFaint,
          }}
        >
          No events found to test against. As an Admin, seed at least two
          events owned by two different vendors, then reload this page.
        </div>
      ) : (
        checks.map((row) => (
          <div
            key={row.event.id}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "18px 24px",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: fontBody, fontSize: 14, fontWeight: 600 }}>
                  {row.event.name} <span style={{ color: C.textFaint, fontWeight: 400 }}>(vendor #{row.event.vendor_user_id})</span>
                </div>
                <div style={{ fontFamily: fontMono, fontSize: 11, color: C.textFaint, marginTop: 2 }}>
                  {row.relationship} — expecting <strong style={{ color: row.expected === "allow" ? "#22c55e" : "#ef4444" }}>{row.expected.toUpperCase()}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {Object.entries(row.abilities).map(([ability, ok]) => (
                <div key={ability} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: fontMono, fontSize: 12, color: C.textMuted }}>{ability}</span>
                  <Pill ok={ok} expected={row.expected} />
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <p style={{ fontFamily: fontBody, fontSize: 12, color: C.textFaint, marginTop: 8 }}>
        A red ⚠ next to a pill means the result didn't match what should
        happen for that relationship — that's the bug to go fix, not
        something to dismiss.
      </p>
    </AdminLayout>
  );
}
