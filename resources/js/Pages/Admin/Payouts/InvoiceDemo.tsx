// resources/js/Pages/Admin/Payouts/InvoiceDemo.tsx
// Renders your REAL Payouts/Invoice.tsx with randomly generated payout data,
// so the layout, columns, grouping, timeline and print CSS are identical.
import React from "react";
import PayoutInvoice from "./Invoice";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fee settings — change these to try different percent systems.
const PLATFORM_PCT = 10; // website_payment_comission = % of gross
const STRIPE_PCT = 1.75; // online_payment_comission = % of card paid
const STRIPE_FIXED = 0.3; // + fixed per charge (AUD)

const EVENTS = [
  { id: 1, name: "Sunset Sessions", tiers: ["GA", "VIP", "Early Bird"] },
  { id: 2, name: "Harbour Lights Festival", tiers: ["GA", "Premium"] },
  { id: 3, name: "Stand-Up Showdown", tiers: ["Standard", "Front Row"] },
  { id: 4, name: "Jazz in the Gardens", tiers: ["Lawn", "Table"] },
];
const CUSTOMERS = ["Olivia Chen", "Liam Walker", "Mia Patel", "Noah Smith", "Ava Nguyen", "Jack Thompson", "Isla Brown", "Ethan Lee", "Grace Wilson", "Lucas Martin"];

export function makeRandomPayoutInvoice(seed: number) {
  const r = rng(seed);
  const rand = (a: number, b: number) => a + r() * (b - a);
  const int = (a: number, b: number) => Math.round(rand(a, b));
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const iso = (daysAgo: number, hour = 10) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - daysAgo);
    d.setUTCHours(hour, int(0, 59), 0, 0);
    return d.toISOString();
  };

  let orderId = 1000 + int(0, 500);
  const chosen = EVENTS.slice(0, int(2, 4));

  const eventGroups = chosen.map((ev) => {
    const orders = Array.from({ length: int(3, 7) }, () => {
      const qty = int(1, 4);
      const tierName = ev.tiers[Math.floor(r() * ev.tiers.length)];
      const unit = int(35, 140);
      const gross = unit * qty;
      const voucher = r() < 0.25 ? Math.min(gross, int(10, 60)) : 0;
      const card = gross - voucher;
      const stripeFee = round2((card * STRIPE_PCT) / 100 + STRIPE_FIXED);
      const platformFee = round2((gross * PLATFORM_PCT) / 100);
      const vendorSubtotal = round2(gross - stripeFee - platformFee);
      const placedDaysAgo = int(8, 28);
      const refundAmount = r() < 0.12 ? round2(vendorSubtotal * rand(0.3, 1)) : 0;

      return {
        id: orderId++,
        created_at: iso(placedDaysAgo),
        total_price: card,
        voucher_discount: voucher || null,
        stripe_amount: card,
        online_payment_comission: stripeFee,
        website_payment_comission: platformFee,
        vendor_subtotal: vendorSubtotal,
        paid_at: iso(placedDaysAgo, 11),
        fees_calculated_at: iso(placedDaysAgo - 1, 3),
        paid_out_at: iso(2, 9),
        refunded_at: refundAmount ? iso(placedDaysAgo - 3) : null,
        refund_amount: refundAmount || null,
        payment_method: "card",
        user: { id: int(1, 999), name: CUSTOMERS[Math.floor(r() * CUSTOMERS.length)], email: "buyer@example.com" },
        refunds: refundAmount
          ? [{ id: orderId + 5000, type: "custom", amount: refundAmount, reason: "Customer request", is_marker: false, created_at: iso(placedDaysAgo - 3) }]
          : [],
        order_items: [
          {
            id: orderId + 9000,
            quantity: qty,
            ticket_tier: { id: ev.id * 10, name: tierName, event_leg: { event: { id: ev.id, name: ev.name } } },
            product: null,
          },
        ],
      };
    });

    const net = (o: any) => Math.max(0, o.vendor_subtotal - (o.refund_amount ?? 0));
    return {
      key: `event:${ev.id}`,
      event_id: ev.id,
      event_name: ev.name,
      order_count: orders.length,
      vendor_net: round2(orders.reduce((a, o) => a + net(o), 0)),
      orders,
    };
  });

  const amount = round2(eventGroups.reduce((a, g) => a + g.vendor_net, 0));

  const payout = {
    id: int(20, 400),
    vendor: {
      user_id: 7,
      store_name: "Harbour Live Co",
      store_address: "12 Circular Quay West, Sydney NSW 2000",
      user: { name: "Harbour Live", email: "accounts@harbourlive.example" },
    },
    amount,
    starting_from: iso(30).slice(0, 10),
    until: iso(7).slice(0, 10),
    created_at: iso(1),
    orders: eventGroups.flatMap((g) => g.orders),
  };

  return { payout, eventGroups };
}

export default function PayoutInvoiceDemo() {
  const [seed, setSeed] = React.useState(2026);
  const data = React.useMemo(() => makeRandomPayoutInvoice(seed), [seed]);

  return (
    <>
      <PayoutInvoice payout={data.payout as any} eventGroups={data.eventGroups as any} isAdmin />
      <button
        className="no-print"
        onClick={() => setSeed((s) => s + 1)}
        style={{
          position: "fixed", left: 20, bottom: 20, zIndex: 50, padding: "8px 14px",
          background: "#FFB627", color: "#0B0B10", border: 0, borderRadius: 8,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
        }}
      >
        Randomise data
      </button>
    </>
  );
}
