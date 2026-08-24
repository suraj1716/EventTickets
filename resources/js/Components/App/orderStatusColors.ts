// resources/js/Components/App/orderStatusColors.ts
//
// Previously duplicated verbatim as a local `STATUS_COLORS` const in both
// Booking/BookingHistory.tsx and Order/OrdersHistory.tsx. One definition now.

export const ORDER_STATUS_COLORS: Record<string, string> = {
  paid: "var(--color-success, #3a7d44)",
  draft: "var(--color-warning, #c9a96e)",
  delivered: "var(--color-success, #3a7d44)",
  cancelled: "var(--color-error, #c0392b)",
  refunded: "var(--color-error, #c0392b)",
};

export function getOrderStatusColor(status: string): string {
  return ORDER_STATUS_COLORS[status] ?? "var(--color-text-muted)";
}
