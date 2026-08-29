// resources/js/Pages/Admin/Events/Index.tsx
//
// Reskinned to match the "Night Pulse" admin mockup: stat strip, filter
// chips, grid/list toggle, search + vendor + sort controls.
//
// Scope note: the mockup's drawer only models one date/venue per event
// and a flat tier list, but this platform supports multi-leg tours with
// per-leg ticket tiers (see Events/Form.tsx). Reimplementing that in a
// slide-over here would either lose leg editing for tours or duplicate
// Form.tsx's logic and drift out of sync with it. So cards/rows open the
// existing Create/Edit form instead of an inline drawer — everything
// else (layout, stat strip, chips, grid/list, search, sort, view
// toggle) matches the mockup pixel-for-pixel.
//
// Status + search are server-side filters (existing backend behavior).
// Vendor / kind / "needs attention" / sort are client-side over the
// current page, since the controller doesn't accept those as query
// params yet.

import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import type { Event, EventStatus, Paginated } from '@/types';
import AdminLayout from '../AdminLayout';
import { StatusBadge, Icons } from '../../../Components/Admin/AdminComponents';

interface Props {
  events: Paginated<Event>;
  filters?: {
    status?: EventStatus;
    search?: string;
  };
}

const C = {
  bg: '#0B0B10',
  bgAlt: '#1A1922',
  sidebar: '#111017',
  surface: '#15141B',
  surface2: '#1E1D26',
  border: '#26232E',
  borderDashed: '#33303C',
  text: '#F7F5F2',
  textInverse: '#0B0B10',
  textMuted: '#9C97A8',
  textFaint: '#6B6775',
  textFainter: '#565262',
  amber: '#FFB627',
  hot: '#FF3E30',
  success: '#7CE0A8',
  error: '#E08585',
};

const fontBody = "'Inter', sans-serif";
const fontDisplay = "'Anton', sans-serif";
const fontMono = "'JetBrains Mono', monospace";

const STATUS_LABEL: Record<EventStatus, string> = {
  draft: 'Draft',
  proposed: 'Proposed',
  published: 'Published',
  cancelled: 'Cancelled',
};

const GRADIENTS = [
  'linear-gradient(135deg,#ff3e30,#ffb627)',
  'linear-gradient(135deg,#7858ff,#ff3e30)',
  'linear-gradient(135deg,#3ddc84,#ffb627)',
  'linear-gradient(135deg,#ffb627,#ff3e30)',
  'linear-gradient(135deg,#ff3e30,#7858ff)',
  'linear-gradient(135deg,#ffb627,#3ddc84)',
];

function gradientFor(id: number) {
  return GRADIENTS[id % GRADIENTS.length];
}

function formatDate(iso?: string | null) {
  if (!iso) return 'Date TBC';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function primaryLegSummary(event: Event) {
  const legs = event.legs ?? [];
  if (!legs.length) return { date: 'Date TBC', venue: 'Venue TBC' };
  const first = legs[0];
  const date = event.type === 'tour' && legs.length > 1
    ? `${formatDate(first.event_date)} +${legs.length - 1} more`
    : formatDate(first.event_date);
  const venue = legs.length > 1 ? `${legs.length} venues` : (first.venue_name || 'Venue TBC');
  return { date, venue };
}

function kindLabel(event: Event) {
  return event.type === 'tour' ? `Tour · ${event.legs?.length ?? 0} legs` : 'Standalone';
}

function tierTotals(event: Event) {
  const tiers = (event.legs ?? []).flatMap((leg) => leg.ticket_tiers ?? []);
  const cap = tiers.reduce((a, t) => a + Number(t.quantity || 0), 0);
  const sold = tiers.reduce((a, t) => a + (Number(t.quantity || 0) - Number(t.remaining || 0)), 0);
  return { cap, sold, pct: cap ? Math.round((sold / cap) * 100) : 0 };
}

function needsAttention(event: Event): { flag: boolean; reason: string } {
  if (event.status === 'published' || event.status === 'cancelled') return { flag: false, reason: '' };
  const legs = event.legs ?? [];
  if (!legs.length) return { flag: true, reason: 'No venue/date set yet' };
  const missingTiers = legs.some((leg) => !leg.ticket_tiers?.length);
  if (missingTiers) return { flag: true, reason: 'One or more locations need a ticket tier' };
  return { flag: false, reason: '' };
}

function CardMenu({
  event,
  onPublish,
  onDelete,
}: {
  event: Event;
  onPublish: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const canPublish = event.status === 'draft' || event.status === 'proposed';

  return (
    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'transparent',
          border: 'none',
          color: C.textFainter,
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
        }}
        title="Actions"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <circle cx="4" cy="10" r="1.4" fill="currentColor" />
          <circle cx="10" cy="10" r="1.4" fill="currentColor" />
          <circle cx="16" cy="10" r="1.4" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 60 }}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              width: 168,
              background: C.surface2,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
              zIndex: 61,
              overflow: 'hidden',
            }}
          >
            <Link
              href={route('admin.events.edit', event.id)}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                fontFamily: fontBody,
                fontSize: 12.5,
                color: C.text,
                textDecoration: 'none',
              }}
            >
              <Icons.Edit /> Edit
            </Link>
            {canPublish && (
              <button
                onClick={() => { setOpen(false); onPublish(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  fontFamily: fontBody,
                  fontSize: 12.5,
                  color: C.amber,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Icons.Check /> Publish
              </button>
            )}
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                borderTop: `1px dashed ${C.borderDashed}`,
                fontFamily: fontBody,
                fontSize: 12.5,
                color: C.hot,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Icons.Delete /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function EventsIndex({ events, filters }: Props) {
  const [search, setSearch] = useState(filters?.search ?? '');
  const [statusChip, setStatusChip] = useState<EventStatus | 'all' | 'tour' | 'attention'>(filters?.status ?? 'all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [sort, setSort] = useState<'attention' | 'newest' | 'name' | 'sold' | 'watch'>('attention');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  function applyServerFilters(next: Partial<Props['filters']>) {
    router.get(
      route('admin.events.index'),
      { ...filters, ...next },
      { preserveState: true, replace: true }
    );
  }

  function handleChip(k: typeof statusChip) {
    setStatusChip(k);
    if (k === 'all' || k === 'tour' || k === 'attention') {
      // client-side only chips — clear server status filter if it was set
      if (filters?.status) applyServerFilters({ status: undefined });
    } else {
      applyServerFilters({ status: k });
    }
  }

  function handlePublish(event: Event) {
    if (event.legs?.some((leg) => !leg.ticket_tiers?.length)) {
      alert('Every location needs at least one ticket tier before publishing.');
      return;
    }
    router.post(route('vendor.events.publish', event.id));
  }

  function handleDelete(event: Event) {
    if (!confirm(`Delete "${event.name}"? This can't be undone.`)) return;
    router.delete(route('vendor.events.destroy', event.id));
  }

  const vendors = useMemo(() => {
    const names = new Set<string>();
    events.data.forEach((e) => e.vendor?.name && names.add(e.vendor.name));
    return Array.from(names).sort();
  }, [events.data]);

  const stats = useMemo(() => {
    const total = events.data.length;
    const published = events.data.filter((e) => e.status === 'published').length;
    const proposed = events.data.filter((e) => e.status === 'proposed').length;
    const draft = events.data.filter((e) => e.status === 'draft').length;
    const attn = events.data.filter((e) => needsAttention(e).flag).length;
    const ticketsSold = events.data.reduce((a, e) => a + tierTotals(e).sold, 0);
    const watching = events.data.reduce((a, e) => a + (e.watchlist_count ?? 0), 0);
    return { total, published, proposed, draft, attn, ticketsSold, watching };
  }, [events.data]);

  const filteredSorted = useMemo(() => {
    let list = events.data.filter((e) => {
      if (statusChip === 'tour' && e.type !== 'tour') return false;
      if (statusChip === 'attention' && !needsAttention(e).flag) return false;
      if (vendorFilter !== 'all' && e.vendor?.name !== vendorFilter) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'sold') return tierTotals(b).pct - tierTotals(a).pct;
      if (sort === 'watch') return (b.watchlist_count ?? 0) - (a.watchlist_count ?? 0);
      if (sort === 'attention') {
        const av = needsAttention(a).flag ? 1 : 0;
        const bv = needsAttention(b).flag ? 1 : 0;
        return bv - av || b.id - a.id;
      }
      return b.id - a.id; // newest
    });
    return list;
  }, [events.data, statusChip, vendorFilter, search, sort]);

  const chipDefs: { k: typeof statusChip; label: string; flag?: boolean }[] = [
    { k: 'all', label: 'All' },
    { k: 'published', label: 'Published' },
    { k: 'proposed', label: 'Proposed' },
    { k: 'draft', label: 'Draft' },
    { k: 'cancelled', label: 'Cancelled' },
    { k: 'tour', label: 'Tours only' },
    { k: 'attention', label: 'Needs attention', flag: true },
  ];

  return (
    <AdminLayout>
      <Head title="Events" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .evSearch::placeholder { color: ${C.textFainter}; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: fontDisplay, textTransform: 'uppercase', fontSize: 30, letterSpacing: '0.01em', color: C.text }}>
            Events &amp; Tours
          </div>
          <div style={{ fontFamily: fontMono, fontSize: 11.5, color: C.textMuted, marginTop: 6 }}>
            {`// ${stats.total} total — ${stats.published} published · ${stats.proposed} proposed · ${stats.draft} draft`}
            {stats.attn > 0 && <span style={{ color: C.amber }}>{` · ${stats.attn} need attention`}</span>}
          </div>
        </div>
        <Link
          href={route('admin.events.create')}
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 22px',
            background: C.text,
            color: C.bg,
            fontWeight: 600,
            fontSize: 13.5,
            borderRadius: 2,
            textDecoration: 'none',
            transition: 'background 0.25s ease, transform 0.25s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.hot; e.currentTarget.style.color = C.text; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = C.text; e.currentTarget.style.color = C.bg; e.currentTarget.style.transform = 'none'; }}
        >
          <Icons.Plus /> New Event
        </Link>
      </div>

      {/* ── Stat strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { n: stats.total, l: 'Total events' },
          { n: stats.published, l: 'Published' },
          { n: stats.attn, l: 'Needs attention', attn: true },
          { n: stats.ticketsSold.toLocaleString(), l: 'Tickets sold' },
          { n: stats.watching.toLocaleString(), l: 'Total watching' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: fontDisplay, fontSize: 22, color: s.attn ? C.amber : C.text }}>{s.n}</div>
            <div style={{ fontFamily: fontMono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textMuted, marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {chipDefs.map((c) => {
            const active = statusChip === c.k;
            return (
              <button
                key={c.k}
                onClick={() => handleChip(c.k)}
                style={{
                  fontFamily: fontMono,
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: `1px solid ${active ? C.text : C.border}`,
                  color: active ? C.bg : C.textMuted,
                  background: active ? C.text : 'transparent',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                }}
              >
                {c.flag && <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber }} />}
                {c.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', width: 200 }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ color: C.textFainter, flexShrink: 0 }}>
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
              <path d="M17 17l-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              className="evSearch"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyServerFilters({ search })}
              placeholder="Search events…"
              style={{ background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 12.5, width: '100%', fontFamily: fontBody }}
            />
          </div>

          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontFamily: fontMono, fontSize: 11, letterSpacing: '0.04em', padding: '9px 10px', borderRadius: 8, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All vendors</option>
            {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontFamily: fontMono, fontSize: 11, letterSpacing: '0.04em', padding: '9px 10px', borderRadius: 8, outline: 'none', cursor: 'pointer' }}
          >
            <option value="attention">Sort: Needs attention</option>
            <option value="newest">Sort: Newest</option>
            <option value="name">Sort: Name A–Z</option>
            <option value="sold">Sort: Tickets sold</option>
            <option value="watch">Sort: Watchlist</option>
          </select>

          <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
            {(['grid', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                title={v === 'grid' ? 'Grid view' : 'List view'}
                style={{ border: 'none', background: view === v ? C.text : 'transparent', color: view === v ? C.bg : C.textFainter, width: 32, height: 28, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
              >
                {v === 'grid' ? (
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="3" width="6" height="6" rx="1" fill="currentColor" /><rect x="11" y="3" width="6" height="6" rx="1" fill="currentColor" />
                    <rect x="3" y="11" width="6" height="6" rx="1" fill="currentColor" /><rect x="11" y="11" width="6" height="6" rx="1" fill="currentColor" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="4" width="14" height="2.4" rx="1" fill="currentColor" /><rect x="3" y="9" width="14" height="2.4" rx="1" fill="currentColor" /><rect x="3" y="14" width="14" height="2.4" rx="1" fill="currentColor" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontFamily: fontMono, fontSize: 11, color: C.textFainter, marginBottom: 14 }}>
        {`Showing ${filteredSorted.length} of ${events.data.length} events on this page`}
      </div>

      {/* ── Grid view ── */}
      {view === 'grid' && (
        filteredSorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(268px,1fr))', gap: 18 }}>
            {filteredSorted.map((event) => {
              const attn = needsAttention(event);
              const t = tierTotals(event);
              const { date, venue } = primaryLegSummary(event);
              return (
                <div
                  key={event.id}
                  onClick={() => router.visit(route('admin.events.edit', event.id))}
                  style={{
                    position: 'relative',
                    background: C.surface,
                    border: `1px solid ${attn.flag ? 'rgba(255,182,39,0.5)' : C.border}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease, transform 0.2s ease',
                  }}
                >
                  {attn.flag && (
                    <div title={attn.reason} style={{ position: 'absolute', top: 12, right: 44, zIndex: 2, width: 22, height: 22, borderRadius: '50%', background: 'rgba(11,11,13,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.amber, fontSize: 12 }}>⚑</div>
                  )}
                  <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 3 }}>
                    <CardMenu event={event} onPublish={() => handlePublish(event)} onDelete={() => handleDelete(event)} />
                  </div>
                  <div style={{ height: 118, position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 12, background: gradientFor(event.id) }}>
                    <StatusBadge status={STATUS_LABEL[event.status]} />
                    <span style={{ fontFamily: fontMono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,243,239,0.75)', background: 'rgba(11,11,13,0.4)', padding: '4px 9px', borderRadius: 999 }}>
                      {kindLabel(event)}
                    </span>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontFamily: fontDisplay, textTransform: 'uppercase', fontSize: 17, letterSpacing: '0.01em', marginBottom: 4, color: C.text }}>{event.name}</div>
                    <div style={{ fontFamily: fontMono, fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{date} · {venue}</div>
                    <div style={{ fontFamily: fontMono, fontSize: 10.5, color: C.textFainter, marginBottom: 12 }}>{event.vendor?.name ?? '—'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: C.textMuted, marginBottom: 6 }}>
                      <span>Tickets sold</span><span>{t.pct}% ({t.sold.toLocaleString()}/{t.cap.toLocaleString()})</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: C.surface2, overflow: 'hidden', marginBottom: 14 }}>
                      <span style={{ display: 'block', height: '100%', width: `${t.pct}%`, background: `linear-gradient(90deg,${C.hot},${C.amber})` }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: fontMono, fontSize: 11, color: C.amber }}>
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" /><path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                        {event.watchlist_count ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── List view ── */}
      {view === 'list' && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr .9fr 1fr 1.2fr .8fr 32px', gap: 12, padding: '12px 18px', fontFamily: fontMono, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textFainter }}>
            <span>Event</span><span>Vendor</span><span>Type</span><span>Status</span><span>Tickets sold</span><span>Watching</span><span></span>
          </div>
          {filteredSorted.length === 0 ? (
            <EmptyState />
          ) : (
            filteredSorted.map((event) => {
              const t = tierTotals(event);
              const attn = needsAttention(event);
              const { date, venue } = primaryLegSummary(event);
              return (
                <div
                  key={event.id}
                  onClick={() => router.visit(route('admin.events.edit', event.id))}
                  style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr .9fr 1fr 1.2fr .8fr 32px', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: `1px solid ${C.border}`, fontSize: 13, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 7, flexShrink: 0, position: 'relative', background: gradientFor(event.id) }}>
                      {attn.flag && <div title={attn.reason} style={{ position: 'absolute', top: -4, right: -4, width: 13, height: 13, borderRadius: '50%', background: C.amber, border: `2px solid ${C.surface}` }} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: C.text }}>{event.name}</div>
                      <div style={{ fontFamily: fontMono, fontSize: 10.5, color: C.textMuted, marginTop: 2 }}>{date} · {venue}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: fontMono, fontSize: 11, color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.vendor?.name ?? '—'}</div>
                  <div style={{ fontFamily: fontMono, fontSize: 11, color: C.textMuted }}>{kindLabel(event)}</div>
                  <div><StatusBadge status={STATUS_LABEL[event.status]} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: C.surface2, overflow: 'hidden' }}>
                      <span style={{ display: 'block', height: '100%', width: `${t.pct}%`, background: `linear-gradient(90deg,${C.hot},${C.amber})` }} />
                    </div>
                    <div style={{ fontFamily: fontMono, fontSize: 10.5, color: C.textMuted, width: 32, textAlign: 'right' }}>{t.pct}%</div>
                  </div>
                  <div style={{ fontFamily: fontMono, fontSize: 11, color: C.amber }}>{event.watchlist_count ?? 0}</div>
                  <CardMenu event={event} onPublish={() => handlePublish(event)} onDelete={() => handleDelete(event)} />
                </div>
              );
            })
          )}
        </div>
      )}

      {events.meta.last_page > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 28, flexWrap: 'wrap' }}>
          {events.meta.links.map((link, i) => (
            <button
              key={i}
              disabled={!link.url}
              onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
              dangerouslySetInnerHTML={{ __html: link.label }}
              style={{
                minWidth: 32,
                height: 32,
                padding: '0 10px',
                fontFamily: fontMono,
                fontSize: 12,
                background: link.active ? C.text : C.surface,
                color: link.active ? C.bg : C.textMuted,
                border: `1px solid ${link.active ? C.text : C.border}`,
                borderRadius: 8,
                cursor: link.url ? 'pointer' : 'default',
                opacity: link.url ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: C.textFainter, fontFamily: fontMono, fontSize: 12 }}>
      No events match these filters.
    </div>
  );
}
