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
  FlashMessage,
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
  flash?: { success?: string; error?: string };
  errors?: { error?: string };
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

export default function EventTickets({ tickets, events, filters, flash, errors }: Props) {
  const handleUndoScan = (ticket: Ticket) => {
    if (!confirm(`Revert ticket ${ticket.code} back to "Not scanned"?`)) return;
    router.post(route('admin.events.tickets.undo-scan', ticket.id), {}, { preserveScroll: true });
  };

  const handleCheckIn = (ticket: Ticket) => {
    if (!confirm(`Manually check in ticket ${ticket.code}? Use this only when scanning isn't possible.`)) return;
    router.post(route('admin.events.tickets.check-in', ticket.id), {}, { preserveScroll: true });
  };

  const handleVoid = (ticket: Ticket) => {
    const reason = prompt(`Void ticket ${ticket.code}. Reason (optional):`);
    if (reason === null) return; // cancelled
    router.post(route('admin.events.tickets.void', ticket.id), { reason }, { preserveScroll: true });
  };

  const handleUnvoid = (ticket: Ticket) => {
    if (!confirm(`Unvoid ticket ${ticket.code}? It will be reverted to "Not scanned".`)) return;
    router.post(route('admin.events.tickets.unvoid', ticket.id), {}, { preserveScroll: true });
  };

  return (
    <AdminLayout>
      <Head title="Tickets" />

      <AdminPageHeader eyebrow="Admin · Events" title="Tickets" />

      <FlashMessage flash={{ ...flash, error: flash?.error ?? errors?.error }} />

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

      <AdminTable headers={['Code', 'Event', 'Tier', 'Buyer', 'Attendance', 'Actions']} empty="No tickets match these filters.">
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
              <Td>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ticket.status === 'valid' && (
                    <button
                      onClick={() => handleCheckIn(ticket)}
                      style={{
                        fontSize: 11, fontWeight: 600, color: C.success,
                        background: `${C.success}18`, border: `1px solid ${C.success}40`,
                        padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                      }}
                    >
                      Check in
                    </button>
                  )}
                  {ticket.status === 'used' && (
                    <button
                      onClick={() => handleUndoScan(ticket)}
                      style={{
                        fontSize: 11, fontWeight: 600, color: C.info,
                        background: `${C.info}18`, border: `1px solid ${C.info}40`,
                        padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                      }}
                    >
                      Undo scan
                    </button>
                  )}
                  {ticket.status !== 'void' && (
                    <button
                      onClick={() => handleVoid(ticket)}
                      style={{
                        fontSize: 11, fontWeight: 600, color: C.error,
                        background: `${C.error}18`, border: `1px solid ${C.error}40`,
                        padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                      }}
                    >
                      Void
                    </button>
                  )}
                  {ticket.status === 'void' && (
                    <button
                      onClick={() => handleUnvoid(ticket)}
                      style={{
                        fontSize: 11, fontWeight: 600, color: C.info,
                        background: `${C.info}18`, border: `1px solid ${C.info}40`,
                        padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                      }}
                    >
                      Unvoid
                    </button>
                  )}
                </div>
              </Td>
            </Tr>
          );
        })}
      </AdminTable>

      {tickets.meta.last_page > 1 && <Pagination links={tickets.meta.links} />}
    </AdminLayout>
  );
}
