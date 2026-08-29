import React, { useEffect, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "../AdminLayout";
import { createPortal } from "react-dom";

import { AdminPageHeader, AdminBtn, StatusBadge, FlashMessage, ConfirmModal, Icons, fontDisplay, fontBody, C } from "../../../Components/Admin/AdminComponents";

interface OrderItem {
  id: number;
  title: string;
  image: string | null;
  quantity: number;
  price: number;
  subtotal: number;
}
interface OrderProps {
  voucher_id: number | null;
  id: number;
  customer: string;
  customer_email: string;
  customer_phone: string;
  vendor: string;
  vendor_type: string;
  total_price: number;
  voucher_discount: number;
  booking_fee: number;
  status: string;
  is_paid: boolean;
  payment_method: string | null;
  manual_paid_at: string | null;
  payment_intent: string | null;
  refunded_at: string | null;
  refund_amount: number | null;
  created_at: string;
  items: OrderItem[];
  booking: { id: number; booking_date: string; time_slot: string } | null;
  staff_id: number | null;
  staff: { id: number; name: string } | null;
  refunded_types: string[];
  gross_total: number;
}

interface Props {
  order: OrderProps;
  statuses: string[];
  flash: { success?: string; error?: string };
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        padding: "10px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <span
        style={{
          fontFamily: `${fontBody}`,
          fontSize: "10px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: `${C.textMuted}`,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: `${fontBody}`,
          fontSize: "13px",
          color: `${C.text}`,
          textAlign: "right",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: `${C.surface}`,
        border: `1px solid ${C.border}`,
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${C.border}`,
          background: `${C.bgAlt}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 3,
            height: 16,
            background: `${C.amber}`,
            borderRadius: 2,
          }}
        />
        <span
          style={{
            fontFamily: `${fontBody}`,
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: `${C.textMuted}`,
            fontWeight: 500,
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}
const menuItemStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  background: "transparent",
  border: "none",
  padding: "8px 10px",
  fontFamily: `${fontBody}`,
  fontSize: "12px",
  letterSpacing: "0.04em",
  color: `${C.text}`,
  cursor: "pointer",
  borderRadius: "8px",
  zIndex: 1000,
};
export default function OrderShow({ order, statuses, flash }: Props) {
  const [showDelete, setShowDelete] = useState(false);
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);

  const handleStatusSave = () => {
    setSaving(true);
    router.patch(
      route("admin.orders.status", order.id),
      { status },
      {
        preserveScroll: true,
        onFinish: () => setSaving(false),
      },
    );
  };
  console.log("order refund state:", {
    refund_amount: order.refund_amount,
    voucher_discount: order.voucher_discount,
    refunded_types: order.refunded_types,
  });

  const [refundMenuOpen, setRefundMenuOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>("");

  const maxRefundable = order.total_price - (order.refund_amount ?? 0);

  const handleCustomRefund = () => {
    const amount = parseFloat(refundAmount);

    if (isNaN(amount) || amount <= 0) {
      alert("Enter a valid refund amount.");
      return;
    }
    if (amount > maxRefundable) {
      alert(
        `Amount cannot exceed the refundable total of $${maxRefundable.toFixed(2)}.`,
      );
      return;
    }
    if (!confirm(`Refund $${amount.toFixed(2)} for this order?`)) return;

    router.post(
      route("admin.orders.refund", order.id),
      { type: "custom", amount },
      { preserveScroll: true, onSuccess: () => setRefundAmount("") },
    );
  };

  const refundMenuRef = useRef<HTMLDivElement>(null);

  const refundPortalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedTrigger = refundMenuRef.current?.contains(target);
      const clickedPortal = refundPortalRef.current?.contains(target);
      if (!clickedTrigger && !clickedPortal) {
        setRefundMenuOpen(false);
      }
    };
    if (refundMenuOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [refundMenuOpen]);

  const handleRefund = (
    type: "full" | "booking_fee" | "except_booking_fee",
  ) => {
    const labels = {
      full: "Process a FULL refund (including booking fee)?",
      booking_fee: "Refund ONLY the booking fee?",
      except_booking_fee: "Refund everything EXCEPT the booking fee?",
    };
    if (!confirm(labels[type])) return;
    router.post(
      route("admin.orders.refund", order.id),
      { type },
      { preserveScroll: true },
    );
  };

  const handleDelete = () => {
    router.delete(route("admin.orders.destroy", order.id));
  };
  const stripeLikeMethods = [
    "stripe",
    "card",
    "link",
    "afterpay_clearpay",
    "klarna",
    "zip",
  ];
  const isStripeOrder = order.payment_method
    ? stripeLikeMethods.includes(order.payment_method)
    : false;
  const isVoucherCovered = Number(order.voucher_discount) > 0;
  const isFullyRefunded = order.refunded_types.includes("full");

  // Partial refund buttons work if EITHER the order is Stripe-paid (partial charge refund)
  // OR the order was voucher-covered (partial voucher restore) — or both, for mixed orders.
  const canPartialRefund = isStripeOrder || isVoucherCovered;
  const bothPartialsUsed =
    order.refunded_types.includes("booking_fee") &&
    order.refunded_types.includes("except_booking_fee");

  const isWalkIn = !!order.payment_method && !order.payment_intent;
  return (
    <>
      <Head title={`Order #${order.id}`} />
      <AdminLayout>
        <AdminPageHeader
          eyebrow="Commerce"
          title={
            <>
              Order{" "}
              <em
                style={{
                  fontStyle: "italic",
                  color: `${C.amberHover}`,
                }}
              >
                #{order.id}
              </em>
            </>
          }
          meta={`Created ${order.created_at}`}
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <AdminBtn
                as="a"
                href={route("admin.orders.index")}
                variant="ghost"
              >
                <Icons.Back /> Orders
              </AdminBtn>
              <AdminBtn
                as="a"
                href={route("admin.orders.edit", order.id)}
                variant="ghost"
              >
                <Icons.Edit /> Edit
              </AdminBtn>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {!isFullyRefunded && (
                  <div
                    ref={refundMenuRef}
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <AdminBtn onClick={() => setRefundMenuOpen((o) => !o)}>
                      Refund ▾
                    </AdminBtn>
                    {refundMenuOpen &&
                      refundMenuRef.current &&
                      createPortal(
                        <div
                          ref={refundPortalRef}
                          style={{
                            position: "fixed",
                            top:
                              refundMenuRef.current.getBoundingClientRect()
                                .bottom + 6,
                            left:
                              refundMenuRef.current.getBoundingClientRect()
                                .right - 240,
                            zIndex: 9999,
                            background: `${C.surface}`,
                            border: `1px solid ${C.border}`,
                            borderRadius: "8px",
                            boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
                            padding: "10px",
                            width: 240,
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <button
                            onClick={() => {
                              handleRefund("full");
                              setRefundMenuOpen(false);
                            }}
                            disabled={isFullyRefunded || bothPartialsUsed}
                            style={menuItemStyle}
                          >
                            Refund Full
                          </button>

                          <button
                            onClick={() => {
                              handleRefund("except_booking_fee");
                              setRefundMenuOpen(false);
                            }}
                            disabled={
                              isFullyRefunded ||
                              !canPartialRefund ||
                              order.refunded_types.includes(
                                "except_booking_fee",
                              )
                            }
                            style={menuItemStyle}
                          >
                            Refund Except Booking Fee
                          </button>

                          <button
                            onClick={() => {
                              handleRefund("booking_fee");
                              setRefundMenuOpen(false);
                            }}
                            disabled={
                              isFullyRefunded ||
                              !canPartialRefund ||
                              order.refunded_types.includes("booking_fee")
                            }
                            style={menuItemStyle}
                          >
                            Refund Booking Fee Only
                          </button>

                          <div
                            style={{
                              borderTop: `1px solid ${C.border}`,
                              paddingTop: "8px",
                              display: "flex",
                              gap: "6px",
                            }}
                          >
                            <input
                              type="number"
                              min={0}
                              max={maxRefundable}
                              step="0.01"
                              placeholder={`Max $${maxRefundable.toFixed(2)}`}
                              value={refundAmount}
                              onChange={(e) => setRefundAmount(e.target.value)}
                              style={{
                                flex: 1,
                                minWidth: 0,
                                padding: "6px 8px",
                                fontFamily: `${fontBody}`,
                                fontSize: "12px",
                                border: `1px solid ${C.border}`,
                                borderRadius: "8px",
                              }}
                            />
                            <button
                              onClick={() => {
                                handleCustomRefund();
                                setRefundMenuOpen(false);
                              }}
                              style={{
                                ...menuItemStyle,
                                width: "auto",
                                padding: "6px 10px",
                              }}
                            >
                              Refund
                            </button>
                          </div>
                        </div>,
                        document.body,
                      )}
                  </div>
                )}
              </div>
              <AdminBtn onClick={() => setShowDelete(true)} variant="danger">
                <Icons.Delete /> Delete Order
              </AdminBtn>
            </div>
          }
        />

        <FlashMessage flash={flash} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 300px",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* ── LEFT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Items */}
            <SectionCard title="Order Items">
              <div
                style={{
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        background: `${C.bgAlt}`,
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      {["", "Product", "Qty", "Unit Price", "Subtotal"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              padding: "8px 12px",
                              textAlign: "left",
                              fontFamily: `${fontBody}`,
                              fontSize: "9px",
                              letterSpacing: "0.15em",
                              textTransform: "uppercase",
                              color: `${C.textMuted}`,
                              fontWeight: 500,
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        <td style={{ padding: "10px 12px" }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "8px",
                              overflow: "hidden",
                              background: `${C.bgAlt}`,
                              border: `1px solid ${C.border}`,
                              flexShrink: 0,
                            }}
                          >
                            {item.image ? (
                              <img
                                src={`/storage/${item.image}`}
                                alt={item.title}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity: 0.3,
                                }}
                              >
                                <Icons.Image />
                              </div>
                            )}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontFamily: `${fontBody}`,
                            fontSize: "13px",
                            color: `${C.text}`,
                          }}
                        >
                          {item.title}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontFamily: `${fontBody}`,
                            fontSize: "13px",
                            color: `${C.textMuted}`,
                          }}
                        >
                          ×{item.quantity}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontFamily: `${fontBody}`,
                            fontSize: "13px",
                            color: `${C.textMuted}`,
                          }}
                        >
                          A${Number(item.price).toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontFamily: `${fontBody}`,
                            fontSize: "13px",
                            color: `${C.amber}`,
                            fontWeight: 500,
                          }}
                        >
                          A${Number(item.subtotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {order.booking_fee > 0 && (
                      <tr
                        style={{
                          borderTop: `1px solid ${C.border}`,
                          background: `${C.bgAlt}`,
                        }}
                      >
                        <td
                          colSpan={4}
                          style={{
                            padding: "10px 12px",
                            textAlign: "right",
                            fontFamily: `${fontBody}`,
                            fontSize: "11px",
                            color: `${C.textMuted}`,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          Booking Fee
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontFamily: `${fontBody}`,
                            fontSize: "13px",
                            color: `${C.textMuted}`,
                          }}
                        >
                          A${Number(order.booking_fee).toFixed(2)}
                        </td>
                      </tr>
                    )}

                    {Number(order.voucher_discount) > 0 && (
                      <tr
                        style={{
                          borderTop: `1px solid ${C.border}`,
                          background: `${C.bgAlt}`,
                        }}
                      >
                        <td
                          colSpan={4}
                          style={{
                            padding: "10px 12px",
                            textAlign: "right",
                            fontFamily: `${fontBody}`,
                            fontSize: "11px",
                            color: `${C.textMuted}`,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          Gift Card / Voucher Applied
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontFamily: `${fontBody}`,
                            fontSize: "13px",
                            color: `${C.error}`,
                          }}
                        >
                          −A${Number(order.voucher_discount).toFixed(2)}
                        </td>
                      </tr>
                    )}

                    <tr
                      style={{
                        borderTop: `2px solid ${C.border}`,
                        background: `${C.bgAlt}`,
                      }}
                    >
                      <td
                        colSpan={4}
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontFamily: `${fontBody}`,
                          fontSize: "10px",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: `${C.textMuted}`,
                        }}
                      >
                        Order Total
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontFamily: `${fontDisplay}`,
                          fontSize: "1.2rem",
                          color: `${C.amber}`,
                        }}
                      >
                        A${Number(order.gross_total).toFixed(2)}
                      </td>
                    </tr>

                    {Number(order.voucher_discount) > 0 && (
                      <tr style={{ background: `${C.bgAlt}` }}>
                        <td
                          colSpan={4}
                          style={{
                            padding: "6px 12px",
                            textAlign: "right",
                            fontFamily: `${fontBody}`,
                            fontSize: "10px",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: `${C.textMuted}`,
                          }}
                        >
                          Amount Charged
                        </td>
                        <td
                          style={{
                            padding: "6px 12px",
                            fontFamily: `${fontBody}`,
                            fontSize: "13px",
                            color: `${C.textMuted}`,
                          }}
                        >
                          A${Number(order.total_price).toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            </SectionCard>

            {/* Booking */}
            {order.booking && (
              <SectionCard title="Booking">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      padding: "14px 16px",
                      background: `${C.bgAlt}`,
                      borderRadius: "8px",
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: `${fontBody}`,
                        fontSize: "10px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: `${C.textMuted}`,
                        marginBottom: 6,
                      }}
                    >
                      Date
                    </div>
                    <div
                      style={{
                        fontFamily: `${fontBody}`,
                        fontSize: "14px",
                        color: `${C.text}`,
                        fontWeight: 500,
                      }}
                    >
                      {order.booking.booking_date}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "14px 16px",
                      background: `${C.bgAlt}`,
                      borderRadius: "8px",
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: `${fontBody}`,
                        fontSize: "10px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: `${C.textMuted}`,
                        marginBottom: 6,
                      }}
                    >
                      Time Slot
                    </div>
                    <div
                      style={{
                        fontFamily: `${fontBody}`,
                        fontSize: "14px",
                        color: `${C.text}`,
                        fontWeight: 500,
                      }}
                    >
                      {order.booking.time_slot}
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Staff */}
            {order.staff && (
              <SectionCard title="Staff">
                <div
                  style={{
                    padding: "14px 16px",
                    background: `${C.bgAlt}`,
                    borderRadius: "8px",
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: `${fontBody}`,
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: `${C.textMuted}`,
                      marginBottom: 6,
                    }}
                  >
                    Name
                  </div>
                  <div
                    style={{
                      fontFamily: `${fontBody}`,
                      fontSize: "14px",
                      color: `${C.text}`,
                      fontWeight: 500,
                    }}
                  >
                    {order.staff.name}
                  </div>
                </div>
              </SectionCard>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Customer */}
            <SectionCard title="Customer">
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <InfoRow label="Name">{order.customer}</InfoRow>
                <InfoRow label="Email">{order.customer_email}</InfoRow>
                {order.customer_phone && (
                  <InfoRow label="Phone">{order.customer_phone}</InfoRow>
                )}
                <InfoRow label="Vendor">{order.vendor}</InfoRow>
              </div>
            </SectionCard>

            {/* Payment */}
            <SectionCard title="Payment">
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <InfoRow label="Status">
                  <StatusBadge status={order.is_paid ? "paid" : "draft"} />
                </InfoRow>
                {order.payment_method && (
                  <InfoRow label="Method">
                    <span
                      style={{
                        textTransform: "uppercase",
                        fontSize: 11,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {order.payment_method}
                    </span>
                    {isWalkIn && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 10,
                          color: `${C.amber}`,
                          background: "rgba(201,169,110,0.1)",
                          border: "1px solid rgba(201,169,110,0.25)",
                          padding: "1px 6px",
                          borderRadius: "999px",
                        }}
                      >
                        Walk-in
                      </span>
                    )}
                  </InfoRow>
                )}
                {order.manual_paid_at && (
                  <InfoRow label="Paid at">{order.manual_paid_at}</InfoRow>
                )}
                {order.payment_intent && (
                  <InfoRow label="Stripe PI">
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        color: `${C.textMuted}`,
                      }}
                    >
                      {order.payment_intent.slice(0, 24)}…
                    </span>
                  </InfoRow>
                )}
                {order.refunded_at && (
                  <>
                    <InfoRow label="Refunded">A${order.refund_amount}</InfoRow>
                    <InfoRow label="Refund date">{order.refunded_at}</InfoRow>
                  </>
                )}
              </div>
            </SectionCard>

            {/* Status control */}
            <SectionCard title="Order Status">
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    fontFamily: `${fontBody}`,
                    fontSize: "13px",
                    color: `${C.text}`,
                    background: `${C.bgAlt}`,
                    border: `1px solid ${C.border}`,
                    borderRadius: "8px",
                    outline: "none",
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <AdminBtn
                  onClick={handleStatusSave}
                  disabled={saving || status === order.status}
                  variant="primary"
                >
                  <Icons.Check /> {saving ? "Saving…" : "Update Status"}
                </AdminBtn>
              </div>
            </SectionCard>
          </div>
        </div>

        {showDelete && (
          <ConfirmModal
            title={`Delete Order #${order.id}?`}
            description={`This will permanently delete the order for ${order.customer} including all items and any linked booking.`}
            confirmLabel="Delete Order"
            onConfirm={handleDelete}
            onCancel={() => setShowDelete(false)}
          />
        )}
      </AdminLayout>
    </>
  );
}
