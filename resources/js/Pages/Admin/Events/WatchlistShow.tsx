// resources/js/Pages/Admin/Events/WatchlistShow.tsx

import { Head, router } from '@inertiajs/react';
import AdminLayout from "../AdminLayout";

import type { Event, EventWatchlistEntry, Paginated } from '@/types';

interface Props {
  event: Event;
  entries: Paginated<EventWatchlistEntry>;
}

export default function EventWatchlistShow({ event, entries }: Props) {
  function handleNotify() {
    if (!confirm(`Send a reminder email to all ${entries.meta.total} people on the watchlist for "${event.name}"?`)) {
      return;
    }
    router.post(route('admin.events.watchlist.notify', event.id));
  }

  return (
    <AdminLayout>
      <Head title={`Watchlist — ${event.name}`} />

      <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Watchlist</p>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">{event.name}</h1>
        <button
          onClick={handleNotify}
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          Notify all
        </button>
      </div>

      <div className="border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-900 text-neutral-500 text-xs uppercase tracking-wide">
              <th className="text-left font-medium px-4 py-3">Email</th>
              <th className="text-left font-medium px-4 py-3">Joined</th>
              <th className="text-left font-medium px-4 py-3">Notified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {entries.data.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-neutral-500">
                  Nobody on the watchlist yet.
                </td>
              </tr>
            )}
            {entries.data.map((entry) => (
              <tr key={entry.id} className="text-neutral-200">
                <td className="px-4 py-3">{entry.email}</td>
                <td className="px-4 py-3 text-neutral-400">
                  {new Date(entry.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  {entry.notified ? (
                    <span className="text-green-400 text-xs">Sent</span>
                  ) : (
                    <span className="text-neutral-500 text-xs">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {entries.meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          {entries.meta.links.map((link, i) => (
            <button
              key={i}
              disabled={!link.url}
              onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
              dangerouslySetInnerHTML={{ __html: link.label }}
              className={`min-w-[32px] h-8 px-2 text-xs rounded-md ${
                link.active ? 'bg-white text-black' : 'text-neutral-400 hover:bg-neutral-800 disabled:opacity-30'
              }`}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}