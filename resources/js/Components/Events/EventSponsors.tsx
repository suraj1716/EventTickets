// resources/js/Components/Events/EventSponsors.tsx
//
// Buyer-side "Sponsors" section for Events/Show.tsx.
// Vertical list grouped by tier (Platinum → Gold → Partners), small
// fixed-size tiles left-aligned (never full-width), logo image covers
// the tile. Logos link out when the sponsor has a website_url.
//
// Same Box Office palette as Events/Show.tsx.

import { motion } from "framer-motion";

export type SponsorTier = "platinum" | "gold" | "other";

export interface EventSponsor {
  id: number;
  name: string;
  logo_url: string | null;
  tier: SponsorTier;
  tier_label: string;
  website_url: string | null;
  position: number;
}

interface Props {
  sponsors: EventSponsor[];
  title?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

// Tier display order. The backend already returns them sorted
// (Event::sponsors()), this just controls grouping.
const TIER_ORDER: SponsorTier[] = ["platinum", "gold", "other"];

const TILE_SIZE: Record<SponsorTier, string> = {
  platinum: "h-14 w-24",
  gold: "h-12 w-20",
  other: "h-10 w-16",
};

const TIER_ACCENT: Record<SponsorTier, string> = {
  platinum: "border-[#C9D4E5]/35 hover:border-[#C9D4E5]/70",
  gold: "border-[#FFB627]/35 hover:border-[#FFB627]/70",
  other: "border-[#26232E] hover:border-[#FFB627]/40",
};

const TIER_TEXT: Record<SponsorTier, string> = {
  platinum: "text-[#DCE5F2]",
  gold: "text-[#FFB627]",
  other: "text-[#6B6775]",
};

export default function EventSponsors({ sponsors, title = "Sponsors" }: Props) {
  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  const groups = TIER_ORDER.map((tier) => ({
    tier,
    label: sponsors.find((s) => s.tier === tier)?.tier_label ?? tier,
    items: sponsors.filter((s) => s.tier === tier),
  })).filter((group) => group.items.length > 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <h2 className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.2em] text-[#6B6775] mb-4">
        {title}
      </h2>

      <div className="space-y-3">
        {groups.map((group) => (
          <div
            key={group.tier}
            className="grid grid-cols-[84px_1fr] items-center gap-x-4"
          >
            <p
              className={[
                "font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.25em]",
                TIER_TEXT[group.tier],
              ].join(" ")}
            >
              {group.label}
            </p>

            {/* Logos for every tier start at the same x — the label
                column above is a fixed width, so this row always begins
                in the same place regardless of label length. */}
            <div className="flex flex-wrap items-center gap-2">
              {group.items.map((sponsor) => (
                <SponsorTile key={sponsor.id} sponsor={sponsor} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function SponsorTile({ sponsor }: { sponsor: EventSponsor }) {
  const tileClassName = [
    "shrink-0 overflow-hidden rounded-lg border bg-[#15141B] transition-colors",
    TILE_SIZE[sponsor.tier],
    TIER_ACCENT[sponsor.tier],
  ].join(" ");

  const tile = sponsor.logo_url ? (
    <div className={tileClassName}>
      <img
        src={sponsor.logo_url}
        alt={sponsor.name}
        loading="lazy"
        className="h-full w-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
      />
    </div>
  ) : (
    <div
      className={[
        tileClassName,
        "flex items-center justify-center",
      ].join(" ")}
    >
      <span className="px-1 text-center text-[9px] font-bold leading-tight text-[#9C97A8] transition-colors group-hover:text-white">
        {sponsor.name}
      </span>
    </div>
  );

  if (sponsor.website_url) {
    return (
      <a
        href={sponsor.website_url}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        title={sponsor.name}
        className="group"
      >
        {tile}
      </a>
    );
  }

  return (
    <div title={sponsor.name} className="group">
      {tile}
    </div>
  );
}
