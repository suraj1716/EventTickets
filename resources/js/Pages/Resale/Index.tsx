// resources/js/Pages/Resale/Index.tsx
//
// Public marketplace of active resale listings. Buying requires login
// (handled by resale.checkout's auth middleware) — browsing doesn't,
// so anyone can see what's available before signing up.

import { useMemo, useState, FormEvent } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import toast from "react-hot-toast";
import PageHero from "@/Components/Page/PageHero";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

interface Listing {
  id: number;
  price: string;
  seller: { id: number; name: string };
  ticket: {
    id: number;
    ticket_tier: { name: string } | null;
    event_leg: {
      venue_name: string;
      event_date: string;
      event: {
        name: string;
        slug: string;
        media: {
          id: number;
          type: string;
          path: string;
          mime_type: string;
          size: number;
          position: number;
          url: string;
        }[];
      } | null;
    } | null;
  };
}

interface Props {
  listings: {
    data: Listing[];
    links: { prev: string | null; next: string | null };
    meta: { current_page: number; last_page: number; total: number };
  };
}

// Embedded payment form for a single resale listing — same
// PaymentElement pattern as Checkout/Payment.tsx, just rendered
// inline in a modal instead of a full page, since a resale purchase
// is always exactly one ticket with no cart/order summary needed.
function ResalePaymentForm({
  listing,
  onDone,
}: {
  listing: Listing;
  onDone: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/stripe/success?payment_intent={PAYMENT_INTENT_ID}`,
      },
    });

    if (error) {
      setErrorMessage(
        error.message ?? "Payment failed. Please check your payment details."
      );
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {errorMessage && (
        <div className="mt-3 rounded-lg border border-red-800/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={submitting}
          className="flex-1 rounded-lg border border-[#26232E] py-2.5 text-sm font-semibold text-[#9C97A8] hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || submitting}
          className="flex-1 rounded-lg bg-[#FFB627] py-2.5 text-sm font-bold text-[#0B0B10] hover:bg-[#ffc75c] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Processing…" : `Pay $${listing.price}`}
        </button>
      </div>
    </form>
  );
}

function ResaleCheckoutModal({
  listing,
  clientSecret,
  stripeKey,
  onClose,
}: {
  listing: Listing;
  clientSecret: string;
  stripeKey: string;
  onClose: () => void;
}) {
  const stripePromise = useMemo(() => loadStripe(stripeKey), [stripeKey]);
  const options = useMemo(() => ({ clientSecret }), [clientSecret]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#26232E] bg-[#15141B] p-6">
        <h3 className="font-semibold text-white mb-1">
          {listing.ticket.event_leg?.event?.name ?? "Resale ticket"}
        </h3>
        <p className="text-xs text-[#9C97A8] mb-4">
          {listing.ticket.event_leg?.venue_name}
          {listing.ticket.ticket_tier ? ` · ${listing.ticket.ticket_tier.name}` : ""}
        </p>

        <Elements stripe={stripePromise} options={options}>
          <ResalePaymentForm listing={listing} onDone={onClose} />
        </Elements>
      </div>
    </div>
  );
}

export default function ResaleIndex({ listings }: Props) {
  const { csrf_token } = usePage().props as { csrf_token: string };
  const [checkout, setCheckout] = useState<{
    listing: Listing;
    clientSecret: string;
    stripeKey: string;
  } | null>(null);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  async function buy(listing: Listing) {
    setBuyingId(listing.id);
    try {
      const res = await fetch(route("resale.checkout", listing.id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-TOKEN": csrf_token,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.resale || data.message || "Unable to purchase this ticket.");
        return;
      }

      setCheckout({
        listing,
        clientSecret: data.clientSecret,
        stripeKey: data.stripeKey,
      });
    } catch {
      toast.error("Unable to purchase this ticket.");
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <AuthenticatedLayout>
      <Head title="Resale tickets" />

      <div className="min-h-screen bg-[#0B0B10] text-[#F7F5F2] font-['Manrope']">

           <PageHero
                    eyebrow="Resale Marketplace"
                    title={<>Tickets <em> from other fans</em></>}
                    subtitle=" Every listing here transfers through this platform — the seller's
            original ticket is retired the moment you buy, so what you get is
            the only valid copy."
                    breadcrumbs={[{ label: "Home", href: route("home") }, { label: "Vouchers" }]}
                  />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-1 py-14 pb-48  -mt-12 ">

           <a
            href={route("verify.index")}
            className="text-xs text-[#FFB627] underline "
          >
            Bought a ticket from someone off-platform? Verify it first →
          </a>




          {listings.data.length === 0 ? (
            <div className="mt-10 border border-dashed border-[#26232E] rounded-2xl py-16 text-center">
              <h3 className="font-bold">No resale tickets right now</h3>
              <p className="text-sm text-[#9C97A8] mt-2">
                Check back later, or browse events on sale.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              {listings.data.map((listing) => (
                <div
                  key={listing.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-[#26232E] bg-[#15141B] p-4"
                >
                  {/* Event poster thumbnail — landscape, full-width on mobile */}
{/* Event poster thumbnail */}
<Link
  href={
    listing.ticket.event_leg?.event?.slug
      ? route("events.show", listing.ticket.event_leg.event.slug)
      : "#"
  }
  className="relative h-40 w-full sm:h-16 sm:w-28 shrink-0 overflow-hidden rounded-lg border border-[#26232E] block"
>
  {listing.ticket.event_leg?.event?.media?.length ? (
    <img
      src={listing.ticket.event_leg.event.media[0].url}
      alt={listing.ticket.event_leg.event.name}
      className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
    />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-[#1D1B24] via-[#15141B] to-[#0B0B10] flex items-center justify-center">
      <span className="font-['Anton'] text-lg uppercase text-white/10 select-none">
        Live
      </span>
    </div>
  )}
</Link>

<div className="min-w-0 flex-1">
  <Link
    href={
      listing.ticket.event_leg?.event?.slug
        ? route("events.show", listing.ticket.event_leg.event.slug)
        : "#"
    }
    className="font-semibold text-white truncate block hover:text-[#FFB627] transition-colors"
  >
    {listing.ticket.event_leg?.event?.name ?? "Event"}
  </Link>

  <p className="text-xs text-[#9C97A8] mt-1">
    {listing.ticket.event_leg?.venue_name}
    {listing.ticket.ticket_tier
      ? ` · ${listing.ticket.ticket_tier.name}`
      : ""}
  </p>

  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
    {listing.ticket.event_leg?.event_date && (
      <p className="font-['IBM_Plex_Mono'] text-[11px] text-[#6B6775]">
        {new Date(
          listing.ticket.event_leg.event_date
        ).toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    )}

    <span className="hidden sm:inline text-[11px] text-[#6B6775]">
      ·
    </span>

    <p className="text-[11px] text-[#6B6775]">
      Sold by{" "}
      <span className="text-[#9C97A8]">
        {listing.seller.name}
      </span>
    </p>
  </div>
</div>


                  <div className="flex items-center justify-between sm:flex-col sm:items-end shrink-0 gap-2 sm:gap-0">
                    <p className="font-['IBM_Plex_Mono'] text-lg font-semibold text-[#FFB627]">
                      ${listing.price}
                    </p>
                    <button
                      type="button"
                      onClick={() => buy(listing)}
                      disabled={buyingId === listing.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#FFB627] text-[#0B0B10] font-bold hover:bg-[#ffc75c] transition-colors sm:mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {buyingId === listing.id ? "Please wait…" : "Buy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {listings.meta.last_page > 1 && (
            <div className="flex items-center justify-between mt-6 text-sm text-[#6B6775]">
              <span>
                Page {listings.meta.current_page} of {listings.meta.last_page}
              </span>
              <div className="flex gap-3">
                {listings.links.prev && (
                  <Link href={listings.links.prev} className="hover:text-white">
                    Previous
                  </Link>
                )}
                {listings.links.next && (
                  <Link href={listings.links.next} className="hover:text-white">
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {checkout && (
        <ResaleCheckoutModal
          listing={checkout.listing}
          clientSecret={checkout.clientSecret}
          stripeKey={checkout.stripeKey}
          onClose={() => setCheckout(null)}
        />
      )}
    </AuthenticatedLayout>
  );
}
