import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import BookingWidget from "@/Pages/Booking/BookingWidget";
import CartItem from "@/Components/App/CartItem";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { CurrencyFormatter } from "@/utils/CurrencyFormatter";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { ShoppingCartIcon } from "@heroicons/react/20/solid";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StaffSelectStep from "@/Components/App/StaffSelectStep";
import Button from "@/Components/App/ui/Button";

function Index({
  csrf_token,
  cartItems,
  totalPrice,
  shippingAddresses,
  showBookingWidget,
  showShippingForm,
  vendorId,
}: any) {
  // ── Promo ──────────────────────────────────────────────────────────────────
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDetails, setPromoDetails] = useState<any>(null);

  // ── Shipping ───────────────────────────────────────────────────────────────
  const [selectedAddressId, setSelectedAddressId] = useState(
    shippingAddresses.find((a: any) => a.is_default)?.id ?? null,
  );

  // ── Staff ──────────────────────────────────────────────────────────────────
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(() => {
    const v = localStorage.getItem("selectedStaffId");
    return v ? parseInt(v, 10) : null;
  });
  const [selectedStaffName, setSelectedStaffName] = useState<string | null>(
    () => localStorage.getItem("selectedStaffName") || null,
  );






  const handleSelectStaff = (
    staffId: number | null,
    staffName: string | null = null,
  ) => {
    setSelectedStaffId(staffId);
    setSelectedStaffName(staffName);

    if (staffId !== null) {
      localStorage.setItem("selectedStaffId", String(staffId));
      if (staffName) {
        localStorage.setItem("selectedStaffName", staffName);
      } else {
        localStorage.removeItem("selectedStaffName");
      }
    } else {
      localStorage.removeItem("selectedStaffId");
      localStorage.removeItem("selectedStaffName");
    }
  };

  // ── Booking ────────────────────────────────────────────────────────────────
  const [bookingDate, setBookingDate] = useState(
    () => localStorage.getItem("bookingDate") || "",
  );
  const [date, setDate] = useState(new Date()); // ✅ an actual Date instance
  const [timeSlot, setTimeSlot] = useState(
    () => localStorage.getItem("timeSlot") || "",
  );
  const [bookingConfirmed, setBookingConfirmed] = useState(() => {
    const d = localStorage.getItem("bookingDate");
    const t = localStorage.getItem("timeSlot");
    return !!(d && t);
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(false);

  // ── Steps ──────────────────────────────────────────────────────────────────
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [step, setStep] = useState(() =>
    parseInt(localStorage.getItem("checkoutStep") || "1", 10),
  );
  const steps = ["Cart", "Booking", "Review"];
  useEffect(() => {
    localStorage.removeItem("bookingDate");
    localStorage.removeItem("timeSlot");
    localStorage.removeItem("checkoutStep");
    localStorage.removeItem("selectedStaffId");
    localStorage.removeItem("selectedStaffName");
    // deliberately run once on mount only, wiping anything left from a prior visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ── Loading ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);

  // ── Flash ──────────────────────────────────────────────────────────────────
  const { props } = usePage();
  const flash: any = (props as any).flash || {};
  useEffect(() => {
    if (flash.success) toast.success(flash.success);
    if (flash.error) toast.error(flash.error);
    // Show real checkout error if backend exposes it
    if (flash.checkout) toast.error(flash.checkout);
  }, [flash]);

  // ── Scroll step into view ──────────────────────────────────────────────────
  useEffect(() => {
    const ref = stepRefs.current[step - 1];
    if (ref)
      ref.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
  }, [step]);

  // const prevCartKeysRef = useRef<string>(JSON.stringify(Object.keys(cartItems).sort()));

  // useEffect(() => {
  //   const currentKeys = JSON.stringify(Object.keys(cartItems).sort());
  //   if (prevCartKeysRef.current !== currentKeys && hasAppointmentItems && step === 3) {
  //     setStep(2);
  //     toast.info("Cart updated — please review your booking.");
  //   }
  //   prevCartKeysRef.current = currentKeys;
  // }, [cartItems]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const hasAppointmentItems = Object.values(cartItems).some((group: any) => {
    const vt = group.user.vendor_type;
    if (!vt) return false;
    // handle both string and object (enum cast)
    return (typeof vt === "string" ? vt : vt?.value) === "appointment";
  });
  const totalBookingFee = bookingConfirmed
    ? Object.values(cartItems)
        .filter((g: any) => g.user.vendor_type === "appointment")
        .reduce(
          (sum: number, g: any) => sum + parseFloat(g.user.booking_fee || "0"),
          0,
        )
    : 0;

  const subtotalWithBooking = totalPrice + totalBookingFee;

  const allGiftCards = Object.values(cartItems)
    .flatMap((g: any) => g.items)
    .every((item: any) => item.is_gift_card === true);

  // ── Discounted total (pure — no side effects) ──────────────────────────────
  const getDiscountedTotal = (): number => {
    const base = bookingConfirmed ? subtotalWithBooking : totalPrice;
    if (!promoApplied || !promoDetails) return base;
    const discount = Number(promoDetails.discount_amount ?? 0);
    if (!Number.isFinite(discount) || discount <= 0) return base;
    return Math.max(0, base - discount);
  };

  // ── Promo toast (only on apply, not on every render) ──────────────────────
  const handleApplyPromo = async () => {
    if (promoApplied) {
      toast.error("A promo code is already applied. Remove it first.");
      return;
    }
    try {
      const orderTotal = bookingConfirmed ? subtotalWithBooking : totalPrice;

      const res = await fetch("/vouchers/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrf_token,
        },
        body: JSON.stringify({
          code: promoCode,
          order_total: orderTotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid code");
        return;
      }
      setPromoApplied(true);
      setPromoDetails(data);
      toast.success("Promo applied!");
    } catch {
      toast.error("Failed to apply promo");
    }
  };

  // ── Core fix: wrap Inertia router.post in a real Promise ───────────────────
  const postAsync = (url: string, data: Record<string, any>): Promise<void> =>
    new Promise((resolve, reject) => {
      router.post(url, data, {
        preserveScroll: true,
        onSuccess: () => resolve(),
        onError: (errors) => reject(new Error(JSON.stringify(errors))),
      });
    });

  // ── Checkout ───────────────────────────────────────────────────────────────

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    if (!allGiftCards && hasAppointmentItems && (!bookingDate || !timeSlot)) {
      toast.error("Please select a booking date and time before proceeding.");
      return;
    }

    setLoading(true);

    const primitiveVendorId = Array.isArray(vendorId) ? vendorId[0] : vendorId;

    // Step 1: Store booking
    if (!allGiftCards && bookingConfirmed) {
      try {
        await axios.post(route("bookings.store"), {
          booking_date: bookingDate,
          hasBooking: "1",
          hasShipping: showShippingForm ? "1" : "0",
          time_slot: timeSlot,
          vendor_id: primitiveVendorId,
          staff_id: selectedStaffId,
        });
      } catch (err: any) {
        console.error("Booking store failed:", err);
        toast.error("Could not save your booking. Please try again.");
        setLoading(false);
        return;
      }
    }

    // Step 2: Fire checkout
    router.post(
      route("cart.checkout"),
      {
        shipping_address_id: selectedAddressId ?? null,
        vendor_id: null,
        total_price: getDiscountedTotal(),
        voucher_id: promoDetails?.id ?? null,
      },
      {
        onError: (errors) => {
          const msg =
            Object.values(errors)[0] ?? "Checkout failed. Please try again.";
          toast.error(String(msg));
          setLoading(false);
        },
        onSuccess: () => {
          // Step 3: Clean up only after success
          [
            "bookingDate",
            "timeSlot",
            "checkoutStep",
            "selectedStaffId",
            "selectedStaffName",
          ].forEach((k) => localStorage.removeItem(k));
          setBookingDate("");
          setTimeSlot("");
          setBookingConfirmed(false);
          setSelectedStaffId(null);
          setSelectedStaffName(null);
          setStep(1);
          setLoading(false);
        },
      },
    );
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <AuthenticatedLayout>
      <ToastContainer position="top-right" autoClose={4000} />
      <Head title="Your Cart" />

      <style>{`
        .co-page {
          max-width: 860px;
          margin: 0 auto;
          padding: var(--space-3xl) var(--space-lg);
          font-family: var(--font-body);
        }

        /* Step indicator */
        .co-steps {
          display: flex;
          align-items: center;
          margin-bottom: var(--space-3xl);
          padding-bottom: var(--space-xl);
          border-bottom: 1px solid var(--color-border);
        }
        .co-step-btn {
          display: flex; align-items: center; gap: 10px;
          background: none; border: none; cursor: pointer; padding: 0;
        }
        .co-step-circle {
          width: 36px; height: 36px;
          border-radius: var(--radius-full);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display);
          font-size: 1rem; font-weight: 400;
          flex-shrink: 0;
          transition: all var(--transition-base);
        }
        .co-step-label {
          font-family: var(--font-body);
          font-size: var(--text-sm);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 400;
          white-space: nowrap;
        }
        .co-step-line {
          flex: 1; height: 1px;
          margin: 0 var(--space-md);
          transition: background var(--transition-base);
        }

        /* Sections */
        .co-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          padding: var(--space-xl);
        }
        .co-card-warm {
          background: var(--color-surface-warm);
          border: 1px solid var(--color-border);
          padding: var(--space-xl);
        }

        /* Order summary rows */
        .co-summary-row {
          display: flex; justify-content: space-between;
          padding: var(--space-sm) 0;
          border-bottom: 1px solid var(--color-border);
          font-family: var(--font-body);
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        /* Booking confirmed bar */
        .co-booking-bar {
          background: var(--color-surface-warm);
          border: 1px solid var(--color-border);
          padding: var(--space-lg) var(--space-xl);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-md);
        }

        /* Promo input */
        .co-promo-input {
          flex: 1;
          padding: 0.75rem 1rem;
          font-family: var(--font-body);
          font-size: var(--text-sm);
          color: var(--color-text);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          outline: none;
          transition: border-color var(--transition-fast);
        }
        .co-promo-input:focus { border-color: var(--color-primary); }

        /* Empty */
        .co-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 60vh; text-align: center; gap: var(--space-lg);
        }

        @media (max-width: 540px) {
          .co-page { padding: var(--space-xl) var(--space-md); }
          .co-step-label { display: none; }
        }
      `}</style>

      <div className="co-page">
        {Object.keys(cartItems).length > 0 ? (
          <>
            {/* ── Step Indicator ── */}
            <div className="co-steps">
              {steps.map((label, index) => {
                const stepIndex = index + 1;
                const isActive = step === stepIndex;
                const isDone = step > stepIndex;
                return (
                  <div
                    key={label}
                    ref={(el) => (stepRefs.current[index] = el)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flex: index < steps.length - 1 ? 1 : "none",
                    }}
                  >
                    <button
                      className="co-step-btn"
                      onClick={() => setStep(stepIndex)}
                    >
                      <span
                        className="co-step-circle"
                        style={{
                          border: `1px solid ${isActive ? "var(--color-primary)" : isDone ? "var(--color-accent)" : "var(--color-border)"}`,
                          background: isActive
                            ? "var(--color-primary)"
                            : isDone
                              ? "var(--color-accent)"
                              : "transparent",
                          color:
                            isActive || isDone
                              ? "var(--color-text-inverse)"
                              : "var(--color-text)",
                        }}
                      >
                        {isDone ? "✓" : stepIndex}
                      </span>
                      <span
                        className="co-step-label"
                        style={{
                          color: isActive
                            ? "var(--color-primary)"
                            : "var(--color-text-muted-light)",
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        {label}
                      </span>
                    </button>
                    {index < steps.length - 1 && (
                      <div
                        className="co-step-line"
                        style={{
                          background: isDone
                            ? "var(--color-accent)"
                            : "var(--color-border)",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ══════════════════ STEP 1: CART ══════════════════ */}
            {step === 1 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-xl)",
                }}
              >
                {Object.values(cartItems).map((group: any) => (
                  <div key={group.user.id}>
                    <h2
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-2xl)",
                        fontWeight: 400,
                        color: "var(--color-text)",
                        marginBottom: "var(--space-md)",
                        paddingBottom: "var(--space-sm)",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      {group.user.name}
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--space-sm)",
                      }}
                    >
                      {group.items.map((item: any) => (
                        <CartItem key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    paddingTop: "var(--space-md)",
                  }}
                >
                  <Button variant="primary" onClick={() => setStep(2)}>
                    Next: Booking →
                  </Button>
                </div>
              </div>
            )}

            {/* ══════════════════ STEP 2: BOOKING ══════════════════ */}
            {step === 2 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-xl)",
                }}
              >
                {hasAppointmentItems && (
                  <>
                    {Object.values(cartItems)
                      .filter((g: any) => g.user.vendor_type === "appointment")
                      .map((group: any) => (
                        <div
                          key={group.user.id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "var(--space-md)",
                          }}
                        >
                          {/* ── PHASE 1: Not yet confirmed → show Book button only ── */}
                          {!bookingConfirmed && (
                            <div className="co-card-warm">
                              {parseFloat(group.user.booking_fee || "0") >
                                0 && (
                                <p
                                  style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize: "var(--text-sm)",
                                    color: "var(--color-text-muted)",
                                    marginBottom: "var(--space-md)",
                                  }}
                                >
                                  A booking fee of{" "}
                                  <strong
                                    style={{ color: "var(--color-primary)" }}
                                  >
                                    $
                                    {parseFloat(
                                      group.user.booking_fee || "0",
                                    ).toFixed(2)}
                                  </strong>{" "}
                                  will be added to your subtotal.
                                </p>
                              )}
                              <Button
                                variant="accent"
                                size="sm"
                                onClick={() => {
                                  // setBookingConfirmed(true);
                                  setDialogOpen(true);
                                }}
                              >
                                Book Now
                              </Button>
                            </div>
                          )}

                          {/* ── PHASE 2: Confirmed → show staff selector ── */}
                          {bookingConfirmed && bookingDate && timeSlot && (
                            <div className="co-card">
                              <StaffSelectStep
                                vendorId={group.user.id}
                                date={bookingDate}
                                timeSlot={timeSlot}
                                selectedStaffId={selectedStaffId}
                                onSelect={handleSelectStaff}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                  </>
                )}

                {/* ── Booking summary bar (date + time + staff) ── */}
                {bookingConfirmed && bookingDate && timeSlot && (
                  <div className="co-booking-bar">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-xs)",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "var(--color-primary)",
                          marginBottom: "4px",
                        }}
                      >
                        Appointment Confirmed
                      </span>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        <strong style={{ color: "var(--color-text)" }}>
                          Date:
                        </strong>{" "}
                        {bookingDate}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        <strong style={{ color: "var(--color-text)" }}>
                          Time:
                        </strong>{" "}
                        {timeSlot}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        <strong style={{ color: "var(--color-text)" }}>
                          Staff:
                        </strong>{" "}
                        {selectedStaffName ||
                          "No preference — vendor will assign"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                      <button
                        onClick={() => setDialogOpen(true)}
                        style={{
                          background: "transparent",
                          color: "var(--color-primary)",
                          border: "1px solid var(--color-primary)",
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-xs)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "0.5rem 1.25rem",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setBookingConfirmed(false);
                          setBookingDate("");
                          setTimeSlot("");
                          setSelectedStaffId(null);
                          setSelectedStaffName(null);
                          localStorage.removeItem("bookingDate");
                          localStorage.removeItem("timeSlot");
                          localStorage.removeItem("selectedStaffId");
                          localStorage.removeItem("selectedStaffName");
                        }}
                        style={{
                          background: "transparent",
                          color: "var(--color-error)",
                          border: "1px solid var(--color-error)",
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-xs)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "0.5rem 1.25rem",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* BookingWidget dialog */}
                {showBookingWidget && (
                  <BookingWidget
                    bookingDate={bookingDate}
                    setBookingDate={setBookingDate}
                    timeSlot={timeSlot}
                    setTimeSlot={setTimeSlot}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    vendorId={
                      Array.isArray(vendorId) && vendorId.length > 0
                        ? vendorId[0]
                        : (vendorId ?? null)
                    }
                    onSubmit={(date: string, slot: string) => {
                      setBookingDate(date);
                      setTimeSlot(slot);
                      setBookingConfirmed(true);
                      setDialogOpen(false);
                      // Reset staff when date/time changes
                      setSelectedStaffId(null);
                      setSelectedStaffName(null);
                    }}
                  />
                )}

                {/* Subtotal */}
                <div
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-lg)",
                    color: "var(--color-text-muted)",
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "var(--space-lg)",
                  }}
                >
                  Subtotal:{" "}
                  <span
                    style={{
                      fontWeight: 500,
                      color: "var(--color-primary)",
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-xl)",
                    }}
                  >
                    <CurrencyFormatter
                      amount={
                        bookingConfirmed ? subtotalWithBooking : totalPrice
                      }
                      currency="AUD"
                    />
                  </span>
                </div>

                {/* Nav buttons */}
                <div style={{ display: "flex", gap: "var(--space-md)" }}>
                  <Button
                    variant="outline"
                    style={{ flex: 1 }}
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      if (
                        !allGiftCards &&
                        hasAppointmentItems &&
                        (!bookingDate || !timeSlot)
                      ) {
                        toast.error(
                          "Please select a booking date and time before proceeding.",
                        );
                        return;
                      }
                      setStep(3);
                    }}
                  >
                    Next: Review →
                  </Button>
                </div>
              </div>
            )}

            {/* ══════════════════ STEP 3: REVIEW ══════════════════ */}
            {step === 3 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-xl)",
                }}
              >
                {/* Promo code */}
                <div className="co-card-warm">
                  <label
                    style={{
                      display: "block",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-xs)",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-text-muted)",
                      marginBottom: "var(--space-sm)",
                    }}
                  >
                    Promo / Gift Code
                  </label>
                  <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                    <input
                      className="co-promo-input"
                      type="text"
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                    />
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={handleApplyPromo}
                    >
                      Apply
                    </Button>
                  </div>
                  {promoApplied && promoDetails && (
                    <p
                      style={{
                        marginTop: "var(--space-sm)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-success)",
                      }}
                    >
                      {promoDetails.type === "gift"
                        ? `Gift card applied — $${Number(promoDetails.remaining_amount ?? 0).toFixed(2)} remaining`
                        : promoDetails.discount_type === "percentage"
                          ? `Promo applied: ${promoDetails.amount}% off`
                          : `Promo applied: $${Number(promoDetails.amount).toFixed(2)} off`}
                    </p>
                  )}
                </div>

                {/* Order summary */}
                <div className="co-card">
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-xl)",
                      fontWeight: 400,
                      color: "var(--color-text)",
                      marginBottom: "var(--space-lg)",
                      paddingBottom: "var(--space-sm)",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    Order Summary
                  </h3>

                  {Object.values(cartItems).map((group: any) => (
                    <div
                      key={group.user.id}
                      style={{ marginBottom: "var(--space-lg)" }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-xs)",
                          fontWeight: 500,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--color-primary)",
                          marginBottom: "var(--space-sm)",
                        }}
                      >
                        {group.user.name}
                      </p>
                      {group.items.map((item: any) => (
                        <div className="co-summary-row" key={item.id}>
                          <span>
                            {item.title}{" "}
                            <span style={{ color: "var(--color-text)" }}>
                              × {item.quantity}
                            </span>
                          </span>
                          <span
                            style={{
                              color: "var(--color-text)",
                              fontWeight: 500,
                            }}
                          >
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Booking fee row */}
                  {bookingConfirmed && totalBookingFee > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "var(--space-sm) 0",
                        borderBottom: "1px solid var(--color-border)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      <span>Booking Fee</span>
                      <span
                        style={{ color: "var(--color-text)", fontWeight: 500 }}
                      >
                        ${totalBookingFee.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Discount row */}
                  {promoApplied &&
                    promoDetails &&
                    Number(promoDetails.discount_amount) > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "var(--space-sm) 0",
                          borderBottom: "1px solid var(--color-border)",
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-success)",
                        }}
                      >
                        <span>Discount</span>
                        <span>
                          −${Number(promoDetails.discount_amount).toFixed(2)}
                        </span>
                      </div>
                    )}

                  {/* Subtotal */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      paddingTop: "var(--space-md)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Subtotal
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-lg)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      <CurrencyFormatter
                        amount={
                          bookingConfirmed ? subtotalWithBooking : totalPrice
                        }
                        currency="AUD"
                      />
                    </span>
                  </div>

                  {/* Total */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginTop: "var(--space-md)",
                      paddingTop: "var(--space-md)",
                      borderTop: "2px solid var(--color-border-dark)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-xl)",
                        color: "var(--color-text)",
                      }}
                    >
                      Total
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-3xl)",
                        fontWeight: 300,
                        color: "var(--color-primary)",
                      }}
                    >
                      <CurrencyFormatter
                        amount={getDiscountedTotal()}
                        currency="AUD"
                      />
                    </span>
                  </div>
                </div>

                {/* Booking summary if confirmed */}
                {bookingConfirmed && bookingDate && timeSlot && (
                  <div
                    style={{
                      background: "rgba(45,80,22,0.04)",
                      border: "1px solid var(--color-primary)",
                      borderLeft: "3px solid var(--color-primary)",
                      padding: "var(--space-md) var(--space-lg)",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-muted)",
                      display: "flex",
                      gap: "var(--space-xl)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      <strong style={{ color: "var(--color-text)" }}>
                        Appointment:
                      </strong>{" "}
                      {bookingDate} at {timeSlot}
                    </span>
                    {selectedStaffName && (
                      <span>
                        <strong style={{ color: "var(--color-text)" }}>
                          Staff:
                        </strong>{" "}
                        {selectedStaffName}
                      </span>
                    )}
                  </div>
                )}

                {/* Nav buttons */}
                <div style={{ display: "flex", gap: "var(--space-md)" }}>
                  <Button
                    variant="outline"
                    style={{ flex: 1 }}
                    onClick={() => setStep(2)}
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCheckout}
                    disabled={loading}
                    style={{
                      flex: 2,
                      opacity: loading ? 0.8 : 1,
                    }}
                  >
                    {loading ? "Processing…" : "Confirm & Pay"}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Empty cart ── */
          <div className="co-empty">
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingCartIcon
                style={{
                  width: "36px",
                  height: "36px",
                  color: "var(--color-primary)",
                }}
              />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-3xl)",
                  fontWeight: 300,
                  color: "var(--color-text)",
                  marginBottom: "var(--space-sm)",
                }}
              >
                Your cart is empty
              </h2>
              <p
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "var(--text-base)",
                }}
              >
                Looks like you haven't added anything yet.
              </p>
            </div>
            <Link href="/shop" className="btn btn-primary btn-lg">
              Shop Now
            </Link>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

export default Index;
