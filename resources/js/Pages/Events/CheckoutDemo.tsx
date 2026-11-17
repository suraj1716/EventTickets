// resources/js/Pages/Events/CheckoutDemo.tsx
// Shows the REAL checkout order bar from Events/Show.tsx. Checkout opens
// automatically whenever tickets are in the cart, so we pre-fill the cart
// (same sessionStorage shape Show.tsx uses) with random quantities.
// "Confirm & pay" calls /events/{id}/cart — stubbed here so no real order or
// Stripe session is created.
import React from "react";
import EventShow from "./Show";
import { makeEventDetails } from "@/utils/demoEventData";

const EVENT_ID = 2;

export default function CheckoutDemo() {
  const [ready, setReady] = React.useState(false);
  const props = React.useMemo(() => makeEventDetails(2026, EVENT_ID, true), []);

  React.useLayoutEffect(() => {
    const leg = props.eventDetails.legs[0];
    const selection: Record<number, number> = {};
    leg.ticket_tiers.forEach((t: any, i: number) => (selection[t.id] = i === 2 ? 1 : i + 1));
    try {
      sessionStorage.setItem(
        `event-cart-${EVENT_ID}`,
        JSON.stringify({ activeLegId: leg.id, selection, productSelection: { 1: 1 }, selectedSeatIds: [] }),
      );
    } catch {}
    const realFetch = window.fetch.bind(window);
    window.fetch = ((input: any, init?: any) => {
      if (String(input).includes("/cart") || String(input).includes("events.cart.add")) {
        return Promise.resolve(
          new Response(JSON.stringify({ message: "Demo mode: payment is disabled." }), { status: 500, headers: { "Content-Type": "application/json" } }),
        );
      }
      return realFetch(input, init);
    }) as typeof window.fetch;
    setReady(true);
    return () => { window.fetch = realFetch; try { sessionStorage.removeItem(`event-cart-${EVENT_ID}`); } catch {} };
  }, [props]);

  return ready ? <EventShow event={props.event} eventDetails={props.eventDetails as any} /> : null;
}
