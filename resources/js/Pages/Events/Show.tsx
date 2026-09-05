// resources/js/Pages/Events/Show.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import type { Event, EventLeg, TicketTier } from "@/types";
import HeroMediaSlider from "@/Components/HeroMediaSlider";
import React from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

/*
|--------------------------------------------------------------------------
| Local Product type
|--------------------------------------------------------------------------
| You do NOT currently have Product in @/types, so we keep this local.
|--------------------------------------------------------------------------
*/

interface Product {
  id: number;
  event_id: number | null;
  title: string;
  slug: string;
  description: string | null;
  price: string;
  status: string;
  highlight: string | null;
  quantity: number | null;
  image_url?: string | null;
}

/*
|--------------------------------------------------------------------------
| Page props
|--------------------------------------------------------------------------
*/

interface Props {
  event: Event;
  relatedEvents?: Event[];
  products?: Product[];
}

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type Selection = Record<number, number>;

type ProductSelection = Record<number, number>;

type Seat = NonNullable<EventLeg["seats"]>[number];

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const EASE = [0.16, 1, 0.3, 1] as const;

const SEAT_TIER_COLORS = ["#FFB627", "#8B6BFF", "#FF6F91", "#4FD1C5"];

/*
|--------------------------------------------------------------------------
| Animation variants
|--------------------------------------------------------------------------
*/

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const rowVariants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: EASE,
    },
  },
};

const railVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const railCardVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: EASE,
    },
  },
};

/*
|--------------------------------------------------------------------------
| Main component
|--------------------------------------------------------------------------
*/

export default function EventShow({
  event,
  relatedEvents = [],
  products = [],
}: Props) {
  /*
  |--------------------------------------------------------------------------
  | Event legs
  |--------------------------------------------------------------------------
  */

  const legs = event.legs ?? [];

  const isTour = event.type === "tour" && legs.length > 1;
  const CART_STORAGE_KEY = `event-cart-${event.id}`;

  function loadStoredCart() {
    try {
      const raw = sessionStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  const storedCart = loadStoredCart();
  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [activeLegId, setActiveLegId] = useState<number | undefined>(
    storedCart?.activeLegId ?? legs[0]?.id,
  );

  const { existingTicketSelection, existingProductSelection } = usePage()
    .props as unknown as {
    existingTicketSelection: Record<number, number>;
    existingProductSelection: Record<number, number>;
  };

  const [selection, setSelection] = useState<Record<number, number>>(
    storedCart?.selection ?? existingTicketSelection ?? {},
  );
  const [productSelection, setProductSelection] = useState<
    Record<number, number>
  >(storedCart?.productSelection ?? existingProductSelection ?? {});
  const [showSummary, setShowSummary] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>(
    storedCart?.selectedSeatIds ?? [],
  );

  const [joiningWatchlist, setJoiningWatchlist] = useState(false);

  const [watchlistEmail, setWatchlistEmail] = useState("");

  function buildLines() {
    const ticketLines = isReserved
      ? Array.from(
          selectedSeatIds
            .reduce((map, seatId) => {
              const seat = seatLookup.get(seatId);
              if (!seat || seat.ticket_tier_id == null) return map;
              const entry = map.get(seat.ticket_tier_id) ?? {
                ticket_tier_id: seat.ticket_tier_id,
                quantity: 0,
                seat_ids: [] as number[],
              };
              entry.quantity += 1;
              entry.seat_ids.push(seatId);
              map.set(seat.ticket_tier_id, entry);
              return map;
            }, new Map<number, { ticket_tier_id: number; quantity: number; seat_ids: number[] }>())
            .values(),
        )
      : Object.entries(selection)
          .filter(([, qty]) => qty > 0)
          .map(([ticket_tier_id, quantity]) => ({
            ticket_tier_id: Number(ticket_tier_id),
            quantity,
          }));

    const productLines = Object.entries(productSelection)
      .filter(([, qty]) => qty > 0)
      .map(([product_id, quantity]) => ({
        product_id: Number(product_id),
        quantity,
      }));

    return { ticketLines, productLines };
  }

  /*
  |--------------------------------------------------------------------------
  | Active leg
  |--------------------------------------------------------------------------
  */

  const activeLeg = legs.find((leg) => leg.id === activeLegId) ?? legs[0];

  /*
  |--------------------------------------------------------------------------
  | Reserved seating
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Reserved status is based on actual seats.
  |
  */

  const isReserved = (activeLeg?.seats?.length ?? 0) > 0;

  /*
  |--------------------------------------------------------------------------
  | Select event leg
  |--------------------------------------------------------------------------
  */

  function selectLeg(legId: number) {
    setActiveLegId(legId);
    setSelection({});
    setSelectedSeatIds([]); // was: setSelectedSeatIds({})
  }

  /*
  |--------------------------------------------------------------------------
  | Ticket quantity
  |--------------------------------------------------------------------------
  */

  function changeQty(tier: TicketTier, delta: number) {
    setSelection((prev) => {
      const current = prev[tier.id] ?? 0;

      const next = current + delta;

      if (next < 0) {
        return prev;
      }

      if (next > tier.remaining) {
        return prev;
      }

      return {
        ...prev,
        [tier.id]: next,
      };
    });
  }
  function removeTicketLine(tierId: number) {
    setSelection((prev) => {
      const next = { ...prev };
      delete next[tierId];
      return next;
    });
  }

  function removeSeat(seatId: number) {
    setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
  }

  function removeProductLine(productId: number) {
    setProductSelection((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }
  /*
  |--------------------------------------------------------------------------
  | Seat selection
  |--------------------------------------------------------------------------
  */

  function toggleSeat(seat: Seat) {
    if (seat.status !== "available" || seat.ticket_tier_id == null) {
      return;
    }

    setSelectedSeatIds((prev) =>
      prev.includes(seat.id)
        ? prev.filter((id) => id !== seat.id)
        : [...prev, seat.id],
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Product quantity
  |--------------------------------------------------------------------------
  */

  function changeProductQty(product: Product, delta: number) {
    setProductSelection((prev) => {
      const current = prev[product.id] ?? 0;

      const next = current + delta;

      if (next < 0) {
        return prev;
      }

      /*
      | If product has a quantity limit,
      | do not allow more than available.
      */

      if (product.quantity !== null && next > product.quantity) {
        return prev;
      }

      return {
        ...prev,
        [product.id]: next,
      };
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Seat lookup
  |--------------------------------------------------------------------------
  */

  const seatLookup = useMemo(() => {
    const map = new Map<number, Seat>();

    activeLeg?.seats?.forEach((seat) => {
      map.set(seat.id, seat);
    });

    return map;
  }, [activeLeg]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({
          activeLegId,
          selection,
          productSelection,
          selectedSeatIds,
        }),
      );
    } catch {
      // sessionStorage unavailable (private mode, etc.) — fail silently
    }
  }, [activeLegId, selection, productSelection, selectedSeatIds]);

  // CHECKPOINT 0b — confirm seatLookup contents at render time
  useEffect(() => {
    console.log(
      "CHECKPOINT 0b - seatLookup size",
      seatLookup.size,
      "sample:",
      Array.from(seatLookup.entries()).slice(0, 5),
    );
  }, [seatLookup]);
  /*
  |--------------------------------------------------------------------------
  | Ticket tier lookup
  |--------------------------------------------------------------------------
  */

  const tierLookup = useMemo(() => {
    const map = new Map<number, TicketTier>();

    activeLeg?.ticket_tiers?.forEach((tier) => {
      map.set(tier.id, tier);
    });

    return map;
  }, [activeLeg]);

  /*
  |--------------------------------------------------------------------------
  | Calculate complete order
  |--------------------------------------------------------------------------
  */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutStage, setCheckoutStage] = useState<"summary" | "payment">(
    "summary",
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const stripePromiseRef = useRef<Promise<Stripe | null> | null>(null);
  async function confirmAndPay() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setPaymentError(null);

    const { ticketLines, productLines } = buildLines();

    try {
      const csrf =
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
          ?.content ?? "";

      const res = await fetch(route("events.cart.add", event.id), {
        method: "POST",
         credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-TOKEN": csrf,
        },
        body: JSON.stringify({
          event_id: event.id,
          ticket_lines: ticketLines,
          product_lines: productLines,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.message ?? "Couldn't start checkout. Please try again.",
        );
      }

      const data = await res.json();

      if (data.orderComplete) {
        // fully covered without Stripe (credit, free ticket, etc.)
        router.visit(route("stripe.success"));
        return;
      }

      if (!stripePromiseRef.current) {
        stripePromiseRef.current = loadStripe(data.stripeKey);
      }

      setClientSecret(data.clientSecret);
      setCheckoutStage("payment");
    } catch (err) {
      setPaymentError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const { ticketTotal, merchTotal, total, ticketCount, merchCount } =
    useMemo(() => {
      let ticketTotal = 0;
      let merchTotal = 0;

      let ticketCount = 0;
      let merchCount = 0;

      /*
    |--------------------------------------------------------------------------
    | General admission tickets
    |--------------------------------------------------------------------------
    */

      if (!isReserved) {
        for (const tier of activeLeg?.ticket_tiers ?? []) {
          const qty = selection[tier.id] ?? 0;

          ticketTotal += parseFloat(tier.price) * qty;

          ticketCount += qty;
        }
      }

      /*
    |--------------------------------------------------------------------------
    | Reserved seats
    |--------------------------------------------------------------------------
    */

      if (isReserved) {
        for (const seatId of selectedSeatIds) {
          const seat = seatLookup.get(seatId);

          if (!seat || seat.ticket_tier_id == null) {
            continue;
          }

          const tier = tierLookup.get(seat.ticket_tier_id);

          if (!tier) {
            continue;
          }

          ticketTotal += parseFloat(tier.price);

          ticketCount += 1;
        }
      }

      /*
    |--------------------------------------------------------------------------
    | Merchandise
    |--------------------------------------------------------------------------
    */

      for (const product of products) {
        const qty = productSelection[product.id] ?? 0;

        merchTotal += parseFloat(product.price) * qty;

        merchCount += qty;
      }

      return {
        ticketTotal,
        merchTotal,
        total: ticketTotal + merchTotal,
        ticketCount,
        merchCount,
      };
    }, [
      activeLeg,
      isReserved,
      selection,
      selectedSeatIds,
      seatLookup,
      tierLookup,
      products,
      productSelection,
    ]);
  useEffect(() => {
    setShowSummary(ticketCount > 0 || merchCount > 0);
  }, [ticketCount, merchCount]);
  /*
  |--------------------------------------------------------------------------
  | Ticket tier status
  |--------------------------------------------------------------------------
  */

  function tierStatus(
    tier: TicketTier,
  ): "open" | "upcoming" | "closed" | "sold_out" {
    if (tier.remaining <= 0) {
      return "sold_out";
    }

    const now = new Date();

    if (now < new Date(tier.starts_at)) {
      return "upcoming";
    }

    if (now > new Date(tier.ends_at)) {
      return "closed";
    }

    return "open";
  }

  /*
  |--------------------------------------------------------------------------
  | Checkout
  |--------------------------------------------------------------------------
  |
  | Sends tickets AND merchandise together.
  |--------------------------------------------------------------------------
  */

  /*
  |--------------------------------------------------------------------------
  | Watchlist
  |--------------------------------------------------------------------------
  */

  function handleJoinWatchlist() {
    if (!watchlistEmail.trim()) {
      return;
    }

    setJoiningWatchlist(true);

    router.post(
      route("events.watchlist.store", event.id),
      {
        email: watchlistEmail,
      },
      {
        preserveScroll: true,

        onFinish: () => setJoiningWatchlist(false),

        onSuccess: () => setWatchlistEmail(""),
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Misc
  |--------------------------------------------------------------------------
  */

  const isProposedOnly = event.status === "proposed";

  const categoryNames =
    event.categories?.map((category) => category.name) ?? [];

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <AuthenticatedLayout>
      <Head title={event.name}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />

        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen bg-[#0B0B10] text-[#F7F5F2] font-['Manrope'] pb-32">
        {/* =========================================================
            HERO
        ========================================================= */}

        <section className="relative h-[380px] sm:h-[460px] w-full overflow-hidden border-b border-[#26232E]">
          {event.media && event.media.length > 0 ? (
            <HeroMediaSlider media={event.media} eventName={event.name} />
          ) : event.image_url ? (
            <motion.img
              src={event.image_url}
              alt={event.name}
              initial={{
                scale: 1.08,
              }}
              animate={{
                scale: 1,
              }}
              transition={{
                duration: 1.4,
                ease: EASE,
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1D1B24] via-[#15141B] to-[#0B0B10]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,182,39,0.14),transparent_35%),radial-gradient(circle_at_80%_75%,rgba(139,107,255,0.14),transparent_32%)]" />

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-['Anton'] text-7xl uppercase text-white/5 select-none">
                  Live
                </span>
              </div>
            </div>
          )}

      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0B0B10] via-[#0B0B10]/50 to-transparent pointer-events-none" />

<Link
  href={route("events.index")}
  className="absolute top-5 left-4 sm:left-6 lg:left-8 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 backdrop-blur px-3 py-1.5 text-xs text-white/80 hover:text-white hover:border-white/30 transition-colors"
>
  <svg
    className="w-3.5 h-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
  Back to events
</Link>

          <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-8">
            <motion.p
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.4,
              }}
              className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.3em] mb-3 flex items-center gap-2"
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  isProposedOnly ? "bg-[#8B6BFF]" : "bg-[#FFB627]"
                }`}
              />

              <span
                className={isProposedOnly ? "text-[#B7A7FF]" : "text-[#FFB627]"}
              >
                {isProposedOnly ? "Proposed event" : "Live event"}
              </span>
            </motion.p>

            <motion.h1
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
                delay: 0.05,
                ease: EASE,
              }}
              className="font-['Anton'] uppercase leading-[0.9] text-4xl sm:text-5xl lg:text-6xl tracking-tight max-w-3xl text-white"
            >
              {event.name}
            </motion.h1>

            {event.artists && event.artists.length > 0 && (
              <motion.p
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
                }}
                className="text-base text-[#D8D5DE] mt-3"
              >
                Featuring{" "}
                {event.artists.map((artist) => artist.name).join(", ")}
              </motion.p>
            )}

            {activeLeg && (
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
                  delay: 0.15,
                }}
                className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-5 font-['IBM_Plex_Mono'] text-xs text-[#9C97A8]"
              >
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M3 10h18M8 2v4M16 2v4" />
                  </svg>

                  {new Date(activeLeg.event_date).toLocaleDateString(
                    undefined,
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </span>

                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>

                  {activeLeg.venue_name}

                  {activeLeg.city ? `, ${activeLeg.city}` : ""}
                </span>
              </motion.div>
            )}
          </div>
        </section>

        {/* =========================================================
            BODY
        ========================================================= */}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
            {/* =====================================================
                MAIN CONTENT
            ===================================================== */}

            <div className="space-y-10 min-w-0">
              {/* ===================================================
                  ABOUT
              =================================================== */}

              <motion.section
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  margin: "-60px",
                }}
                transition={{
                  duration: 0.5,
                  ease: EASE,
                }}
              >
                <h2 className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.2em] text-[#6B6775] mb-3">
                  About this event
                </h2>

                <p className="text-[15px] leading-relaxed text-[#D8D5DE] whitespace-pre-line">
                  {event.description ??
                    "No description yet — check back soon for details on what to expect at this event."}
                </p>

                {categoryNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {categoryNames.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-[#15141B] border border-[#26232E] px-2.5 py-1 text-[11px] text-[#9C97A8]"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </motion.section>

              {/* ===================================================
                  LINEUP
              =================================================== */}

              {event.artists && event.artists.length > 0 && (
                <motion.section
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    margin: "-60px",
                  }}
                  transition={{
                    duration: 0.5,
                    ease: EASE,
                  }}
                >
                  <h2 className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.2em] text-[#6B6775] mb-3">
                    Lineup
                  </h2>

                  <div className="flex flex-wrap gap-2">
                    {event.artists.map((artist) => (
                      <span
                        key={artist.id}
                        className="rounded-full border border-[#26232E] bg-[#15141B] px-3.5 py-2 text-sm text-white"
                      >
                        {artist.name}
                      </span>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* ===================================================
                  TOUR DATES
              =================================================== */}

              {isTour && (
                <motion.section
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    margin: "-60px",
                  }}
                  transition={{
                    duration: 0.5,
                    ease: EASE,
                  }}
                >
                  <h2 className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.2em] text-[#6B6775] mb-3">
                    Tour dates
                  </h2>

                  <div className="space-y-2">
                    {legs.map((leg) => {
                      const active = leg.id === activeLegId;

                      return (
                        <button
                          key={leg.id}
                          onClick={() => selectLeg(leg.id)}
                          className={`w-full flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                            active
                              ? "border-[#FFB627]/50 bg-[#FFB627]/[0.06]"
                              : "border-[#26232E] bg-[#15141B] hover:border-[#3a3745]"
                          }`}
                        >
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                active ? "text-[#FFB627]" : "text-white"
                              }`}
                            >
                              {leg.venue_name}

                              {leg.city ? `, ${leg.city}` : ""}
                            </p>

                            <p className="font-['IBM_Plex_Mono'] text-xs text-[#6B6775] mt-0.5">
                              {new Date(leg.event_date).toLocaleDateString(
                                undefined,
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wide ${
                              active ? "text-[#FFB627]" : "text-[#6B6775]"
                            }`}
                          >
                            {active ? "Selected" : "Select"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.section>
              )}

              {/* ===================================================
                  VENUE
              =================================================== */}

              {activeLeg && (
                <motion.section
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    margin: "-60px",
                  }}
                  transition={{
                    duration: 0.5,
                    ease: EASE,
                  }}
                >
                  <h2 className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.2em] text-[#6B6775] mb-3">
                    Venue
                  </h2>

                  <div className="flex items-start gap-3 rounded-xl border border-[#26232E] bg-[#15141B] p-4">
                    <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-[#0B0B10] border border-[#26232E] flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-[#FFB627]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        {activeLeg.venue_name}
                      </p>

                      <p className="text-sm text-[#9C97A8] mt-0.5">
                        {activeLeg.venue_address ??
                          activeLeg.address ??
                          activeLeg.city ??
                          "Address to be announced"}
                      </p>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* ===================================================
                  MERCHANDISE
              =================================================== */}

              {!isProposedOnly && products.length > 0 && (
                <motion.section
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    margin: "-60px",
                  }}
                  transition={{
                    duration: 0.5,
                    ease: EASE,
                  }}
                >
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <h2 className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.2em] text-[#6B6775]">
                        Merchandise
                      </h2>

                      <p className="text-sm text-[#9C97A8] mt-1">
                        Add official event merch to your order.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {products.map((product) => {
                      const qty = productSelection[product.id] ?? 0;

                      const soldOut =
                        product.quantity !== null && product.quantity <= 0;

                      const maxReached =
                        product.quantity !== null && qty >= product.quantity;

                      return (
                        <motion.div
                          key={product.id}
                          whileHover={{
                            y: -2,
                          }}
                          className="rounded-xl border border-[#26232E] bg-[#15141B] overflow-hidden"
                        >
                          {/* Product image */}

                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="h-40 w-full object-cover"
                            />
                          ) : (
                            <div className="h-40 w-full bg-gradient-to-br from-[#1D1B24] via-[#15141B] to-[#0B0B10] flex items-center justify-center">
                              <span className="font-['Anton'] uppercase text-3xl text-white/5">
                                Merch
                              </span>
                            </div>
                          )}

                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-white">
                                  {product.title}
                                </h3>

                                {product.description && (
                                  <p className="text-xs text-[#6B6775] mt-1 line-clamp-2">
                                    {product.description}
                                  </p>
                                )}
                              </div>

                              <span className="font-['IBM_Plex_Mono'] text-sm font-semibold text-[#FFB627] shrink-0">
                                ${parseFloat(product.price).toFixed(2)}
                              </span>
                            </div>

                            {/* Quantity */}

                            <div className="flex items-center justify-between mt-4">
                              <div>
                                <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wide text-[#6B6775]">
                                  Quantity
                                </span>

                                {product.quantity !== null &&
                                  product.quantity > 0 && (
                                    <p className="text-[10px] text-[#565262] mt-0.5">
                                      {product.quantity} available
                                    </p>
                                  )}
                              </div>

                              {soldOut ? (
                                <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wide text-[#6B6775]">
                                  Sold out
                                </span>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      changeProductQty(product, -1)
                                    }
                                    disabled={qty === 0}
                                    className="w-8 h-8 rounded-lg border border-[#26232E] text-white disabled:opacity-30 hover:border-[#FFB627]/50 transition-colors"
                                    aria-label={`Decrease ${product.title}`}
                                  >
                                    −
                                  </button>

                                  <span className="w-5 text-center font-['IBM_Plex_Mono'] text-sm text-white">
                                    {qty}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => changeProductQty(product, 1)}
                                    disabled={maxReached}
                                    className="w-8 h-8 rounded-lg border border-[#26232E] text-white disabled:opacity-30 hover:border-[#FFB627]/50 transition-colors"
                                    aria-label={`Increase ${product.title}`}
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.section>
              )}
            </div>

            {/* =====================================================
                RIGHT SIDEBAR
            ===================================================== */}

            <div className="lg:sticky lg:top-6">
              {isProposedOnly ? (
                <WatchlistPanel
                  event={event}
                  email={watchlistEmail}
                  onEmailChange={setWatchlistEmail}
                  onJoin={handleJoinWatchlist}
                  joining={joiningWatchlist}
                />
              ) : (
                <div className="space-y-4">
                  {/* =================================================
                      TICKET PANEL
                  ================================================= */}

                  <div className="border border-[#26232E] bg-[#15141B] rounded-2xl p-5">
                    {isTour && (
                      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
                        {legs.map((leg) => {
                          const active = leg.id === activeLegId;

                          return (
                            <button
                              key={leg.id}
                              onClick={() => selectLeg(leg.id)}
                              className={`relative whitespace-nowrap px-3.5 py-1.5 rounded-full font-['IBM_Plex_Mono'] text-xs uppercase tracking-wide transition-colors ${
                                active
                                  ? "text-[#0B0B10]"
                                  : "text-[#9C97A8] border border-[#26232E] hover:border-[#FFB627]/40 hover:text-white"
                              }`}
                            >
                              {active && (
                                <motion.span
                                  layoutId="activeLegPill"
                                  className="absolute inset-0 rounded-full bg-[#FFB627]"
                                  transition={{
                                    type: "spring",
                                    stiffness: 380,
                                    damping: 30,
                                  }}
                                />
                              )}

                              <span className="relative z-10">
                                {new Date(leg.event_date).toLocaleDateString(
                                  undefined,
                                  {
                                    day: "numeric",
                                    month: "short",
                                  },
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#6B6775] mb-3">
                      {isReserved ? "Ticket prices" : "Select tickets"}
                    </p>

                    <AnimatePresence mode="wait">
                      {isReserved ? (
                        <motion.div
                          key={`reserved-${activeLeg?.id ?? "none"}`}
                          variants={listVariants}
                          initial="hidden"
                          animate="show"
                          exit={{
                            opacity: 0,
                          }}
                          className="space-y-4"
                        >
                          {/* Price legend */}

                          <div className="space-y-2">
                            {(activeLeg?.ticket_tiers ?? []).map((tier, i) => (
                              <div
                                key={tier.id}
                                className="flex items-center justify-between rounded-lg border border-[#26232E] bg-[#0B0B10] px-3 py-2"
                              >
                                <span className="flex items-center gap-2 text-sm text-white">
                                  <span
                                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                                    style={{
                                      background:
                                        SEAT_TIER_COLORS[
                                          i % SEAT_TIER_COLORS.length
                                        ],
                                    }}
                                  />

                                  {tier.name}
                                </span>

                                <span className="font-['IBM_Plex_Mono'] text-xs text-[#9C97A8]">
                                  ${parseFloat(tier.price).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Selected seats */}

                          {selectedSeatIds.length === 0 ? (
                            <p className="text-sm text-[#6B6775]">
                              Pick your seats from the seating chart below.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider text-[#6B6775]">
                                Your seats
                              </p>

                              {selectedSeatIds.map((seatId) => {
                                const seat = seatLookup.get(seatId);

                                if (!seat) {
                                  return null;
                                }

                                const tier =
                                  seat.ticket_tier_id != null
                                    ? tierLookup.get(seat.ticket_tier_id)
                                    : undefined;

                                return (
                                  <div
                                    key={seatId}
                                    className="flex items-center justify-between rounded-lg border border-[#26232E] bg-[#0B0B10] px-3 py-2"
                                  >
                                    <div>
                                      <p className="text-sm text-white">
                                        Seat {seat.label}
                                      </p>

                                      <p className="font-['IBM_Plex_Mono'] text-xs text-[#9C97A8]">
                                        {tier?.name} · $
                                        {tier
                                          ? parseFloat(tier.price).toFixed(2)
                                          : "—"}
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => toggleSeat(seat)}
                                      className="text-[#6B6775] hover:text-white text-xs"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key={`ga-${activeLeg?.id ?? "none"}`}
                          variants={listVariants}
                          initial="hidden"
                          animate="show"
                          exit={{
                            opacity: 0,
                          }}
                          className="space-y-2.5"
                        >
                          {(activeLeg?.ticket_tiers ?? []).map((tier) => (
                            <TierRow
                              key={tier.id}
                              tier={tier}
                              status={tierStatus(tier)}
                              qty={selection[tier.id] ?? 0}
                              onChange={(delta) => changeQty(tier, delta)}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* =================================================
                      ORDER SUMMARY
                  ================================================= */}

                  {/* {(ticketCount > 0 || merchCount > 0) && (
                    <OrderSummary
                      event={event}
                      activeLeg={activeLeg}
                      ticketTotal={ticketTotal}
                      merchTotal={merchTotal}
                      total={total}
                      ticketCount={ticketCount}
                      merchCount={merchCount}
                      products={products}
                      productSelection={productSelection}
                      selection={selection}
                      selectedSeatIds={selectedSeatIds}
                      seatLookup={seatLookup}
                      tierLookup={tierLookup}
                      isReserved={isReserved}
                      onRemoveTicketLine={removeTicketLine}
                      onRemoveSeat={removeSeat}
                      onRemoveProductLine={removeProductLine}
                    />
                  )} */}
                </div>
              )}
            </div>
          </div>

          {/* =========================================================
              SEATING CHART
          ========================================================= */}

          {!isProposedOnly && isReserved && activeLeg && (
            <motion.section
              key={`seatmap-${activeLeg.id}`}
              initial={{
                opacity: 0,
                y: 12,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                margin: "-60px",
              }}
              transition={{
                duration: 0.5,
                ease: EASE,
              }}
              className="mt-16 pt-10 border-t border-[#26232E]"
            >
              <h2 className="text-xl font-bold mb-5">Choose your seats</h2>

              <SeatChart
                leg={activeLeg}
                selectedSeatIds={selectedSeatIds}
                onToggleSeat={toggleSeat}
              />
            </motion.section>
          )}

          {/* =========================================================
    RELATED EVENTS
========================================================= */}

          {relatedEvents.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mt-20"
            >
              {/* Header */}
              <div className="mb-7 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                    Discover more
                  </p>

                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    You might also like
                  </h2>
                </div>

                <div className="hidden items-center gap-2 sm:flex">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                    aria-label="Previous events"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                    aria-label="Next events"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Slider */}
              <motion.div
                variants={railVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {relatedEvents.map((related) => (
                  <RelatedEventCard key={related.id} event={related} />
                ))}
              </motion.div>
            </motion.section>
          )}
        </div>
      </div>

      {/* ===========================================================
          STICKY ORDER BAR
      =========================================================== */}

      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="fixed inset-x-0 bottom-0 z-[999] bg-[#15141B] border-t border-[#26232E] rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto"
          >
            <AnimatePresence mode="wait">
              {checkoutStage === "summary" ? (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* ...your existing order summary JSX unchanged... */}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setShowSummary(false)}
                      className="flex-1 rounded-xl border border-[#26232E] text-[#D8D5DE] py-3 text-sm"
                    >
                      Back
                    </button>
                    <button
                      onClick={confirmAndPay}
                      disabled={isSubmitting}
                      className="flex-1 rounded-xl bg-[#FFB627] text-[#0B0B10] font-bold py-3 text-sm disabled:opacity-50"
                    >
                      {isSubmitting ? "Processing..." : "Confirm & pay"}
                    </button>
                  </div>

                  {paymentError && (
                    <p className="mt-3 text-sm text-[#FF6F91]">
                      {paymentError}
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25 }}
                >
                 {clientSecret && stripePromiseRef.current && (
  <Elements stripe={stripePromiseRef.current} options={{ clientSecret }}>
    <InlineCardForm
      totalDue={total}
      ticketTotal={ticketTotal}
      merchTotal={merchTotal}
      isReserved={isReserved}
      selection={selection}
      selectedSeatIds={selectedSeatIds}
      seatLookup={seatLookup}
      tierLookup={tierLookup}
      products={products}
      productSelection={productSelection}
      onBack={() => setCheckoutStage("summary")}
    />
  </Elements>
)}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthenticatedLayout>
  );
}

/*
|--------------------------------------------------------------------------
| Ticket row
|--------------------------------------------------------------------------
*/

function TierRow({
  tier,
  status,
  qty,
  onChange,
}: {
  tier: TicketTier;
  status: "open" | "upcoming" | "closed" | "sold_out";
  qty: number;
  onChange: (delta: number) => void;
}) {
  const unavailable = status !== "open";

  const statusLabel = {
    open: null,
    upcoming: "Not on sale yet",
    closed: "Pricing window closed",
    sold_out: "Sold out",
  }[status];

  const accent = {
    open: "bg-[#FFB627]",
    upcoming: "bg-[#8B6BFF]",
    closed: "bg-[#33303C]",
    sold_out: "bg-[#33303C]",
  }[status];

  return (
    <motion.div
      variants={rowVariants}
      className={`relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-[#26232E] bg-[#0B0B10] pl-5 pr-4 py-3.5 ${
        unavailable ? "opacity-55" : ""
      }`}
    >
      <span className={`absolute left-0 top-0 h-full w-1 ${accent}`} />

      <div>
        <p className="font-semibold text-white text-sm">{tier.name}</p>

        <p className="font-['IBM_Plex_Mono'] text-xs text-[#9C97A8] mt-0.5">
          ${parseFloat(tier.price).toFixed(2)}
          {statusLabel ? ` · ${statusLabel}` : ` · ${tier.remaining} left`}
        </p>
      </div>

      {unavailable ? (
        <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wide text-[#6B6775]">
          Unavailable
        </span>
      ) : (
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{
              scale: 0.88,
            }}
            onClick={() => onChange(-1)}
            disabled={qty === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#26232E] text-[#D8D5DE] disabled:opacity-30 hover:border-[#FFB627]/50 hover:text-white transition-colors"
            aria-label={`Decrease ${tier.name} quantity`}
          >
            −
          </motion.button>

          <span className="min-w-[18px] text-center font-['IBM_Plex_Mono'] text-sm text-white">
            {qty}
          </span>

          <motion.button
            whileTap={{
              scale: 0.88,
            }}
            onClick={() => onChange(1)}
            disabled={qty >= tier.remaining}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#26232E] text-[#D8D5DE] disabled:opacity-30 hover:border-[#FFB627]/50 hover:text-white transition-colors"
            aria-label={`Increase ${tier.name} quantity`}
          >
            +
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

/*
|--------------------------------------------------------------------------
| Order summary
|--------------------------------------------------------------------------
*/

function OrderSummary({
  activeLeg,
  ticketTotal,
  merchTotal,
  total,
  ticketCount,
  merchCount,
  products,
  productSelection,
}: {
  event: Event;
  activeLeg?: EventLeg;
  ticketTotal: number;
  merchTotal: number;
  total: number;
  ticketCount: number;
  merchCount: number;
  products: Product[];
  productSelection: ProductSelection;
}) {
  return (
    <div className="border border-[#26232E] bg-[#15141B] rounded-2xl p-5">
      <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#6B6775] mb-4">
        Order summary
      </p>

      {/* Tickets */}

      {ticketCount > 0 && (
        <div className="pb-4 border-b border-[#26232E]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Tickets</span>

            <span className="font-['IBM_Plex_Mono'] text-sm text-white">
              ${ticketTotal.toFixed(2)}
            </span>
          </div>

          <p className="text-xs text-[#6B6775] mt-1">
            {ticketCount} {ticketCount === 1 ? "ticket" : "tickets"}
            {activeLeg ? ` · ${activeLeg.venue_name}` : ""}
          </p>
        </div>
      )}

      {/* Merchandise */}

      {merchCount > 0 && (
        <div className="py-4 border-b border-[#26232E]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">
              Merchandise
            </span>

            <span className="font-['IBM_Plex_Mono'] text-sm text-white">
              ${merchTotal.toFixed(2)}
            </span>
          </div>

          <div className="space-y-1.5">
            {products
              .filter((product) => (productSelection[product.id] ?? 0) > 0)
              .map((product) => {
                const qty = productSelection[product.id] ?? 0;

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="text-[#9C97A8] truncate">
                      {qty} × {product.title}
                    </span>

                    <span className="font-['IBM_Plex_Mono'] text-[#9C97A8] shrink-0">
                      ${(parseFloat(product.price) * qty).toFixed(2)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <span className="text-base font-bold text-white">Total</span>
        <span className="font-['IBM_Plex_Mono'] text-xl font-semibold text-[#FFB627]">
          ${total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Seat chart
|--------------------------------------------------------------------------
*/

function SeatChart({
  leg,
  selectedSeatIds,
  onToggleSeat,
}: {
  leg: EventLeg;
  selectedSeatIds: number[];
  onToggleSeat: (seat: Seat) => void;
}) {
  const tiers = leg.ticket_tiers ?? [];

  const tierColorIndex = new Map(
    tiers.map((tier, i) => [tier.id, i % SEAT_TIER_COLORS.length]),
  );

  const rows = useMemo(() => {
    const groups = new Map<string, Seat[]>();

    (leg.seats ?? []).forEach((seat) => {
      const bucket = groups.get(seat.row_label) ?? [];
      bucket.push(seat);
      groups.set(seat.row_label, bucket);
    });

    return Array.from(groups.entries()).sort(([, seatsA], [, seatsB]) => {
      const orderA = Math.min(...seatsA.map((s) => s.sort_order));
      const orderB = Math.min(...seatsB.map((s) => s.sort_order));
      return orderA - orderB;
    });
  }, [leg.seats]);

  return (
    <div className="rounded-2xl border border-[#26232E] bg-[#15141B] p-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {tiers.map((tier, i) => (
          <span
            key={tier.id}
            className="flex items-center gap-2 text-xs text-[#9C97A8]"
          >
            <span
              className="w-3 h-3 rounded-sm"
              style={{
                background: SEAT_TIER_COLORS[i % SEAT_TIER_COLORS.length],
              }}
            />
            {tier.name} · ${parseFloat(tier.price).toFixed(0)}
          </span>
        ))}
        <span className="flex items-center gap-2 text-xs text-[#565262]">
          <span className="w-3 h-3 rounded-sm bg-[#26232E]" />
          Unavailable
        </span>
      </div>

      {/* Stage */}
      <div className="mx-auto mb-8 max-w-md">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-transparent via-[#FFB627]/40 to-transparent" />
        <p className="text-center font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#565262] mt-2">
          Stage
        </p>
      </div>

      {/* Rows */}
      <div className="space-y-1.5 overflow-x-auto">
        {rows.map(([rowLabel, seats]) => (
          <div
            key={rowLabel}
            className="flex items-center justify-center gap-1.5"
          >
            <span className="w-5 shrink-0 font-['IBM_Plex_Mono'] text-[10px] text-[#565262] text-right">
              {rowLabel}
            </span>

            {seats
              .slice()
              .sort((a, b) => a.seat_number - b.seat_number)
              .map((seat, i, arr) => {
                const isSelected = selectedSeatIds.includes(seat.id);
                const isUnavailable =
                  seat.status !== "available" || seat.ticket_tier_id == null;
                const colorIdx =
                  seat.ticket_tier_id != null
                    ? (tierColorIndex.get(seat.ticket_tier_id) ?? 0)
                    : 0;
                const color = SEAT_TIER_COLORS[colorIdx];

                return (
                  <React.Fragment key={seat.id}>
                    <motion.button
                      type="button"
                      disabled={isUnavailable}
                      onClick={() => onToggleSeat(seat)}
                      whileHover={!isUnavailable ? { scale: 1.15 } : undefined}
                      whileTap={!isUnavailable ? { scale: 0.9 } : undefined}
                      className="w-5 h-5 shrink-0 rounded-[4px] flex items-center justify-center"
                      style={{
                        background: isUnavailable
                          ? "#26232E"
                          : isSelected
                            ? color
                            : `${color}26`,
                        border: `1px solid ${isUnavailable ? "#33303C" : color}`,
                        cursor: isUnavailable ? "not-allowed" : "pointer",
                      }}
                      aria-label={`Seat ${seat.label}${
                        isUnavailable
                          ? ", unavailable"
                          : isSelected
                            ? ", selected"
                            : ", available"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-[#0B0B10]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </motion.button>
                    {seat.venue_seat?.aisle_after && i < arr.length - 1 && (
                      <span className="w-4 shrink-0" aria-hidden="true" />
                    )}
                  </React.Fragment>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

function InlineCardForm({
  totalDue,
  ticketTotal,
  merchTotal,
  isReserved,
  selection,
  selectedSeatIds,
  seatLookup,
  tierLookup,
  products,
  productSelection,
  onBack,
}: {
  totalDue: number;
  ticketTotal: number;
  merchTotal: number;
  isReserved: boolean;
  selection: Selection;
  selectedSeatIds: number[];
  seatLookup: Map<number, Seat>;
  tierLookup: Map<number, TicketTier>;
  products: Product[];
  productSelection: ProductSelection;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/stripe/success`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Payment failed. Please check your card details.");
      setSubmitting(false);
      return;
    }

  if (paymentIntent?.status === "succeeded") {
  router.visit(route("stripe.success", { payment_intent: paymentIntent.id }));
  return;
}

    setSubmitting(false);
    setErrorMessage("Payment is still processing — please wait a moment and check your orders.");
  }

  const ticketLines = isReserved
    ? selectedSeatIds
        .map((seatId) => {
          const seat = seatLookup.get(seatId);
          const tier = seat?.ticket_tier_id != null ? tierLookup.get(seat.ticket_tier_id) : undefined;
          if (!seat || !tier) return null;
          return {
            key: `seat-${seatId}`,
            label: `Seat ${seat.label} — ${tier.name}`,
            amount: parseFloat(tier.price),
          };
        })
        .filter((l): l is { key: string; label: string; amount: number } => l !== null)
    : Object.entries(selection)
        .filter(([, qty]) => qty > 0)
        .map(([tierId, qty]) => {
          const tier = tierLookup.get(Number(tierId));
          if (!tier) return null;
          return {
            key: `tier-${tierId}`,
            label: `${tier.name} × ${qty}`,
            amount: parseFloat(tier.price) * qty,
          };
        })
        .filter((l): l is { key: string; label: string; amount: number } => l !== null);

  const productLines = Object.entries(productSelection)
    .filter(([, qty]) => qty > 0)
    .map(([productId, qty]) => {
      const product = products.find((p) => p.id === Number(productId));
      if (!product) return null;
      return {
        key: `product-${productId}`,
        label: `${product.title} × ${qty}`,
        amount: parseFloat(product.price) * qty,
      };
    })
    .filter((l): l is { key: string; label: string; amount: number } => l !== null);

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">Card details</h3>
        <button type="button" onClick={onBack} className="text-xs text-[#6B6775] hover:text-white">
          ← Back to order
        </button>
      </div>

      {/* Order recap */}
      <div className="rounded-lg border border-[#26232E] bg-[#0B0B10] px-3 py-3 mb-4">
        {ticketLines.length > 0 && (
          <div className="mb-2">
            <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider text-[#6B6775] mb-1.5">
              Tickets
            </p>
            {ticketLines.map((line) => (
              <div key={line.key} className="flex items-center justify-between text-sm py-0.5">
                <span className="text-[#D8D5DE] truncate">{line.label}</span>
                <span className="font-['IBM_Plex_Mono'] text-white shrink-0 ml-2">
                  ${line.amount.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between text-xs text-[#6B6775] mt-1 pt-1 border-t border-[#1c1a22]">
              <span>Subtotal</span>
              <span className="font-['IBM_Plex_Mono']">${ticketTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {productLines.length > 0 && (
          <div className={ticketLines.length > 0 ? "pt-2 border-t border-[#26232E]" : ""}>
            <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider text-[#6B6775] mb-1.5">
              Merchandise
            </p>
            {productLines.map((line) => (
              <div key={line.key} className="flex items-center justify-between text-sm py-0.5">
                <span className="text-[#D8D5DE] truncate">{line.label}</span>
                <span className="font-['IBM_Plex_Mono'] text-white shrink-0 ml-2">
                  ${line.amount.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between text-xs text-[#6B6775] mt-1 pt-1 border-t border-[#1c1a22]">
              <span>Subtotal</span>
              <span className="font-['IBM_Plex_Mono']">${merchTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-base font-bold text-white mt-3 pt-2 border-t border-[#26232E]">
          <span>Total</span>
          <span className="font-['IBM_Plex_Mono'] text-[#FFB627]">${totalDue.toFixed(2)}</span>
        </div>
      </div>

      <PaymentElement />

      {errorMessage && <p className="mt-3 text-sm text-[#FF6F91]">{errorMessage}</p>}

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full mt-4 rounded-xl bg-[#FFB627] text-[#0B0B10] font-bold py-3 text-sm disabled:opacity-50"
      >
        {submitting ? "Processing..." : `Pay $${totalDue.toFixed(2)}`}
      </button>
    </form>
  );
}

/*
|--------------------------------------------------------------------------
| Watchlist
|--------------------------------------------------------------------------
*/

function WatchlistPanel({
  event,
  email,
  onEmailChange,
  onJoin,
  joining,
}: {
  event: Event;
  email: string;
  onEmailChange: (value: string) => void;
  onJoin: () => void;
  joining: boolean;
}) {
  return (
    <div className="relative border border-dashed border-[#33303C] bg-[#15141B] rounded-2xl p-5">
      <p className="text-sm text-[#D8D5DE] mb-1">
        This event isn't confirmed yet — the organizer is gauging interest.
      </p>

      <p className="font-['IBM_Plex_Mono'] text-xs text-[#8B6BFF] mb-4">
        {event.watchlist_count ?? 0}{" "}
        {event.watchlist_count === 1 ? "person is" : "people are"} watching ·
        we'll email you the moment it's confirmed
      </p>

      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 bg-[#0B0B10] border border-[#26232E] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#565262] focus:outline-none focus:border-[#8B6BFF]/50 focus:ring-2 focus:ring-[#8B6BFF]/15"
        />

        <motion.button
          whileHover={{
            y: -1,
          }}
          whileTap={{
            scale: 0.97,
          }}
          onClick={onJoin}
          disabled={joining || !email.trim()}
          className="bg-[#8B6BFF] text-white text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-[#9d81ff] transition-colors disabled:opacity-40"
        >
          Notify me
        </motion.button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Related event
|--------------------------------------------------------------------------
*/

function RelatedEventCard({ event }: { event: RelatedEvent }) {
  const firstLeg = event.legs?.[0];

  const date = firstLeg?.start_at
    ? new Date(firstLeg.start_at).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
      })
    : null;

  const venue = firstLeg?.venue?.name ?? null;

  return (
    <Link
      href={route("events.show", {
        event: event.slug,
      })}
      className="
        group
        relative
        block
        h-[390px]
        w-[300px]
        min-w-[300px]
        overflow-hidden
        rounded-[28px]
        border
        border-white/10
        bg-[#141319]
        shadow-[0_20px_60px_rgba(0,0,0,0.25)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-white/20
        hover:shadow-[0_28px_80px_rgba(0,0,0,0.4)]
        sm:h-[410px]
        sm:w-[320px]
        sm:min-w-[320px]
      "
    >
      {/* Image */}
      <div className="absolute inset-0 overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.name}
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-700
              ease-out
              group-hover:scale-110
            "
          />
        ) : (
          <div
            className="
              h-full
              w-full
              bg-[radial-gradient(circle_at_top_right,#35313F,transparent_45%),linear-gradient(135deg,#201D27,#0B0B10)]
            "
          />
        )}

        {/* Image overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />

        {/* Extra subtle hover glow */}
        <div className="absolute inset-0 bg-white/0 transition duration-500 group-hover:bg-white/[0.03]" />
      </div>

      {/* Top badges */}
      <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
        {event.type ? (
          <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
            {event.type}
          </span>
        ) : (
          <span />
        )}

        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/80 backdrop-blur-md transition group-hover:bg-white group-hover:text-black">
          ↗
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {date && (
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black">
              {date}
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-xl font-bold leading-tight text-white sm:text-2xl">
          {event.name}
        </h3>

        {venue && (
          <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
            <span className="text-white/40">⌖</span>
            <span className="truncate">{venue}</span>
          </div>
        )}

        {/* Bottom action */}
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/80 transition group-hover:text-white">
          Explore event
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
