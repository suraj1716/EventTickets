import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../AdminLayout';

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

import type {
  Event,
  EventWatchlistEntry,
  Paginated,
} from '@/types';

interface Props {
  event: Event;
  entries: Paginated<EventWatchlistEntry>;
}

export default function EventWatchlistShow({
  event,
  entries,
}: Props) {
  const [sending, setSending] = useState(false);

  function handleNotify() {
    const total = entries.meta.total;

    if (total === 0) {
      return;
    }

    const confirmed = confirm(
      `Send a reminder email to all ${total} verified ${
        total === 1 ? 'watcher' : 'watchers'
      } on this list?\n\n` +
      `People who have already received a notification will receive it again.`
    );

    if (!confirmed) {
      return;
    }

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

      <AdminPageHeader
        eyebrow="Admin · Watchlist"
        title={event.name}
        meta={`${entries.meta.total} ${
          entries.meta.total === 1 ? 'verified watcher' : 'verified watchers'
        }`}
        action={
          <AdminBtn
            onClick={handleNotify}
            disabled={sending || entries.meta.total === 0}
          >
            {sending
              ? 'Sending…'
              : 'Send reminder to everyone'}
          </AdminBtn>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <Link
          href={route('admin.events.watchlist.index')}
          style={{
            fontFamily: fontMono,
            fontSize: '10.5px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.textMuted,
            textDecoration: 'none',
          }}
        >
          ← All watchlists
        </Link>
      </div>

      <AdminTable
        headers={['Email', 'Joined', 'Verified', 'Notified']}
        empty="Nobody with a verified email is on this watchlist yet."
      >
        {entries.data.map((entry) => (
          <Tr key={entry.id}>
            <Td>{entry.email}</Td>

            <Td muted>
              {new Date(entry.created_at).toLocaleDateString(
                undefined,
                {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }
              )}
            </Td>

            <Td>
              {entry.verified_at ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '12px',
                    color: C.success,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: C.success,
                      display: 'inline-block',
                    }}
                  />

                  {new Date(entry.verified_at).toLocaleDateString(
                    undefined,
                    {
                      day: 'numeric',
                      month: 'short',
                    }
                  )}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '12px',
                    color: C.textFaint,
                  }}
                >
                  Not verified
                </span>
              )}
            </Td>

            <Td>
              {entry.notified ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '12px',
                    color: C.success,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: C.success,
                      display: 'inline-block',
                    }}
                  />

                  {entry.notified_at
                    ? new Date(
                        entry.notified_at
                      ).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'Yes'}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '12px',
                    color: C.textFaint,
                  }}
                >
                  Not yet
                </span>
              )}
            </Td>
          </Tr>
        ))}
      </AdminTable>

      {entries.meta.last_page > 1 && (
        <Pagination links={entries.meta.links} />
      )}
    </AdminLayout>
  );
}
