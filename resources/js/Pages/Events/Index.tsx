// resources/js/Pages/Events/Index.tsx
//
// Design concept: "Box Office"
// The page borrows its visual language from live-music ticketing itself —
// a marquee-style hero, a box-office search window, and event cards built
// like real ticket stubs (perforated edge, punch holes, an "Admit One"
// stub with the price). Motion is handled with Framer Motion:
//   npm install framer-motion
//
// Fonts used (loaded via <Head> below): Anton (marquee display),
// Manrope (UI body), IBM Plex Mono (ticket/price details).

import { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import GuestLayout from "@/Layouts/GuestLayout";
import type {
  Category,
  Event,
  EventSearchFilters,
  EventType,
  Paginated,
  SortOption,
} from "@/types";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

interface Props {
  events: Paginated<Event>;
  filters: EventSearchFilters;
  categories: Category[];
}

const EASE = [0.16, 1, 0.3, 1] as const;
const MotionLink = motion(Link);

const filterContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const filterItemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
};

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export default function EventsIndex({ events, filters, categories }: Props) {

  const [local, setLocal] = useState<EventSearchFilters>(filters);
  function apply(next: Partial<EventSearchFilters>) {
    const merged = {
      ...local,
      ...next,
    };

    setLocal(merged);

    router.get(route("events.index"), merged, {
      preserveState: true,
      replace: true,
      preserveScroll: true,
    });
  }

  function toggleCategory(id: number) {
    const ids = local.category_ids ?? [];

    apply({
      category_ids: ids.includes(id)
        ? ids.filter((categoryId) => categoryId !== id)
        : [...ids, id],
    });
  }

  function clearFilters() {
    setLocal({});
    router.get(
      route("events.index"),
      {},
      {
        preserveState: true,
        replace: true,
        preserveScroll: true,
      },
    );
  }

  const hasFilters = Object.values(local).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined && value !== null && value !== "";
  });

  const heroWords = ["Find", "your", "next", "night", "out."];

  return (
    <AuthenticatedLayout>
      <Head title="Events">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen bg-[#0B0B10] text-[#F7F5F2] font-['Manrope']">
        {/* Hero — marquee */}
        <section className="relative overflow-hidden border-b border-[#26232E] min-h-[800px] sm:min-h-[600px] lg:min-h-[550px] flex items-center">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          >
            <source src="/videos/concert.mp4" type="video/mp4" />
          </video>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0B10]" />
          <div className="pointer-events-none absolute inset-0" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#FFB627] mb-4 flex items-center gap-2"
            >
              <motion.span
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-block h-1.5 w-1.5 rounded-full bg-[#FFB627]"
              />
              Box office — open now
            </motion.p>

            <h1 className="font-['Anton'] uppercase leading-[0.88] text-5xl sm:text-6xl lg:text-7xl tracking-tight flex flex-wrap gap-x-4 gap-y-2">
              {heroWords.map((word, i) => (
                <motion.span
                  key={word + i}
                  initial={{ opacity: 0, y: 44 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.08 * i, ease: EASE }}
                  className={i === heroWords.length - 1 ? "text-[#FFB627]" : ""}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mt-5 max-w-xl text-base sm:text-lg text-[#9C97A8] leading-relaxed"
            >
              Concerts, tours and unforgettable nights, all in one lineup.
            </motion.p>

            {/* Search — box office window */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="mt-9 max-w-2xl"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C97A8]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>

                  <input
                    type="text"
                    value={local.search ?? ""}
                    onChange={(e) =>
                      setLocal((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        apply({ search: local.search });
                      }
                    }}
                    placeholder="Search events, artists, venues..."
                    className="w-full h-[52px] rounded-xl border border-[#26232E] bg-[#15141B] pl-11 pr-4 text-sm text-[#F7F5F2] placeholder:text-[#6B6775] outline-none transition focus:border-[#FFB627]/60 focus:ring-2 focus:ring-[#FFB627]/20"
                  />
                </div>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => apply({ search: local.search })}
                  className="h-[52px] px-7 rounded-xl bg-[#FFB627] text-[#0B0B10] text-sm font-bold uppercase tracking-wide hover:bg-[#ffc75c] transition-colors"
                >
                  Search
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-8">
            {/* Filters */}
            <aside>
              <motion.div
                variants={filterContainerVariants}
                initial="hidden"
                animate="show"
                className="lg:sticky lg:top-6 space-y-6"
              >
                <motion.div
                  variants={filterItemVariants}
                  className="flex items-center justify-between"
                >
                  <h2 className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.2em] text-white">
                    Filters
                  </h2>

                  <AnimatePresence>
                    {hasFilters && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        type="button"
                        onClick={clearFilters}
                        className="text-xs text-[#6B6775] hover:text-[#FFB627] transition-colors"
                      >
                        Clear all
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Location */}
                <FilterSection title="Location">
                  <input
                    type="text"
                    value={local.city ?? ""}
                    onChange={(e) =>
                      setLocal((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        apply({ city: local.city });
                      }
                    }}
                    onBlur={() => apply({ city: local.city })}
                    placeholder="Sydney"
                    className={inputClass}
                  />
                </FilterSection>

                {/* Categories */}
                <FilterSection title="Genre">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const active = (local.category_ids ?? []).includes(
                        category.id,
                      );

                      return (
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          type="button"
                          key={category.id}
                          onClick={() => toggleCategory(category.id)}
                          className={[
                            "px-3 py-1.5 rounded-full text-xs border transition-colors",
                            active
                              ? "bg-[#FFB627] text-[#0B0B10] border-[#FFB627] font-semibold"
                              : "bg-[#15141B] text-[#9C97A8] border-[#26232E] hover:border-[#FFB627]/50 hover:text-white",
                          ].join(" ")}
                        >
                          {category.name}
                        </motion.button>
                      );
                    })}
                  </div>
                </FilterSection>

                {/* Artist */}
                <FilterSection title="Artist">
                  <input
                    type="text"
                    value={local.artist ?? ""}
                    onChange={(e) =>
                      setLocal((prev) => ({
                        ...prev,
                        artist: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        apply({ artist: local.artist });
                      }
                    }}
                    onBlur={() => apply({ artist: local.artist })}
                    placeholder="Artist name"
                    className={inputClass}
                  />
                </FilterSection>

                {/* Date */}
                <FilterSection title="Date">
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={local.date_from ?? ""}
                      onChange={(e) =>
                        apply({
                          date_from: e.target.value || undefined,
                        })
                      }
                      className={inputClass}
                    />

                    <input
                      type="date"
                      value={local.date_to ?? ""}
                      onChange={(e) =>
                        apply({
                          date_to: e.target.value || undefined,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                </FilterSection>

                {/* Price */}
                <FilterSection title="Price">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      value={local.price_min ?? ""}
                      onChange={(e) =>
                        setLocal((prev) => ({
                          ...prev,
                          price_min: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        }))
                      }
                      onBlur={() =>
                        apply({
                          price_min: local.price_min,
                        })
                      }
                      placeholder="Min"
                      className={inputClass}
                    />

                    <input
                      type="number"
                      min="0"
                      value={local.price_max ?? ""}
                      onChange={(e) =>
                        setLocal((prev) => ({
                          ...prev,
                          price_max: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        }))
                      }
                      onBlur={() =>
                        apply({
                          price_max: local.price_max,
                        })
                      }
                      placeholder="Max"
                      className={inputClass}
                    />
                  </div>
                </FilterSection>

                {/* Type */}
                <FilterSection title="Event type">
                  <select
                    value={local.type ?? ""}
                    onChange={(e) =>
                      apply({
                        type: (e.target.value || undefined) as
                          | EventType
                          | undefined,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="">All event types</option>
                    <option value="standalone">Standalone</option>
                    <option value="tour">Tour</option>
                  </select>
                </FilterSection>
              </motion.div>
            </aside>

            {/* Results */}
            <section className="min-w-0">
              {/* Result header */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
              >
                <div>
                  <p className="font-['IBM_Plex_Mono'] text-xs text-[#6B6775]">
                    {events.meta.total.toLocaleString()}{" "}
                    {events.meta.total === 1 ? "event" : "events"}
                  </p>

                  <h2 className="text-xl font-bold mt-1">Upcoming events</h2>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-[#6B6775]">Sort by</label>

                  <select
                    value={local.sort ?? "date"}
                    onChange={(e) =>
                      apply({
                        sort: e.target.value as SortOption,
                      })
                    }
                    className="bg-[#15141B] border border-[#26232E] rounded-lg px-3 py-2 text-sm text-[#F7F5F2] outline-none focus:border-[#FFB627]/50"
                  >
                    <option value="date">Soonest</option>
                    <option value="trending">Trending</option>
                    <option value="price_low">Price: low to high</option>
                  </select>
                </div>
              </motion.div>

              {/* Active filters */}
              <AnimatePresence mode="popLayout">
                {hasFilters && (
                  <motion.div layout className="flex flex-wrap gap-2 mb-5">
                    <AnimatePresence mode="popLayout">
                      {local.city && (
                        <FilterTag
                          key="city"
                          label={`City: ${local.city}`}
                          onRemove={() => apply({ city: undefined })}
                        />
                      )}

                      {local.artist && (
                        <FilterTag
                          key="artist"
                          label={`Artist: ${local.artist}`}
                          onRemove={() => apply({ artist: undefined })}
                        />
                      )}

                      {local.type && (
                        <FilterTag
                          key="type"
                          label={local.type === "tour" ? "Tour" : "Standalone"}
                          onRemove={() => apply({ type: undefined })}
                        />
                      )}

                      {local.date_from && (
                        <FilterTag
                          key="date_from"
                          label={`From ${formatFilterDate(local.date_from)}`}
                          onRemove={() => apply({ date_from: undefined })}
                        />
                      )}

                      {local.date_to && (
                        <FilterTag
                          key="date_to"
                          label={`Until ${formatFilterDate(local.date_to)}`}
                          onRemove={() => apply({ date_to: undefined })}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty */}
              {events.data.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="border border-dashed border-[#26232E] bg-[#15141B]/60 rounded-2xl py-20 px-6 text-center"
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#0B0B10] border border-[#26232E] flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#6B6775]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-4-4" />
                    </svg>
                  </div>

                  <h3 className="text-lg font-bold mt-5">No events found</h3>

                  <p className="text-sm text-[#9C97A8] mt-2 max-w-md mx-auto">
                    Try changing your filters or searching for a different
                    event, artist or location.
                  </p>

                  {hasFilters && (
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={clearFilters}
                      className="mt-6 px-4 py-2 rounded-lg border border-[#26232E] text-sm text-[#D8D5DE] hover:border-[#FFB627]/50 hover:text-white transition-colors"
                    >
                      Clear filters
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                <>
                  {/* Cards */}
                  <motion.div
                    variants={gridVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                  >
                    {events.data.map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} />
                    ))}
                  </motion.div>

                  {/* Pagination */}
                  {events.meta.last_page > 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="flex items-center justify-center gap-1 mt-10"
                    >
                      {events.meta.links.map((link, index) => (
                        <motion.button
                          key={`${link.label}-${index}`}
                          whileHover={link.url ? { y: -2 } : undefined}
                          whileTap={link.url ? { scale: 0.95 } : undefined}
                          type="button"
                          disabled={!link.url}
                          onClick={() =>
                            link.url &&
                            router.get(
                              link.url,
                              {},
                              {
                                preserveState: true,
                                preserveScroll: true,
                              },
                            )
                          }
                          dangerouslySetInnerHTML={{
                            __html: link.label,
                          }}
                          className={[
                            "min-w-9 h-9 px-3 rounded-lg text-xs border transition-colors font-['IBM_Plex_Mono']",
                            link.active
                              ? "bg-[#FFB627] text-[#0B0B10] border-[#FFB627] font-semibold"
                              : "bg-[#15141B] text-[#9C97A8] border-[#26232E] hover:border-[#FFB627]/50 hover:text-white",
                            !link.url ? "opacity-30 cursor-not-allowed" : "",
                          ].join(" ")}
                        />
                      ))}
                    </motion.div>
                  )}
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </AuthenticatedLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={filterItemVariants}>
      <label className="block font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#6B6775] mb-2.5">
        {title}
      </label>
      {children}
    </motion.div>
  );
}

function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.2, ease: EASE }}
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-[#26232E] bg-[#15141B] px-3 py-1.5 text-xs text-[#D8D5DE] hover:border-[#FFB627]/50 hover:text-white transition-colors"
    >
      <span className="font-['IBM_Plex_Mono']">{label}</span>
      <span className="text-[#6B6775]">×</span>
    </motion.button>
  );
}

function EventCard({ event, index }: { event: Event; index: number }) {
  const firstLeg = event.legs?.[0];

  const cheapestTier = useMemo(() => {
    return event.legs
      ?.flatMap((leg) => leg.ticket_tiers ?? [])
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
  }, [event.legs]);

  const categoryNames =
    event.categories?.slice(0, 2).map((category) => category.name) ?? [];

  const tilt = index % 2 === 0 ? -1 : 1;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, rotate: tilt }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="group"
    >
      <MotionLink
        href={route("events.show", event.slug)}
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#26232E] bg-[#15141B] transition-colors group-hover:border-[#FFB627]/40"
        style={{
          boxShadow: "0 0 0 rgba(0,0,0,0)",
        }}
        whileHover={{
          boxShadow: "0 24px 48px -20px rgba(255,182,39,0.22)",
        }}
      >
        {/* Poster image */}
        {/* Poster image */}
        <div className="relative h-40 w-full shrink-0 overflow-hidden border-b border-dashed border-[#33303C]">
          {event.media?.length > 0 ? (
            <img
              src={event.media[0].url}
              alt={event.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : event.image_url ? (
            <img
              src={event.image_url}
              alt={event.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="relative h-full w-full bg-gradient-to-br from-[#1D1B24] via-[#15141B] to-[#0B0B10]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,182,39,0.10),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(139,107,255,0.10),transparent_30%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-['Anton'] text-4xl uppercase text-white/5 select-none">
                  Live
                </span>
              </div>
            </div>
          )}

          {/* punch holes where the poster meets the stub below */}
          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#0B0B10] z-10" />
        </div>

        <div className="flex flex-1 min-w-0">
          {/* Main info */}
          <div className="flex-1 min-w-0 p-5 flex flex-col">
            <div className="flex items-center justify-between gap-3">
              {firstLeg && (
                <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-wide text-[#FFB627]">
                  {formatEventDate(firstLeg.event_date)}
                </p>
              )}

              {event.type === "tour" && (
                <span className="rounded-full border border-[#8B6BFF]/40 bg-[#8B6BFF]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#B7A7FF]">
                  Tour
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white mt-2.5 line-clamp-2 group-hover:text-[#FFB627] transition-colors">
              {event.name}
            </h3>

            {event.artists && event.artists.length > 0 && (
              <p className="text-sm text-[#9C97A8] mt-1.5 line-clamp-1">
                {event.artists.map((artist) => artist.name).join(", ")}
              </p>
            )}

            <div className="flex items-center justify-between mt-auto pt-4 gap-3">
              {firstLeg?.city && (
                <span className="text-xs text-[#6B6775] truncate">
                  {firstLeg.city}
                </span>
              )}

              {event.watchlist_count && event.watchlist_count > 0 && (
                <span className="text-[10px] text-[#6B6775] shrink-0">
                  {event.watchlist_count} watching
                </span>
              )}
            </div>

            {categoryNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {categoryNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-[#0B0B10] border border-[#26232E] px-2 py-1 text-[10px] text-[#9C97A8]"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Perforation + ticket stub */}
          <div className="relative w-[86px] shrink-0 border-l border-dashed border-[#33303C] flex flex-col items-center justify-between py-4">
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#0B0B10]" />

            <span className="font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-[0.25em] text-[#565262] [writing-mode:vertical-rl] rotate-180">
              Admit One
            </span>

            <div className="text-center">
              <p className="font-['IBM_Plex_Mono'] text-[9px] text-[#565262] uppercase mb-0.5">
                From
              </p>
              <p className="font-['IBM_Plex_Mono'] text-sm font-semibold text-[#FFB627]">
                {cheapestTier
                  ? `$${parseFloat(cheapestTier.price).toFixed(0)}`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </MotionLink>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatEventDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFilterDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

const inputClass =
  "w-full bg-[#15141B] border border-[#26232E] rounded-xl px-3 py-2.5 text-sm text-[#F7F5F2] placeholder:text-[#565262] focus:outline-none focus:border-[#FFB627]/50 focus:ring-2 focus:ring-[#FFB627]/15 transition-colors";
