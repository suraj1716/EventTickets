import { Head, Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
  Ticket as TicketIcon,
  MapPin,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";
import ResaleListingForm from "@/Components/ResaleListingForm";
const C = {
  bg: "#0B0B10",
  surface: "#15141B",
  border: "#26232E",
  borderDashed: "#33303C",
  text: "#F7F5F2",
  textMuted: "#9C97A8",
  textFaint: "#6B6775",
  textFainter: "#565262",
  amber: "#FFB627",
  amberHover: "#ffc75c",
};

interface Ticket {
  id: number;
  code: string;
  qr_path: string | null;
  barcode_path: string | null;

  status: "valid" | "listed" | "used" | "void";

  owner_user_id: number | null;
  stripe_account_active: boolean;

  active_listing: {
    id: number;
    price: string;
  } | null;

  ticket_tier?: {
    name: string;
    price: string;
  };

  event_leg?: {
    venue_name: string;
    city?: string | null;
    event_date: string;
    event?: {
      name: string;
    };
  };
}

interface Props {
  ticket: Ticket;
}
interface AuthUser {
  id: number;
}

interface PageProps {
  auth: {
    user: AuthUser | null;
  };
}
const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  valid: { fg: "#7CE0A8", bg: "rgba(124,224,168,0.1)" },
  active: { fg: "#7CE0A8", bg: "rgba(124,224,168,0.1)" },
  used: { fg: C.textFaint, bg: "rgba(255,255,255,0.04)" },
  redeemed: { fg: C.textFaint, bg: "rgba(255,255,255,0.04)" },
  cancelled: { fg: "#E08585", bg: "rgba(224,133,133,0.1)" },
  refunded: { fg: "#E08585", bg: "rgba(224,133,133,0.1)" },
};

export default function TicketShow({ ticket }: Props) {
  const { auth } = usePage<PageProps>().props;
  const storageUrl = (path: string | null) =>
    path ? `/storage/${path}` : null;

  const qrUrl = storageUrl(ticket.qr_path);
  const barcodeUrl = storageUrl(ticket.barcode_path);

  const statusKey = ticket.status?.toLowerCase?.() ?? "";
  const statusColor = STATUS_COLORS[statusKey] ?? {
    fg: C.amber,
    bg: "rgba(255,182,39,0.1)",
  };

  return (
    <AuthenticatedLayout>
      <Head title={`Ticket ${ticket.code}`} />

      <style>{`
        .tk-page { min-height: 100vh; background: ${C.bg}; color: ${C.text}; font-family: 'Manrope', sans-serif; }
        .tk-back {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${C.textFaint};
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.15s ease;
        }
        .tk-back:hover { color: ${C.text}; }

        .tk-stub {
          margin-top: 24px;
          border-radius: 16px;
          border: 1px solid ${C.border};
          background: ${C.surface};
          overflow: hidden;
        }
        .tk-stub-top { padding: 28px 28px 24px; }
        .tk-stub-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }
        .tk-status-pill {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 999px;
        }
        .tk-brand {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${C.textFainter};
        }
.tk-resell-wrap {
  margin-top: 20px;
}

.tk-resell-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  border: 1px solid #E5484D;
    background: #FF1F1F;
  color: #FFFFFF;

  border-radius: 10px;
  padding: 12px 16px;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;

  transition: all 0.15s ease;
}

.tk-resell-button:hover {
  background: #D90000;
  border-color: #D90000;
  color: #FFFFFF;
}
        .tk-event-name {
          font-family: 'Anton', sans-serif;
          text-transform: uppercase;
          font-size: 1.7rem;
          line-height: 1.15;
          letter-spacing: 0.01em;
          color: ${C.text};
          margin: 0 0 18px;
        }

        .tk-meta-list { display: flex; flex-direction: column; gap: 9px; }
        .tk-meta-row {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12.5px;
          color: ${C.textMuted};
          line-height: 1.5;
        }
        .tk-meta-icon { color: ${C.amber}; flex-shrink: 0; margin-top: 1px; }
        .tk-tier {
          display: inline-block;
          margin-top: 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          color: ${C.amber};
          border: 1px solid rgba(255,182,39,0.3);
          background: rgba(255,182,39,0.06);
          border-radius: 999px;
          padding: 5px 12px;
        }

        /* ── ticket perforation seam ── */
        .tk-perf {
          position: relative;
          height: 1px;
          border-top: 1px dashed ${C.borderDashed};
        }
        .tk-perf::before, .tk-perf::after {
          content: '';
          position: absolute;
          top: -10px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${C.bg};
        }
        .tk-perf::before { left: -10px; }
        .tk-perf::after { right: -10px; }

        .tk-stub-bottom { padding: 24px 28px 28px; }

        .tk-code-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${C.textFaint};
          margin: 0 0 6px;
        }
        .tk-code {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 1.15rem;
          letter-spacing: 0.08em;
          color: ${C.text};
          word-break: break-all;
        }

        .tk-scan-box {
          margin-top: 22px;
          border-radius: 12px;
          background: #ffffff;
          padding: 22px;
          display: flex;
          justify-content: center;
        }
        .tk-scan-box img { display: block; }

        .tk-scan-hint {
          text-align: center;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.08em;
          color: ${C.textFaint};
          margin-top: 18px;
        }
      `}</style>

      <div className="tk-page">
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>
          <Link href={route("tickets.index")} className="tk-back">
            <ArrowLeft size={13} strokeWidth={2} />
            Back to my tickets
          </Link>

          <div className="tk-stub">
            <div className="tk-stub-top">
              <div className="tk-stub-header">
                <span
                  className="tk-status-pill"
                  style={{ color: statusColor.fg, background: statusColor.bg }}
                >
                  {ticket.status}
                </span>
                <span className="tk-brand">
                  <TicketIcon size={13} color={C.amber} strokeWidth={1.8} />
                  Box Office
                </span>
              </div>

              <h1 className="tk-event-name">{ticket.event_leg?.event?.name}</h1>

              <div className="tk-meta-list">
                {ticket.event_leg?.event_date && (
                  <div className="tk-meta-row">
                    <CalendarDays
                      size={14}
                      className="tk-meta-icon"
                      strokeWidth={1.8}
                    />
                    <span>
                      {new Date(ticket.event_leg.event_date).toLocaleDateString(
                        "en-AU",
                        {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                )}

                {(ticket.event_leg?.venue_name || ticket.event_leg?.city) && (
                  <div className="tk-meta-row">
                    <MapPin
                      size={14}
                      className="tk-meta-icon"
                      strokeWidth={1.8}
                    />
                    <span>
                      {ticket.event_leg?.venue_name}
                      {ticket.event_leg?.venue_name && ticket.event_leg?.city
                        ? ", "
                        : ""}
                      {ticket.event_leg?.city}
                    </span>
                  </div>
                )}
              </div>

              {ticket.ticket_tier?.name && (
                <span className="tk-tier">
                  {ticket.ticket_tier.name}
                  {ticket.ticket_tier.price
                    ? ` · $${ticket.ticket_tier.price}`
                    : ""}
                </span>
              )}
            </div>

            <div className="tk-perf" />

            <div className="tk-stub-bottom">
              <p className="tk-code-label">Ticket code</p>
              <p className="tk-code">{ticket.code}</p>

              {qrUrl && (
                <div className="tk-scan-box">
                  <img
                    src={qrUrl}
                    alt="Ticket QR code"
                    style={{ width: 208, height: 208 }}
                  />
                </div>
              )}

              {barcodeUrl && (
                <div className="tk-scan-box">
                  <img
                    src={barcodeUrl}
                    alt="Ticket barcode"
                    style={{
                      maxWidth: "100%",
                      height: 96,
                      objectFit: "contain",
                    }}
                  />
                </div>
              )}

              <p className="tk-scan-hint">
                Present this QR code or barcode at the entrance
              </p>
            </div>
          </div>

          <ResaleListingForm
            ticketId={ticket.id}
            isOwner={auth.user?.id === ticket.owner_user_id}
            ticketStatus={ticket.status}
            stripeAccountActive={ticket.stripe_account_active}
            activeListing={ticket.active_listing}
          />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
