// resources/js/Pages/Admin/Events/Watchlist.tsx
//
// Summary view: one row per event, with watchlist size — the
// "is this worth publishing" signal made visible to the vendor.
// Drills down into WatchlistShow.tsx for the actual email list.

import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../AdminLayout';
import {
  AdminPageHeader,
  AdminTable,
  Tr,
  Td,
  StatusBadge,
  ActionBtn,
  Pagination,
  Icons,
} from '@/Components/Admin/AdminComponents';

interface WatchlistEvent {
  id: number;
  name: string;
  status: string;
  watchlist_count: number;
}

interface Props {
  events: {
    data: WatchlistEvent[];
    links: {
      first: string | null;
      last: string | null;
      prev: string | null;
      next: string | null;
    };
    meta: {
      current_page: number;
      last_page: number;
      total: number;
      links: any[];
    };
  };
}

export default function Watchlist({ events }: Props) {
  return (
    <AdminLayout>
      <Head title="Event Watchlists" />

      <AdminPageHeader
        eyebrow="Admin · Events"
        title="Watchlists"
        meta={`${events.meta.total} event${events.meta.total === 1 ? '' : 's'} with people waiting`}
      />

      <AdminTable headers={['Event', 'Status', 'Watching', '']} empty="No events have watchlist signups yet">
        {events.data.map((event) => (
          <Tr key={event.id}>
            <Td>{event.name}</Td>
            <Td><StatusBadge status={event.status} /></Td>
            <Td muted>{event.watchlist_count}</Td>
            <Td right>
              <ActionBtn
                as={Link}
                href={route('admin.events.watchlist.show', event.id)}
                variant="view"
                title="View watchlist"
              >
                <Icons.View />
              </ActionBtn>
            </Td>
          </Tr>
        ))}
      </AdminTable>

      {events.meta.last_page > 1 && <Pagination links={events.meta.links} />}
    </AdminLayout>
  );
}
