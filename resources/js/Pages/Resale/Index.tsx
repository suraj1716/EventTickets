// resources/js/Pages/Resale/Index.tsx
//
// Public marketplace of active resale listings. Buying requires login
// (handled by resale.checkout's auth middleware) — browsing doesn't,
// so anyone can see what's available before signing up.

import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

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
      event: { name: string; slug: string; image_url: string | null } | null;
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

export default function ResaleIndex({ listings }: Props) {
  function buy(listingId: number) {
    router.post(route("resale.checkout", listingId));
  }
  return (
    <AuthenticatedLayout>
      <Head title="Resale tickets" />

      <div className="min-h-screen bg-[#0B0B10] text-[#F7F5F2] font-['Manrope']">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs uppercase tracking-wide text-[#6B6775] mb-1">
            Resale marketplace
          </p>
          <h1 className="text-3xl font-bold mb-2">Tickets from other fans</h1>
          <p className="text-sm text-[#9C97A8] mb-2 max-w-xl">
            Every listing here transfers through this platform — the seller's
            original ticket is retired the moment you buy, so what you get is
            the only valid copy.
          </p>
          <a
            href={route("verify.index")}
            className="text-xs text-[#FFB627] underline"
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
  <div className="relative h-40 w-full sm:h-16 sm:w-28 shrink-0 overflow-hidden rounded-lg border border-[#26232E]">
    {listing.ticket.event_leg?.event?.image_url ? (
      <img
        src={listing.ticket.event_leg.event.image_url}
        alt=""
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="h-full w-full bg-gradient-to-br from-[#1D1B24] via-[#15141B] to-[#0B0B10] flex items-center justify-center">
        <span className="font-['Anton'] text-lg uppercase text-white/10 select-none">Live</span>
      </div>
    )}
  </div>

  <div className="min-w-0 flex-1">
    <p className="font-semibold text-white truncate">
      {listing.ticket.event_leg?.event?.name ?? 'Event'}
    </p>
    <p className="text-xs text-[#9C97A8] mt-1">
      {listing.ticket.event_leg?.venue_name}
      {listing.ticket.ticket_tier ? ` · ${listing.ticket.ticket_tier.name}` : ''}
    </p>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
      {listing.ticket.event_leg?.event_date && (
        <p className="font-['IBM_Plex_Mono'] text-[11px] text-[#6B6775]">
          {new Date(listing.ticket.event_leg.event_date).toLocaleDateString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      )}
      <span className="hidden sm:inline text-[11px] text-[#6B6775]">·</span>
      <p className="text-[11px] text-[#6B6775]">
        Sold by <span className="text-[#9C97A8]">{listing.seller.name}</span>
      </p>
    </div>
  </div>

  <div className="flex items-center justify-between sm:flex-col sm:items-end shrink-0 gap-2 sm:gap-0">
    <p className="font-['IBM_Plex_Mono'] text-lg font-semibold text-[#FFB627]">
      ${listing.price}
    </p>
    <button
      type="button"
      onClick={() => buy(listing.id)}
      className="text-xs px-3 py-1.5 rounded-lg bg-[#FFB627] text-[#0B0B10] font-bold hover:bg-[#ffc75c] transition-colors sm:mt-2"
    >
      Buy
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
    </AuthenticatedLayout>
  );
}
