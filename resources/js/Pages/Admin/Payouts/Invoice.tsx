// resources/js/Pages/Admin/Payouts/Invoice.tsx

import React from "react";
import { Head, Link } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import { AdminBtn, Icons, C } from "../../../Components/Admin/AdminComponents";
import { formatDate } from "@/utils/dateFormat";

interface RefundRow {
  id: number;
  type: string;
  amount: number;
  reason: string | null;
  is_marker: boolean;
  voucher_restored?: number;
  created_at: string;
}

interface OrderRow {
  id: number;
  created_at: string;

  /**
   * In your current DB:
   *
   * total_price = amount remaining after voucher
   * voucher_discount = gift card amount
   *
   * Example:
   * total_price       = 60
   * voucher_discount  = 100
   * gross order value = 160
   */
  total_price: number;

  voucher_discount: number | null;

  /**
   * Actual amount charged through Stripe/card.
   *
   * Example:
   * stripe_amount = 60
   */
  stripe_amount: number | null;

  online_payment_comission: number | null;
  website_payment_comission: number | null;

  vendor_subtotal: number | null;

  paid_at: string | null;
  fees_calculated_at: string | null;
  paid_out_at: string | null;
  refunded_at: string | null;

  refund_amount: number | null;

  payment_method: string | null;

  user: {
    id: number;
    name: string;
    email: string;
  } | null;

  refunds?: RefundRow[];
}

interface Vendor {
  user_id: number;
  store_name: string;
  store_address?: string;

  user?: {
    name: string;
    email: string;
  };
}

interface Payout {
  id: number;
  vendor: Vendor | null;
  amount: number;
  starting_from: string;
  until: string;
  created_at: string;
  orders: OrderRow[];
}

interface Props {
  payout: Payout;
  isAdmin?: boolean;
}

const money = (n: number | null | undefined) =>
  `A$${Number(n ?? 0).toFixed(2)}`;

/**
 * Gift card amount.
 */
const getVoucher = (order: OrderRow) => {
  return Math.max(0, Number(order.voucher_discount ?? 0));
};

/**
 * Gross/original customer order value.
 *
 * Your current DB structure stores:
 *
 * total_price      = card/payment portion
 * voucher_discount = gift card portion
 *
 * Therefore:
 *
 * Gross = total_price + voucher_discount
 *
 * Example:
 *
 * total_price      = 60
 * voucher_discount = 100
 *
 * Gross = 160
 */
const getGross = (order: OrderRow) => {
  return Number(order.total_price ?? 0) + Number(order.voucher_discount ?? 0);
};

/**
 * Actual amount paid by card / Stripe.
 *
 * Prefer stripe_amount because this is explicitly stored
 * in the orders table.
 *
 * Fallback to total_price for older orders.
 */
const getCardAmount = (order: OrderRow) => {
  if (order.stripe_amount !== null && order.stripe_amount !== undefined) {
    return Number(order.stripe_amount);
  }

  return Math.max(0, Number(order.total_price ?? 0));
};

type Step = {
  label: string;
  at: string;
  detail?: string;
  negative?: boolean;
};

function buildTimeline(order: OrderRow): Step[] {
  const steps: Step[] = [];

  const gross = getGross(order);
  const voucher = getVoucher(order);
  const card = getCardAmount(order);

  steps.push({
    label: "Order placed",
    at: order.created_at,
    detail:
      `Gross ${money(gross)} · ` +
      `Gift Card ${voucher > 0 ? `−${money(voucher)}` : "—"} · ` +
      `Card ${money(card)}`,
  });

  if (order.paid_at) {
    steps.push({
      label: "Payment confirmed",
      at: order.paid_at,
      detail:
        `Gift Card ${voucher > 0 ? `−${money(voucher)}` : "—"} · ` +
        `Card ${money(card)}`,
    });
  }

  if (order.fees_calculated_at) {
    steps.push({
      label: "Fees calculated",
      at: order.fees_calculated_at,
      detail:
        `Stripe ${money(order.online_payment_comission)} · ` +
        `Platform ${money(order.website_payment_comission)} · ` +
        `Net ${money(order.vendor_subtotal)}`,
    });
  }

  /**
   * Display every real refund event.
   *
   * Marker rows are internal bookkeeping and are not shown.
   */
  (order.refunds ?? [])
    .filter((refund) => !refund.is_marker)
    .forEach((refund) => {
      const typeLabel =
        refund.type === "booking_fee"
          ? "Booking fee refunded"
          : refund.type === "custom"
            ? "Partial refund"
            : "Refunded";

      steps.push({
        label: typeLabel,
        at: refund.created_at,
        detail:
          `${money(refund.amount)}` +
          `${refund.reason ? ` — ${refund.reason}` : ""}`,
        negative: true,
      });
    });

  if (order.paid_out_at) {
    steps.push({
      label: "Included in payout",
      at: order.paid_out_at,
    });
  }

  return steps.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
}

function OrderTimeline({ order }: { order: OrderRow }) {
  const steps = buildTimeline(order);

  const gross = getGross(order);
  const voucher = getVoucher(order);
  const card = getCardAmount(order);

  return (
    <div
      style={{
        padding: "14px 4px 14px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* PAYMENT BREAKDOWN */}
      <div
        style={{
          marginBottom: 4,
          padding: 12,
          border: `1px solid ${C.border}`,
          borderRadius: "8px",
          background: "rgba(0,0,0,0.015)",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            color: `${C.textMuted}`,
            marginBottom: 8,
            letterSpacing: "0.08em",
          }}
        >
          Payment Breakdown
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {/* GROSS */}
          <div>
            <div
              style={{
                fontSize: 10,
                color: `${C.textMuted}`,
              }}
            >
              Gross
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {money(gross)}
            </div>
          </div>

          {/* GIFT CARD */}
          <div>
            <div
              style={{
                fontSize: 10,
                color: `${C.textMuted}`,
              }}
            >
              Gift Card
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {voucher > 0 ? `−${money(voucher)}` : "—"}
            </div>
          </div>

          {/* CARD */}
          <div>
            <div
              style={{
                fontSize: 10,
                color: `${C.textMuted}`,
              }}
            >
              Card / Stripe
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {money(card)}
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      {steps.map((step, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: step.negative
                  ? `${C.error}`
                  : `${C.amber}`,
                marginTop: 4,
                flexShrink: 0,
              }}
            />

            {index < steps.length - 1 && (
              <div
                style={{
                  width: 1,
                  flex: 1,
                  background: `${C.border}`,
                  minHeight: 18,
                }}
              />
            )}
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {step.label}
            </div>

            <div
              style={{
                fontSize: 11,
                color: `${C.textMuted}`,
              }}
            >
              {new Date(step.at).toLocaleString("en-AU")}
            </div>

            {step.detail && (
              <div
                style={{
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                {step.detail}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PayoutInvoice({ payout, isAdmin = false }: Props) {
  const orders = payout.orders ?? [];

  const [expandedId, setExpandedId] = React.useState<number | null>(null);

  /**
   * INVOICE TOTALS
   *
   * Gross:
   *   total_price + voucher_discount
   *
   * Gift Card:
   *   voucher_discount
   *
   * Card:
   *   stripe_amount
   *
   * Stripe Fee:
   *   online_payment_comission
   *
   * Platform Fee:
   *   website_payment_comission
   *
   * Net Vendor:
   *   vendor_subtotal - refunds
   */
  const totals = orders.reduce(
    (acc, order) => {
      const gross = getGross(order);

      const voucher = getVoucher(order);

      const card = getCardAmount(order);

      const stripeFee = Number(order.online_payment_comission ?? 0);

      const platformFee = Number(order.website_payment_comission ?? 0);

      const refunded = Number(order.refund_amount ?? 0);

      const netVendorSubtotal = Math.max(
        0,
        Number(order.vendor_subtotal ?? 0) - refunded,
      );

      acc.gross += gross;
      acc.voucher += voucher;
      acc.card += card;
      acc.stripeFee += stripeFee;
      acc.platformFee += platformFee;
      acc.refunded += refunded;
      acc.netToVendor += netVendorSubtotal;

      return acc;
    },
    {
      gross: 0,
      voucher: 0,
      card: 0,
      stripeFee: 0,
      platformFee: 0,
      refunded: 0,
      netToVendor: 0,
    },
  );

  const reconciled =
    Math.abs(totals.netToVendor - Number(payout.amount)) < 0.01;

  return (
    <>
      <Head title={`Payout Invoice #${payout.id}`} />

      <AdminLayout>
      <style>{`
  @media print {
    /* Hide everything from AdminLayout */
    body * {
      visibility: hidden !important;
    }

    /* Show ONLY the invoice */
    .invoice-sheet,
    .invoice-sheet * {
      visibility: visible !important;
    }

    /* Position invoice at the top-left of the printed page */
    .invoice-sheet {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 24px !important;

      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;

      background: white !important;
    }

    /* Hide buttons/navigation explicitly */
    .no-print {
      display: none !important;
    }

    /* Remove scroll container from table */
    .payout-table {
      display: block !important;
      overflow: visible !important;
    }

    .payout-table table {
      width: 100% !important;
      min-width: 0 !important;
    }

    /* Screen timeline hidden */
    .screen-timeline {
      display: none !important;
    }

    /* ALL timelines visible in PDF */
    .print-timeline {
      display: table-row !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .print-timeline-content {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .payout-order-row {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    .payout-expand-cell {
      color: transparent !important;
    }

    tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* Don't print links/URLs generated by browser */
    a::after {
      content: none !important;
    }
  }

  @page {
    size: A4;
    margin: 10mm;
  }

  @media (max-width: 900px) {
    .payout-summary-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }

    .payout-table {
      display: block;
      overflow-x: auto;
    }
  }

  @media (max-width: 600px) {
    .payout-summary-grid {
      grid-template-columns: 1fr !important;
    }
  }
`}</style>

        {/* TOP ACTIONS */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Link
            href={route("admin.payouts.index")}
            style={{
              fontSize: 12,
              color: `${C.textMuted}`,
            }}
          >
            ← Back to Payouts
          </Link>

          <AdminBtn onClick={() => window.print()}>
            <Icons.Plus /> Print / Save as PDF
          </AdminBtn>
        </div>

        {/* INVOICE */}
        <div
          className="invoice-sheet"
          style={{
            background: `${C.surface}`,
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            padding: 32,
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: `2px solid ${C.border}`,
              paddingBottom: 20,
              marginBottom: 24,
              gap: 20,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                }}
              >
                Payout Invoice
              </h1>

              <div
                style={{
                  fontSize: 12,
                  color: `${C.textMuted}`,
                }}
              >
                Reference #{payout.id} · Recorded{" "}
                {formatDate(payout.created_at)}
              </div>
            </div>

            <div
              style={{
                textAlign: "right",
                fontSize: 12,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                }}
              >
                {payout.vendor?.store_name ?? "—"}
              </div>

              {payout.vendor?.store_address && (
                <div>{payout.vendor.store_address}</div>
              )}

              {payout.vendor?.user?.email && (
                <div>{payout.vendor.user.email}</div>
              )}
            </div>
          </div>

          {/* PERIOD */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 24,
              gap: 20,
            }}
          >
            <div
              style={{
                fontSize: 13,
              }}
            >
              <strong>Period:</strong> {formatDate(payout.starting_from)} →{" "}
              {formatDate(payout.until)}
              <span
                style={{
                  marginLeft: 16,
                  color: `${C.textMuted}`,
                }}
              >
                {orders.length} order
                {orders.length === 1 ? "" : "s"} included
              </span>
            </div>

            {isAdmin && !reconciled && (
              <div
                style={{
                  fontSize: 12,
                  color: `${C.error}`,
                }}
              >
                ⚠ Recorded amount ({money(payout.amount)}) differs from
                calculated net vendor amount ({money(totals.netToVendor)}
                ).
              </div>
            )}
          </div>

          {/* ORDER TABLE */}
          <div className="payout-table">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                minWidth: 1050,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    textAlign: "left",
                  }}
                >
                  <th
                    style={{
                      padding: "6px 4px",
                      width: 20,
                    }}
                  />

                  <th
                    style={{
                      padding: "6px 4px",
                    }}
                  >
                    Order
                  </th>

                  <th
                    style={{
                      padding: "6px 4px",
                    }}
                  >
                    Date
                  </th>

                  <th
                    style={{
                      padding: "6px 4px",
                    }}
                  >
                    Customer
                  </th>

                  <th
                    style={{
                      padding: "6px 4px",
                      textAlign: "right",
                    }}
                  >
                    Gross Total
                  </th>

                  <th
                    style={{
                      padding: "6px 4px",
                      textAlign: "right",
                    }}
                  >
                    Gift Card
                  </th>

                  <th
                    style={{
                      padding: "6px 4px",
                      textAlign: "right",
                    }}
                  >
                    Card Paid
                  </th>

                  <th
                    style={{
                      padding: "6px 4px",
                      textAlign: "right",
                    }}
                  >
                    Stripe Fee
                  </th>

                  <th
                    style={{
                      padding: "6px 4px",
                      textAlign: "right",
                    }}
                  >
                    Platform Fee
                  </th>

                  <th
                    style={{
                      padding: "6px 4px",
                      textAlign: "right",
                    }}
                  >
                    Refunded
                  </th>

                  <th
                    style={{
                      padding: "6px 4px",
                      textAlign: "right",
                    }}
                  >
                    Net to Vendor
                  </th>
                </tr>
              </thead>

              <tbody>
                {orders.map((o) => {
                  const isOpen = expandedId === o.id;

                  const refunded = Number(o.refund_amount ?? 0);

                  const grossTotal =
                    Number(o.total_price ?? 0) +
                    Number(o.voucher_discount ?? 0);

                  const giftCard = Number(o.voucher_discount ?? 0);

                  const cardPaid = Number(o.stripe_amount ?? 0);

                  const netToVendor = Math.max(
                    0,
                    Number(o.vendor_subtotal ?? 0) - refunded,
                  );

                  return (
                    <React.Fragment key={o.id}>
                      {/* ORDER ROW */}
                      <tr
                        className="payout-order-row"
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                          cursor: "pointer",
                        }}
                        onClick={() => setExpandedId(isOpen ? null : o.id)}
                      >
                        <td
                          className="payout-expand-cell"
                          style={{
                            padding: "6px 4px",
                            color: `${C.textMuted}`,
                          }}
                        >
                          {isOpen ? "▾" : "▸"}
                        </td>

                        <td
                          style={{
                            padding: "6px 4px",
                            fontWeight: 600,
                          }}
                        >
                          #{o.id}
                        </td>

                        <td
                          style={{
                            padding: "6px 4px",
                            color: `${C.textMuted}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(o.created_at).toLocaleDateString("en-AU")}
                        </td>

                        <td style={{ padding: "6px 4px" }}>
                          {o.user?.name ?? "—"}
                        </td>

                        {/* GROSS */}
                        <td
                          style={{
                            padding: "6px 4px",
                            textAlign: "right",
                            fontWeight: 600,
                          }}
                        >
                          {money(grossTotal)}
                        </td>

                        {/* GIFT CARD */}
                        <td
                          style={{
                            padding: "6px 4px",
                            textAlign: "right",
                          }}
                        >
                          {giftCard > 0 ? `−${money(giftCard)}` : "—"}
                        </td>

                        {/* CARD PAID */}
                        <td
                          style={{
                            padding: "6px 4px",
                            textAlign: "right",
                          }}
                        >
                          {money(cardPaid)}
                        </td>

                        {/* STRIPE FEE */}
                        <td
                          style={{
                            padding: "6px 4px",
                            textAlign: "right",
                          }}
                        >
                          −{money(o.online_payment_comission)}
                        </td>

                        {/* PLATFORM FEE */}
                        <td
                          style={{
                            padding: "6px 4px",
                            textAlign: "right",
                          }}
                        >
                          −{money(o.website_payment_comission)}
                        </td>

                        {/* REFUND */}
                        <td
                          style={{
                            padding: "6px 4px",
                            textAlign: "right",
                            color:
                              refunded > 0 ? `${C.error}` : undefined,
                          }}
                        >
                          {refunded > 0 ? `−${money(refunded)}` : "—"}
                        </td>

                        {/* NET TO VENDOR */}
                        <td
                          style={{
                            padding: "6px 4px",
                            textAlign: "right",
                            fontWeight: 600,
                          }}
                        >
                          {money(netToVendor)}
                        </td>
                      </tr>

                      {/* NORMAL SCREEN TIMELINE */}
                      {isOpen && (
                        <tr className="screen-timeline">
                          <td
                            colSpan={11}
                            style={{
                              background: "rgba(0,0,0,0.015)",
                            }}
                          >
                            <OrderTimeline order={o} />
                          </td>
                        </tr>
                      )}

                      {/* PRINT/PDF TIMELINE */}
                      <tr
                        className="print-timeline"
                        style={{
                          display: "none",
                        }}
                      >
                        <td
                          colSpan={11}
                          className="print-timeline-content"
                          style={{
                            background: "rgba(0,0,0,0.015)",
                          }}
                        >
                          <OrderTimeline order={o} />
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}

                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: `${C.textMuted}`,
                      }}
                    >
                      No orders are attached to this payout.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* TOTALS */}
              <tfoot>
                <tr
                  style={{
                    borderTop: `2px solid ${C.border}`,
                    fontWeight: 600,
                  }}
                >
                  <td
                    colSpan={4}
                    style={{
                      padding: "8px 4px",
                    }}
                  >
                    Totals
                  </td>

                  {/* GROSS */}
                  <td
                    style={{
                      padding: "8px 4px",
                      textAlign: "right",
                    }}
                  >
                    {money(totals.gross)}
                  </td>

                  {/* VOUCHER */}
                  <td
                    style={{
                      padding: "8px 4px",
                      textAlign: "right",
                    }}
                  >
                    {totals.voucher > 0 ? `−${money(totals.voucher)}` : "—"}
                  </td>

                  {/* CARD */}
                  <td
                    style={{
                      padding: "8px 4px",
                      textAlign: "right",
                    }}
                  >
                    {money(totals.card)}
                  </td>

                  {/* STRIPE */}
                  <td
                    style={{
                      padding: "8px 4px",
                      textAlign: "right",
                    }}
                  >
                    −{money(totals.stripeFee)}
                  </td>

                  {/* PLATFORM */}
                  <td
                    style={{
                      padding: "8px 4px",
                      textAlign: "right",
                    }}
                  >
                    −{money(totals.platformFee)}
                  </td>

                  {/* REFUNDS */}
                  <td
                    style={{
                      padding: "8px 4px",
                      textAlign: "right",
                    }}
                  >
                    {totals.refunded > 0 ? `−${money(totals.refunded)}` : "—"}
                  </td>

                  {/* NET */}
                  <td
                    style={{
                      padding: "8px 4px",
                      textAlign: "right",
                      color: `${C.amber}`,
                    }}
                  >
                    {money(totals.netToVendor)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* SUMMARY */}
          <div
            className="payout-summary-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 12,
              marginTop: 28,
            }}
          >
            {[
              ["Gross Revenue", money(totals.gross)],
              [
                "Gift Card",
                totals.voucher > 0 ? `−${money(totals.voucher)}` : "—",
              ],
              ["Card Paid", money(totals.card)],
              ["Stripe Fees", `−${money(totals.stripeFee)}`],
              ["Platform Fees", `−${money(totals.platformFee)}`],
              ["Recorded Payout", money(payout.amount)],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: `${C.textMuted}`,
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>

                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* REFUND NOTE */}
          {orders.some(
            (order) =>
              (order.refunds ?? []).filter((refund) => !refund.is_marker)
                .length > 0,
          ) && (
            <div
              style={{
                marginTop: 20,
                fontSize: 11,
                color: `${C.textMuted}`,
              }}
            >
              Note: some orders in this period have one or more refunds recorded
              against them. The "Refunded" and "Net to Vendor" columns already
              account for these refunds. If a refund happened
              <em> after</em> this payout was recorded, reconcile manually.
            </div>
          )}

          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: `${C.textMuted}`,
            }}
          >
            Click any order row to see its full timeline.
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
