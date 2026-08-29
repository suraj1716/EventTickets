import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '../AdminLayout';
import {
  AdminPageHeader,
  AdminBtn,
  C,
  fontBody,
  fontMono,
} from '@/Components/Admin/AdminComponents';

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

const inputStyle: React.CSSProperties = {
  padding: '7px 12px',
  fontFamily: fontBody,
  fontSize: '13px',
  color: C.text,
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: '8px',
  outline: 'none',
};

const panelStyle: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
};

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

      <div style={{ maxWidth: 1100 }}>
        <AdminPageHeader
          eyebrow="Event seating"
          title={`Seat map — ${eventLeg.venue_name}`}
          meta="The physical seats come from the venue. Prices are set per section, for this event only — the same room can sell for different prices at a different event."
        />

        {/* Venue information */}
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: fontMono, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint }}>Venue</p>
              <h2 style={{ fontFamily: fontBody, fontSize: '1.05rem', fontWeight: 500, color: C.text, marginTop: 4 }}>
                {venue?.name ?? eventLeg.venue_name}
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: fontMono, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint }}>Venue seats</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: C.text }}>{totalVenueSeats}</p>
            </div>
          </div>

          {!venue && (
            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: '8px', background: 'rgba(224,133,133,0.08)', border: `1px solid ${C.error}40`, fontSize: '13px', color: C.error }}>
              No venue is assigned to this event leg. Select a venue before configuring seats.
            </div>
          )}
        </div>

        {/* Per-section pricing + import */}
        {venue && (
          <div style={panelStyle}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: C.text, marginBottom: 4 }}>Price each section</h2>
            <p style={{ fontSize: '13px', color: C.textMuted, marginBottom: 16 }}>
              Pick which ticket tier sells each section. A section left as "No price yet"
              still shows up on the seat map but stays unsellable until you assign one.
            </p>

            {eventLeg.ticket_tiers.length === 0 ? (
              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,182,39,0.08)', border: `1px solid ${C.amber}40`, fontSize: '13px', color: C.amber, marginBottom: 16 }}>
                This event has no ticket tiers yet — add at least one before assigning
                section pricing.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {venue.sections.map((section) => (
                  <div
                    key={section.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                      borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bg, padding: '10px 12px',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '13px', color: C.text }}>{section.name}</p>
                      <p style={{ fontSize: '11px', color: C.textFaint }}>
                        {section.seats.length} seats
                        {section.code ? ` · ${section.code}` : ''}
                      </p>
                    </div>

                    <select
                      value={sectionAssignments[section.id] ?? ''}
                      onChange={(e) => setAssignment(section.id, e.target.value)}
                      style={inputStyle}
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, paddingTop: 16, borderTop: `1px dashed ${C.borderDashed}` }}>
              <p style={{ fontSize: '13px', color: C.textMuted }}>
                Copies the venue's sections and seats into this event with the pricing
                above.
              </p>
              <AdminBtn onClick={importVenueSeats}>
                {seats.length > 0 ? 'Re-import venue seats' : 'Import venue seats'}
              </AdminBtn>
            </div>
          </div>
        )}

        {/* Event seat map */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px dashed ${C.borderDashed}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>Event seat map</h2>
              <p style={{ fontSize: '11px', color: C.textFaint, marginTop: 4 }}>{seats.length} seats configured</p>
            </div>
          </div>

          {seats.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>💺</div>
              <h3 style={{ color: C.text, fontWeight: 500 }}>No event seats</h3>
              <p style={{ fontSize: '13px', color: C.textMuted, marginTop: 4 }}>
                Import the seating map from the venue.
              </p>
            </div>
          ) : (
            <div style={{ padding: 20 }}>
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
                  <div key={section.id} style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{section.name}</h3>
                      {section.code && (
                        <span style={{ fontSize: '11px', color: C.textFaint }}>{section.code}</span>
                      )}
                      <span style={{ fontSize: '11px', color: C.textFaint }}>
                        {sectionSeats.length} seats
                      </span>
                    </div>

                    <p style={{ fontSize: '11px', marginBottom: 12 }}>
                      {unpricedCount > 0 ? (
                        <span style={{ color: C.amber }}>
                          {unpricedCount} seat{unpricedCount === 1 ? '' : 's'} unpriced —
                          not sellable yet
                        </span>
                      ) : (
                        <span style={{ color: C.textFaint }}>
                          {sectionSeats[0]?.ticket_tier?.name} · $
                          {sectionSeats[0]?.ticket_tier
                            ? parseFloat(sectionSeats[0].ticket_tier.price).toFixed(2)
                            : '—'}
                        </span>
                      )}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {sectionSeats.map((seat) => {
                        const unavailable = seat.status !== 'available';
                        const unpriced = !seat.ticket_tier_id;

                        return (
                          <SeatChip
                            key={seat.id}
                            label={seat.label}
                            unavailable={unavailable}
                            unpriced={unpriced}
                            title={
                              unavailable
                                ? `${seat.status} — cannot be removed`
                                : unpriced
                                  ? 'No ticket tier assigned yet'
                                  : seat.ticket_tier?.name
                            }
                            onDelete={() => deleteSeat(seat.id)}
                          />
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

function SeatChip({
  label,
  unavailable,
  unpriced,
  title,
  onDelete,
}: {
  label: string;
  unavailable: boolean;
  unpriced: boolean;
  title?: string;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const style: React.CSSProperties = unavailable
    ? { background: C.bg, border: `1px solid ${C.border}`, color: C.textFaint }
    : unpriced
      ? { background: C.bg, border: `1px solid ${C.amber}60`, color: C.amber }
      : { background: C.bgAlt, border: `1px solid ${C.border}`, color: C.textMuted };

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        title={title}
        style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px', ...style }}
      >
        {label}
      </div>

      {!unavailable && hovered && (
        <button
          type="button"
          onClick={onDelete}
          style={{
            position: 'absolute', top: -8, right: -8, width: 20, height: 20,
            borderRadius: '50%', background: C.error, color: C.textInverse,
            fontSize: '12px', lineHeight: '20px', border: 'none', cursor: 'pointer',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
