import React, { useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps, PaginationProps, Order, OrderItem } from "@/types";
import BookingWidget from "./BookingWidget";
import StaffSelectStep from "@/Components/App/StaffSelectStep";
import dayjs from "dayjs";
import Button from "@/Components/App/ui/Button";
import OrderStatusBadge, {
  TimelineDot,
} from "@/Components/App/ui/OrderStatusBadge";
import Modal from "@/Components/App/ui/Modal";
import PageHero from "@/Components/Page/PageHero";

function ConfirmationModal({
  open,
  bookingDate,
  timeSlot,
  vendorId,
  selectedStaffId,
  onSelectStaff,
  onSave,
  onCancel,
}: {
  open: boolean;
  bookingDate: string;
  timeSlot: string;
  vendorId: number | null;
  selectedStaffId: number | null;
  onSelectStaff: (staffId: number | null, staffName?: string | null) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(12,10,8,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md, 4px)",
          padding: "28px 32px",
          maxWidth: 420,
          width: "90%",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.2rem",
            fontWeight: 300,
            color: "var(--color-text)",
            margin: "0 0 18px",
          }}
        >
          Confirm Booking
        </h3>

        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text)",
            marginBottom: 6,
          }}
        >
          <strong style={{ fontWeight: 500 }}>Date:</strong> {bookingDate}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text)",
            marginBottom: 20,
          }}
        >
          <strong style={{ fontWeight: 500 }}>Time:</strong> {timeSlot}
        </div>

        {vendorId && (
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
                marginBottom: 8,
              }}
            >
              Staff Member
            </label>
            <StaffSelectStep
              vendorId={vendorId}
              date={bookingDate}
              timeSlot={timeSlot}
              selectedStaffId={selectedStaffId}
              onSelect={onSelectStaff}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BookingHistory() {
  const { orders } =
    usePage<PageProps<{ orders: PaginationProps<Order> }>>().props;

  const [editConfirmItem, setEditConfirmItem] = useState<OrderItem | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [selectedStaffName, setSelectedStaffName] = useState<string | null>(
    null,
  );
  const [errors, setErrors] = useState<{
    booking_date?: string;
    time_slot?: string;
  }>({});
  const today = new Date().toISOString().split("T")[0];

  const appointmentOrders = orders.data.filter(
    (o) => o.vendor.vendor_type === "appointment",
  );

  // The vendor for whichever booking is currently being edited
  const editingVendorId =
    orders?.data.find((order) =>
      order.orderItems.some((item) => item.id === editingItem?.id),
    )?.vendor.user_id ?? null;

  const handleEditBooking = (item: OrderItem) => {
    if (!item.booking) return;
    setEditingItem(item);
    setBookingDate(dayjs(item.booking.booking_date).format("YYYY-MM-DD"));
    setTimeSlot(item.booking.time_slot);
    setSelectedStaffId(item.booking.staff_id ?? null);
    setSelectedStaffName(null); // resolved by StaffSelectStep once loaded
    setErrors({});
    setDialogOpen(true);
  };

  const handleSelectStaff = (
    staffId: number | null,
    staffName?: string | null,
  ) => {
    setSelectedStaffId(staffId);
    setSelectedStaffName(staffName ?? null);
  };

  const handleCancelBooking = (
    item: OrderItem,
    orderStatus: string,
    order: Order,
  ) => {
    if (orderStatus !== "draft" && orderStatus !== "paid") {
      console.warn(
        "Booking can only be cancelled when order is draft or paid.",
      );
      return;
    }
    if (!item.booking?.id) {
      console.error("Booking ID is missing.");
      return;
    }

    const bookingDateObj = new Date(item.booking.booking_date);
    const now = new Date();
    const hoursUntilBooking =
      (bookingDateObj.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isFullRefund = hoursUntilBooking >= 24;

    const grossTotal = order.total_price + (order.voucher_discount ?? 0);
    const refundAmount = isFullRefund
      ? grossTotal
      : grossTotal - order.booking_fee;

    const giftCardNote =
      Number(order.voucher_discount) > 0
        ? `\nGift card used ($${Number(order.voucher_discount).toFixed(2)}) will be fully restored to your balance, regardless of timing.\n`
        : "";

    const confirmMessage = isFullRefund
      ? `⚠️ Cancel this booking?\n\n` +
        `More than 24 hours until your appointment — full refund applies.\n\n` +
        `Total paid: $${grossTotal.toFixed(2)}\n` +
        `You'll receive: $${refundAmount.toFixed(2)}\n` +
        giftCardNote
      : `⚠️ Cancel this booking?\n\n` +
        `This is within 24 hours of your appointment — the booking fee is non-refundable.\n\n` +
        `Total paid: $${grossTotal.toFixed(2)}\n` +
        `Booking fee (non-refundable): -$${order.booking_fee.toFixed(2)}\n` +
        `You'll receive: $${refundAmount.toFixed(2)}\n` +
        giftCardNote +
        `\nAlternatively, you can edit the booking to change the date/time instead.`;

    if (confirm(confirmMessage)) {
      router.post(
        route("bookings.cancel", item.booking.id),
        {},
        {
          onSuccess: () =>
            alert("Booking cancelled. Refund will be processed."),
          onError: (errs) => {
            console.error("Failed to cancel booking", errs);
            alert("Cancellation failed. Please try again.");
          },
        },
      );
    }
  };

  const handleConfirmBooking = (date: string, slot: string) => {
    if (!editingItem || !editingItem.booking) {
      console.warn("Missing editingItem or booking");
      return;
    }

    router.put(
      route("bookings.update", editingItem.booking.id),
      { booking_date: date, time_slot: slot, staff_id: selectedStaffId },
      {
        onSuccess: () => {
          setEditingItem(null);
          setConfirmModalOpen(false);
          setSelectedStaffId(null);
          setSelectedStaffName(null);
          setErrors({});
        },
        onError: (errorBag) => {
          setErrors(errorBag);
          setConfirmModalOpen(false);
          setDialogOpen(true);
        },
      },
    );
  };

  const requestEditBooking = (item: OrderItem) => {
    setEditConfirmItem(item);
  };

  const confirmEditBooking = () => {
    if (editConfirmItem) {
      handleEditBooking(editConfirmItem);
    }
    setEditConfirmItem(null);
  };

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
          Booking History
        </h2>
      }
    >
      <PageHero
        eyebrow=""
        title={
          <>
            Your <em>Bookings</em>
          </>
        }
        subtitle=""
        breadcrumbs={[
          { label: "Home", href: route("home") },
          { label: "Bookings" },
        ]}
      />
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-16">
          {appointmentOrders.length === 0 ? (
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
              ✦ No bookings yet
            </div>
          ) : (
            <div style={{ position: "relative" }}>
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

              {appointmentOrders.map((order, idx) => {
                const grossTotal =
                  Number(order.total_price) +
                  Number(order.voucher_discount ?? 0);

                const cancellableItem = order.orderItems.find(
                  (item) => item.booking && today < item.booking.booking_date,
                );

                const editableItem = order.orderItems.find(
                  (item) =>
                    item.booking &&
                    today < item.booking.booking_date &&
                    !item.booking.edited_at,
                );

                if (order.id === 18) {
                  console.log("order 18 status:", order.status);
                }
                return (
                  <div
                    key={order.id}
                    style={{
                      position: "relative",
                      paddingLeft: 40,
                      marginBottom:
                        idx === appointmentOrders.length - 1 ? 0 : 48,
                    }}
                  >
                    <TimelineDot status={order.status} />

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

                    <div
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md, 4px)",
                        overflow: "hidden",
                      }}
                    >
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
                          <div
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "var(--text-lg)",
                              fontWeight: 400,
                              color:
                                "var(--color-accent-dark, var(--color-primary))",
                            }}
                          >
                            ${grossTotal.toFixed(2)}
                          </div>
                          {Number(order.voucher_discount) > 0 && (
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
                          )}
                          {Number(order.total_price) > 0 && (
                            <div
                              style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "11px",
                                color: "var(--color-text-muted)",
                                marginTop: 2,
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

                      <div
                        style={{
                          padding: "14px 24px",
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        <span style={{ color: "var(--color-text)" }}>
                          {order.vendor.store_name}
                        </span>
                        {" · "}
                        {order.vendor.store_address}

                        {(() => {
                          const booking = order.orderItems.find(
                            (item) => item.booking,
                          )?.booking;

                          return (
                            booking && (
                              <div
                                style={{
                                  fontFamily: "var(--font-body)",
                                  fontSize: "12px",
                                  color: "var(--color-text)",
                                  marginTop: 4,
                                }}
                              >
                                {new Date(
                                  booking.booking_date,
                                ).toLocaleDateString()}{" "}
                                · {booking.time_slot}
                                {" · "}
                                <span
                                  style={{ color: "var(--color-text-muted)" }}
                                >
                                  {booking.staff
                                    ? `with ${booking.staff.name}`
                                    : "No staff preference"}
                                </span>
                              </div>
                            )
                          );
                        })()}
                      </div>
                      {order.orderItems.map((item, i) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: "14px 24px",
                            borderTop: "1px solid var(--color-border)",
                            flexWrap: "wrap",
                          }}
                        >
                          <img
                            src={
                              item.product.image || "/images/placeholder.png"
                            }
                            alt={item.product.title}
                            style={{
                              width: 44,
                              height: 44,
                              objectFit: "cover",
                              borderRadius: "var(--radius-sm, 3px)",
                              flexShrink: 0,
                            }}
                          />

                          <div style={{ flex: 1, minWidth: 160 }}>
                            <span
                              style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "var(--text-sm)",
                                color: "var(--color-text)",
                              }}
                            >
                              {item.product.title}
                            </span>
                            {(item.variation_summary ?? []).length > 0 && (
                              <div
                                style={{
                                  fontFamily: "var(--font-body)",
                                  fontSize: "12px",
                                  color: "var(--color-text-muted)",
                                  marginTop: 2,
                                }}
                              >
                                {(item.variation_summary ?? [])
                                  .map((v) => `${v.type}: ${v.option}`)
                                  .join(" · ")}
                              </div>
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

                      {(order.status === "draft" ||
                        order.status === "paid" ||
                        order.status === "cancelled") && (
                        <div
                          style={{
                            padding: "14px 24px",
                            borderTop: "1px solid var(--color-border)",
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          {cancellableItem ? (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={!editableItem}
                                onClick={() => {
                                  if (editableItem)
                                    setEditConfirmItem(editableItem);
                                }}
                                title={
                                  !editableItem
                                    ? "This booking has already been edited once"
                                    : undefined
                                }
                                style={
                                  !editableItem
                                    ? {
                                        opacity: 0.5,
                                        cursor: "not-allowed",
                                        pointerEvents: "none",
                                      }
                                    : undefined
                                }
                              >
                                Edit Booking
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={order.status === "cancelled"}
                                onClick={() => {
                                  if (order.status !== "cancelled") {
                                    handleCancelBooking(
                                      cancellableItem,
                                      order.status,
                                      order,
                                    );
                                  }
                                }}
                                title={
                                  order.status === "cancelled"
                                    ? "This order has already been cancelled"
                                    : undefined
                                }
                                style={
                                  order.status === "cancelled"
                                    ? {
                                        opacity: 0.5,
                                        cursor: "not-allowed",
                                        pointerEvents: "none",
                                      }
                                    : undefined
                                }
                              >
                                Cancel Booking
                              </Button>
                            </>
                          ) : (
                            <span
                              style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "12px",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              Completed
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {editingItem && (
          <BookingWidget
            bookingDate={bookingDate}
            setBookingDate={setBookingDate}
            timeSlot={timeSlot}
            setTimeSlot={(slot) => {
              setTimeSlot(slot);
              if (slot && bookingDate) {
                setDialogOpen(false);
                setConfirmModalOpen(true);
              }
            }}
            open={dialogOpen}
            onOpenChange={(open) => setDialogOpen(open)}
            vendorId={editingVendorId}
            onSubmit={() => {}}
          />
        )}

        <Modal
          show={!!editConfirmItem}
          onClose={() => setEditConfirmItem(null)}
          maxWidth="sm"
        >
          <div style={{ padding: "24px" }}>
            <h3
              style={{
                fontFamily: "var(--font-heading, var(--font-display))",
                fontSize: "16px",
                color: "var(--color-text)",
                marginBottom: "8px",
              }}
            >
              Edit booking?
            </h3>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--color-text-muted)",
                marginBottom: "20px",
              }}
            >
              You can only edit this booking once. Are you sure you want to
              continue?
            </p>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditConfirmItem(null)}
              >
                No
              </Button>
              <Button variant="primary" size="sm" onClick={confirmEditBooking}>
                Yes
              </Button>
            </div>
          </div>
        </Modal>

        <ConfirmationModal
          open={confirmModalOpen}
          bookingDate={bookingDate}
          timeSlot={timeSlot}
          vendorId={editingVendorId}
          selectedStaffId={selectedStaffId}
          onSelectStaff={handleSelectStaff}
          onCancel={() => {
            setConfirmModalOpen(false);
            setDialogOpen(true);
          }}
          onSave={() => {
            handleConfirmBooking(bookingDate, timeSlot);
            setConfirmModalOpen(false);
          }}
        />
      </div>
    </AuthenticatedLayout>
  );
}
