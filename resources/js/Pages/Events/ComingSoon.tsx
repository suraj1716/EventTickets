// resources/js/Pages/Events/ComingSoon.tsx
//
// Same "Box Office" design language as Events/Index.tsx, but for
// events with status 'proposed' — not on sale yet, watchlist only.
// The ticket stub deliberately shows a watchlist count instead of a
// price: an unpriced stub is the honest visual signal that this
// isn't purchasable yet, no extra copy needed to explain that.
//
//   npm install framer-motion

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Category, Event, Paginated } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface ComingSoonFilters {
  search?: string;
  category?: number;
}

interface Props {
  events: Paginated<Event>;
  filters: ComingSoonFilters;
  categories: Category[];
}

const EASE = [0.16, 1, 0.3, 1] as const;

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export default function ComingSoon({ events, filters, categories }: Props) {
    console.log('ComingSoon props', events);   // TEMP — remove after c
  const [local, setLocal] = useState<ComingSoonFilters>(filters);

  function apply(next: Partial<ComingSoonFilters>) {
    const merged = { ...local, ...next };
    setLocal(merged);

    router.get(route('events.coming-soon'), merged, {
      preserveState: true,
      replace: true,
      preserveScroll: true,
    });
  }

  function toggleCategory(id: number) {
    apply({ category: local.category === id ? undefined : id });
  }

  return (
    <AuthenticatedLayout>
      <Head title="Coming Soon">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen bg-[#0B0B10] text-[#F7F5F2] font-['Manrope']">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-[#26232E]">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[#8B6BFF] opacity-[0.16] blur-[100px]"
            animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#8B6BFF] mb-4 flex items-center gap-2"
            >
              <motion.span
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block h-1.5 w-1.5 rounded-full bg-[#8B6BFF]"
              />
              Not confirmed yet — be first to know
            </motion.p>

            <h1 className="font-['Anton'] uppercase leading-[0.88] text-5xl sm:text-6xl lg:text-7xl tracking-tight">
              Coming <span className="text-[#8B6BFF]">soon.</span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-5 max-w-xl text-base sm:text-lg text-[#9C97A8] leading-relaxed"
            >
              These events aren't confirmed yet. Join the waitlist and we'll email you the moment tickets go on sale.
            </motion.p>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-9 max-w-2xl"
            >
              <div className="relative">
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
                  value={local.search ?? ''}
                  onChange={(e) => setLocal((prev) => ({ ...prev, search: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') apply({ search: local.search });
                  }}
                  onBlur={() => apply({ search: local.search })}
                  placeholder="Search upcoming events..."
                  className="w-full h-[52px] rounded-xl border border-[#26232E] bg-[#15141B] pl-11 pr-4 text-sm text-[#F7F5F2] placeholder:text-[#6B6775] outline-none transition focus:border-[#8B6BFF]/60 focus:ring-2 focus:ring-[#8B6BFF]/20"
                />
              </div>

              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {categories.map((category) => {
                    const active = local.category === category.id;
                    return (
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        type="button"
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={[
                          'px-3 py-1.5 rounded-full text-xs border transition-colors',
                          active
                            ? 'bg-[#8B6BFF] text-white border-[#8B6BFF] font-semibold'
                            : 'bg-[#15141B] text-[#9C97A8] border-[#26232E] hover:border-[#8B6BFF]/50 hover:text-white',
                        ].join(' ')}
                      >
                        {category.name}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Results */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="font-['IBM_Plex_Mono'] text-xs text-[#6B6775] mb-6">
            {events.meta.total.toLocaleString()} {events.meta.total === 1 ? 'event' : 'events'} not yet on sale
          </p>

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
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mt-5">Nothing coming up right now</h3>
              <p className="text-sm text-[#9C97A8] mt-2 max-w-md mx-auto">
                Check back soon, or browse events already on sale.
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div
                variants={gridVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              >
                {events.data.map((event, index) => (
                  <ComingSoonCard key={event.id} event={event} index={index} />
                ))}
              </motion.div>

              {events.meta.last_page > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex items-center justify-center gap-1 mt-10"
                >
                  {events.meta.links.map((link, index) => (
                    <button
                      key={`${link.label}-${index}`}
                      type="button"
                      disabled={!link.url}
                      onClick={() =>
                        link.url &&
                        router.get(link.url, {}, { preserveState: true, preserveScroll: true })
                      }
                      dangerouslySetInnerHTML={{ __html: link.label }}
                      className={[
                        "min-w-9 h-9 px-3 rounded-lg text-xs border transition-colors font-['IBM_Plex_Mono']",
                        link.active
                          ? 'bg-[#8B6BFF] text-white border-[#8B6BFF] font-semibold'
                          : 'bg-[#15141B] text-[#9C97A8] border-[#26232E] hover:border-[#8B6BFF]/50 hover:text-white',
                        !link.url ? 'opacity-30 cursor-not-allowed' : '',
                      ].join(' ')}
                    />
                  ))}
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>
    </AuthenticatedLayout>
  );
}

function ComingSoonCard({ event, index }: { event: Event; index: number }) {
  const firstLeg = event.legs?.[0];
  const categoryNames = event.categories?.slice(0, 2).map((c) => c.name) ?? [];
  const tilt = index % 2 === 0 ? -1 : 1;

  return (
    <motion.a
      href={route('events.show', event.slug)}
      variants={cardVariants}
      whileHover={{ y: -6, rotate: tilt, boxShadow: '0 24px 48px -20px rgba(139,107,255,0.22)' }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#26232E] bg-[#15141B] transition-colors hover:border-[#8B6BFF]/40"
    >
      <div className="relative h-40 w-full shrink-0 overflow-hidden border-b border-dashed border-[#33303C]">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative h-full w-full bg-gradient-to-br from-[#1D1B24] via-[#15141B] to-[#0B0B10]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,107,255,0.12),transparent_35%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-['Anton'] text-4xl uppercase text-white/5 select-none">Soon</span>
            </div>
          </div>
        )}
        <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#0B0B10] z-10" />
      </div>

      <div className="flex flex-1 min-w-0">
        <div className="flex-1 min-w-0 p-5 flex flex-col">
          <div className="flex items-center justify-between gap-3">
            {firstLeg && (
              <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-wide text-[#8B6BFF]">
                {formatEventDate(firstLeg.event_date)}
              </p>
            )}
            {event.type === 'tour' && (
              <span className="rounded-full border border-[#8B6BFF]/40 bg-[#8B6BFF]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#B7A7FF]">
                Tour
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-white mt-2.5 line-clamp-2 group-hover:text-[#8B6BFF] transition-colors">
            {event.name}
          </h3>

          {event.artists && event.artists.length > 0 && (
            <p className="text-sm text-[#9C97A8] mt-1.5 line-clamp-1">
              {event.artists.map((a) => a.name).join(', ')}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto pt-4 gap-3">
            {firstLeg?.city && <span className="text-xs text-[#6B6775] truncate">{firstLeg.city}</span>}
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

        {/* Stub — watchlist count instead of price, since this isn't purchasable yet */}
        <div className="relative w-[86px] shrink-0 border-l border-dashed border-[#33303C] flex flex-col items-center justify-between py-4">
          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#0B0B10]" />

          <span className="font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-[0.25em] text-[#565262] [writing-mode:vertical-rl] rotate-180">
            Waitlist
          </span>

          <div className="text-center">
            <p className="font-['IBM_Plex_Mono'] text-[9px] text-[#565262] uppercase mb-0.5">Watching</p>
            <p className="font-['IBM_Plex_Mono'] text-sm font-semibold text-[#8B6BFF]">
              {event.watchlist_count ?? 0}
            </p>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

function formatEventDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
