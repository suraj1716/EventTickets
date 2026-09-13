// save as resources/js/Pages/Admin/ResalePayouts/Index.tsx
import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
  AdminPageHeader,
  AdminTable,
  ActionBtn,
  FilterBar,
  Pagination,
  Tr,
  Td,
  FlashMessage,
  ConfirmModal,
  Icons,
  C,
} from "../../../Components/Admin/AdminComponents";
import { formatDate } from "@/utils/dateFormat";
import AdminLayout from "@/Pages/Admin/AdminLayout";

interface Person {
  id: number;
  name: string;
  email: string;
}

interface Ticket {
  id: number;
  code: string;
}

interface Listing {
  id: number;
  seller: Person | null;
  buyer: Person | null;
  ticket: Ticket | null;
  price: number;
  commission_amount: number;
  seller_payout_amount: number;
  seller_paid_out: boolean;
  seller_paid_out_at: string | null;
  sold_at: string | null;
  stripe_transfer_id: string | null;
}

interface Props {
  listings: { data: Listing[]; links: any[] };
  filters: { status?: string };
  counts: { failed: number };
  flash: { success?: string; error?: string };
}

export default function ResalePayoutsIndex({ listings, filters, counts, flash }: Props) {
  const [retryTarget, setRetryTarget] = useState<Listing | null>(null);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    if (!retryTarget) return;
    setRetrying(true);
    router.post(route("admin.resale-payouts.retry", retryTarget.id), {}, {
      preserveScroll: true,
      onFinish: () => {
        setRetrying(false);
        setRetryTarget(null);
      },
    });
  };

  return (
    <>
      <Head title="Resale Payouts" />
      <AdminLayout>
        <AdminPageHeader
          eyebrow="Commerce"
          title="Resale Payouts"
          meta={
            counts.failed > 0
              ? `${counts.failed} transfer${counts.failed === 1 ? "" : "s"} need attention`
              : "All transfers sent"
          }
        />

        <FlashMessage flash={flash} />

        <p style={{ color: C.textMuted, fontSize: 13, marginTop: -8, marginBottom: 16, maxWidth: 640 }}>
          These are automatic Stripe Connect transfers — fired the instant a
          resale checkout completes, not created by an admin. This page is
          for visibility and, when a transfer fails, a manual retry. For
          vendor payouts on primary ticket sales, see{" "}
          <a href={route("admin.payouts.index")} style={{ color: C.info }}>
            Payouts
          </a>
          .
        </p>

        <FilterBar
          routeName="admin.resale-payouts.index"
          filters={filters}
          fields={[
            {
              key: "status",
              type: "select",
              placeholder: "All statuses",
              options: [
                { value: "paid", label: "Paid out" },
                { value: "failed", label: "Failed / pending retry" },
              ],
            },
          ]}
        />

        <AdminTable
          headers={["#", "Ticket", "Seller", "Buyer", "Sale Price", "Seller Payout", "Sold", "Status", "Actions"]}
          empty="✦ No resale sales yet"
        >
          {listings.data.map((l) => (
            <Tr key={l.id}>
              <Td muted>{l.id}</Td>
              <Td muted>{l.ticket?.code ?? "—"}</Td>
              <Td>
                {l.seller?.name ?? "—"}
                {l.seller?.email && (
                  <div style={{ fontSize: 11, color: C.textFaint }}>{l.seller.email}</div>
                )}
              </Td>
              <Td>{l.buyer?.name ?? "—"}</Td>
              <Td muted>A${Number(l.price).toFixed(2)}</Td>
              <Td>
                <span style={{ color: C.amber, fontWeight: 500 }}>
                  A${Number(l.seller_payout_amount).toFixed(2)}
                </span>
              </Td>
              <Td muted>{formatDate(l.sold_at)}</Td>
              <Td>
                {l.seller_paid_out ? (
                  <span style={{ color: C.success, fontSize: 12, fontWeight: 500 }}>
                    ✓ Paid {formatDate(l.seller_paid_out_at)}
                  </span>
                ) : (
                  <span style={{ color: C.error, fontSize: 12, fontWeight: 500 }}>
                    ✕ Failed — needs retry
                  </span>
                )}
              </Td>
              <Td onClick={(e) => e.stopPropagation()}>
                {!l.seller_paid_out && (
                  <ActionBtn
                    variant="edit"
                    title="Retry Stripe transfer"
                    onClick={() => setRetryTarget(l)}
                  >
                    <Icons.Check />
                  </ActionBtn>
                )}
              </Td>
            </Tr>
          ))}
        </AdminTable>

        <Pagination links={listings.links} />

        {retryTarget && (
          <ConfirmModal
            title={`Retry payout for listing #${retryTarget.id}?`}
            description={`Re-fires the Stripe transfer of A$${Number(retryTarget.seller_payout_amount).toFixed(2)} to ${retryTarget.seller?.name ?? "the seller"}. Safe to click — this is a no-op if the seller has already been paid.`}
            confirmLabel={retrying ? "Retrying…" : "Retry Transfer"}
            onConfirm={handleRetry}
            onCancel={() => setRetryTarget(null)}
          />
        )}
      </AdminLayout>
    </>
  );
}
