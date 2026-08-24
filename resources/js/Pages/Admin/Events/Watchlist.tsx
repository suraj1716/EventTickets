// resources/js/Pages/Admin/Events/WatchlistShow.tsx
//
// Drill-down: the actual email list for one event, plus a manual
// "Send reminder" action. Reminder re-emails EVERYONE on the list,
// including already-notified entries — see EventWatchlistNotifier's
// force parameter — so this is worded as a deliberate re-send, not
// a silent catch-up action, to avoid a vendor firing it repeatedly
// by habit.

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../AdminLayout';

interface WatchlistEntry {
  id: number;
  email: string;
  notified: boolean;
  notified_at: string | null;
  created_at: string;
}

interface Props {
  event: {
    id: number;
    name: string;
    status: string;
  };
  entries: {
    data: WatchlistEntry[];
    links: {
      prev: string | null;
      next: string | null;
    };
    meta: {
      current_page: number;
      last_page: number;
      total: number;
    };
  };
}

export default function WatchlistShow({ event, entries }: Props) {
  const [sending, setSending] = useState(false);

  function sendReminder() {
    const confirmed = confirm(
      `This will re-email all ${entries.meta.total} people on this list, including anyone already notified. Continue?`
    );
    if (!confirmed) return;

    setSending(true);
    router.post(
      route('admin.events.watchlist.notify', event.id),
      {},
      {
        preserveScroll: true,
        onFinish: () => setSending(false),
      }
    );
  }

  return (
    <AdminLayout>
      <Head title={`Watchlist — ${event.name}`} />

      <div className="max-w-3xl">
        <Link
          href={route('admin.events.watchlist.index')}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white mb-4"
        >
          ← All watchlists
        </Link>

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
              {event.status === 'proposed' ? 'Proposed event' : 'Published event'}
            </p>
            <h1 className="text-2xl font-semibold text-white">{event.name}</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {entries.meta.total} {entries.meta.total === 1 ? 'person' : 'people'} watching
            </p>
          </div>

          <button
            type="button"
            onClick={sendReminder}
            disabled={sending || entries.meta.total === 0}
            className="shrink-0 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40"
          >
            {sending ? 'Sending…' : 'Send reminder to everyone'}
          </button>
        </div>

        {entries.data.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
            <h3 className="text-white font-medium">No one on this list</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Signups will appear here as people join the watchlist.
            </p>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-neutral-500">
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium">Notified</th>
                </tr>
              </thead>
              <tbody>
                {entries.data.map((entry) => (
                  <tr key={entry.id} className="border-b border-neutral-800 last:border-0">
                    <td className="px-5 py-3.5 text-white">{entry.email}</td>
                    <td className="px-5 py-3.5 text-neutral-500">
                      {new Date(entry.created_at).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      {entry.notified ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {entry.notified_at
                            ? new Date(entry.notified_at).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                              })
                            : 'Yes'}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-600">Not yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {entries.meta.last_page > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-neutral-500">
            <span>
              Page {entries.meta.current_page} of {entries.meta.last_page}
            </span>
            <div className="flex gap-2">
              {entries.links.prev && (
                <Link href={entries.links.prev} className="hover:text-white">
                  Previous
                </Link>
              )}
              {entries.links.next && (
                <Link href={entries.links.next} className="hover:text-white">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
