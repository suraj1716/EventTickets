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

type Props = {
  stats: {
    total_revenue: number;
    total_orders: number;
    pending_orders: number;
    total_bookings: number;
    today_bookings: number;
    total_products: number;
    total_users: number;
    total_vendors: number;
  };
  salesChart: { labels: string[]; data: number[] };
  ordersByStatus: Record<string, number>;
  recentOrders: any[];
  upcomingBookings: any[];
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

export default function Dashboard({ stats, salesChart, ordersByStatus, recentOrders, upcomingBookings }: Props) {
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
    labels: Object.keys(ordersByStatus),
    datasets: [{
      data: Object.values(ordersByStatus),
      backgroundColor: [C.textFaint, C.amber, C.info, C.success, C.error],
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
      <Head title="Admin Dashboard" />

      <AdminPageHeader eyebrow="Admin · Overview" title="Dashboard" />

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1px", background: C.border, border: `1px solid ${C.border}`, marginBottom: "28px" }}>
        <StatCard label="Total Revenue" value={`A$${stats.total_revenue.toLocaleString()}`} accent />
        <StatCard label="Total Orders"   value={stats.total_orders} />
        <StatCard label="Pending Orders" value={stats.pending_orders} sub="awaiting action" />
        <StatCard label="Total Bookings" value={stats.total_bookings} />
        <StatCard label="Today's Bookings" value={stats.today_bookings} sub="scheduled today" />
        <StatCard label="Products"       value={stats.total_products} />
        <StatCard label="Users"          value={stats.total_users} />
        <StatCard label="Vendors"        value={stats.total_vendors} sub="approved" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", marginBottom: "28px" }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "24px" }}>
          <p style={{ fontFamily: fontMono, fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.textMuted, marginBottom: "20px" }}>
            Sales — Last 30 Days
          </p>
          <Line data={lineData} options={chartOptions} />
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "24px" }}>
          <p style={{ fontFamily: fontMono, fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.textMuted, marginBottom: "20px" }}>
            Orders by Status
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* Recent orders */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
            <span style={{ fontFamily: fontDisplay, textTransform: "uppercase", fontSize: "1.1rem", fontWeight: 400, color: C.text }}>Recent Orders</span>
            <a href={route("admin.orders.index")} style={{ fontFamily: fontMono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: C.amber, textDecoration: "none" }}>View all →</a>
          </div>
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

        {/* Upcoming bookings */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
            <span style={{ fontFamily: fontDisplay, textTransform: "uppercase", fontSize: "1.1rem", fontWeight: 400, color: C.text }}>Upcoming Bookings</span>
            <a href={route("admin.bookings.index")} style={{ fontFamily: fontMono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: C.amber, textDecoration: "none" }}>View all →</a>
          </div>
          <AdminTable headers={["Customer", "Date", "Time", "Status"]} empty="No upcoming bookings">
            {upcomingBookings.map((b) => (
              <Tr key={b.id}>
                <Td>{b.customer}</Td>
                <Td muted>{b.booking_date}</Td>
                <Td muted>{b.time_slot}</Td>
                <Td><StatusBadge status={b.order_status} /></Td>
              </Tr>
            ))}
          </AdminTable>
        </div>
      </div>
    </AdminLayout>
  );
}
