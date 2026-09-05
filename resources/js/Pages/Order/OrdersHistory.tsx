import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { motion } from "framer-motion";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps, PaginationProps, Order, OrderItem } from "@/types";
import Pagination from "@/Components/App/ui/Pagination";
import PageHero from "@/Components/Page/PageHero";

const EASE = [0.16, 1, 0.3, 1] as const;

/* =====================================================
   Status → color mapping
===================================================== */

const STATUS_STYLES: Record<
  string,
  {
    label: string;
    dot: string;
    text: string;
    bg: string;
    border: string;
  }
> = {
  pending: {
    label: "Pending",
    dot: "#FFB627",
    text: "#FFB627",
    bg: "rgba(255,182,39,0.1)",
    border: "rgba(255,182,39,0.25)",
  },

  processing: {
    label: "Processing",
    dot: "#FFB627",
    text: "#FFB627",
    bg: "rgba(255,182,39,0.1)",
    border: "rgba(255,182,39,0.25)",
  },

  completed: {
    label: "Completed",
    dot: "#34D399",
    text: "#34D399",
    bg: "rgba(52,211,153,0.1)",
    border: "rgba(52,211,153,0.25)",
  },

  paid: {
    label: "Paid",
    dot: "#34D399",
    text: "#34D399",
    bg: "rgba(52,211,153,0.1)",
    border: "rgba(52,211,153,0.25)",
  },

  cancelled: {
    label: "Cancelled",
    dot: "#F87171",
    text: "#F87171",
    bg: "rgba(248,113,113,0.1)",
    border: "rgba(248,113,113,0.25)",
  },

  refunded: {
    label: "Refunded",
    dot: "#F87171",
    text: "#F87171",
    bg: "rgba(248,113,113,0.1)",
    border: "rgba(248,113,113,0.25)",
  },
};

function statusStyle(status: string) {
  return (
    STATUS_STYLES[status?.toLowerCase()] ?? {
      label: status,
      dot: "#6B6775",
      text: "#9C97A8",
      bg: "rgba(255,255,255,0.04)",
      border: "#26232E",
    }
  );
}

/* =====================================================
   Status Badge
===================================================== */

function StatusBadge({ status }: { status: string }) {
  const s = statusStyle(status);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider"
      style={{
        color: s.text,
        background: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: s.dot }}
      />

      {s.label}
    </span>
  );
}

/* =====================================================
   Timeline Dot
===================================================== */

function TimelineDot({ status }: { status: string }) {
  const s = statusStyle(status);

  return (
    <div
      className="absolute left-0 top-1 flex h-4 w-4 items-center justify-center rounded-full"
      style={{
        background: "#0B0B10",
        border: `2px solid ${s.dot}`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: s.dot }}
      />
    </div>
  );
}

/* =====================================================
   Item Thumbnail
===================================================== */

function ItemThumb({ item }: { item: OrderItem }) {
  const src = item.product?.image ?? item.ticket_tier?.event_image ?? null;

  if (!src) {
    return (
      <div
        className="h-14 w-14 shrink-0 rounded-lg flex items-center justify-center"
        style={{ background: "#0B0B10", border: "1px solid #26232E" }}
      >
        <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#6B6775]">
          {item.ticket_tier ? "TIX" : "—"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={item.ticket_tier?.event_name ?? item.product?.title ?? "Item"}
      className="h-14 w-14 shrink-0 rounded-lg object-cover"
      style={{ border: "1px solid #26232E" }}
    />
  );
}

function ItemRow({ item, isFirst }: { item: OrderItem; isFirst: boolean }) {
  console.log("[ItemRow DEBUG]", JSON.stringify(item, null, 2));

  const tier = item.ticket_tier;

  return (
    <div
      className="flex items-center gap-3.5 py-3.5"
      style={{ borderTop: isFirst ? "1px solid #26232E" : "none" }}
    >
      <ItemThumb item={item} />

      <div className="min-w-0 flex-1">
        {item.product ? (
          <Link
            href={`/product/${item.product.id}`}
            className="text-sm text-[#D8D5DE] hover:text-white hover:underline truncate block"
          >
            {item.product.title}
          </Link>
        ) : tier ? (
          <span className="text-sm text-[#D8D5DE] block truncate">
            {tier.name}
            {tier.event_name ? ` — ${tier.event_name}` : ""}
          </span>
        ) : (
          <span className="text-sm text-[#D8D5DE] block">Booking Fee</span>
        )}

        {tier?.venue_name && (
          <div className="text-xs text-[#6B6775] mt-0.5">
            {tier.venue_name}
            {tier.event_date
              ? ` · ${new Date(tier.event_date).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}`
              : ""}
          </div>
        )}

        {item.seats && item.seats.length > 0 && (
          <div className="text-xs text-[#6B6775] mt-0.5">
            Seat{item.seats.length > 1 ? "s" : ""}{" "}
            {item.seats.map((s) => s.label).join(", ")}
          </div>
        )}

        {item.variation_summary && item.variation_summary.length > 0 && (
          <div className="text-xs text-[#6B6775] mt-0.5">
            {item.variation_summary.map((v) => `${v.type}: ${v.option}`).join(" · ")}
          </div>
        )}

        {item.attachment_path && (

           <a href={`/storage/${item.attachment_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#FFB627] hover:underline mt-0.5 inline-block"
          >
            {item.attachment_name || "View attachment"}
          </a>
        )}
      </div>

      <div className="font-['IBM_Plex_Mono'] text-sm text-[#9C97A8] shrink-0 whitespace-nowrap">
        {item.quantity} × ${Number(item.price).toFixed(2)}
      </div>
    </div>
  );
}

/* =====================================================
   Orders History Page
===================================================== */

export default function OrdersHistory() {
  const { orders } =
    usePage<PageProps<{ orders: PaginationProps<Order> }>>().props;

  const hasOrders = (orders?.data?.length ?? 0) > 0;

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-['Anton'] text-3xl uppercase text-white">
          Order History
        </h2>
      }
    >
      <Head title="Order History">
        <link rel="preconnect" href="https://fonts.googleapis.com" />

        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen bg-[#0B0B10] font-['Manrope'] text-[#F7F5F2]">
        {/* =================================================
            Hero
        ================================================= */}

        <PageHero
          eyebrow="Your account"
          title={
            <>
              Order <em>History</em>
            </>
          }
          breadcrumbs={[
            {
              label: "Home",
              href: route("home"),
            },
            {
              label: "Orders",
            },
          ]}
        />

       <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-1 py-1">
          {/* =================================================
              Empty State
          ================================================= */}

          {!hasOrders ? (
            <motion.div
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: EASE,
              }}
              className="rounded-2xl border border-[#26232E] bg-[#15141B] px-6 py-16 text-center"
            >
              <p className="text-sm text-[#9C97A8]">
                No orders yet. Once you make a purchase,
                it'll show up here.
              </p>

              <Link
                href={route("home")}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#FFB627] px-5 py-3 text-sm font-bold text-[#0B0B10] transition-colors hover:bg-[#ffc355]"
              >
                Browse events & products
              </Link>
            </motion.div>
          ) : (
            /* =================================================
               Orders Timeline
            ================================================= */

            <motion.div
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: EASE,
              }}
              className="relative space-y-10"
            >
              {/* Timeline spine */}

              <div
                className="absolute bottom-2 left-[7px] top-2 w-px"
                style={{
                  background: "#26232E",
                }}
              />

              {orders.data.map((order) => {
                const grossTotal =
                  Number(order.total_price) +
                  Number(order.voucher_discount ?? 0);

                return (
                  <div
                    key={order.id}
                    className="relative pl-9"
                  >
                    {/* Timeline dot */}

                    <TimelineDot status={order.status} />

                    {/* Date */}

                    <div className="mb-2 font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-wider text-[#6B6775]">
                      {new Date(
                        order.created_at
                      ).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>

                    {/* =================================================
                        Order Card
                    ================================================= */}

                    <div className="overflow-hidden rounded-2xl border border-[#26232E] bg-[#15141B]">
                      {/* Header */}

                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#26232E] px-5 py-4 sm:px-6">
                        {/* Order information */}

                        <div>
                          <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider text-[#6B6775]">
                            Order number
                          </p>

                          <p className="mb-2 mt-0.5 font-['IBM_Plex_Mono'] text-lg font-semibold text-white">
                            #{order.id}
                          </p>

                          <StatusBadge
                            status={order.status}
                          />
                        </div>

                        {/* Total */}

                        <div className="text-right">
                          {Number(
                            order.voucher_discount
                          ) > 0 ? (
                            <>
                              <div className="font-['IBM_Plex_Mono'] text-2xl font-semibold text-[#FFB627]">
                                ${grossTotal.toFixed(2)}
                              </div>

                              <div className="mt-1 text-[11px] text-[#6B6775]">
                                Voucher −$
                                {Number(
                                  order.voucher_discount
                                ).toFixed(2)}
                              </div>

                              {Number(
                                order.total_price
                              ) > 0 && (
                                <div className="mt-0.5 text-xs text-[#6B6775]">
                                  Card − $
                                  {Number(
                                    order.total_price
                                  ).toFixed(2)}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="font-['IBM_Plex_Mono'] text-2xl font-semibold text-[#FFB627]">
                              $
                              {Number(
                                order.total_price
                              ).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* =================================================
                          Vendor / Meta
                      ================================================= */}

                      <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-[#26232E] px-5 py-3.5 text-sm text-[#9C97A8] sm:px-6">
                        <span>
                          <span className="text-[#D8D5DE]">
                            {order.vendor.store_name}
                          </span>

                          {" · "}

                          {order.vendor.store_address}
                        </span>

                        {order.payment_method && (
                          <span className="capitalize">
                            Paid via{" "}
                            {Number(
                              order.voucher_discount
                            ) > 0 &&
                            order.payment_method ===
                              "card"
                              ? "Voucher + Card"
                              : order.payment_method ===
                                  "gift_card"
                                ? "Voucher"
                                : order.payment_method}
                          </span>
                        )}

                        {order.vendor.vendor_type ===
                          "appointment" &&
                          order.booking_date && (
                            <span>
                              {new Date(
                                order.booking_date
                              ).toLocaleDateString()}{" "}
                              · {order.time_slot}
                            </span>
                          )}
                      </div>

                      {/* =================================================
                          Items
                      ================================================= */}

                      <div className="px-5 sm:px-6">
                        {order.orderItems.map(
                          (item, index) => (
                            <ItemRow
                              key={item.id}
                              item={item}
                              isFirst={index === 0}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* =================================================
              Pagination
          ================================================= */}

          {hasOrders && (
            <div className="mt-10">
              <Pagination
                links={orders?.meta?.links ?? []}
              />
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
