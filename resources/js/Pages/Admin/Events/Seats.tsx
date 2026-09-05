import { useMemo, useState } from 'react';
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
  aisle_after: boolean;
  sort_order: number;
}

interface VenueSection {
  id: number;
  name: string;
  code: string | null;
  sort_order?: number;
  seats: VenueSeat[];
}

interface TicketTier {
  id: number;
  name: string;
  price: string;
}

interface EventSeat {
  id: number;
  venue_seat_id: number | null;
  row_label: string;
  seat_number: number;
  label: string;
  status: string;
  ticket_tier_id: number | null;
  sort_order: number;

  ticket_tier?: TicketTier | null;

  venue_seat?: VenueSeat & {
    section?: VenueSection | null;
  };
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

const panelStyle: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  overflow: 'hidden',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontFamily: fontBody,
  fontSize: 13,
  color: C.text,
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  outline: 'none',
  minWidth: 180,
};

function money(value: string | number | null | undefined) {
  return Number(value ?? 0).toFixed(2);
}

function statusLabel(status: string) {
  switch (status) {
    case 'available':
      return 'Available';
    case 'reserved':
      return 'Reserved';
    case 'sold':
      return 'Sold';
    case 'blocked':
      return 'Blocked';
    default:
      return status;
  }
}

function statusStyle(status: string, unpriced = false): React.CSSProperties {
  if (unpriced) {
    return {
      background: 'rgba(245,158,11,.10)',
      border: '1px solid rgba(245,158,11,.35)',
      color: C.amber,
    };
  }

  switch (status) {
    case 'sold':
      return {
        background: 'rgba(239,68,68,.12)',
        border: '1px solid rgba(239,68,68,.35)',
        color: C.error,
      };

    case 'reserved':
      return {
        background: 'rgba(245,158,11,.12)',
        border: '1px solid rgba(245,158,11,.35)',
        color: C.amber,
      };

    case 'blocked':
      return {
        background: 'rgba(148,163,184,.12)',
        border: '1px solid rgba(148,163,184,.35)',
        color: C.textMuted,
      };

    default:
      return {
        background: C.bg,
        border: `1px solid ${C.border}`,
        color: C.text,
      };
  }
}

function seatTypeLabel(type: string | null) {
  if (!type) return 'Standard';

  return type
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Seats({ eventLeg, venue, seats }: Props) {
  const [activeSectionId, setActiveSectionId] = useState<number | 'all'>('all');

  const initialAssignments = useMemo(() => {
    const result: Record<number, string> = {};

    for (const seat of seats) {
      const sectionId =
        seat.venue_seat?.venue_section_id ??
        seat.venue_seat?.section?.id;

      if (
        sectionId &&
        seat.ticket_tier_id &&
        result[sectionId] === undefined
      ) {
        result[sectionId] = String(seat.ticket_tier_id);
      }
    }

    return result;
  }, [seats]);

  const [sectionAssignments, setSectionAssignments] =
    useState<Record<number, string>>(initialAssignments);

  const totalVenueSeats =
    venue?.sections.reduce(
      (total, section) => total + section.seats.filter((s) => s.is_active).length,
      0
    ) ?? 0;

  const available = seats.filter((seat) => seat.status === 'available').length;
  const reserved = seats.filter((seat) => seat.status === 'reserved').length;
  const sold = seats.filter((seat) => seat.status === 'sold').length;
  const blocked = seats.filter((seat) => seat.status === 'blocked').length;
  const unpriced = seats.filter((seat) => !seat.ticket_tier_id).length;

  const visibleSections =
    activeSectionId === 'all'
      ? venue?.sections ?? []
      : (venue?.sections ?? []).filter(
          (section) => section.id === activeSectionId
        );

  function setAssignment(sectionId: number, tierId: string) {
    setSectionAssignments((prev) => ({
      ...prev,
      [sectionId]: tierId,
    }));
  }

  function importVenueSeats() {
    if (!venue) {
      alert('This event leg does not have a venue selected.');
      return;
    }

    if (totalVenueSeats === 0) {
      alert('This venue does not have any active seats configured.');
      return;
    }

    if (seats.some((seat) => seat.status !== 'available')) {
      alert(
        'This event has reserved, sold, or blocked seats. The seat map cannot be regenerated while those seats exist.'
      );
      return;
    }

    // Any section left unassigned imports with ticket_tier_id = null,
    // which the buyer-facing seat chart treats as unsellable/unavailable.
    // Warn with real seat counts before that happens silently.
    const sectionsWithoutTier = (venue?.sections ?? []).filter(
      (section) => !sectionAssignments[section.id]
    );

    if (sectionsWithoutTier.length > 0) {
      const details = sectionsWithoutTier
        .map((section) => {
          const seatCount = section.seats.filter((s) => s.is_active).length;
          return `${section.name} (${seatCount} seats)`;
        })
        .join(', ');

      const confirmed = confirm(
        `These sections have no ticket tier assigned and will NOT be sellable to buyers: ${details}. Import anyway?`
      );

      if (!confirmed) return;
    }

    if (seats.length > 0) {
      const confirmed = confirm(
        'Re-importing the venue layout will replace the current event seat inventory. Continue?'
      );

      if (!confirmed) return;
    }

    const payload = {
      section_assignments: Object.fromEntries(
        Object.entries(sectionAssignments).filter(
          ([, tierId]) => tierId !== ''
        )
      ),
    };

    router.post(
      route('admin.event-legs.seats.import', eventLeg.id),
      payload,
      {
        preserveScroll: true,
      }
    );
  }

  function deleteSeat(seatId: number, label: string) {
    if (
      !confirm(
        `Remove seat ${label} from this event? This does not modify the venue layout.`
      )
    ) {
      return;
    }

    router.delete(
      route('admin.event-legs.seats.seat.destroy', {
        eventLeg: eventLeg.id,
        seat: seatId,
      }),
      {
        preserveScroll: true,
      }
    );
  }

  function clearInventory() {
    if (
      !confirm(
        'Clear the entire event seat inventory? The venue template will not be changed.'
      )
    ) {
      return;
    }

    router.delete(
      route('admin.event-legs.seats.destroy', eventLeg.id),
      {
        preserveScroll: true,
      }
    );
  }

  function rowsForSection(section: VenueSection) {
    const sectionSeatIds = new Set(
      section.seats.filter((seat) => seat.is_active).map((seat) => seat.id)
    );

    const sectionEventSeats = seats.filter(
      (seat) =>
        seat.venue_seat_id !== null &&
        sectionSeatIds.has(seat.venue_seat_id)
    );

    const rows = new Map<string, EventSeat[]>();

    for (const seat of sectionEventSeats) {
      const row = seat.row_label || '—';

      if (!rows.has(row)) {
        rows.set(row, []);
      }

      rows.get(row)!.push(seat);
    }

    return Array.from(rows.entries())
      .map(([row, rowSeats]) => {
        const sorted = [...rowSeats].sort((a, b) => {
          const aOrder =
            a.venue_seat?.sort_order ??
            a.sort_order ??
            a.seat_number;

          const bOrder =
            b.venue_seat?.sort_order ??
            b.sort_order ??
            b.seat_number;

          return aOrder - bOrder;
        });

        return {
          row,
          seats: sorted,
        };
      })
      .sort((a, b) => {
        const aOrder = a.seats[0]?.venue_seat?.sort_order ?? 0;
        const bOrder = b.seats[0]?.venue_seat?.sort_order ?? 0;

        if (aOrder !== bOrder) return aOrder - bOrder;

        return a.row.localeCompare(b.row, undefined, {
          numeric: true,
        });
      });
  }

  return (
    <AdminLayout>
      <Head title={`Seats — ${eventLeg.venue_name}`} />

      <div
        style={{
          maxWidth: 1250,
          margin: '0 auto',
          paddingBottom: 50,
        }}
      >
        <AdminPageHeader
          eyebrow="Event seating"
          title={`Manage seats — ${eventLeg.venue_name}`}
          meta="The venue controls the physical layout. This event controls pricing, inventory and seat availability."
        />

        {/* Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(145px, 1fr))',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            ['Configured', seats.length, C.text],
            ['Available', available, C.text],
            ['Reserved', reserved, C.amber],
            ['Sold', sold, C.error],
            ['Blocked', blocked, C.textMuted],
            ['Unpriced', unpriced, C.amber],
          ].map(([label, value, color]) => (
            <div
              key={String(label)}
              style={{
                ...panelStyle,
                padding: '15px 16px',
              }}
            >
              <div
                style={{
                  fontFamily: fontMono,
                  fontSize: 9,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: C.textFaint,
                }}
              >
                {label}
              </div>

              <div
                style={{
                  marginTop: 7,
                  fontSize: 22,
                  fontWeight: 700,
                  color: color as string,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Venue / actions */}
        <div
          style={{
            ...panelStyle,
            marginBottom: 20,
            padding: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: fontMono,
                  fontSize: 9,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: C.textFaint,
                }}
              >
                Venue
              </div>

              <h2
                style={{
                  marginTop: 5,
                  fontSize: 18,
                  fontWeight: 600,
                  color: C.text,
                }}
              >
                {venue?.name ?? eventLeg.venue_name}
              </h2>

              <p
                style={{
                  marginTop: 5,
                  fontSize: 12,
                  color: C.textMuted,
                }}
              >
                {venue?.sections.length ?? 0} sections ·{' '}
                {totalVenueSeats} active venue seats ·{' '}
                {eventLeg.seating_type === 'reserved'
                  ? 'Reserved seating'
                  : 'General admission'}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              {seats.length > 0 && (
                <AdminBtn
                  onClick={clearInventory}
                  style={{
                    background: 'transparent',
                    color: C.error,
                    border: `1px solid ${C.error}50`,
                  }}
                >
                  Clear event seats
                </AdminBtn>
              )}

              {venue && (
                <AdminBtn onClick={importVenueSeats}>
                  {seats.length > 0
                    ? 'Re-import venue layout'
                    : 'Import venue layout'}
                </AdminBtn>
              )}
            </div>
          </div>

          {!venue && (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 9,
                background: 'rgba(224,133,133,.08)',
                border: `1px solid ${C.error}40`,
                color: C.error,
                fontSize: 13,
              }}
            >
              No venue is assigned to this event leg. Select a venue before
              configuring reserved seats.
            </div>
          )}
        </div>

        {/* Pricing */}
        {venue && (
          <div
            style={{
              ...panelStyle,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: `1px dashed ${C.borderDashed}`,
              }}
            >
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text,
                }}
              >
                Section pricing
              </h2>

              <p
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: C.textMuted,
                }}
              >
                Assign a ticket tier to each physical venue section.
              </p>
            </div>

            {eventLeg.ticket_tiers.length === 0 ? (
              <div
                style={{
                  margin: 20,
                  padding: 14,
                  borderRadius: 9,
                  background: 'rgba(245,158,11,.08)',
                  border: `1px solid ${C.amber}40`,
                  color: C.amber,
                  fontSize: 13,
                }}
              >
                No ticket tiers exist for this event leg yet.
              </div>
            ) : (
              <div
                style={{
                  padding: 20,
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 10,
                }}
              >
                {venue.sections.map((section) => {
                  const activeSeats = section.seats.filter(
                    (seat) => seat.is_active
                  );

                  return (
                    <div
                      key={section.id}
                      style={{
                        border: `1px solid ${C.border}`,
                        borderRadius: 10,
                        padding: 13,
                        background: C.bg,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 12,
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: C.text,
                            }}
                          >
                            {section.name}
                          </div>

                          <div
                            style={{
                              marginTop: 3,
                              fontSize: 10,
                              color: C.textFaint,
                              fontFamily: fontMono,
                            }}
                          >
                            {activeSeats.length} seats
                            {section.code
                              ? ` · ${section.code}`
                              : ''}
                          </div>
                        </div>

                        <select
                          value={sectionAssignments[section.id] ?? ''}
                          onChange={(e) =>
                            setAssignment(
                              section.id,
                              e.target.value
                            )
                          }
                          style={selectStyle}
                        >
                          <option value="">
                            No price yet
                          </option>

                          {eventLeg.ticket_tiers.map((tier) => (
                            <option
                              key={tier.id}
                              value={tier.id}
                            >
                              {tier.name} · $
                              {money(tier.price)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Map */}
        <div style={panelStyle}>
          <div
            style={{
              padding: '18px 20px',
              borderBottom: `1px dashed ${C.borderDashed}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 15,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.text,
                  }}
                >
                  Event seat map
                </h2>

                <p
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: C.textFaint,
                  }}
                >
                  Physical rows and aisles come from the venue template.
                </p>
              </div>

              {venue && (
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSectionId('all')}
                    style={{
                      border: `1px solid ${
                        activeSectionId === 'all'
                          ? C.text
                          : C.border
                      }`,
                      background:
                        activeSectionId === 'all'
                          ? C.text
                          : C.bg,
                      color:
                        activeSectionId === 'all'
                          ? C.surface
                          : C.textMuted,
                      borderRadius: 7,
                      padding: '7px 11px',
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    All sections
                  </button>

                  {venue.sections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() =>
                        setActiveSectionId(section.id)
                      }
                      style={{
                        border: `1px solid ${
                          activeSectionId === section.id
                            ? C.text
                            : C.border
                        }`,
                        background:
                          activeSectionId === section.id
                            ? C.text
                            : C.bg,
                        color:
                          activeSectionId === section.id
                            ? C.surface
                            : C.textMuted,
                        borderRadius: 7,
                        padding: '7px 11px',
                        cursor: 'pointer',
                        fontSize: 11,
                      }}
                    >
                      {section.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {seats.length === 0 ? (
            <div
              style={{
                padding: '65px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 38,
                  marginBottom: 12,
                  opacity: .7,
                }}
              >
                💺
              </div>

              <h3
                style={{
                  color: C.text,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                No event seats configured
              </h3>

              <p
                style={{
                  marginTop: 5,
                  fontSize: 12,
                  color: C.textMuted,
                }}
              >
                Import the venue layout above to create this
                event's seat inventory.
              </p>
            </div>
          ) : (
            <div
              style={{
                padding: 20,
                overflowX: 'auto',
              }}
            >
              {/* Stage */}
              <div
                style={{
                  width: 'min(680px, 75%)',
                  minWidth: 300,
                  margin: '0 auto 35px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: C.text,
                    opacity: .8,
                  }}
                />

                <div
                  style={{
                    marginTop: 8,
                    fontFamily: fontMono,
                    fontSize: 9,
                    letterSpacing: '.18em',
                    textTransform: 'uppercase',
                    color: C.textFaint,
                  }}
                >
                  Stage / field
                </div>
              </div>

              {visibleSections.map((section) => {
                const rows = rowsForSection(section);

                if (rows.length === 0) {
                  return null;
                }

                const sectionTierIds = Array.from(
                  new Set(
                    seats
                      .filter(
                        (seat) =>
                          seat.venue_seat?.venue_section_id ===
                          section.id
                      )
                      .map((seat) => seat.ticket_tier_id)
                      .filter(Boolean)
                  )
                );

                return (
                  <div
                    key={section.id}
                    style={{
                      marginBottom: 30,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      background: C.bg,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 15px',
                        borderBottom: `1px dashed ${C.borderDashed}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 15,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: C.text,
                          }}
                        >
                          {section.name}
                        </div>

                        <div
                          style={{
                            marginTop: 3,
                            fontSize: 10,
                            color: C.textFaint,
                          }}
                        >
                          {rows.length} rows ·{' '}
                          {section.seats.filter(
                            (seat) => seat.is_active
                          ).length}{' '}
                          venue seats
                        </div>
                      </div>

                      {sectionTierIds.length > 0 && (
                        <div
                          style={{
                            fontSize: 10,
                            color: C.textMuted,
                          }}
                        >
                          Tier assigned
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        padding: '22px 15px',
                        minWidth: 760,
                      }}
                    >
                      {rows.map(({ row, seats: rowSeats }) => (
                        <div
                          key={`${section.id}-${row}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 9,
                          }}
                        >
                          <div
                            style={{
                              width: 35,
                              flex: '0 0 35px',
                              textAlign: 'right',
                              fontFamily: fontMono,
                              fontSize: 9,
                              color: C.textFaint,
                            }}
                          >
                            {row}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flex: 1,
                              gap: 5,
                            }}
                          >
                            {rowSeats.map((seat, index) => {
                              const venueSeat =
                                seat.venue_seat;

                              const unpriced =
                                !seat.ticket_tier_id;

                              const previousVenueSeat =
                                rowSeats[index - 1]?.venue_seat;

                              const hasAisle =
                                !!previousVenueSeat?.aisle_after;

                              return (
                                <div
                                  key={seat.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: hasAisle ? 14 : 5,
                                  }}
                                >
                                  <button
                                    type="button"
                                    title={`${seat.label} · ${statusLabel(
                                      seat.status
                                    )}${
                                      seat.ticket_tier
                                        ? ` · ${seat.ticket_tier.name} · $${money(
                                            seat.ticket_tier
                                              .price
                                          )}`
                                        : ' · No price'
                                    }${
                                      venueSeat?.seat_type
                                        ? ` · ${seatTypeLabel(
                                            venueSeat.seat_type
                                          )}`
                                        : ''
                                    }`}
                                    onClick={() => {
                                      if (
                                        seat.status ===
                                        'available'
                                      ) {
                                        deleteSeat(
                                          seat.id,
                                          seat.label
                                        );
                                      }
                                    }}
                                    style={{
                                      width: 31,
                                      height: 28,
                                      padding: 0,
                                      borderRadius: 6,
                                      cursor:
                                        seat.status ===
                                        'available'
                                          ? 'pointer'
                                          : 'default',
                                      fontFamily: fontMono,
                                      fontSize: 8,
                                      fontWeight: 600,
                                      ...statusStyle(
                                        seat.status,
                                        unpriced
                                      ),
                                      opacity:
                                        seat.status ===
                                        'blocked'
                                          ? .65
                                          : 1,
                                    }}
                                  >
                                    {seat.seat_number}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 18,
                  flexWrap: 'wrap',
                  paddingTop: 8,
                }}
              >
                {[
                  ['Available', 'available'],
                  ['Reserved', 'reserved'],
                  ['Sold', 'sold'],
                  ['Blocked', 'blocked'],
                  ['No price', 'unpriced'],
                ].map(([label, status]) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 10,
                      color: C.textMuted,
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 16,
                        borderRadius: 4,
                        display: 'inline-block',
                        ...statusStyle(
                          status === 'unpriced'
                            ? 'available'
                            : status,
                          status === 'unpriced'
                        ),
                      }}
                    />

                    {label}
                  </div>
                ))}
              </div>

              <p
                style={{
                  marginTop: 14,
                  textAlign: 'center',
                  fontSize: 10,
                  color: C.textFaint,
                }}
              >
                Clicking an available seat removes it from this
                event only. Sold or reserved seats cannot be removed.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
