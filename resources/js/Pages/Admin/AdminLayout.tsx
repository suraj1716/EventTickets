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
  ChevronDown,
  ArrowLeft,
  Bell,
  LogOut,
  type LucideIcon,
} from "lucide-react";

const C = {
  bg: "#0B0B10",
  bgAlt: "#1A1922",
  sidebar: "#111017",
  surface: "#15141B",
  surfaceWarm: "#201C14",
  border: "#26232E",
  borderDashed: "#33303C",
  text: "#F7F5F2",
  textInverse: "#0B0B10",
  textMuted: "#9C97A8",
  textFaint: "#6B6775",
  textFainter: "#565262",
  amber: "#FFB627",
  amberHover: "#ffc75c",
  amberDark: "#e2a220",
  error: "#E08585",
};

const NAV_GROUPS: {
  group: string | null;
  icon?: LucideIcon;
  items: { label: string; href: string; icon: LucideIcon; countKey: string | null }[];
}[] = [
  {
    group: null,
    items: [
      { label: "Dashboard", href: "admin.dashboard", icon: LayoutDashboard, countKey: null },
    ],
  },
  {
    group: "Events",
    icon: Ticket,
    items: [
      { label: "Events", href: "admin.events.index", icon: Ticket, countKey: null },
      { label: "New Event", href: "admin.events.create", icon: PlusCircle, countKey: null },
      { label: "Venues", href: "admin.venues.index", icon: MapPin, countKey: null },
      { label: "Ticket Orders", href: "admin.events.orders.index", icon: ClipboardList, countKey: null },
      { label: "Tickets", href: "admin.events.tickets.index", icon: TicketCheck, countKey: null },
      { label: "Watchlist", href: "admin.events.watchlist.index", icon: Eye, countKey: null },
      { label: "Ticket Scan", href: "staff.scan.index", icon: ScanLine, countKey: null },
    ],
  },
  {
    group: "Catalogue",
    icon: Package,
    items: [
      { label: "Hero Banner", href: "admin.hero-banner.index", icon: Image, countKey: null },
      { label: "Departments", href: "admin.departments.index", icon: Tag, countKey: null },
      { label: "Categories", href: "admin.categories.index", icon: FolderTree, countKey: null },
      { label: "Products", href: "admin.products.index", icon: Package, countKey: null },
      { label: "Gallery", href: "admin.gallery.index", icon: Images, countKey: null },
      { label: "Contacts", href: "admin.contacts.index", icon: Mail, countKey: "contacts" },
    ],
  },
  {
    group: "Commerce",
    icon: ClipboardList,
    items: [
      { label: "Orders", href: "admin.orders.index", icon: ClipboardList, countKey: "orders" },
      { label: "Bookings", href: "admin.bookings.index", icon: CalendarDays, countKey: "bookings" },
      { label: "Vouchers", href: "admin.vouchers.index", icon: Gift, countKey: "vouchers" },
      { label: "Gift-Cards", href: "admin.gift-card-templates.index", icon: CreditCard, countKey: "gift-cards" },
    ],
  },
  {
    group: "People",
    icon: User,
    items: [
      { label: "Users", href: "admin.users.index", icon: User, countKey: null },
      { label: "Vendors", href: "admin.vendors.index", icon: Store, countKey: null },
      { label: "Staffs", href: "admin.vendor.staff.index", icon: Users, countKey: null },
      { label: "Roaster", href: "admin.roster.index", icon: CalendarClock, countKey: null },
    ],
  },
  {
    group: null,
    items: [
      { label: "Payouts", href: "admin.payouts.index", icon: Wallet, countKey: null },
    ],
  },
];

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span
      style={{
        background: C.amber,
        color: C.textInverse,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        padding: "1px 5px",
        borderRadius: "10px",
        marginLeft: "auto",
        minWidth: 16,
        textAlign: "center",
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

  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([
    "Catalogue",
    "Commerce",
    "People",
  ]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const toggleGroup = (group: string) =>
    setOpenGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );

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

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500;700&family=Manrope:wght@300;400;500;600;700&display=swap');
      `}</style>

      <ToastContainer position="top-right" autoClose={3000} />

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: collapsed ? "60px" : "220px",
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
        {/* Logo */}
        <div
          style={{
            padding: "24px 20px",
            borderBottom: `1px dashed ${C.borderDashed}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          {!collapsed && (
            <span
              style={{
                fontFamily: "'Anton', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                fontSize: "1.1rem",
                color: C.text,
                whiteSpace: "nowrap",
              }}
            >
              Admin
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "none",
              border: "none",
              color: C.amber,
              cursor: "pointer",
              padding: "4px",
              flexShrink: 0,
              display: "flex",
            }}
          >
            {collapsed ? <ChevronRight size={16} strokeWidth={2} /> : <ChevronLeft size={16} strokeWidth={2} />}
          </button>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {NAV_GROUPS.map((group) => {
            const isOpen = group.group ? openGroups.includes(group.group) : true;
            const hasActive = group.items.some((item) => {
              const href = route(item.href);
              return url.startsWith(new URL(href).pathname);
            });
            const GroupIcon = group.icon;

            return (
              <div key={group.group ?? "__ungrouped"}>
                {group.group && (
                  <button
                    onClick={() => toggleGroup(group.group!)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "10px 20px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: hasActive ? C.amber : C.textFaint,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {!collapsed ? (
                      <>
                        <span>{group.group}</span>
                        <ChevronDown
                          size={12}
                          strokeWidth={2}
                          style={{
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                            opacity: 0.7,
                          }}
                        />
                      </>
                    ) : (
                      GroupIcon && (
                        <span style={{ margin: "0 auto", display: "flex", color: hasActive ? C.amber : C.textFaint }}>
                          <GroupIcon size={15} strokeWidth={1.8} />
                        </span>
                      )
                    )}
                  </button>
                )}

                <div
                  style={{
                    maxHeight: isOpen && !collapsed ? "500px" : collapsed ? "auto" : "0px",
                    overflow: "hidden",
                    transition: group.group ? "max-height 0.25s ease" : "none",
                  }}
                >
                  {group.items.map((item) => {
                    const href = route(item.href);
                    const isActive = url.startsWith(new URL(href).pathname);
                    const count = item.countKey ? (adminCounts[item.countKey] ?? 0) : 0;
                    const ItemIcon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "9px 20px",
                          paddingLeft: collapsed || !group.group ? "20px" : "30px",
                          color: isActive ? C.amber : C.textMuted,
                          background: isActive ? "rgba(255,182,39,0.07)" : "transparent",
                          borderLeft: isActive ? `2px solid ${C.amber}` : "2px solid transparent",
                          textDecoration: "none",
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: "13px",
                          letterSpacing: "0.02em",
                          transition: "all 0.15s ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ flexShrink: 0, display: "flex" }}>
                          <ItemIcon size={15} strokeWidth={1.8} />
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
                </div>

                {group.group && (
                  <div
                    style={{
                      height: 0,
                      borderTop: `1px dashed ${C.borderDashed}`,
                      margin: "6px 20px",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Back to site */}
        <div style={{ padding: "16px 20px", borderTop: `1px dashed ${C.borderDashed}` }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: C.textFaint,
              textDecoration: "none",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10.5px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            <ArrowLeft size={13} strokeWidth={2} />
            {!collapsed && "Back to Site"}
          </Link>
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
            height: "92px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/images/logo.png"
              alt="RB Hair & Beauty Lounge"
              style={{ height: 54, width: "auto", objectFit: "contain" }}
            />
          </div>

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
                      fontFamily: "'IBM Plex Mono', monospace",
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
                      fontFamily: "'IBM Plex Mono', monospace",
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
                        fontFamily: "'IBM Plex Mono', monospace",
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
                              fontFamily: "'IBM Plex Mono', monospace",
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
                            fontFamily: "'IBM Plex Mono', monospace",
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
                fontFamily: "'IBM Plex Mono', monospace",
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
