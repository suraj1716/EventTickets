import React from "react";
import { Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps, PaginationProps, Order } from "@/types";
import OrderStatusBadge, {
  TimelineDot,
} from "@/Components/App/ui/OrderStatusBadge";
import Pagination from "@/Components/App/ui/Pagination";
import PageHero from "@/Components/Page/PageHero";

export default function OrdersHistory() {
  const { orders } =
    usePage<PageProps<{ orders: PaginationProps<Order> }>>().props;

  return (
    <AuthenticatedLayout
      header={
        <h2
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text)",
            fontSize: "var(--text-2xl)",
            fontWeight: 300,
          }}
        >
          Order History
        </h2>
      }
    >
      <PageHero
        eyebrow=""
        title={
          <>
            Your <em>Orders</em>
          </>
        }
        subtitle=""
        breadcrumbs={[
          { label: "Home", href: route("home") },
          { label: "Gallery" },
        ]}
      />

      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-16">
          {orders?.data?.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-xl)",
                fontWeight: 300,
                color: "var(--color-text-muted)",
              }}
            >
              ✦ No orders yet
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              {/* Vertical timeline spine */}
              <div
                style={{
                  position: "absolute",
                  left: 7,
                  top: 8,
                  bottom: 8,
                  width: 1,
                  background: "var(--color-border)",
                }}
              />

              {orders.data.map((order, idx) => {
                const grossTotal =
                  Number(order.total_price) +
                  Number(order.voucher_discount ?? 0);

                return (
                  <div
                    key={order.id}
                    style={{
                      position: "relative",
                      paddingLeft: 40,
                      marginBottom: idx === orders.data.length - 1 ? 0 : 48,
                    }}
                  >
                    {/* Timeline dot */}
                    <TimelineDot status={order.status} />

                    {/* Date label */}
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--color-text-muted)",
                        marginBottom: 8,
                      }}
                    >
                      {new Date(order.created_at).toLocaleDateString(
                        undefined,
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </div>

                    {/* Card */}
                    <div
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md, 4px)",
                        overflow: "hidden",
                      }}
                    >
                      {/* Card header */}
                      <div
                        style={{
                          padding: "18px 24px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 16,
                          flexWrap: "wrap",
                          borderBottom: "1px solid var(--color-border)",
                          background: "var(--color-bg-alt)",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "var(--text-lg)",
                              fontWeight: 400,
                              color: "var(--color-text)",
                              marginBottom: 4,
                            }}
                          >
                            Order #{order.id}
                          </div>
                          <OrderStatusBadge status={order.status} />
                        </div>

                        <div style={{ textAlign: "right" }}>
                          {Number(order.voucher_discount) > 0 && (
                            <>
                              <div
                                style={{
                                  fontFamily: "var(--font-display)",
                                  fontSize: "var(--text-2xl)",
                                  fontWeight: 600,
                                  color: "var(--color-primary)",
                                }}
                              >
                                ${grossTotal.toFixed(2)}
                              </div>
                              <div
                                style={{
                                  fontFamily: "var(--font-body)",
                                  fontSize: "11px",
                                  color: "var(--color-text-muted)",
                                  marginTop: 2,
                                }}
                              >
                                Voucher −$
                                {Number(order.voucher_discount).toFixed(2)}
                              </div>
                            </>
                          )}
                          {Number(order.total_price) > 0 && (
                            <div
                              style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "12px",
                                color: "var(--color-text-muted)",
                                marginTop:
                                  Number(order.voucher_discount) > 0 ? 4 : 0,
                              }}
                            >
                              Card − ${Number(order.total_price).toFixed(2)}
                            </div>
                          )}
                          {Number(order.total_price) === 0 &&
                            Number(order.voucher_discount) > 0 && (
                              <div
                                style={{
                                  fontFamily: "var(--font-body)",
                                  fontSize: "11px",
                                  color: "var(--color-text-muted)",
                                  marginTop: 2,
                                }}
                              >
                                Fully covered
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Vendor / meta row */}
                      <div
                        style={{
                          padding: "14px 24px",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px 20px",
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        <span>
                          <span style={{ color: "var(--color-text)" }}>
                            {order.vendor.store_name}
                          </span>
                          {" · "}
                          {order.vendor.store_address}
                        </span>
                        {order.payment_method && (
                          <span className="capitalize">
                            Paid via{" "}
                            {order.voucher_discount > 0 &&
                            order.payment_method === "card"
                              ? "Voucher + Card"
                              : order.payment_method === "gift_card"
                                ? "Voucher"
                                : order.payment_method}
                          </span>
                        )}
                        {order.vendor.vendor_type === "appointment" &&
                          order.booking_date && (
                            <span>
                              {new Date(
                                order.booking_date,
                              ).toLocaleDateString()}{" "}
                              · {order.time_slot}
                            </span>
                          )}
                      </div>

                      {/* Items */}
                      <div>
                        {order.orderItems.map((item, i) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 14,
                              padding: "14px 24px",
                              borderTop:
                                i === 0
                                  ? "1px solid var(--color-border)"
                                  : "none",
                            }}
                          >
                            {item.product?.image ? (
                              <img
                                src={item.product.image}
                                alt={item.product.title}
                                style={{
                                  width: 44,
                                  height: 44,
                                  objectFit: "cover",
                                  borderRadius: "var(--radius-sm, 3px)",
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  flexShrink: 0,
                                  borderRadius: "var(--radius-sm, 3px)",
                                  background: "var(--color-bg-alt)",
                                }}
                              />
                            )}

                            <div style={{ flex: 1, minWidth: 0 }}>
                              {item.product ? (
                                <Link
                                  href={`/product/${item.product.id}`}
                                  style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize: "var(--text-sm)",
                                    color: "var(--color-text)",
                                    textDecoration: "none",
                                  }}
                                  className="hover:underline"
                                >
                                  {item.product.title}
                                </Link>
                              ) : (
                                <span
                                  style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize: "var(--text-sm)",
                                    color: "var(--color-text)",
                                  }}
                                >
                                  Booking Fee
                                </span>
                              )}
                              {item.variation_summary &&
                                item.variation_summary.length > 0 && (
                                  <div
                                    style={{
                                      fontFamily: "var(--font-body)",
                                      fontSize: "12px",
                                      color: "var(--color-text-muted)",
                                      marginTop: 2,
                                    }}
                                  >
                                    {item.variation_summary
                                      .map((v) => `${v.type}: ${v.option}`)
                                      .join(" · ")}
                                  </div>
                                )}
                              {item.attachment_path && (
                                <a
                                  href={`/storage/${item.attachment_path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize: "12px",
                                    color: "var(--color-info, #2471a3)",
                                  }}
                                  className="hover:underline"
                                >
                                  {item.attachment_name || "View attachment"}
                                </a>
                              )}
                            </div>

                            <div
                              style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "var(--text-sm)",
                                color: "var(--color-text-muted)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.quantity} × ${Number(item.price).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <Pagination links={orders?.meta?.links ?? []} />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
