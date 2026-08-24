// resources/js/Pages/Admin/Events/Tickets.tsx

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from "../AdminLayout";

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

const STATUS_STYLES: Record<TicketStatus, string> = {
  valid: 'bg-neutral-800 text-neutral-300',
  used: 'bg-green-950 text-green-400',
  void: 'bg-red-950 text-red-400',
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  valid: 'Not scanned',
  used: 'Attended',
  void: 'Void',
};

export default function EventTickets({ tickets, events, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? '');

  function apply(next: Partial<Props['filters']>) {
    router.get(route('admin.events.tickets.index'), { ...filters, ...next }, { preserveState: true, replace: true });
  }

  return (
    <AdminLayout>
      <Head title="Tickets" />

      <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Events</p>
      <h1 className="text-2xl font-semibold text-white mb-6">Tickets</h1>

      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply({ search })}
          placeholder="Search ticket code…"
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600"
        />
        <select
          value={filters.event_id ?? ''}
          onChange={(e) => apply({ event_id: e.target.value ? Number(e.target.value) : undefined })}
          className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neutral-600"
        >
          <option value="">All events</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <select
          value={filters.status ?? ''}
          onChange={(e) => apply({ status: (e.target.value || undefined) as TicketStatus })}
          className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neutral-600"
        >
          <option value="">Any status</option>
          <option value="valid">Not scanned</option>
          <option value="used">Attended</option>
          <option value="void">Void</option>
        </select>
      </div>

      <div className="border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-900 text-neutral-500 text-xs uppercase tracking-wide">
              <th className="text-left font-medium px-4 py-3">Code</th>
              <th className="text-left font-medium px-4 py-3">Event</th>
              <th className="text-left font-medium px-4 py-3">Tier</th>
              <th className="text-left font-medium px-4 py-3">Buyer</th>
              <th className="text-left font-medium px-4 py-3">Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {tickets.data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  No tickets match these filters.
                </td>
              </tr>
            )}
            {tickets.data.map((ticket) => (
              <tr key={ticket.id} className="text-neutral-200">
                <td className="px-4 py-3 font-mono text-xs text-neutral-400">{ticket.code}</td>
                <td className="px-4 py-3">{ticket.event_leg?.event?.name ?? '—'}</td>
                <td className="px-4 py-3 text-neutral-400">{ticket.ticket_tier?.name ?? '—'}</td>
                <td className="px-4 py-3 text-neutral-400">{ticket.order?.user?.name ?? ticket.holder_name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[ticket.status]}`}>
                    {STATUS_LABEL[ticket.status]}
                  </span>
                  {ticket.status === 'used' && ticket.scanned_at && (
                    <span className="ml-2 text-xs text-neutral-500">
                      {new Date(ticket.scanned_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tickets.meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          {tickets.meta.links.map((link, i) => (
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