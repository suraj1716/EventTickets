// save as resources/js/Pages/Admin/Payouts/Index.tsx
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
  Tr,
  Td,
  FlashMessage,
  ConfirmModal,
  Icons,
} from "../../../Components/Admin/AdminComponents";
import { formatDate, formatDateRange } from "@/utils/dateFormat";

interface Vendor {
  user_id: number;
  store_name: string;
}

interface Payout {
  id: number;
  vendor: Vendor | null;
  amount: number;
  starting_from: string;
  until: string;
  created_at: string;
  orders_count: number;
}

interface Props {
  payouts: { data: Payout[]; links: any[] };
  vendors: Vendor[];
  filters: { vendor_id?: string };
  flash: { success?: string; error?: string };
}

export default function PayoutsIndex({ payouts, vendors, filters, flash }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Payout | null>(null);

  const [form, setForm] = useState({
    vendor_id: "",
    starting_from: "",
    until: "",
    amount: "",
  });
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canPreview = form.vendor_id && form.starting_from && form.until;

  const fetchPreview = () => {
    if (!canPreview) return;
    setLoadingPreview(true);
    fetch(route("admin.payouts.preview"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN":
          document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? "",
      },
      body: JSON.stringify(form),
    })
      .then((r) => r.json())
      .then((data) =>
        setForm((f) => ({ ...f, amount: String(data.suggested_amount ?? "") })),
      )
      .finally(() => setLoadingPreview(false));
  };

  const handleSubmit = () => {
    setSubmitting(true);
    router.post(route("admin.payouts.store"), form, {
      preserveScroll: true,
      onSuccess: () => {
        setShowForm(false);
        setForm({ vendor_id: "", starting_from: "", until: "", amount: "" });
      },
      onFinish: () => setSubmitting(false),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    router.delete(route("admin.payouts.destroy", deleteTarget.id), {
      onFinish: () => setDeleteTarget(null),
    });
  };

  return (
    <>
      <Head title="Payouts" />
      <AdminLayout>
        <AdminPageHeader
          eyebrow="Commerce"
          title="Payouts"
          meta={`${payouts.data.length} records shown`}
          action={
            <AdminBtn variant="accent" onClick={() => setShowForm((s) => !s)}>
              <Icons.Plus /> New Payout
            </AdminBtn>
          }
        />

        <FlashMessage flash={flash} />

        {showForm && (
          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: 16,
              marginBottom: 16,
              background: "var(--color-surface)",
              display: "flex",
              gap: 12,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div>
              <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                Vendor
              </label>
              <select
                value={form.vendor_id}
                onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
                style={{ padding: "6px 8px", minWidth: 180 }}
              >
                <option value="">Select vendor…</option>
                {vendors.map((v) => (
                  <option key={v.user_id} value={v.user_id}>
                    {v.store_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                From
              </label>
              <input
                type="date"
                value={form.starting_from}
                onChange={(e) =>
                  setForm({ ...form, starting_from: e.target.value })
                }
                style={{ padding: "6px 8px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                Until
              </label>
              <input
                type="date"
                value={form.until}
                onChange={(e) => setForm({ ...form, until: e.target.value })}
                style={{ padding: "6px 8px" }}
              />
            </div>

            <AdminBtn
              type="button"
              disabled={!canPreview || loadingPreview}
              onClick={fetchPreview}
            >
              {loadingPreview ? "Calculating…" : "Suggest Amount"}
            </AdminBtn>

            <div>
              <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                Amount (A$)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                style={{ padding: "6px 8px", width: 120 }}
              />
            </div>

            <AdminBtn
              variant="accent"
              disabled={!form.vendor_id || !form.amount || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Saving…" : "Record & Email Receipt"}
            </AdminBtn>
          </div>
        )}

        <FilterBar
          routeName="admin.payouts.index"
          filters={filters}
          fields={[
            {
              key: "vendor_id",
              type: "select",
              placeholder: "All vendors",
              options: vendors.map((v) => ({
                value: String(v.user_id),
                label: v.store_name,
              })),
            },
          ]}
        />

        <AdminTable
          headers={["#", "Vendor", "Period", "Amount", "Orders", "Recorded", "Actions"]}
          empty="✦ No payouts yet"
        >
          {payouts.data.map((p) => (
            <Tr key={p.id}>
              <Td muted>{p.id}</Td>
              <Td>{p.vendor?.store_name ?? "—"}</Td>
              <Td muted>
                {formatDate(p.starting_from)} → {formatDate(p.until)}
              </Td>
              <Td>
                <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                  A${Number(p.amount).toFixed(2)}
                </span>
              </Td>
              <Td muted>{p.orders_count}</Td>
              <Td muted>{formatDate(p.created_at)}</Td>
              <Td onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", gap: 4 }}>
                  <ActionBtn
                    variant="view"
                    title="View Invoice"
                    as="a"
                    href={route("admin.payouts.show", p.id)}
                  >
                    <Icons.View />
                  </ActionBtn>
                  <ActionBtn
                    variant="delete"
                    title="Delete"
                    onClick={() => setDeleteTarget(p)}
                  >
                    <Icons.Delete />
                  </ActionBtn>
                </div>
              </Td>
            </Tr>
          ))}
        </AdminTable>

        <Pagination links={payouts.links} />

        {deleteTarget && (
          <ConfirmModal
            title={`Delete Payout #${deleteTarget.id}?`}
            description={`This removes the payout record for ${deleteTarget.vendor?.store_name}. It does not reverse any email already sent. This cannot be undone.`}
            confirmLabel="Delete Payout"
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AdminLayout>
    </>
  );
}
