// resources/js/Pages/Admin/Events/Index.tsx
//
// Assumes the shared AdminLayout / AdminComponents pattern already used
// across the salon platform's admin panel. Swap the imports below for
// your actual paths/exports if they differ.

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import type { Event, EventStatus, Paginated } from '@/types';
import AdminLayout from '../AdminLayout';

interface Props {
  events: Paginated<Event>;
  filters?: {
    status?: EventStatus;
    search?: string;
  };
}

const STATUS_STYLES: Record<EventStatus, string> = {
  draft: 'bg-neutral-800 text-neutral-400',
  proposed: 'bg-blue-950 text-blue-400',
  published: 'bg-green-950 text-green-400',
  cancelled: 'bg-red-950 text-red-400',
};

const STATUS_LABEL: Record<EventStatus, string> = {
  draft: 'Draft',
  proposed: 'Proposed',
  published: 'Published',
  cancelled: 'Cancelled',
};

export default function EventsIndex({ events, filters }: Props) {
  const [search, setSearch] = useState(filters?.search ?? '');

  function applyFilters(next: Partial<Props['filters']>) {
    router.get(
      route('admin.events.index'),
      { ...filters, ...next },
      { preserveState: true, replace: true }
    );
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

  return (
    <AdminLayout>
      <Head title="Events" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Events</p>
          <h1 className="text-2xl font-semibold text-white">Your events</h1>
        </div>
        <Link
          href={route('admin.events.create')}
          className="inline-flex items-center gap-2 bg-white text-black text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors"
        >
          + New event
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
          placeholder="Search events…"
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600"
        />
        <select
          value={filters?.status ?? ''}
          onChange={(e) => applyFilters({ status: (e.target.value || undefined) as EventStatus })}
          className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neutral-600"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="proposed">Proposed</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-900 text-neutral-500 text-xs uppercase tracking-wide">
              <th className="text-left font-medium px-4 py-3">Event</th>
              <th className="text-left font-medium px-4 py-3">Type</th>
              <th className="text-left font-medium px-4 py-3">Locations</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3">Watching</th>
              <th className="text-right font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {events.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                  No events yet. Create your first one to get started.
                </td>
              </tr>
            )}

            {events.data.map((event) => (
              <tr key={event.id} className="text-neutral-200 hover:bg-neutral-900/60">
                <td className="px-4 py-3">
                  <Link
                    href={route('admin.events.edit', event.id)}
                    className="font-medium text-white hover:underline"
                  >
                    {event.name}
                  </Link>
                  {event.artists && event.artists.length > 0 && (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {event.artists.map((a) => a.name).join(', ')}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-400 capitalize">{event.type}</td>
                <td className="px-4 py-3 text-neutral-400">{event.legs?.length ?? 0}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[event.status]}`}
                  >
                    {STATUS_LABEL[event.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-400">{event.watchlist_count ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {(event.status === 'draft' || event.status === 'proposed') && (
                      <button
                        onClick={() => handlePublish(event)}
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-white text-black hover:bg-neutral-200 transition-colors"
                      >
                        Publish
                      </button>
                    )}
                    <Link
                      href={route('admin.events.edit', event.id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(event)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md border border-neutral-800 text-neutral-500 hover:text-red-400 hover:border-red-900 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {events.meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          {events.meta.links.map((link, i) => (
            <button
              key={i}
              disabled={!link.url}
              onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
              dangerouslySetInnerHTML={{ __html: link.label }}
              className={`min-w-[32px] h-8 px-2 text-xs rounded-md ${
                link.active
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:bg-neutral-800 disabled:opacity-30'
              }`}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
