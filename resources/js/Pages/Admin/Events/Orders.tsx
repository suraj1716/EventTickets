// resources/js/Pages/Admin/Events/Orders.tsx

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import type { Order, Paginated } from '@/types';
import AdminLayout from '../AdminLayout';
import { AdminBtn, AdminPageHeader, Icons } from '@/Components/Admin/AdminComponents';

interface Props {
  orders: Paginated<Order>;
  filters: { search?: string };
}

export default function EventOrders({ orders, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? '');

  function apply() {
    router.get(route('admin.events.orders.index'), { search }, { preserveState: true, replace: true });
  }

  return (
    <AdminLayout>
      <AdminPageHeader
             eyebrow="Commerce"
             title="Orders"
             meta={''}
             action={
               <div style={{ display: "flex", gap: 8 }}>
                 <AdminBtn
  as="a"
  href={route('staff.door-sale.create')}
  variant="accent"
>
  <Icons.Plus /> Walk-in Order
</AdminBtn>
               </div>
             }
           />

      <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Events</p>
      <h1 className="text-2xl font-semibold text-white mb-6">Ticket orders</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
        placeholder="Search buyer name or email…"
        className="w-full mb-4 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600"
      />

      <div className="border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-900 text-neutral-500 text-xs uppercase tracking-wide">
              <th className="text-left font-medium px-4 py-3">Order</th>
              <th className="text-left font-medium px-4 py-3">Buyer</th>
              <th className="text-left font-medium px-4 py-3">Event(s)</th>
              <th className="text-left font-medium px-4 py-3">Tickets</th>
              <th className="text-right font-medium px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {orders.data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  No ticket orders yet.
                </td>
              </tr>
            )}
            {orders.data.map((order) => {
              const items = order.order_items ?? [];
              const eventNames = Array.from(
                new Set(items.map((i) => i.ticket_tier?.event_leg?.event?.name).filter(Boolean))
              );
              const ticketCount = items.reduce((sum, i) => sum + i.quantity, 0);

              return (
                <tr key={order.id} className="text-neutral-200">
                  <td className="px-4 py-3 text-neutral-400">#{order.id}</td>
                  <td className="px-4 py-3">{order.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-neutral-400">{eventNames.join(', ') || '—'}</td>
                  <td className="px-4 py-3">{ticketCount}</td>
                  <td className="px-4 py-3 text-right">${parseFloat(order.total_price).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {orders.meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          {orders.meta.links.map((link, i) => (
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