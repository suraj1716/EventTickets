// resources/js/Components/TicketResaleBadge.tsx
//
// Shown directly on the ticket display page, next to the QR — meaning
// it's part of what would appear in any screenshot of the ticket.
// The badge itself isn't the security mechanism (a screenshot of a
// badge is just as fake-able as a screenshot of a QR) — the actual
// protection is that code only rotates through TicketResaleService,
// checkable live at /verify. This badge exists so the LEGITIMATE
// holder sees their own ticket's real status, and so anyone shown a
// screenshot has a clear, findable path (the verify link) to check
// it themselves before paying.

type ResaleBadgeState = 'verified_original' | 'verified_resold' | 'listed_for_resale';

interface Props {
  state: ResaleBadgeState;
  verifyUrl: string;
}

const CONFIG: Record<ResaleBadgeState, { label: string; sub: string; color: string }> = {
  verified_original: {
    label: 'Verified — Original',
    sub: 'Never resold',
    color: 'emerald',
  },
  verified_resold: {
    label: 'Verified — Resold',
    sub: 'Transferred via this platform',
    color: 'sky',
  },
  listed_for_resale: {
    label: 'Listed for resale',
    sub: 'This ticket cannot be scanned while listed',
    color: 'amber',
  },
};

const COLOR_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-950/30 border-emerald-900 text-emerald-400',
  sky: 'bg-sky-950/30 border-sky-900 text-sky-400',
  amber: 'bg-amber-950/30 border-amber-900 text-amber-400',
};

export default function TicketResaleBadge({ state, verifyUrl }: Props) {
  const { label, sub, color } = CONFIG[state];

  return (
    <div className={`rounded-xl border p-4 ${COLOR_CLASSES[color]}`}>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <p className="font-semibold text-sm">{label}</p>
      </div>
      <p className="text-xs opacity-80 mt-1">{sub}</p>

      <a
        href={verifyUrl}
        className="inline-flex items-center gap-1.5 text-xs underline mt-2.5 opacity-90 hover:opacity-100"
      >
        Buying this from someone else? Verify it's still valid before you pay →
      </a>
    </div>
  );
}
