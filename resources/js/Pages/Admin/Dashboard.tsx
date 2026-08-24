import { Head } from "@inertiajs/react";
import AdminLayout from "./AdminLayout";
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

const STATUS_COLORS: Record<string, string> = {
  draft:     "var(--color-text-light)",
  paid:      "var(--color-primary)",
  shipped:   "var(--color-info)",
  delivered: "var(--color-success)",
  cancelled: "var(--color-error)",
};

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div
      style={{
        background: accent ? "var(--color-primary)" : "var(--color-surface)",
        border: `1px solid ${accent ? "var(--color-primary)" : "var(--color-border)"}`,
        padding: "var(--space-xl)",
      }}
    >
      <span
        style={{
          display: "block",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-xs)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: accent ? "rgba(255,255,255,0.6)" : "var(--color-text-light)",
          marginBottom: "var(--space-sm)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "block",
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
          fontWeight: 300,
          color: accent ? "#fff" : "var(--color-text)",
          lineHeight: 1,
          marginBottom: sub ? "6px" : 0,
        }}
      >
        {value}
      </span>
      {sub && (
        <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: accent ? "rgba(255,255,255,0.5)" : "var(--color-text-light)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.65rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: STATUS_COLORS[status] ?? "var(--color-text-muted)",
        background: `${STATUS_COLORS[status] ?? "var(--color-border)"}18`,
        padding: "2px 8px",
        borderRadius: "var(--radius-full)",
        border: `1px solid ${STATUS_COLORS[status] ?? "var(--color-border)"}40`,
      }}
    >
      {status}
    </span>
  );
}

export default function Dashboard({ stats, salesChart, ordersByStatus, recentOrders, upcomingBookings }: Props) {
  const lineData = {
    labels: salesChart.labels,
    datasets: [{
      label: "Revenue (AUD)",
      data: salesChart.data,
      borderColor: "#2D5016",
      backgroundColor: "rgba(45,80,22,0.08)",
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: "#2D5016",
      fill: true,
      tension: 0.4,
    }],
  };

  const doughnutData = {
    labels: Object.keys(ordersByStatus),
    datasets: [{
      data: Object.values(ordersByStatus),
      backgroundColor: ["#A09890", "#2D5016", "#2471A3", "#3A7D44", "#C0392B"],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 8 } },
      y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { size: 10 } } },
    },
  };

  return (
    <AdminLayout>
      <Head title="Admin Dashboard" />

      {/* Page heading */}
      <div style={{ marginBottom: "var(--space-2xl)" }}>
        <span style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: "var(--space-xs)" }}>
          Overview
        </span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 300, color: "var(--color-text)", margin: 0 }}>
          Dashboard
        </h1>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1px", background: "var(--color-border)", border: "1px solid var(--color-border)", marginBottom: "var(--space-2xl)" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--space-lg)", marginBottom: "var(--space-2xl)" }}>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", padding: "var(--space-xl)" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-light)", marginBottom: "var(--space-lg)" }}>
            Sales — Last 30 Days
          </p>
          <Line data={lineData} options={chartOptions} />
        </div>

        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", padding: "var(--space-xl)" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-light)", marginBottom: "var(--space-lg)" }}>
            Orders by Status
          </p>
          <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: "bottom", labels: { font: { size: 11 }, padding: 12 } } } }} />
        </div>
      </div>

      {/* Tables row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-lg)" }}>

        {/* Recent orders */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div style={{ padding: "var(--space-lg) var(--space-xl)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 400, color: "var(--color-text)" }}>Recent Orders</span>
            <a href={route("admin.orders.index")} style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", textDecoration: "none" }}>View all →</a>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["#", "Customer", "Total", "Status"].map(h => (
                  <th key={h} style={{ padding: "var(--space-sm) var(--space-lg)", textAlign: "left", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-light)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o, i) => (
                <tr key={o.id} style={{ borderBottom: i < recentOrders.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <td style={{ padding: "var(--space-sm) var(--space-lg)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>#{o.id}</td>
                  <td style={{ padding: "var(--space-sm) var(--space-lg)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{o.customer}</td>
                  <td style={{ padding: "var(--space-sm) var(--space-lg)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 500 }}>A${o.total}</td>
                  <td style={{ padding: "var(--space-sm) var(--space-lg)" }}><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upcoming bookings */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div style={{ padding: "var(--space-lg) var(--space-xl)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 400, color: "var(--color-text)" }}>Upcoming Bookings</span>
            <a href={route("admin.bookings.index")} style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-primary)", textDecoration: "none" }}>View all →</a>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Customer", "Date", "Time", "Status"].map(h => (
                  <th key={h} style={{ padding: "var(--space-sm) var(--space-lg)", textAlign: "left", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-light)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upcomingBookings.map((b, i) => (
                <tr key={b.id} style={{ borderBottom: i < upcomingBookings.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <td style={{ padding: "var(--space-sm) var(--space-lg)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{b.customer}</td>
                  <td style={{ padding: "var(--space-sm) var(--space-lg)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{b.booking_date}</td>
                  <td style={{ padding: "var(--space-sm) var(--space-lg)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{b.time_slot}</td>
                  <td style={{ padding: "var(--space-sm) var(--space-lg)" }}><StatusBadge status={b.order_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
