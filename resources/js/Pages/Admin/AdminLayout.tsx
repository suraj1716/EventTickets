// resources/js/Pages/Admin/AdminLayout.tsx
//
// Reskinned to match the "Night Pulse" sidebar mockup: mark + role header,
// flat grouped nav with a left accent bar on the active item, dashed
// section dividers, and an avatar/role footer. Nav items, route names,
// counts, notifications and logout wiring are unchanged from before —
// only the shell markup/styling changed.

import { useState, useRef, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  MapPin,
  ClipboardList,
  TicketCheck,
  Eye,
  ScanLine,
  Image,
  Tag,
  FolderTree,
  Package,
  Images,
  Mail,
  CalendarDays,
  Gift,
  CreditCard,
  User,
  Store,
  Users,
  CalendarClock,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Bell,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { C as SharedC } from "@/Components/Admin/AdminComponents";

const C = {
  ...SharedC,
  textFainter: "#565262",
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  countKey: string | null;
  // Hidden from the sidebar for Vendor-only users. Routes themselves
  // aren't scoped by role yet (see admin_routes.php — all under
  // role:Admin|Vendor) — this only trims what vendors *see* for now.
  adminOnly?: boolean;
};

const NAV_GROUPS: { group: string | null; items: NavItem[] }[] = [
  {
    group: null,
    items: [
      { label: "Dashboard", href: "admin.dashboard", icon: LayoutDashboard, countKey: null },
    ],
  },
  {
    group: "Events",
    items: [
      { label: "Events", href: "admin.events.index", icon: Ticket, countKey: null },
      { label: "New Event", href: "admin.events.create", icon: PlusCircle, countKey: null },
      { label: "Venues", href: "admin.venues.index", icon: MapPin, countKey: null },
      { label: "Tickets", href: "admin.events.tickets.index", icon: TicketCheck, countKey: null },
      { label: "Watchlist", href: "admin.events.watchlist.index", icon: Eye, countKey: null },
      { label: "Ticket Scan", href: "staff.scan.index", icon: ScanLine, countKey: null },
    ],
  },
  {
    group: "Catalogue",
    items: [
      { label: "Hero Banner", href: "admin.hero-banner.index", icon: Image, countKey: null, adminOnly: true },
      { label: "Departments", href: "admin.departments.index", icon: Tag, countKey: null, adminOnly: true },
      { label: "Categories", href: "admin.categories.index", icon: FolderTree, countKey: null, adminOnly: true },
      { label: "Products", href: "admin.products.index", icon: Package, countKey: null },
      { label: "Gallery", href: "admin.gallery.index", icon: Images, countKey: null },
      { label: "Contacts", href: "admin.contacts.index", icon: Mail, countKey: "contacts", adminOnly: true },
    ],
  },
  {
    group: "Commerce",
    items: [
      { label: "Orders", href: "admin.orders.index", icon: ClipboardList, countKey: "orders" },
      { label: "Bookings", href: "admin.bookings.index", icon: CalendarDays, countKey: "bookings" },
      { label: "Vouchers", href: "admin.vouchers.index", icon: Gift, countKey: "vouchers" },
      { label: "Gift-Cards", href: "admin.gift-card-templates.index", icon: CreditCard, countKey: null },
      { label: "Payouts", href: "admin.payouts.index", icon: Wallet, countKey: null },
    ],
  },
  {
    group: "People",
    items: [
      { label: "Users", href: "admin.users.index", icon: User, countKey: null, adminOnly: true },
      { label: "Vendors", href: "admin.vendors.index", icon: Store, countKey: null, adminOnly: true },
      { label: "Staffs", href: "admin.vendor.staff.index", icon: Users, countKey: null },
      { label: "Roster", href: "admin.roster.index", icon: CalendarClock, countKey: null, adminOnly: true },
    ],
  },
];

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: "999px",
        background: "rgba(255,182,39,0.14)",
        color: C.amber,
        marginLeft: "auto",
        lineHeight: "14px",
        flexShrink: 0,
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { url, props } = usePage<any>();
  const adminCounts = (props.adminCounts ?? {}) as Record<string, number>;
  const appName = (props.appName as string) || "Admin";
  const authUser = props.auth?.user as
    | { name?: string; avatar?: string; roles?: string[] }
    | null
    | undefined;

  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalUnread = Object.values(adminCounts).reduce((a, b) => a + b, 0);

  const notifications = [
    { label: "Unread Contacts", count: adminCounts.contacts ?? 0, href: "admin.contacts.index", Icon: Mail },
    { label: "New Users", count: adminCounts.users ?? 0, href: "admin.users.index", Icon: User },
    { label: "Pending Orders", count: adminCounts.orders ?? 0, href: "admin.orders.index", Icon: ClipboardList },
    { label: "New Bookings", count: adminCounts.bookings ?? 0, href: "admin.bookings.index", Icon: CalendarDays },
  ].filter((n) => n.count > 0);

  const userName = authUser?.name ?? "Admin";
  const roles = authUser?.roles ?? [];
  const isAdmin = roles.includes("Admin");
  const userRole = authUser?.roles?.[0] ?? "Platform admin";
  const markLetter = appName.trim().charAt(0).toUpperCase() || "A";

  // Vendors see a trimmed-down sidebar; groups left with no items after
  // filtering are dropped entirely.
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isAdmin || !item.adminOnly),
  })).filter((group) => group.items.length > 0);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600;700&display=swap');
        .np-navItem { position: relative; transition: background .15s ease, color .15s ease; }
        .np-navItem:hover { background: rgba(247,245,242,0.05); color: ${C.text}; }
        .np-navItem.active::before {
          content: "";
          position: absolute; left: 0; top: 6px; bottom: 6px;
          width: 3px; border-radius: 2px;
          background: ${C.hot};
        }
      `}</style>

      <ToastContainer position="top-right" autoClose={3000} />

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: collapsed ? "68px" : "260px",
          background: C.sidebar,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s ease",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Header: mark + wordmark + role, collapse toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: collapsed ? "20px 14px 18px" : "20px 18px 18px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: C.hot,
              color: C.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Anton', sans-serif",
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            {markLetter}
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: "'Anton', sans-serif",
                  letterSpacing: "0.02em",
                  fontSize: 16,
                  textTransform: "uppercase",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {appName}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: C.textMuted,
                  textTransform: "uppercase",
                  marginTop: 4,
                }}
              >
                {isAdmin ? "Admin console" : "Vendor portal"}
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "none",
              border: "none",
              color: C.amber,
              cursor: "pointer",
              padding: 4,
              flexShrink: 0,
              display: "flex",
            }}
          >
            {collapsed ? <ChevronRight size={16} strokeWidth={2} /> : <ChevronLeft size={16} strokeWidth={2} />}
          </button>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 10px" }}>
          {visibleGroups.map((group, gi) => (
            <div key={group.group ?? "__ungrouped"}>
              {group.group && !collapsed && (
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    color: C.textFainter,
                    textTransform: "uppercase",
                    padding: "14px 12px 8px",
                  }}
                >
                  {group.group}
                </div>
              )}

              {group.items.map((item) => {
                const href = route(item.href);
                const isActive = url.startsWith(new URL(href).pathname);
                const count = item.countKey ? (adminCounts[item.countKey] ?? 0) : 0;
                const ItemIcon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={`np-navItem${isActive ? " active" : ""}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 7,
                      color: isActive ? C.text : C.textMuted,
                      background: isActive ? "rgba(255,62,48,0.10)" : "transparent",
                      textDecoration: "none",
                      fontSize: 13.5,
                      fontWeight: 500,
                      justifyContent: collapsed ? "center" : "flex-start",
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        display: "flex",
                        opacity: isActive ? 1 : 0.85,
                        color: isActive ? C.hot : "inherit",
                      }}
                    >
                      <ItemIcon size={17} strokeWidth={1.8} />
                    </span>
                    {!collapsed && (
                      <>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        <Badge count={count} />
                      </>
                    )}
                    {collapsed && count > 0 && <Badge count={count} />}
                  </Link>
                );
              })}

              {gi < visibleGroups.length - 1 && (
                <div
                  style={{
                    height: 1,
                    margin: "8px 12px",
                    background: `repeating-linear-gradient(90deg, ${C.borderDashed} 0 5px, transparent 5px 10px)`,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Back to site */}
        {!collapsed && (
          <div style={{ padding: "0 20px 14px" }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: C.textFaint,
                textDecoration: "none",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              <ArrowLeft size={13} strokeWidth={2} />
              Back to Site
            </Link>
          </div>
        )}

        {/* Footer: avatar + name + role */}
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            padding: collapsed ? "14px 0" : "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10,
          }}
        >
          {authUser?.avatar ? (
            <img
              src={authUser.avatar}
              alt={userName}
              style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.hot}, ${C.amber})`,
                flexShrink: 0,
              }}
            />
          )}
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userName}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: C.textMuted,
                  textTransform: "capitalize",
                }}
              >
                {userRole}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <header
          style={{
            background: C.surface,
            borderBottom: `1px solid ${C.border}`,
            padding: "0 28px",
            height: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Notification bell */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                style={{
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  color: C.textMuted,
                  padding: "7px 10px",
                  cursor: "pointer",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Bell size={15} strokeWidth={1.8} />
                {totalUnread > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      background: C.error,
                      color: "#fff",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      fontWeight: 700,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {notifOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: 280,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                    zIndex: 100,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 16px",
                      borderBottom: `1px dashed ${C.borderDashed}`,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: C.amber,
                    }}
                  >
                    Notifications
                  </div>

                  {notifications.length === 0 ? (
                    <div
                      style={{
                        padding: "20px 16px",
                        textAlign: "center",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "11.5px",
                        color: C.textFaint,
                      }}
                    >
                      All caught up ✓
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.href}
                        href={route(n.href)}
                        onClick={() => setNotifOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 16px",
                          borderBottom: `1px dashed ${C.borderDashed}`,
                          textDecoration: "none",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = C.bgAlt)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ color: C.amber, display: "flex" }}>
                          <n.Icon size={16} strokeWidth={1.8} />
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "12.5px", color: C.text, fontWeight: 500 }}>
                            {n.label}
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "10.5px",
                              color: C.textFaint,
                              marginTop: 2,
                            }}
                          >
                            {n.count} unread — click to review
                          </div>
                        </div>
                        <span
                          style={{
                            background: C.amber,
                            color: C.textInverse,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: "10px",
                          }}
                        >
                          {n.count}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={() => router.post(route("logout"))}
              style={{
                background: "transparent",
                border: `1px solid ${C.border}`,
                color: C.textMuted,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10.5px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "7px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <LogOut size={13} strokeWidth={1.8} />
              Logout
            </button>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: "32px 28px",
            overflowX: "hidden",
            background: C.bg,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
