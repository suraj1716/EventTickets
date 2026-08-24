// resources/js/Components/App/ui/OrderStatusBadge.tsx
//
// Two small pieces previously duplicated verbatim in both
// Booking/BookingHistory.tsx and Order/OrdersHistory.tsx:
//   - TimelineDot: the colored ring marker on the vertical timeline spine
//   - OrderStatusBadge: the small dot + uppercase status label inline badge

import React from "react";
import { getOrderStatusColor } from "@/Components/App/orderStatusColors";

export function TimelineDot({ status }: { status: string }) {
  const color = getOrderStatusColor(status);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 6,
        width: 15,
        height: 15,
        borderRadius: "50%",
        background: "var(--color-surface)",
        border: `2px solid ${color}`,
        boxShadow: "0 0 0 4px var(--color-bg)",
      }}
    />
  );
}

export default function OrderStatusBadge({ status }: { status: string }) {
  const color = getOrderStatusColor(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-body)",
        fontSize: "10px",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      {status}
    </span>
  );
}
