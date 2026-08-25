import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Ticket as TicketIcon, MapPin, ArrowRight } from 'lucide-react';

/*
|--------------------------------------------------------------------------
| Palette — matched 1:1 to Navbar.tsx / Footer.tsx / Home.tsx so this page
| reads as the same box office rather than a bolted-on dashboard screen.
|--------------------------------------------------------------------------
*/

const C = {
  bg: '#0B0B10',
  surface: '#15141B',
  border: '#26232E',
  borderDashed: '#33303C',
  text: '#F7F5F2',
  textMuted: '#9C97A8',
  textFaint: '#6B6775',
  textFainter: '#565262',
  amber: '#FFB627',
  amberHover: '#ffc75c',
};

interface Ticket {
  id: number;
  code: string;
  qr_path: string | null;
  barcode_path: string | null;
  status: string;
  ticket_tier?: {
    id: number;
    name: string;
    price: string;
  };
  event_leg?: {
    id: number;
    venue_name: string;
    city?: string | null;
    event_date: string;
    event?: {
      id: number;
      name: string;
      slug: string;
    };
  };
}

interface Props {
  tickets: Ticket[];
}

const STATUS_STYLES: Record<string, { fg: string; bg: string; border: string }> = {
  active: { fg: C.amber, bg: 'rgba(255,182,39,0.1)', border: 'rgba(255,182,39,0.3)' },
  valid: { fg: C.amber, bg: 'rgba(255,182,39,0.1)', border: 'rgba(255,182,39,0.3)' },
  used: { fg: C.textFaint, bg: 'rgba(255,255,255,0.03)', border: C.border },
  redeemed: { fg: C.textFaint, bg: 'rgba(255,255,255,0.03)', border: C.border },
  cancelled: { fg: '#e08585', bg: 'rgba(224,133,133,0.08)', border: 'rgba(224,133,133,0.3)' },
  refunded: { fg: '#e08585', bg: 'rgba(224,133,133,0.08)', border: 'rgba(224,133,133,0.3)' },
};

function StatusBadge({ status }: { status: string }) {
  const key = status?.toLowerCase() ?? '';
  const s = STATUS_STYLES[key] ?? { fg: C.textMuted, bg: 'rgba(255,255,255,0.04)', border: C.border };
  return (
    <span
      className="font-['IBM_Plex_Mono']"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: s.fg,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 999,
        padding: '4px 10px',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.fg, flexShrink: 0 }} />
      {status}
    </span>
  );
}

function formatEventDate(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TicketsIndex({ tickets }: Props) {

  return (
    <AuthenticatedLayout>
      <Head title="My Tickets" />

      <style>{`
        .mt-perf {
          position: relative;
          height: 1px;
          border-top: 1px dashed ${C.borderDashed};
          margin-bottom: 40px;
        }
        .mt-perf::before, .mt-perf::after {
          content: '';
          position: absolute;
          top: -9px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${C.bg};
        }
        .mt-perf::before { left: -9px; }
        .mt-perf::after { right: -9px; }

        .mt-card {
          position: relative;
          display: block;
          border-radius: 10px;
          border: 1px solid ${C.border};
          background: ${C.surface};
          padding: 22px 24px;
          text-decoration: none;
          transition: border-color 0.18s ease, transform 0.18s ease;
          overflow: hidden;
        }
        .mt-card:hover {
          border-color: rgba(255,182,39,0.4);
          transform: translateY(-1px);
        }
        .mt-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: ${C.amber};
          opacity: 0.6;
        }
        /* ticket-stub notches on the card edges */
        .mt-card::after {
          content: '';
          position: absolute;
          right: 128px;
          top: 0;
          bottom: 0;
          border-left: 1px dashed ${C.borderDashed};
          display: none;
        }
        @media (min-width: 640px) {
          .mt-card::after { display: block; }
        }

@media (min-width: 640px) {
  .mt-view-link {
    border-left: 1px dashed var(--border-dashed, currentColor);
    padding-left: 16px;
  }
}


        .mt-view-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${C.amber};
          flex-shrink: 0;
        }
        .mt-card:hover .mt-view-link { color: ${C.amberHover}; }

        .mt-empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 24px;
          padding: 13px 26px;
          border-radius: 6px;
          background: ${C.amber};
          color: ${C.bg};
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.18s ease;
        }
        .mt-empty-btn:hover { background: ${C.amberHover}; }
      `}</style>

      <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-1 py-12">
          <div className="mb-2">
            <p
              className="font-['IBM_Plex_Mono']"
              style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.amber, display: 'flex', alignItems: 'center', gap: 9 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber, display: 'inline-block' }} />
              Your purchases
            </p>

            <h1 className="font-['Anton']" style={{ textTransform: 'uppercase', fontSize: 'clamp(1.9rem, 4vw, 2.6rem)', color: C.text, marginTop: 10, letterSpacing: '0.005em' }}>
              My Tickets
            </h1>

            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13.5, color: C.textMuted, marginTop: 10 }}>
              View your purchased tickets and scan codes at the door.
            </p>
          </div>

          <div className="mt-perf" />

          {tickets.length === 0 ? (
            <div
              style={{
                borderRadius: 14,
                border: `1px dashed ${C.borderDashed}`,
                background: C.surface,
                padding: '64px 24px',
                textAlign: 'center',
              }}
            >
              <TicketIcon size={28} color={C.amber} strokeWidth={1.6} style={{ margin: '0 auto 16px' }} />
              <h2 className="font-['Anton']" style={{ textTransform: 'uppercase', fontSize: 20, color: C.text }}>
                No tickets yet
              </h2>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13.5, color: C.textMuted, marginTop: 8 }}>
                Your purchased event tickets will appear here.
              </p>
              <Link href={route('events.index')} className="mt-empty-btn">
                Browse Events
                <ArrowRight size={13} strokeWidth={2} />
              </Link>
            </div>
          ) : (
         <div className="space-y-10">
  {tickets.map((ticket) => {
    const eventDate = formatEventDate(ticket.event_leg?.event_date);
    return (
      <Link
        key={ticket.id}
        href={route('tickets.show', ticket.id)}
        className="flex flex-col sm:flex-row gap-3 sm:gap-4"
      >
        {/* Image — its own box, left on desktop / top on mobile */}
        <div
          className="relative w-full h-40 sm:h-auto sm:w-36 md:w-44 lg:w-52 shrink-0 rounded-lg overflow-hidden"
          style={{ border: `1px solid ${C.borderDashed}` }}
        >
        {ticket.event_leg?.event?.media?.length ? (
  <img
    src={
      ticket.event_leg.event.media[0].path.startsWith('http')
        ? ticket.event_leg.event.media[0].path
        : `/storage/${ticket.event_leg.event.media[0].path}`
    }
    alt=""
    className="h-full w-full object-cover"
  />
) : ticket.event_leg?.event?.image_url ? (
  <img
    src={ticket.event_leg.event.image_url}
    alt=""
    className="h-full w-full object-cover"
  />
) : (
            <div
              className="h-full w-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.bg})` }}
            >
              <TicketIcon size={24} color={C.textFainter} strokeWidth={1.4} />
            </div>
          )}
        </div>

        {/* Content card — its own box, fills remaining width */}
        <div className="mt-card flex-1" style={{ margin: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 h-full">
            <div style={{ minWidth: 0, paddingLeft: 8 }}>
              <StatusBadge status={ticket.status} />

              <h2
                className="font-['Anton']"
                style={{
                  textTransform: 'uppercase',
                  fontSize: 19,
                  color: C.text,
                  marginTop: 10,
                  letterSpacing: '0.005em',
                  wordBreak: 'break-word',
                }}
              >
                {ticket.event_leg?.event?.name ?? 'Event'}
              </h2>

              <p
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 13,
                  color: C.textMuted,
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                {ticket.ticket_tier?.name ?? 'Ticket'}
                {ticket.ticket_tier?.price ? ` · $${ticket.ticket_tier.price}` : ''}
              </p>

              {(ticket.event_leg?.venue_name || eventDate) && (
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11.5,
                    color: C.textFaint,
                    marginTop: 10,
                  }}
                >
                  <MapPin size={12} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                  {ticket.event_leg?.venue_name}
                  {ticket.event_leg?.city ? ` · ${ticket.event_leg.city}` : ''}
                  {eventDate ? ` · ${eventDate}` : ''}
                </p>
              )}

              <p
                className="font-['IBM_Plex_Mono']"
                style={{
                  fontSize: 10.5,
                  color: C.textFainter,
                  marginTop: 10,
                  letterSpacing: '0.04em',
                }}
              >
                Ticket code: {ticket.code}
              </p>
            </div>

            {/* View — pinned right on desktop (matches the "|" divider
                in the sketch), below content on mobile */}
            <div
              className="mt-view-link shrink-0 sm:pl-4"
              style={{
                borderLeft: undefined,
              }}
            >
              View Ticket
              <ArrowRight size={13} strokeWidth={2} />
            </div>
          </div>
        </div>
      </Link>
    );
  })}
</div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
