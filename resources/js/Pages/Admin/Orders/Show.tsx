import React, { useEffect, useRef, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { createPortal } from "react-dom";

import AdminLayout from "../AdminLayout";

import {
  AdminPageHeader,
  AdminBtn,
  StatusBadge,
  FlashMessage,
  ConfirmModal,
  Icons,
  fontDisplay,
  fontBody,
  C,
} from "../../../Components/Admin/AdminComponents";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface EventInfo {
  id: number;
  name: string;
  slug?: string;
  image?: string | null;
}

interface EventLegInfo {
  id: number;
  name?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  venue_name?: string | null;
  venue_city?: string | null;
  seating_type?: "general" | "reserved" | string | null;
}

interface IssuedTicket {
  id: number;
  code: string;
  status: string;
  qr_url?: string | null;

  holder_name?: string | null;
  holder_email?: string | null;

  seat_label?: string | null;
  tier_name?: string | null;
  tier_price?: number | null;

  event?: EventInfo | null;
  event_leg?: EventLegInfo | null;
}

interface OrderProps {
  id: number;

  customer: string;
  customer_email: string;
  customer_phone: string;

  vendor: string;
  vendor_type?: string | null;

  event?: EventInfo | null;

  tickets: IssuedTicket[];

  total_price: number;
  gross_total: number;
  voucher_discount: number;
  booking_fee: number;

  status: string;
  is_paid: boolean;

  payment_method: string | null;
  manual_paid_at: string | null;
  payment_intent: string | null;

  refunded_at: string | null;
  refund_amount: number | null;
  refunded_types: string[];

  created_at: string;
}

interface Props {
  order: OrderProps;
  statuses: string[];
  flash: {
    success?: string;
    error?: string;
  };
}

/*
|--------------------------------------------------------------------------
| Small UI helpers
|--------------------------------------------------------------------------
*/

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
          fontFamily: fontBody,
          fontSize: "10px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: C.textMuted,
          flexShrink: 0,
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontFamily: fontBody,
          fontSize: "13px",
          color: C.text,
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
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${C.border}`,
          background: C.bgAlt,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 3,
              height: 16,
              background: C.amber,
              borderRadius: 2,
            }}
          />

          <span
            style={{
              fontFamily: fontBody,
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: C.textMuted,
              fontWeight: 500,
            }}
          >
            {title}
          </span>
        </div>

        {eyebrow && (
          <span
            style={{
              fontFamily: fontBody,
              fontSize: "9px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.textMuted,
            }}
          >
            {eyebrow}
          </span>
        )}
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
  fontFamily: fontBody,
  fontSize: "12px",
  letterSpacing: "0.04em",
  color: C.text,
  cursor: "pointer",
  borderRadius: "8px",
};

function formatMoney(value: number | null | undefined) {
  return `A$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return null;

  const date = new Date(`1970-01-01T${value}`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function titleCase(value?: string | null) {
  if (!value) return "—";

  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function OrderShow({
  order,
  statuses,
  flash,
}: Props) {
  const page = usePage();

  console.log("========== ORDER SHOW ==========");
  console.log("FULL ORDER:", order);
  console.log("ORDER ID:", order?.id);
  console.log("CUSTOMER:", order?.customer);
  console.log("VENDOR:", order?.vendor);
  console.log("EVENT:", order?.event);
  console.log("TICKETS:", order?.tickets);
  console.log("ITEMS:", order?.items);

  console.log("========== INERTIA PAGE PROPS ==========");
  console.log("PAGE PROPS:", page.props);
  console.log("ORDER PROP:", page.props.order);
  console.log("=========================================");

  // rest of component...
  const [showDelete, setShowDelete] = useState(false);

  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);

  const [refundMenuOpen, setRefundMenuOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");

  const refundMenuRef = useRef<HTMLDivElement>(null);
  const refundPortalRef = useRef<HTMLDivElement>(null);

  /*
  |--------------------------------------------------------------------------
  | Status
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Refund
  |--------------------------------------------------------------------------
  */

  const maxRefundable = Math.max(
    0,
    Number(order.total_price) - Number(order.refund_amount ?? 0),
  );

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

  const isFullyRefunded =
    order.refunded_types?.includes("full") ?? false;

  const canPartialRefund =
    isStripeOrder || isVoucherCovered;

  const bothPartialsUsed =
    order.refunded_types?.includes("booking_fee") &&
    order.refunded_types?.includes("except_booking_fee");

  const isWalkIn =
    !!order.payment_method && !order.payment_intent;

  const handleRefund = (
    type: "full" | "booking_fee" | "except_booking_fee",
  ) => {
    const labels = {
      full: "Process a FULL refund including the booking fee?",
      booking_fee: "Refund ONLY the booking fee?",
      except_booking_fee:
        "Refund everything EXCEPT the booking fee?",
    };

    if (!confirm(labels[type])) return;

    router.post(
      route("admin.orders.refund", order.id),
      { type },
      {
        preserveScroll: true,
      },
    );
  };

  const handleCustomRefund = () => {
    const amount = parseFloat(refundAmount);

    if (Number.isNaN(amount) || amount <= 0) {
      alert("Enter a valid refund amount.");
      return;
    }

    if (amount > maxRefundable) {
      alert(
        `Amount cannot exceed the refundable total of ${formatMoney(
          maxRefundable,
        )}.`,
      );
      return;
    }

    if (!confirm(`Refund ${formatMoney(amount)} for this order?`)) {
      return;
    }

    router.post(
      route("admin.orders.refund", order.id),
      {
        type: "custom",
        amount,
      },
      {
        preserveScroll: true,
        onSuccess: () => setRefundAmount(""),
      },
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Refund menu outside click
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      const clickedTrigger =
        refundMenuRef.current?.contains(target);

      const clickedPortal =
        refundPortalRef.current?.contains(target);

      if (!clickedTrigger && !clickedPortal) {
        setRefundMenuOpen(false);
      }
    };

    if (refundMenuOpen) {
      document.addEventListener(
        "mousedown",
        handleClickOutside,
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [refundMenuOpen]);

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const handleDelete = () => {
    router.delete(
      route("admin.orders.destroy", order.id),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Event information
  |--------------------------------------------------------------------------
  */

  const event =
    order.event ??
    order.tickets.find((ticket) => ticket.event)?.event ??
    null;

  const firstLeg =
    order.tickets.find((ticket) => ticket.event_leg)?.event_leg ??
    null;

  const uniqueTiers = Array.from(
    new Set(
      order.tickets
        .map((ticket) => ticket.tier_name)
        .filter(Boolean),
    ),
  );

  const reservedTickets = order.tickets.filter(
    (ticket) => ticket.seat_label,
  );

  const hasReservedSeats = reservedTickets.length > 0;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <Head title={`Order #${order.id}`} />

      <AdminLayout>
        <AdminPageHeader
          eyebrow="Ticketing"
          title={
            <>
              Order{" "}
              <em
                style={{
                  fontStyle: "italic",
                  color: C.amberHover,
                }}
              >
                #{order.id}
              </em>
            </>
          }
          meta={`Created ${order.created_at}`}
          action={
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
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

              {!isFullyRefunded && (
                <div
                  ref={refundMenuRef}
                  style={{
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  <AdminBtn
                    onClick={() =>
                      setRefundMenuOpen((open) => !open)
                    }
                  >
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
                          background: C.surface,
                          border: `1px solid ${C.border}`,
                          borderRadius: "8px",
                          boxShadow:
                            "0 12px 32px rgba(0,0,0,0.35)",
                          padding: "10px",
                          width: 240,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <button
                          onClick={() => {
                            handleRefund("full");
                            setRefundMenuOpen(false);
                          }}
                          disabled={
                            isFullyRefunded ||
                            bothPartialsUsed
                          }
                          style={menuItemStyle}
                        >
                          Refund Full
                        </button>

                        <button
                          onClick={() => {
                            handleRefund(
                              "except_booking_fee",
                            );
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
                            order.refunded_types.includes(
                              "booking_fee",
                            )
                          }
                          style={menuItemStyle}
                        >
                          Refund Booking Fee Only
                        </button>

                        <div
                          style={{
                            borderTop: `1px solid ${C.border}`,
                            paddingTop: 8,
                            display: "flex",
                            gap: 6,
                          }}
                        >
                          <input
                            type="number"
                            min={0}
                            max={maxRefundable}
                            step="0.01"
                            placeholder={`Max $${maxRefundable.toFixed(
                              2,
                            )}`}
                            value={refundAmount}
                            onChange={(e) =>
                              setRefundAmount(e.target.value)
                            }
                            style={{
                              flex: 1,
                              minWidth: 0,
                              padding: "6px 8px",
                              fontFamily: fontBody,
                              fontSize: 12,
                              border: `1px solid ${C.border}`,
                              borderRadius: 8,
                              background: C.bgAlt,
                              color: C.text,
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

              <AdminBtn
                onClick={() => setShowDelete(true)}
                variant="danger"
              >
                <Icons.Delete /> Delete
              </AdminBtn>
            </div>
          }
        />

        <FlashMessage flash={flash} />

        {/* =========================================================
            ORDER SUMMARY
        ========================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) 300px",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* =====================================================
              LEFT
          ===================================================== */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* EVENT */}

            <SectionCard
              title="Event"
              eyebrow={event ? `Event #${event.id}` : undefined}
            >
              {event ? (
                <div
                  style={{
                    display: "flex",
                    gap: 18,
                    alignItems: "flex-start",
                  }}
                >
                  {event.image && (
                    <img
                      src={event.image}
                      alt={event.name}
                      style={{
                        width: 110,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: fontDisplay,
                        fontSize: "1.55rem",
                        color: C.text,
                        lineHeight: 1.1,
                        marginBottom: 8,
                      }}
                    >
                      {event.name}
                    </div>

                    {firstLeg && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 5,
                        }}
                      >
                        {firstLeg.name && (
                          <div
                            style={{
                              fontFamily: fontBody,
                              fontSize: 12,
                              color: C.textMuted,
                            }}
                          >
                            {firstLeg.name}
                          </div>
                        )}

                        {firstLeg.date && (
                          <div
                            style={{
                              fontFamily: fontBody,
                              fontSize: 12,
                              color: C.text,
                            }}
                          >
                            {formatDate(firstLeg.date)}
                            {firstLeg.start_time &&
                              ` · ${formatTime(
                                firstLeg.start_time,
                              )}`}
                          </div>
                        )}

                        {firstLeg.venue_name && (
                          <div
                            style={{
                              fontFamily: fontBody,
                              fontSize: 12,
                              color: C.textMuted,
                            }}
                          >
                            {firstLeg.venue_name}
                            {firstLeg.venue_city &&
                              ` · ${firstLeg.venue_city}`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: fontBody,
                    fontSize: 13,
                    color: C.textMuted,
                  }}
                >
                  Event information unavailable.
                </div>
              )}
            </SectionCard>

            {/* TICKETS */}

            <SectionCard
              title="Tickets"
              eyebrow={`${order.tickets.length} issued`}
            >
              {order.tickets.length === 0 ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    color: C.textMuted,
                    fontFamily: fontBody,
                    fontSize: 13,
                  }}
                >
                  No tickets issued for this order.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {order.tickets.map((ticket) => {
                    const leg = ticket.event_leg;

                    return (
                      <div
                        key={ticket.id}
                        style={{
                          border: `1px solid ${C.border}`,
                          borderRadius: 10,
                          background: C.bgAlt,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                            gap: 12,
                            padding:
                              "12px 14px",
                            borderBottom:
                              `1px solid ${C.border}`,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontFamily: fontBody,
                                fontSize: 13,
                                fontWeight: 600,
                                color: C.text,
                              }}
                            >
                              {ticket.tier_name ??
                                "Event Ticket"}
                            </div>

                            <div
                              style={{
                                marginTop: 3,
                                fontFamily:
                                  "monospace",
                                fontSize: 10,
                                color:
                                  C.textMuted,
                                letterSpacing:
                                  "0.05em",
                              }}
                            >
                              {ticket.code}
                            </div>
                          </div>

                          <StatusBadge
                            status={ticket.status}
                          />
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(3, minmax(0, 1fr))",
                            gap: 12,
                            padding: 14,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontFamily:
                                  fontBody,
                                fontSize: 9,
                                textTransform:
                                  "uppercase",
                                letterSpacing:
                                  "0.12em",
                                color:
                                  C.textMuted,
                                marginBottom: 4,
                              }}
                            >
                              Holder
                            </div>

                            <div
                              style={{
                                fontFamily:
                                  fontBody,
                                fontSize: 12,
                                color: C.text,
                              }}
                            >
                              {ticket.holder_name ??
                                order.customer}
                            </div>
                          </div>

                          <div>
                            <div
                              style={{
                                fontFamily:
                                  fontBody,
                                fontSize: 9,
                                textTransform:
                                  "uppercase",
                                letterSpacing:
                                  "0.12em",
                                color:
                                  C.textMuted,
                                marginBottom: 4,
                              }}
                            >
                              Tier
                            </div>

                            <div
                              style={{
                                fontFamily:
                                  fontBody,
                                fontSize: 12,
                                color: C.text,
                              }}
                            >
                              {ticket.tier_name ??
                                "—"}
                            </div>
                          </div>

                          <div>
                            <div
                              style={{
                                fontFamily:
                                  fontBody,
                                fontSize: 9,
                                textTransform:
                                  "uppercase",
                                letterSpacing:
                                  "0.12em",
                                color:
                                  C.textMuted,
                                marginBottom: 4,
                              }}
                            >
                              Seat
                            </div>

                            <div
                              style={{
                                fontFamily:
                                  fontBody,
                                fontSize: 12,
                                color:
                                  ticket.seat_label
                                    ? C.amber
                                    : C.textMuted,
                                fontWeight:
                                  ticket.seat_label
                                    ? 600
                                    : 400,
                              }}
                            >
                              {ticket.seat_label ??
                                "General Admission"}
                            </div>
                          </div>
                        </div>

                        {leg && (
                          <div
                            style={{
                              padding:
                                "9px 14px",
                              borderTop:
                                `1px solid ${C.border}`,
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "center",
                              gap: 10,
                              fontFamily:
                                fontBody,
                              fontSize: 11,
                              color:
                                C.textMuted,
                            }}
                          >
                            <span>
                              {leg.venue_name ??
                                "Venue unavailable"}
                              {leg.venue_city &&
                                ` · ${leg.venue_city}`}
                            </span>

                            <span>
                              {leg.date
                                ? formatDate(
                                    leg.date,
                                  )
                                : ""}
                              {leg.start_time &&
                                ` · ${formatTime(
                                  leg.start_time,
                                )}`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* EVENT BREAKDOWN */}

            <SectionCard title="Ticket Breakdown">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                {uniqueTiers.length > 0 ? (
                  uniqueTiers.map((tier) => {
                    const tierTickets =
                      order.tickets.filter(
                        (ticket) =>
                          ticket.tier_name === tier,
                      );

                    const subtotal =
                      tierTickets.reduce(
                        (sum, ticket) =>
                          sum +
                          Number(
                            ticket.tier_price ??
                              0,
                          ),
                        0,
                      );

                    return (
                      <div
                        key={tier}
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          padding:
                            "11px 0",
                          borderBottom:
                            `1px solid ${C.border}`,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontFamily:
                                fontBody,
                              fontSize: 13,
                              color: C.text,
                            }}
                          >
                            {tier}
                          </div>

                          <div
                            style={{
                              marginTop: 2,
                              fontFamily:
                                fontBody,
                              fontSize: 10,
                              color:
                                C.textMuted,
                            }}
                          >
                            {tierTickets.length}{" "}
                            {tierTickets.length ===
                            1
                              ? "ticket"
                              : "tickets"}
                          </div>
                        </div>

                        {subtotal > 0 && (
                          <div
                            style={{
                              fontFamily:
                                fontBody,
                              fontSize: 13,
                              color:
                                C.text,
                            }}
                          >
                            {formatMoney(
                              subtotal,
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      color: C.textMuted,
                      fontFamily: fontBody,
                      fontSize: 13,
                    }}
                  >
                    Ticket information unavailable.
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    paddingTop: 14,
                  }}
                >
                  <span
                    style={{
                      fontFamily: fontBody,
                      fontSize: 10,
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.14em",
                      color: C.textMuted,
                    }}
                  >
                    Seating
                  </span>

                  <span
                    style={{
                      fontFamily: fontBody,
                      fontSize: 12,
                      color: C.text,
                    }}
                  >
                    {hasReservedSeats
                      ? "Reserved Seating"
                      : "General Admission"}
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* ATTENDEES */}

            <SectionCard
              title="Attendees"
              eyebrow={`${order.tickets.length} ticket${
                order.tickets.length === 1
                  ? ""
                  : "s"
              }`}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {order.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: 16,
                      padding:
                        "10px 12px",
                      border:
                        `1px solid ${C.border}`,
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily:
                            fontBody,
                          fontSize: 13,
                          color: C.text,
                        }}
                      >
                        {ticket.holder_name ??
                          order.customer}
                      </div>

                      {ticket.holder_email && (
                        <div
                          style={{
                            marginTop: 2,
                            fontFamily:
                              fontBody,
                            fontSize: 11,
                            color:
                              C.textMuted,
                          }}
                        >
                          {ticket.holder_email}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <div
                        style={{
                          fontFamily:
                            "monospace",
                          fontSize: 10,
                          color:
                            C.textMuted,
                        }}
                      >
                        {ticket.code}
                      </div>

                      {ticket.seat_label && (
                        <div
                          style={{
                            marginTop: 2,
                            fontFamily:
                              fontBody,
                            fontSize: 10,
                            color:
                              C.amber,
                          }}
                        >
                          Seat{" "}
                          {ticket.seat_label}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* =====================================================
              RIGHT
          ===================================================== */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* CUSTOMER */}

            <SectionCard title="Customer">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                <InfoRow label="Name">
                  {order.customer || "—"}
                </InfoRow>

                <InfoRow label="Email">
                  {order.customer_email || "—"}
                </InfoRow>

                {order.customer_phone && (
                  <InfoRow label="Phone">
                    {order.customer_phone}
                  </InfoRow>
                )}
              </div>
            </SectionCard>

            {/* EVENT / VENDOR */}

            <SectionCard title="Marketplace">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                <InfoRow label="Vendor">
                  {order.vendor || "—"}
                </InfoRow>

                {order.vendor_type && (
                  <InfoRow label="Account">
                    {titleCase(order.vendor_type)}
                  </InfoRow>
                )}

                {event && (
                  <InfoRow label="Event">
                    {event.name}
                  </InfoRow>
                )}

                {firstLeg?.venue_name && (
                  <InfoRow label="Venue">
                    {firstLeg.venue_name}
                  </InfoRow>
                )}
              </div>
            </SectionCard>

            {/* PAYMENT */}

            <SectionCard title="Payment">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                <InfoRow label="Status">
                  <StatusBadge
                    status={
                      order.is_paid
                        ? "paid"
                        : order.status
                    }
                  />
                </InfoRow>

                {order.payment_method && (
                  <InfoRow label="Method">
                    <span
                      style={{
                        textTransform:
                          "uppercase",
                        fontSize: 11,
                        letterSpacing:
                          "0.1em",
                      }}
                    >
                      {order.payment_method}
                    </span>

                    {isWalkIn && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 10,
                          color: C.amber,
                          background:
                            "rgba(201,169,110,0.1)",
                          border:
                            "1px solid rgba(201,169,110,0.25)",
                          padding:
                            "1px 6px",
                          borderRadius:
                            "999px",
                        }}
                      >
                        Walk-in
                      </span>
                    )}
                  </InfoRow>
                )}

                <InfoRow label="Tickets">
                  {formatMoney(
                    order.gross_total -
                      Number(order.booking_fee),
                  )}
                </InfoRow>

                {Number(order.booking_fee) > 0 && (
                  <InfoRow label="Booking Fee">
                    {formatMoney(
                      order.booking_fee,
                    )}
                  </InfoRow>
                )}

                {Number(order.voucher_discount) >
                  0 && (
                  <InfoRow label="Voucher">
                    <span
                      style={{
                        color: C.error,
                      }}
                    >
                      −
                      {formatMoney(
                        order.voucher_discount,
                      )}
                    </span>
                  </InfoRow>
                )}

                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 12,
                    borderTop:
                      `2px solid ${C.border}`,
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: fontBody,
                      fontSize: 10,
                      letterSpacing:
                        "0.14em",
                      textTransform:
                        "uppercase",
                      color: C.textMuted,
                    }}
                  >
                    Charged
                  </span>

                  <span
                    style={{
                      fontFamily:
                        fontDisplay,
                      fontSize:
                        "1.35rem",
                      color: C.amber,
                    }}
                  >
                    {formatMoney(
                      order.total_price,
                    )}
                  </span>
                </div>

                {order.manual_paid_at && (
                  <InfoRow label="Paid At">
                    {order.manual_paid_at}
                  </InfoRow>
                )}

                {order.payment_intent && (
                  <InfoRow label="Payment ID">
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily:
                          "monospace",
                        color:
                          C.textMuted,
                      }}
                    >
                      {order.payment_intent.slice(
                        0,
                        20,
                      )}
                      …
                    </span>
                  </InfoRow>
                )}
              </div>
            </SectionCard>

            {/* ORDER TOTAL */}

            <SectionCard title="Order Summary">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                <InfoRow label="Ticket Value">
                  {formatMoney(
                    order.gross_total -
                      Number(order.booking_fee),
                  )}
                </InfoRow>

                <InfoRow label="Booking Fee">
                  {formatMoney(
                    order.booking_fee,
                  )}
                </InfoRow>

                {Number(order.voucher_discount) >
                  0 && (
                  <InfoRow label="Discount">
                    <span
                      style={{
                        color: C.error,
                      }}
                    >
                      −
                      {formatMoney(
                        order.voucher_discount,
                      )}
                    </span>
                  </InfoRow>
                )}

                <div
                  style={{
                    paddingTop: 14,
                    marginTop: 4,
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: fontBody,
                      fontSize: 10,
                      letterSpacing:
                        "0.14em",
                      textTransform:
                        "uppercase",
                      color: C.textMuted,
                    }}
                  >
                    Total
                  </span>

                  <span
                    style={{
                      fontFamily:
                        fontDisplay,
                      fontSize:
                        "1.4rem",
                      color: C.amber,
                    }}
                  >
                    {formatMoney(
                      order.total_price,
                    )}
                  </span>
                </div>

                {order.refunded_at && (
                  <div
                    style={{
                      marginTop: 12,
                      padding:
                        "10px 12px",
                      background:
                        "rgba(220,80,80,0.06)",
                      border:
                        "1px solid rgba(220,80,80,0.18)",
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        fontFamily:
                          fontBody,
                        fontSize: 10,
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          "0.12em",
                        color:
                          C.textMuted,
                      }}
                    >
                      Refunded
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                        fontFamily:
                          fontBody,
                        fontSize: 13,
                        color:
                          C.error,
                      }}
                    >
                      {formatMoney(
                        order.refund_amount,
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                        fontFamily:
                          fontBody,
                        fontSize: 10,
                        color:
                          C.textMuted,
                      }}
                    >
                      {order.refunded_at}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* STATUS */}

            <SectionCard title="Order Status">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding:
                      "9px 12px",
                    fontFamily:
                      fontBody,
                    fontSize: 13,
                    color: C.text,
                    background:
                      C.bgAlt,
                    border:
                      `1px solid ${C.border}`,
                    borderRadius: 8,
                    outline: "none",
                  }}
                >
                  {statuses.map(
                    (value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {titleCase(value)}
                      </option>
                    ),
                  )}
                </select>

                <AdminBtn
                  onClick={
                    handleStatusSave
                  }
                  disabled={
                    saving ||
                    status ===
                      order.status
                  }
                  variant="primary"
                >
                  <Icons.Check />

                  {saving
                    ? "Saving…"
                    : "Update Status"}
                </AdminBtn>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* DELETE */}

        {showDelete && (
          <ConfirmModal
            title={`Delete Order #${order.id}?`}
            description={`This will permanently delete the order for ${
              order.customer
            } including all tickets.`}
            confirmLabel="Delete Order"
            onConfirm={handleDelete}
            onCancel={() =>
              setShowDelete(false)
            }
          />
        )}
      </AdminLayout>
    </>
  );
}
