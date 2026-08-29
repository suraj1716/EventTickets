// resources/js/Pages/Admin/Events/Tickets.tsx

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from "../AdminLayout";
import {
  AdminPageHeader,
  FilterBar,
  AdminTable,
  Tr,
  Td,
  Pagination,
  C,
  fontMono,
} from '@/Components/Admin/AdminComponents';

import type { Paginated, Ticket, TicketStatus } from '@/types';

interface EventOption {
  id: number;
  name: string;
}

interface Props {
  tickets: Paginated<Ticket>;
  events: EventOption[];
  filters: { event_id?: number; status?: TicketStatus; search?: string };
}

const STATUS_COLOR: Record<TicketStatus, string> = {
  valid: C.info,
  used: C.success,
  void: C.error,
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  valid: 'Not scanned',
  used: 'Attended',
  void: 'Void',
};

export default function EventTickets({ tickets, events, filters }: Props) {
  return (
    <AdminLayout>
      <Head title="Tickets" />

      <AdminPageHeader eyebrow="Admin · Events" title="Tickets" />

      <FilterBar
        routeName="admin.events.tickets.index"
        filters={filters as Record<string, string>}
        fields={[
          { key: 'search', placeholder: 'Search ticket code…', flex: true },
          {
            key: 'event_id',
            type: 'select',
            placeholder: 'All events',
            options: events.map((e) => ({ value: String(e.id), label: e.name })),
          },
          {
            key: 'status',
            type: 'select',
            placeholder: 'Any status',
            options: [
              { value: 'valid', label: 'Not scanned' },
              { value: 'used', label: 'Attended' },
              { value: 'void', label: 'Void' },
            ],
          },
        ]}
      />

      <AdminTable headers={['Code', 'Event', 'Tier', 'Buyer', 'Attendance']} empty="No tickets match these filters.">
        {tickets.data.map((ticket) => {
          const color = STATUS_COLOR[ticket.status];
          return (
            <Tr key={ticket.id}>
              <Td>
                <span style={{ fontFamily: fontMono, fontSize: '12px', color: C.textMuted }}>{ticket.code}</span>
              </Td>
              <Td>{ticket.event_leg?.event?.name ?? '—'}</Td>
              <Td muted>{ticket.ticket_tier?.name ?? '—'}</Td>
              <Td muted>{ticket.order?.user?.name ?? ticket.holder_name ?? '—'}</Td>
              <Td>
                <span
                  style={{
                    display: 'inline-block', fontSize: '11px', fontWeight: 600,
                    color, background: `${color}18`, border: `1px solid ${color}40`,
                    padding: '2px 10px', borderRadius: '999px',
                  }}
                >
                  {STATUS_LABEL[ticket.status]}
                </span>
                {ticket.status === 'used' && ticket.scanned_at && (
                  <span style={{ marginLeft: 8, fontSize: '11px', color: C.textFaint }}>
                    {new Date(ticket.scanned_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </Td>
            </Tr>
          );
        })}
      </AdminTable>

      {tickets.meta.last_page > 1 && <Pagination links={tickets.meta.links} />}
    </AdminLayout>
  );
}
