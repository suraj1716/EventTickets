import { Head } from "@inertiajs/react";
import AdminLayout from "./AdminLayout";
import {
  AdminPageHeader,
  AdminTable,
  Tr,
  Td,
  StatusBadge,
  C,
  fontBody,
  fontDisplay,
  fontMono,
} from "@/Components/Admin/AdminComponents";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend, ArcElement);

type Scope = "admin" | "vendor";

type Stats = {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  published_events: number;
  upcoming_events: number;
  tickets_sold: number;
  tickets_used: number;
  checked_in_today: number;
  total_vendors?: number;
  pending_vendors?: number;
};

type UpcomingEvent = {
  id: number;
  event_name: string;
  venue: string;
  city: string | null;
  date: string | null;
  tickets_sold: number;
  capacity: number | null;
};

type RecentOrder = {
  id: number;
  customer: string;
  total: number;
  status: string;
  created_at: string;
};

type TopEvent = {
  id: number;
  name: string;
  tickets_sold: number;
};

type Props = {
  scope: Scope;
  stats: Stats;
  salesChart: { labels: string[]; data: number[] };
  ticketsByStatus: { valid: number; used: number; void: number };
  upcomingEvents: UpcomingEvent[];
  recentOrders: RecentOrder[];
  topEvents: TopEvent[];
};

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div
      style={{
        background: accent ? C.amber : C.surface,
        border: `1px solid ${accent ? C.amber : C.border}`,
        padding: "24px",
      }}
    >
      <span
        style={{
          display: "block",
          fontFamily: fontMono,
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: accent ? "rgba(11,11,16,0.6)" : C.textMuted,
          marginBottom: "8px",
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "block",
          fontFamily: fontDisplay,
          fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
          fontWeight: 400,
          color: accent ? C.textInverse : C.text,
          lineHeight: 1,
          marginBottom: sub ? "6px" : 0,
        }}
      >
        {value}
      </span>
      {sub && (
        <span style={{ fontFamily: fontBody, fontSize: "12px", color: accent ? "rgba(11,11,16,0.55)" : C.textFaint }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function SectionHeading({ title, viewAllRoute }: { title: string; viewAllRoute?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
      <span style={{ fontFamily: fontDisplay, textTransform: "uppercase", fontSize: "1.1rem", fontWeight: 400, color: C.text }}>
        {title}
      </span>
      {viewAllRoute && (
        <a
          href={route(viewAllRoute)}
          style={{ fontFamily: fontMono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: C.amber, textDecoration: "none" }}
        >
          View all →
        </a>
      )}
    </div>
  );
}

export default function Dashboard({ scope, stats, salesChart, ticketsByStatus, upcomingEvents, recentOrders, topEvents }: Props) {
  const isAdmin = scope === "admin";

  const lineData = {
    labels: salesChart.labels,
    datasets: [{
      label: "Revenue (AUD)",
      data: salesChart.data,
      borderColor: C.amber,
      backgroundColor: "rgba(255,182,39,0.10)",
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: C.amber,
      fill: true,
      tension: 0.4,
    }],
  };

  const doughnutData = {
    labels: ["Not scanned", "Attended", "Void"],
    datasets: [{
      data: [ticketsByStatus.valid, ticketsByStatus.used, ticketsByStatus.void],
      backgroundColor: [C.info, C.success, C.error],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: C.textFaint, font: { size: 10 }, maxTicksLimit: 8 },
      },
      y: {
        grid: { color: C.border },
        ticks: { color: C.textFaint, font: { size: 10 } },
      },
    },
  };

  return (
    <AdminLayout>
      <Head title="Dashboard" />

      <AdminPageHeader
        eyebrow={isAdmin ? "Admin · Marketplace overview" : "Vendor · Your events"}
        title="Dashboard"
      />

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1px", background: C.border, border: `1px solid ${C.border}`, marginBottom: "28px" }}>
        <StatCard label="Total Revenue" value={`A$${stats.total_revenue.toLocaleString()}`} accent />
        <StatCard label="Total Orders" value={stats.total_orders} />
        <StatCard label="Pending Orders" value={stats.pending_orders} sub="awaiting action" />
        <StatCard label={isAdmin ? "Published Events" : "Your Published Events"} value={stats.published_events} />
        <StatCard label="Upcoming Events" value={stats.upcoming_events} sub="from today" />
        <StatCard label="Tickets Sold" value={stats.tickets_sold} />
        <StatCard label="Checked In Today" value={stats.checked_in_today} sub="scanned / manual" />
        {isAdmin ? (
          <>
            <StatCard label="Approved Vendors" value={stats.total_vendors ?? 0} />
            <StatCard label="Pending Vendors" value={stats.pending_vendors ?? 0} sub="awaiting approval" />
          </>
        ) : (
          <StatCard label="Tickets Attended" value={stats.tickets_used} />
        )}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", marginBottom: "28px" }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "24px" }}>
          <p style={{ fontFamily: fontMono, fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.textMuted, marginBottom: "20px" }}>
            Revenue — Last 30 Days
          </p>
          <Line data={lineData} options={chartOptions} />
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "24px" }}>
          <p style={{ fontFamily: fontMono, fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.textMuted, marginBottom: "20px" }}>
            Ticket Status
          </p>
          <Doughnut
            data={doughnutData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { color: C.textMuted, font: { size: 11 }, padding: 12 },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Tables row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: isAdmin ? "20px" : 0 }}>

        {/* Recent orders */}
        <div>
          <SectionHeading title="Recent Orders" viewAllRoute="admin.orders.index" />
          <AdminTable headers={["#", "Customer", "Total", "Status"]} empty="No recent orders">
            {recentOrders.map((o) => (
              <Tr key={o.id}>
                <Td muted>#{o.id}</Td>
                <Td>{o.customer}</Td>
                <Td>
                  <span style={{ color: C.amber, fontWeight: 600 }}>A${o.total}</span>
                </Td>
                <Td><StatusBadge status={o.status} /></Td>
              </Tr>
            ))}
          </AdminTable>
        </div>

        {/* Upcoming events */}
        <div>
          <SectionHeading title="Upcoming Events" viewAllRoute="admin.events.index" />
          <AdminTable headers={["Event", "Venue", "Date", "Sold"]} empty="No upcoming events">
            {upcomingEvents.map((e) => (
              <Tr key={e.id}>
                <Td>{e.event_name}</Td>
                <Td muted>{e.venue}{e.city ? `, ${e.city}` : ""}</Td>
                <Td muted>{e.date}</Td>
                <Td>
                  {e.tickets_sold}{e.capacity ? ` / ${e.capacity}` : ""}
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </div>
      </div>

      {/* Admin-only: cross-marketplace leaderboard */}
      {isAdmin && (
        <div>
          <SectionHeading title="Top Events by Tickets Sold" />
          <AdminTable headers={["Event", "Tickets Sold"]} empty="No ticket sales yet">
            {topEvents.map((e) => (
              <Tr key={e.id}>
                <Td>{e.name}</Td>
                <Td><span style={{ color: C.amber, fontWeight: 600 }}>{e.tickets_sold}</span></Td>
              </Tr>
            ))}
          </AdminTable>
        </div>
      )}
    </AdminLayout>
  );
}
