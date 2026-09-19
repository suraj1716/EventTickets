// resources/js/Components/Events/SponsorStrip.tsx
//
// Compact sponsor row for the event cards on Events/Index.tsx.
// Shows the top few logos (already tier-sorted by Event::sponsors()) plus
// a +N overflow chip. Non-interactive on purpose — the whole card is a
// link to the event, so nested anchors would break it.

import type { EventSponsor } from "./EventSponsors";

interface Props {
  sponsors?: EventSponsor[] | null;
  max?: number;
}

export default function SponsorStrip({ sponsors, max = 3 }: Props) {
  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  const shown = sponsors.slice(0, max);
  const overflow = sponsors.length - shown.length;

  return (
    <div className="mt-3 flex items-center gap-2 border-t border-dashed border-[#26232E] pt-3">
      <span className="font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-[0.2em] text-[#565262] shrink-0">
        Sponsors
      </span>

      <div className="flex min-w-0 items-center gap-1.5">
        {shown.map((sponsor) =>
          sponsor.logo_url ? (
            <img
              key={sponsor.id}
              src={sponsor.logo_url}
              alt={sponsor.name}
              title={sponsor.name}
              loading="lazy"
              className="h-6 w-12 shrink-0 rounded bg-[#0B0B10] object-contain p-0.5 opacity-80"
            />
          ) : (
            <span
              key={sponsor.id}
              title={sponsor.name}
              className="max-w-[72px] truncate rounded bg-[#0B0B10] px-1.5 py-0.5 text-[10px] text-[#9C97A8]"
            >
              {sponsor.name}
            </span>
          ),
        )}

        {overflow > 0 && (
          <span className="shrink-0 text-[10px] text-[#565262]">
            +{overflow}
          </span>
        )}
      </div>
    </div>
  );
}
