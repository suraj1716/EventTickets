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
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  AdminTable,
  Tr,
  Td,
  AdminBtn,
  Pagination,
  C,
  fontMono,
} from '@/Components/Admin/AdminComponents';

import type { Event, EventWatchlistEntry, Paginated } from '@/types';

interface Props {
  event: Event;
  entries: Paginated<EventWatchlistEntry>;
}

export default function EventWatchlistShow({ event, entries }: Props) {
  const [sending, setSending] = useState(false);

  function handleNotify() {
    if (!confirm(`This will re-email all ${entries.meta.total} people on this list, including anyone already notified. Continue?`)) {
      return;
    }
    setSending(true);
    router.post(route('admin.events.watchlist.notify', event.id), {}, {
      preserveScroll: true,
      onFinish: () => setSending(false),
    });
  }

  return (
    <AdminLayout>
      <Head title={`Watchlist — ${event.name}`} />

      <AdminPageHeader
        eyebrow="Admin · Watchlist"
        title={event.name}
        meta={`${entries.meta.total} ${entries.meta.total === 1 ? 'person' : 'people'} watching`}
        action={
          <AdminBtn onClick={handleNotify} disabled={sending || entries.meta.total === 0}>
            {sending ? 'Sending…' : 'Send reminder to everyone'}
          </AdminBtn>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <Link
          href={route('admin.events.watchlist.index')}
          style={{
            fontFamily: fontMono, fontSize: '10.5px', letterSpacing: '0.1em',
            textTransform: 'uppercase', color: C.textMuted, textDecoration: 'none',
          }}
        >
          ← All watchlists
        </Link>
      </div>

      <AdminTable headers={['Email', 'Joined', 'Notified']} empty="Nobody on the watchlist yet.">
        {entries.data.map((entry) => (
          <Tr key={entry.id}>
            <Td>{entry.email}</Td>
            <Td muted>
              {new Date(entry.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </Td>
            <Td>
              {entry.notified ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '12px', color: C.success }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.success, display: 'inline-block' }} />
                  {entry.notified_at
                    ? new Date(entry.notified_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
                    : 'Yes'}
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: C.textFaint }}>Not yet</span>
              )}
            </Td>
          </Tr>
        ))}
      </AdminTable>

      {entries.meta.last_page > 1 && <Pagination links={entries.meta.links} />}
    </AdminLayout>
  );
}
