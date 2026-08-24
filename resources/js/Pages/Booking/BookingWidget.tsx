import { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as Dialog from "@radix-ui/react-dialog";
import { DayPicker, Matcher } from "react-day-picker";
import "react-day-picker/dist/style.css";
import dayjs from "dayjs";
import AvailableSlots from "../AvailableSlots";
import Button from "@/Components/App/ui/Button";
import IconButton from "@/Components/App/ui/IconButton";

type BookingWidgetProps = {
  bookingDate: string;
  setBookingDate: (date: string) => void;
  timeSlot: string;
  setTimeSlot: (slot: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId?: number | null;
  onSubmit: (date: string, slot: string) => void;
};

export default function BookingWidget({
  bookingDate,
  setBookingDate,
  timeSlot,
  setTimeSlot,
  open,
  onOpenChange,
  vendorId,
  onSubmit,
}: BookingWidgetProps) {
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closedDates, setClosedDates] = useState<string[]>([]);
  const [recurringClosedDays, setRecurringClosedDays] = useState<number[]>([]);

 const prevBookingDateRef = useRef(bookingDate);

useEffect(() => {
  if (!bookingDate) {
    setAvailableTimeSlots([]);
    setTimeSlot("");
    prevBookingDateRef.current = bookingDate;
    return;
  }

  const dateActuallyChanged = prevBookingDateRef.current !== bookingDate;

  async function fetchTimeSlots() {
    setLoadingSlots(true);
    setError(null);
    if (dateActuallyChanged) {
      setTimeSlot(""); // only clear if the user picked a different date, not on remount
    }
    try {
      const response = await axios.get(`/booking/available-slots`, {
        params: { date: bookingDate, vendorId },
      });
      const { availableSlots, message, closedDates, recurringClosedDays } = response.data;
      setAvailableTimeSlots(Array.isArray(availableSlots) ? availableSlots : []);
      if (closedDates && Array.isArray(closedDates)) setClosedDates(closedDates);
      if (recurringClosedDays && Array.isArray(recurringClosedDays))
        setRecurringClosedDays(recurringClosedDays.map(Number));
      if (message && message.toLowerCase().includes("error")) setError(message);
      else setError(null);
    } catch {
      setError("Failed to load time slots.");
      setAvailableTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  fetchTimeSlots();
  prevBookingDateRef.current = bookingDate;
}, [bookingDate, vendorId]);

  const closedDatesAsDateObjects = closedDates.map((d) => new Date(d));
  const disabledDays: Matcher[] = [
    { before: new Date() },
    ...(recurringClosedDays.length > 0 ? [{ dayOfWeek: recurringClosedDays }] : []),
    ...closedDatesAsDateObjects,
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
      <Dialog.Overlay
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--color-overlay)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 9998,
        }}
      />
      <Dialog.Content
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-xl)",
          padding: 0,
          maxWidth: "520px",
          width: "calc(100vw - 32px)",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 0,
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "var(--space-xl) var(--space-xl) var(--space-lg)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <Dialog.Title
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-2xl)",
              fontWeight: 400,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            Book an Appointment
          </Dialog.Title>
          <IconButton
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            tone="dark"
            size={32}
            style={{ fontSize: "1.1rem", border: "none", background: "none" }}
          >
            ✕
          </IconButton>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "var(--space-xl)" }}>

          {/* Date Picker */}
          <div style={{ marginBottom: "var(--space-xl)" }}>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
                marginBottom: "var(--space-md)",
              }}
            >
              Select Date
            </label>
            <div
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-warm)",
                display: "inline-block",
              }}
            >
              <style>{`
                .rdp {
                  --rdp-accent-color: var(--color-primary) !important;
                  --rdp-background-color: var(--color-bg-alt) !important;
                  margin: 0;
                  padding: 12px;
                  font-family: var(--font-body);
                  font-size: 0.85rem;
                }
                .rdp-day_selected, .rdp-day_selected:hover {
                  background: var(--color-primary) !important;
                  color: var(--color-text-inverse) !important;
                }
                .rdp-button:hover:not([disabled]) {
                  background: var(--color-bg-alt) !important;
                }
                .rdp-day_today:not(.rdp-day_selected) {
                  color: var(--color-accent-dark);
                  font-weight: 600;
                }
                .rdp-caption_label {
                  font-family: var(--font-display) !important;
                  font-size: 1rem !important;
                  font-weight: 400 !important;
                  color: var(--color-text) !important;
                }
                .rdp-nav_button {
                  border: 1px solid var(--color-border) !important;
                  border-radius: 0 !important;
                }
              `}</style>
              <DayPicker
                mode="single"
                selected={bookingDate ? new Date(bookingDate) : undefined}
                onSelect={(date) =>
                  setBookingDate(date ? dayjs(date).format("YYYY-MM-DD") : "")
                }
                disabled={disabledDays}
              />
            </div>
          </div>

          {/* Time Slots */}
          <div style={{ marginBottom: "var(--space-xl)" }}>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-xs)",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
                marginBottom: "var(--space-md)",
              }}
            >
              Select Time Slot
            </label>

            {!bookingDate ? (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-light)",
                  fontStyle: "italic",
                }}
              >
                Please select a date first.
              </p>
            ) : loadingSlots ? (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid var(--color-border)",
                    borderTopColor: "var(--color-primary)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  Loading available slots…
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : error ? (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>
                {error}
              </p>
            ) : availableTimeSlots.length > 0 ? (
              <AvailableSlots
                date={bookingDate}
                availableSlots={availableTimeSlots}
                selectedSlot={timeSlot}
                onSelect={(slot) => {
                  setTimeSlot(slot);
                  // onOpenChange(false);
                }}
              />
            ) : (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-light)", fontStyle: "italic" }}>
                No available slots for this date.
              </p>
            )}
          </div>

          {/* Selected summary */}
          {bookingDate && timeSlot && (
            <div
              style={{
                background: "var(--color-surface-warm)",
                border: "1px solid var(--color-border)",
                padding: "var(--space-md) var(--space-lg)",
                marginBottom: "var(--space-xl)",
                display: "flex",
                gap: "var(--space-xl)",
              }}
            >
              <div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-light)", display: "block", marginBottom: "2px" }}>Date</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", color: "var(--color-text)" }}>
                  {dayjs(bookingDate).format("D MMM YYYY")}
                </span>
              </div>
              <div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-light)", display: "block", marginBottom: "2px" }}>Time</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", color: "var(--color-text)" }}>
                  {timeSlot}
                </span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <Button
              variant="danger"
              style={{ flex: 1 }}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              style={{ flex: 2 }}
              onClick={() => onSubmit(bookingDate, timeSlot)}
              disabled={!bookingDate || !timeSlot}
            >
              Confirm Booking
            </Button>
          </div>
        </div>
      </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
