// resources/js/Pages/Staff/DoorSale.tsx

import { useMemo, useState } from "react";
import { Head, router, useForm } from '@inertiajs/react';
import type { Event, TicketTier } from "@/types";
import AdminLayout from "../Admin/AdminLayout";

interface Props {
  events: Event[];
}

type Selection = Record<number, number>;

export default function DoorSale({ events }: Props) {
 const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
const [submitError, setSubmitError] = useState<Record<string, string>>({});
const [submitting, setSubmitting] = useState(false);
  const event = events.find((item) => item.id === selectedEventId) ?? null;

  const legs = event?.legs ?? [];

  const [activeLegId, setActiveLegId] = useState<number | undefined>(
    event?.legs?.[0]?.id,
  );

  const [selection, setSelection] = useState<Selection>({});

const { data, setData, post, processing, errors, reset } = useForm<{
  event_id: number | '';
  buyer_name: string;
  buyer_email: string;
  lines: {
    ticket_tier_id: number;
    quantity: number;
  }[];
}>({
  event_id: '',
  buyer_name: '',
  buyer_email: '',
  lines: [],
});

  function changeEvent(eventId: number) {
    setSelectedEventId(eventId);

    const nextEvent = events.find((item) => item.id === eventId);

    setActiveLegId(nextEvent?.legs?.[0]?.id);
    setSelection({});

    setData("event_id", eventId);
    setData("lines", []);
  }

  const activeLeg = legs.find((leg) => leg.id === activeLegId) ?? legs[0];

  function changeQty(tier: TicketTier, delta: number) {
    setSelection((prev) => {
      const current = prev[tier.id] ?? 0;
      const next = current + delta;

      if (next < 0 || next > tier.remaining) {
        return prev;
      }

      return {
        ...prev,
        [tier.id]: next,
      };
    });
  }

  const { total, ticketCount } = useMemo(() => {
    let total = 0;
    let ticketCount = 0;

    if (!event) {
      return { total, ticketCount };
    }

    for (const leg of event.legs ?? []) {
      for (const tier of leg.ticket_tiers ?? []) {
        const qty = selection[tier.id] ?? 0;

        total += parseFloat(tier.price) * qty;
        ticketCount += qty;
      }
    }

    return { total, ticketCount };
  }, [selection, event]);

function submit() {
  if (!event) return;

  const lines = Object.entries(selection)
    .filter(([, quantity]) => quantity > 0)
    .map(([ticket_tier_id, quantity]) => ({
      ticket_tier_id: Number(ticket_tier_id),
      quantity: Number(quantity),
    }));

  if (lines.length === 0) {
    console.log('No ticket lines selected');
    return;
  }

  const payload = {
    event_id: Number(event.id),
    buyer_name: data.buyer_name,
    buyer_email: data.buyer_email,
    lines,
  };

  console.log('DOOR SALE PAYLOAD', payload);

  router.post(
    route('staff.door-sale.store'),
    payload,
    {
      preserveScroll: true,

      onSuccess: () => {
        setSelection({});
        reset('buyer_name', 'buyer_email');
      },

      onError: (errors) => {
        console.error('DOOR SALE ERRORS', errors);
      },
    }
  );
}

  return (
    <AdminLayout>
      <Head title={event ? `Door sale — ${event.name}` : "Walk-in Order"} />

      <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
        Staff
      </p>

      <h1 className="text-2xl font-semibold text-white mb-6">Walk-in Order</h1>

      {/* Event */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-5">
        <label className="block text-sm text-neutral-400 mb-1.5">Event</label>

        <select
          value={selectedEventId}
          onChange={(e) => {
            const id = Number(e.target.value);

            if (id) {
              changeEvent(id);
            }
          }}
          className={inputClass}
        >
          <option value="">Select an event</option>

          {events.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {!event ? (
        <div className="border border-neutral-800 rounded-xl bg-neutral-900/50 p-10 text-center text-neutral-500">
          Select an event to continue.
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-white mb-4">
            {event.name}
          </h2>

          {/* Legs */}
          {legs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
              {legs.map((leg) => (
                <button
                  key={leg.id}
                  type="button"
                  onClick={() => {
                    setActiveLegId(leg.id);
                    setSelection({});
                  }}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm transition-colors ${
                    leg.id === activeLegId
                      ? "bg-white text-black"
                      : "border border-neutral-700 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {leg.venue_name}
                </button>
              ))}
            </div>
          )}

          {/* Ticket tiers */}
          <div className="space-y-2.5 mb-6">
            {(activeLeg?.ticket_tiers ?? []).map((tier) => {
              const soldOut = tier.remaining <= 0;
              const qty = selection[tier.id] ?? 0;

              return (
                <div
                  key={tier.id}
                  className={`bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 ${
                    soldOut ? "opacity-55" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-white text-sm">
                      {tier.name}
                    </p>

                    <p className="text-sm text-neutral-400 mt-0.5">
                      ${parseFloat(tier.price).toFixed(2)} ·{" "}
                      {soldOut ? "Sold out" : `${tier.remaining} left`}
                    </p>
                  </div>

                  {!soldOut && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => changeQty(tier, -1)}
                        disabled={qty === 0}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-700 text-neutral-300 disabled:opacity-30 hover:bg-neutral-800"
                      >
                        −
                      </button>

                      <span className="min-w-[16px] text-center text-sm text-white">
                        {qty}
                      </span>

                      <button
                        type="button"
                        onClick={() => changeQty(tier, 1)}
                        disabled={qty >= tier.remaining}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Buyer */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 mb-6">
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5">
                Buyer name
              </label>

              <input
                type="text"
                value={data.buyer_name}
                onChange={(e) => setData("buyer_name", e.target.value)}
                className={inputClass}
              />

              {errors.buyer_name && (
                <p className="text-xs text-red-400 mt-1">{errors.buyer_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-1.5">
                Buyer email
              </label>

              <input
                type="email"
                value={data.buyer_email}
                onChange={(e) => setData("buyer_email", e.target.value)}
                className={inputClass}
              />

              {errors.buyer_email && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.buyer_email}
                </p>
              )}
            </div>

            <p className="text-xs text-neutral-500">
              Cash sale — confirm you've received payment before submitting.
            </p>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
            <div>
              <p className="text-sm text-neutral-400 mb-0.5">Total</p>

              <p className="text-xl font-semibold text-white">
                ${total.toFixed(2)}
              </p>
            </div>

          <button
  type="button"
  onClick={submit}
  disabled={
    ticketCount === 0 ||
    !data.buyer_name.trim() ||
    !data.buyer_email.trim()
  }
  className="bg-white text-black text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40"
>
  Confirm sale · {ticketCount}{' '}
  {ticketCount === 1 ? 'ticket' : 'tickets'}
</button>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

const inputClass =
  "w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600";
