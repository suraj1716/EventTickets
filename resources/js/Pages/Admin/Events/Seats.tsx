import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '../AdminLayout';

interface VenueSeat {
  id: number;
  venue_section_id: number;
  row_label: string;
  seat_number: number;
  label: string;
  seat_type: string | null;
  is_active: boolean;
}

interface VenueSection {
  id: number;
  name: string;
  code: string | null;
  seats: VenueSeat[];
}

interface EventSeat {
  id: number;
  venue_seat_id: number | null;
  row_label: string;
  seat_number: number;
  label: string;
  status: string;
  ticket_tier_id: number | null;
  ticket_tier?: {
    id: number;
    name: string;
    price: string;
  } | null;
}

interface TicketTier {
  id: number;
  name: string;
  price: string;
}

interface Props {
  eventLeg: {
    id: number;
    venue_id: number | null;
    venue_name: string;
    seating_type: string;
    ticket_tiers: TicketTier[];
  };

  venue?: {
    id: number;
    name: string;
    sections: VenueSection[];
  } | null;

  seats: EventSeat[];
}

export default function Seats({ eventLeg, venue, seats }: Props) {
  // section_id -> ticket_tier_id ('' means "no price yet")
  const [sectionAssignments, setSectionAssignments] = useState<Record<number, string>>({});

  const totalVenueSeats =
    venue?.sections.reduce((total, section) => total + section.seats.length, 0) ?? 0;

  function setAssignment(sectionId: number, tierId: string) {
    setSectionAssignments((prev) => ({ ...prev, [sectionId]: tierId }));
  }

  function importVenueSeats() {
    if (!venue) {
      alert('This event leg does not have a venue selected.');
      return;
    }

    if (totalVenueSeats === 0) {
      alert('This venue does not have any seats configured.');
      return;
    }

    if (seats.length > 0) {
      const confirmed = confirm(
        'This event already has seats. Importing the venue seating again will replace the existing event seat map — anything held or sold will block this. Continue?'
      );
      if (!confirmed) return;
    }

    const payload = {
      section_assignments: Object.fromEntries(
        Object.entries(sectionAssignments).filter(([, tierId]) => tierId !== '')
      ),
    };

    router.post(route('admin.event-legs.seats.import', eventLeg.id), payload, {
      preserveScroll: true,
    });
  }

  function deleteSeat(seatId: number) {
    if (!confirm('Remove this event seat?')) return;

    router.delete(
      route('admin.event-legs.seats.seat.destroy', {
        eventLeg: eventLeg.id,
        seat: seatId,
      }),
      { preserveScroll: true }
    );
  }

  return (
    <AdminLayout>
      <Head title={`Seats — ${eventLeg.venue_name}`} />

      <div className="max-w-6xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Event seating</p>
          <h1 className="text-2xl font-semibold text-white mt-1">
            Seat map — {eventLeg.venue_name}
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            The physical seats come from the venue. Prices are set per section, for this
            event only — the same room can sell for different prices at a different event.
          </p>
        </div>

        {/* Venue information */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">Venue</p>
              <h2 className="text-lg font-medium text-white mt-1">
                {venue?.name ?? eventLeg.venue_name}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">Venue seats</p>
              <p className="text-lg font-semibold text-white">{totalVenueSeats}</p>
            </div>
          </div>

          {!venue && (
            <div className="mt-4 p-3 rounded-lg bg-red-950/30 border border-red-900 text-sm text-red-400">
              No venue is assigned to this event leg. Select a venue before configuring seats.
            </div>
          )}
        </div>

        {/* Per-section pricing + import */}
        {venue && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-medium text-white mb-1">Price each section</h2>
            <p className="text-sm text-neutral-500 mb-4">
              Pick which ticket tier sells each section. A section left as "No price yet"
              still shows up on the seat map but stays unsellable until you assign one.
            </p>

            {eventLeg.ticket_tiers.length === 0 ? (
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900 text-sm text-amber-400 mb-4">
                This event has no ticket tiers yet — add at least one before assigning
                section pricing.
              </div>
            ) : (
              <div className="space-y-2 mb-5">
                {venue.sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm text-white">{section.name}</p>
                      <p className="text-xs text-neutral-600">
                        {section.seats.length} seats
                        {section.code ? ` · ${section.code}` : ''}
                      </p>
                    </div>

                    <select
                      value={sectionAssignments[section.id] ?? ''}
                      onChange={(e) => setAssignment(section.id, e.target.value)}
                      className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-200"
                    >
                      <option value="">No price yet</option>
                      {eventLeg.ticket_tiers.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.name} · ${parseFloat(tier.price).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-6 pt-4 border-t border-neutral-800">
              <p className="text-sm text-neutral-500">
                Copies the venue's sections and seats into this event with the pricing
                above.
              </p>
              <button
                type="button"
                onClick={importVenueSeats}
                className="shrink-0 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200"
              >
                {seats.length > 0 ? 'Re-import venue seats' : 'Import venue seats'}
              </button>
            </div>
          </div>
        )}

        {/* Event seat map */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-white">Event seat map</h2>
              <p className="text-xs text-neutral-500 mt-1">{seats.length} seats configured</p>
            </div>
          </div>

          {seats.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-3xl mb-3">💺</div>
              <h3 className="text-white font-medium">No event seats</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Import the seating map from the venue.
              </p>
            </div>
          ) : (
            <div className="p-5">
              {venue?.sections.map((section) => {
                const sectionSeats = seats.filter((eventSeat) => {
                  const venueSeat = section.seats.find(
                    (seat) => seat.id === eventSeat.venue_seat_id
                  );
                  return !!venueSeat;
                });

                if (sectionSeats.length === 0) return null;

                const unpricedCount = sectionSeats.filter((s) => !s.ticket_tier_id).length;

                return (
                  <div key={section.id} className="mb-8 last:mb-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-medium text-white">{section.name}</h3>
                      {section.code && (
                        <span className="text-xs text-neutral-600">{section.code}</span>
                      )}
                      <span className="text-xs text-neutral-600">
                        {sectionSeats.length} seats
                      </span>
                    </div>

                    <p className="text-xs mb-3">
                      {unpricedCount > 0 ? (
                        <span className="text-amber-500">
                          {unpricedCount} seat{unpricedCount === 1 ? '' : 's'} unpriced —
                          not sellable yet
                        </span>
                      ) : (
                        <span className="text-neutral-600">
                          {sectionSeats[0]?.ticket_tier?.name} · $
                          {sectionSeats[0]?.ticket_tier
                            ? parseFloat(sectionSeats[0].ticket_tier.price).toFixed(2)
                            : '—'}
                        </span>
                      )}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {sectionSeats.map((seat) => {
                        const unavailable = seat.status !== 'available';
                        const unpriced = !seat.ticket_tier_id;

                        return (
                          <div key={seat.id} className="group relative">
                            <div
                              className={`px-3 py-2 rounded-lg border text-xs ${
                                unavailable
                                  ? 'bg-neutral-950 border-neutral-800 text-neutral-600'
                                  : unpriced
                                    ? 'bg-neutral-950 border-amber-900/60 text-amber-500'
                                    : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                              }`}
                              title={
                                unavailable
                                  ? `${seat.status} — cannot be removed`
                                  : unpriced
                                    ? 'No ticket tier assigned yet'
                                    : seat.ticket_tier?.name
                              }
                            >
                              {seat.label}
                            </div>

                            {!unavailable && (
                              <button
                                type="button"
                                onClick={() => deleteSeat(seat.id)}
                                className="absolute -top-2 -right-2 hidden group-hover:block w-5 h-5 rounded-full bg-red-500 text-white text-xs"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
