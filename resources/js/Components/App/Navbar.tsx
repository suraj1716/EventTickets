"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Head, Link, usePage, router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, X, ChevronRight, Ticket } from "lucide-react";
import MiniCartDropdown from "./MiniCartDropdown";
import { PageProps } from "@/types";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useAuthModal } from "@/Contexts/AuthModalContext";
import UserCircleIcon from "@heroicons/react/24/solid/UserCircleIcon";
import { formatAustralianPhone } from "@/utils/PhoneFormat";
import { useVendorDetails } from "@/hooks/useVendorData";

/*
|--------------------------------------------------------------------------
| Palette — lifted straight from Events/Index.tsx so the navbar reads as
| part of the same box office, not a bolted-on header. Amber carries every
| active/primary state; purple is reserved for the "Tour" badge elsewhere
| and isn't reused here, to keep it meaning one thing.
|--------------------------------------------------------------------------
*/

const C = {
  bg: "#0B0B10",
  surface: "#15141B",
  border: "#26232E",
  borderDashed: "#33303C",
  text: "#F7F5F2",
  textMuted: "#9C97A8",
  textFaint: "#6B6775",
  textFainter: "#565262",
  amber: "#FFB627",
  amberHover: "#ffc75c",
};

const EASE = [0.16, 1, 0.3, 1] as const;
const MotionLink = motion(Link);

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeIn = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

function NavLink({
  href,
  children,
  active,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: (e: React.MouseEvent<Element>) => void;
}) {
  return (
    <Link
      href={href}
      className={`nav-link${active ? " active" : ""}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    router.get(route("events.index"), { search: term.trim() });
    onClose();
  };

  const suggestions = ["Live music", "Comedy", "Festivals", "This weekend", "Under $50"];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(11,11,16,0.8)", zIndex: 998 }}
          />

          <motion.div
            key="search-panel"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              background: C.surface,
              zIndex: 999,
              padding: "48px 24px 32px",
              borderBottom: `1px solid ${C.border}`,
              boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
            }}
          >
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#FFB627] mb-4 flex items-center gap-2">
                <motion.span
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block h-1.5 w-1.5 rounded-full bg-[#FFB627]"
                />
                What are you looking for?
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  borderBottom: `1px solid ${C.borderDashed}`,
                  paddingBottom: 12,
                }}
              >
                <button
                  onClick={() => handleSearch(query)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}
                  aria-label="Submit search"
                >
                  <Search size={18} color={C.textFaint} strokeWidth={1.8} />
                </button>

                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch(query);
                  }}
                  placeholder="Search events, artists, venues…"
                  className="font-['Manrope']"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: "none",
                    outline: "none",
                    fontSize: 20,
                    fontWeight: 600,
                    color: C.text,
                    background: "transparent",
                    caretColor: C.amber,
                  }}
                />

                <button
                  onClick={onClose}
                  className="font-['IBM_Plex_Mono']"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: C.textFaint,
                    flexShrink: 0,
                  }}
                >
                  Close
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
                {suggestions.map((s) => (
                  <motion.button
                    key={s}
                    whileHover={{ y: -1, borderColor: "rgba(255,182,39,0.5)", color: C.text }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSearch(s)}
                    className="font-['IBM_Plex_Mono']"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: C.textMuted,
                      border: `1px solid ${C.border}`,
                      padding: "6px 14px",
                      borderRadius: 999,
                      background: C.bg,
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Navbar() {
  const { auth } = usePage<PageProps<{ auth?: { user: any } }>>().props;
  const user = auth?.user ?? null;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const isAdmin =
    auth?.user?.roles?.includes("Admin") ||
    (auth?.user?.roles?.includes("Vendor") && auth?.user?.vendor?.status === "approved");
  const { url } = usePage();
  const vendor = useVendorDetails();

  const { openLogin, openRegister } = useAuthModal();

  const userDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [url]);

  const iconBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: C.textMuted,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    position: "relative",
    transition: "color 0.15s ease",
    padding: 0,
    flexShrink: 0,
  };

  const mobileNavItems: { label: string; href: string }[] = [
    { label: "Events", href: route("events.index") },
    { label: "Resale", href: route("resale.index") },

    { label: "Coming Soon", href: route("events.coming-soon") },

    { label: "My Tickets", href: route("tickets.index") },
    { label: "Gift Vouchers", href: route("gift-voucher.shop") },
    { label: "Contact", href: route("contact.index") },
  ];

  const accountItems: { label: string; href: string }[] = [
    ...(isAdmin ? [{ label: "Admin Dashboard", href: route("admin.dashboard") }] : []),
    { label: "My Tickets", href: route("tickets.index") },
    { label: "Vouchers", href: route("vouchers.index") },
    { label: "Profile", href: route("profile.edit") },
    { label: "Orders", href: route("orders.history") },
  ];

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style>{`
        .nav-link {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${C.textMuted};
          text-decoration: none;
          position: relative;
          padding-bottom: 3px;
          transition: color 0.15s ease;
          white-space: nowrap;
        }
        .nav-link::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 1px; background: ${C.amber}; transition: width 0.25s ease; }
        .nav-link:hover { color: ${C.text}; }
        .nav-link:hover::after { width: 100%; }
        .nav-link.active { color: ${C.amber}; }
        .nav-link.active::after { width: 100%; }

        .nav-dropdown-item {
          display: block; width: 100%; padding: 10px 20px;
          font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: ${C.textMuted}; text-decoration: none;
          background: none; border: none; text-align: left; cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .nav-dropdown-item:hover { background: ${C.bg}; color: ${C.amber}; }
        .nav-icon-btn:hover { color: ${C.amber} !important; }

        /* ══ Mobile drawer — ticket-stub layout ══ */
        .fs-panel {
          position: fixed; inset: 0; width: 100%; height: 100dvh;
          overflow-y: auto; -webkit-overflow-scrolling: touch;
          background: ${C.bg};
          display: flex; flex-direction: column;
        }
        .fs-header {
          position: sticky; top: 0; z-index: 5;
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px;
          background: ${C.bg};
          border-bottom: 1px dashed ${C.borderDashed};
          flex-shrink: 0;
        }
        .fs-close {
          width: 40px; height: 40px; border-radius: 50%;
          border: 1px solid rgba(255,182,39,0.3);
          background: rgba(255,182,39,0.08);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: ${C.amber}; flex-shrink: 0;
          transition: background 0.15s ease;
        }
        .fs-close:hover { background: rgba(255,182,39,0.18); }

        .fs-auth { padding: 20px; border-bottom: 1px dashed ${C.borderDashed}; flex-shrink: 0; }
        .fs-auth-guest-label {
          font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: ${C.textFainter}; margin-bottom: 12px;
        }
        .fs-auth-buttons { display: flex; gap: 10px; }
        .fs-btn-signin {
          flex: 1; text-align: center; padding: 13px 0;
          background: ${C.amber}; color: ${C.bg}; border: none; border-radius: 6px;
          font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem;
          letter-spacing: 0.14em; text-transform: uppercase;
          cursor: pointer; font-weight: 700;
          transition: background 0.15s ease;
        }
        .fs-btn-signin:hover { background: ${C.amberHover}; }
        .fs-btn-register {
          flex: 1; text-align: center; padding: 13px 0;
          background: transparent; color: ${C.textMuted};
          border: 1px solid ${C.border}; border-radius: 6px;
          font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem;
          letter-spacing: 0.14em; text-transform: uppercase;
          cursor: pointer; text-decoration: none;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .fs-btn-register:hover { border-color: ${C.amber}; color: ${C.text}; }

        .fs-user-row { display: flex; align-items: center; gap: 14px; }
        .fs-avatar {
          width: 52px; height: 52px; border-radius: 50%; object-fit: cover;
          flex-shrink: 0; border: 1.5px solid ${C.amber};
        }
        .fs-user-name {
          font-family: 'Manrope'; font-size: 0.9rem; color: ${C.text};
          margin: 0; font-weight: 700;
        }
        .fs-user-sub {
          font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem;
          color: ${C.textFainter}; letter-spacing: 0.08em; margin: 2px 0 0;
        }

        .fs-account-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 16px; }
        .fs-account-btn {
          display: flex; align-items: center; justify-content: center; padding: 12px 8px;
          border: 1px solid rgba(255,182,39,0.2); background: rgba(255,182,39,0.05);
          font-family: 'IBM Plex Mono', monospace; font-size: 0.63rem;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: ${C.amber}; text-decoration: none;
          cursor: pointer; border-radius: 6px; text-align: center;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .fs-account-btn:hover { background: rgba(255,182,39,0.14); }
        .fs-account-btn.danger { border-color: rgba(224,90,90,0.3); color: #e08585; grid-column: span 2; }
        .fs-account-btn.danger:hover { background: rgba(224,90,90,0.12); color: #fff; }

        .fs-nav { flex: 1; display: flex; flex-direction: column; padding: 8px 0; }
        .fs-nav-link {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 22px 20px;
          font-family: 'Anton'; text-transform: uppercase; letter-spacing: 0.01em;
          font-size: 1.4rem; font-weight: 400;
          color: rgba(247,245,242,0.85); text-decoration: none;
          border-bottom: 1px dashed ${C.borderDashed};
          background: transparent;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .fs-nav-link:active, .fs-nav-link:hover { background: rgba(255,182,39,0.06); color: ${C.amber}; }
        .fs-nav-arrow { color: ${C.amber}; opacity: 0.7; flex-shrink: 0; margin-left: 12px; }

        .fs-cta { padding: 18px 20px; border-top: 1px dashed ${C.borderDashed}; flex-shrink: 0; }
        .fs-cta-btn {
          display: block; text-align: center; padding: 16px 0;
          background: ${C.amber}; color: ${C.bg};
          font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none;
          border-radius: 6px;
          transition: background 0.15s ease;
        }
        .fs-cta-btn:hover { background: ${C.amberHover}; }
      `}</style>

      {/* ══ MOBILE DRAWER ══ */}
      <Dialog open={mobileOpen} onClose={setMobileOpen} className="relative z-[150] lg:hidden">
        <Transition
          show={mobileOpen}
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0" style={{ background: "rgba(11,11,16,0.8)" }} />
        </Transition>

        <div className="fixed inset-0 z-[160]">
          <Transition
            show={mobileOpen}
            as={Fragment}
            enter="transition ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-250"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fs-panel">
              <div className="fs-header">
                <div className="flex items-center gap-2">
                  <Ticket size={20} color={C.amber} strokeWidth={1.8} />
                  <span className="font-['Anton'] uppercase text-lg text-[#F7F5F2] tracking-wide">
                    Box Office
                  </span>
                </div>
                <button type="button" onClick={() => setMobileOpen(false)} className="fs-close" aria-label="Close menu">
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              <div className="fs-auth">
                {!user ? (
                  <>
                    <p className="fs-auth-guest-label">Your account</p>
                    <div className="fs-auth-buttons">
                      <button onClick={() => { setMobileOpen(false); openLogin(); }} className="fs-btn-signin">
                        Sign In
                      </button>
                      <button onClick={() => { setMobileOpen(false); openRegister(); }} className="fs-btn-register">
                        Create Account
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="fs-user-row">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="fs-avatar" />
                      ) : (
                        <UserCircleIcon className="fs-avatar" style={{ color: C.textMuted }} />
                      )}
                      <div>
                        <p className="fs-user-name">{user.name}</p>
                        <p className="fs-user-sub">My Account</p>
                      </div>
                    </div>

                    <div className="fs-account-grid">
                      {accountItems.map((item) => (
                        <Link key={item.label} href={item.href} className="fs-account-btn" onClick={() => setMobileOpen(false)}>
                          {item.label}
                        </Link>
                      ))}
                      <Link href={route("logout")} method="post" as="button" className="fs-account-btn danger" onClick={() => setMobileOpen(false)}>
                        Logout
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <nav className="fs-nav">
                {mobileNavItems.map((item) => (
                  <Link key={item.label} href={item.href} className="fs-nav-link" onClick={() => setMobileOpen(false)}>
                    {item.label}
                    <ChevronRight size={20} className="fs-nav-arrow" />
                  </Link>
                ))}
              </nav>

              <div className="fs-cta">
                <Link href={route("events.index")} className="fs-cta-btn" onClick={() => setMobileOpen(false)}>
                  Get Tickets
                </Link>
              </div>
            </Dialog.Panel>
          </Transition>
        </div>
      </Dialog>

      {/* ══ SEARCH OVERLAY ══ */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ══ PRIMARY NAV WRAPPER (sticky) ══ */}
      <div className="sticky top-0 z-50">
        {/* Announcement strip — echoes the hero's "box office open" marquee */}
        <div
          className="hidden md:flex font-['IBM_Plex_Mono']"
          style={{
            background: C.bg,
            color: C.textMuted,
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            padding: "9px 0",
            borderBottom: `1px dashed ${C.borderDashed}`,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: C.amber }}
              />
              Box office — open now
            </span>

            {vendor?.phone ? (
              <a href={`tel:${vendor.phone}`} style={{ color: C.text, fontWeight: 600 }}>
                {formatAustralianPhone(vendor.phone)}
              </a>
            ) : (
              <span>Instant e-tickets — nothing to print</span>
            )}
          </div>
        </div>

        {/* ══ HEADER ══ */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8" style={{ height: 76 }}>
            {/* Wordmark */}
            <Link href={route("home")} className="flex items-center gap-2 shrink-0" style={{ textDecoration: "none" }}>
              <Ticket size={22} color={C.amber} strokeWidth={1.8} />
              <span className="font-['Anton'] uppercase text-2xl tracking-wide" style={{ color: C.text }}>
                Box Office
              </span>
            </Link>

            {/* Nav links — desktop only */}
            <nav className="hidden lg:flex items-center gap-8 mx-auto shrink-0">
              <NavLink href={route("events.index")} active={url.startsWith("/events")}>
                Events
              </NavLink>
              <NavLink href={route("resale.index")} active={url.startsWith("/resale")}>
                Resale
              </NavLink>
               <NavLink href={route("events.coming-soon")} active={url.startsWith("/coming-soon")}>
                Coming Soon
              </NavLink>
              <NavLink href={route("tickets.index")} active={url.startsWith("/tickets")}>
                My Tickets
              </NavLink>
              <NavLink href={route("gift-voucher.shop")} active={url.startsWith("/gift-voucher")}>
                Gift Vouchers
              </NavLink>
              <NavLink href={route("contact.index")} active={url.startsWith("/contact")}>
                Contact
              </NavLink>
            </nav>

            {/* Icons + CTA */}
            <div className="flex items-center gap-1 shrink-0">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setSearchOpen(true)}
                style={iconBtnStyle}
                aria-label="Search"
                className="nav-icon-btn"
              >
                <Search size={18} strokeWidth={1.8} />
              </motion.button>

              <div className="relative flex">
                <MiniCartDropdown />
              </div>

              <div className="hidden lg:flex relative" ref={userDropdownRef}>
                {user ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setUserDropdownOpen((p) => !p)}
                      aria-label="User menu"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        border: `1.5px solid ${C.amber}`,
                        overflow: "hidden",
                        cursor: "pointer",
                        padding: 0,
                        background: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <UserCircleIcon style={{ width: "100%", height: "100%", color: C.textMuted }} />
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {userDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: "absolute",
                            top: "calc(100% + 12px)",
                            right: 0,
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 10,
                            minWidth: 190,
                            padding: "6px 0",
                            zIndex: 120,
                          }}
                        >
                          {accountItems.map((item) => (
                            <Link key={item.label} href={item.href} className="nav-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                              {item.label}
                            </Link>
                          ))}
                          <div style={{ height: 1, background: C.border, margin: "6px 0" }} />
                          <Link
                            href={route("logout")}
                            method="post"
                            as="button"
                            className="nav-dropdown-item"
                            style={{ color: "#e08585" }}
                            onClick={() => setUserDropdownOpen(false)}
                          >
                            Logout
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setUserDropdownOpen((p) => !p)}
                      style={iconBtnStyle}
                      aria-label="Account"
                      className="nav-icon-btn"
                    >
                      <User size={18} strokeWidth={1.8} />
                    </motion.button>

                    <AnimatePresence>
                      {userDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: "absolute",
                            top: "calc(100% + 12px)",
                            right: 0,
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 10,
                            minWidth: 180,
                            padding: "6px 0",
                            zIndex: 120,
                          }}
                        >
                          <button onClick={() => { setUserDropdownOpen(false); openLogin(); }} className="nav-dropdown-item">
                            Sign In
                          </button>
                          <button onClick={() => { setUserDropdownOpen(false); openRegister(); }} className="nav-dropdown-item">
                            Create Account
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>

              {/* CTA — desktop only */}
              <MotionLink
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                href={route("events.index")}
                className="hidden lg:inline-flex items-center font-['IBM_Plex_Mono']"
                style={{
                  marginLeft: 10,
                  padding: "10px 22px",
                  background: C.amber,
                  color: C.bg,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Get Tickets
              </MotionLink>

              {/* Hamburger — mobile only */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setMobileOpen(true)}
                style={{ ...iconBtnStyle, marginRight: -6 }}
                aria-label="Open menu"
                className="lg:hidden flex items-center justify-center"
              >
                <Bars3Icon className="size-5" />
              </motion.button>
            </div>
          </div>
        </motion.header>
      </div>
    </>
  );
}
