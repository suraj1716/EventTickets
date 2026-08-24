"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Dialog, Disclosure, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Link, usePage, router } from "@inertiajs/react";
import { HomeIcon, Search } from "lucide-react";
import MiniCartDropdownBottom from "./MiniCartDropdownBottom";
import LoginModal from "@/Pages/Auth/Login";
import RegisterModal from "@/Pages/Auth/Register";
import { PageProps } from "@/types";
import { Bars3Icon } from "@heroicons/react/24/outline";
import SearchBar from "./SearchBar";
import useScrollInfo from "@/hooks/useScrollDirection";

interface Category {
  id: string;
  name: string;
  href: string;
}
interface Department {
  id: string;
  name: string;
  categories: Category[];
  image?: string;
}
interface ProductGroup {
  id: number;
  name: string;
  slug: string;
}
interface CategoryGroup {
  id: number;
  name: string;
  active: boolean;
}

const iconBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--color-text-muted)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  position: "relative",
  transition: "color var(--transition-fast)",
  padding: 0,
};
interface NavbarBottomProps {
  onLogin: () => void;
}
export default function NavbarBottom({ onLogin }: NavbarBottomProps) {
  const {
    auth,
    keyword,
    categoryGroups = [],
    productGroups = [],
  } = usePage<
    PageProps<{
      keyword: string;
      departments: Department[];
      categoryGroups: CategoryGroup[];
      productGroups: ProductGroup[];
      auth: { user: any };
    }>
  >().props as any;

  const user = (auth as any)?.user ?? null;
  const groups = (categoryGroups as CategoryGroup[]) ?? [];
  const pGroups = (productGroups as ProductGroup[]) ?? [];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <style>{`
        /* ── Bottom nav bar ── */
        .bn-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 64px;
          background: var(--color-primary-dark);
          border-top: 1px solid rgba(212,175,90,0.18);
          display: flex;
          align-items: center;
          justify-content: space-around;
          z-index: 200;
          padding: 0 8px;
        }
        .bn-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(253,250,246,0.4);
          text-decoration: none;
          padding: 4px 12px;
          transition: color var(--transition-fast);
          -webkit-tap-highlight-color: transparent;
        }
        .bn-tab:hover, .bn-tab:active { color: rgba(212,175,90,0.9); }
        .bn-tab-label {
          font-family: var(--font-body);
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        /* ── Full-screen panel (reused from Navbar) ── */
        .fs-panel {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100dvh;
          overflow: hidden;
          background: var(--color-primary-dark);
        }
        .fs-right {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          background: transparent;
        }
        .fs-close {
          position: absolute;
          top: 1.25rem; right: 1.25rem;
          width: 2.25rem; height: 2.25rem;
          border-radius: 50%;
          border: 1px solid rgba(201,169,110,0.25);
          background: rgba(201,169,110,0.08);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: var(--color-accent-light);
          z-index: 10;
          transition: background var(--transition-fast);
        }
        .fs-close:hover { background: rgba(201,169,110,0.18); }

        /* Auth block */
        .fs-auth {
          padding: 4rem 1.5rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .fs-auth-guest-label {
          font-family: var(--font-body);
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(253,250,246,0.35);
          margin-bottom: 0.75rem;
        }
        .fs-btn-signin {
          display: block; width: 100%; padding: 0.7rem 0;
          background: var(--color-accent);
          color: var(--color-primary-dark);
          border: none;
          font-family: var(--font-body); font-size: 0.6rem;
          letter-spacing: 0.18em; text-transform: uppercase;
          cursor: pointer; margin-bottom: 0.5rem; font-weight: 600;
          transition: background var(--transition-fast);
        }
        .fs-btn-signin:hover { background: var(--color-accent-light); }
        .fs-btn-register {
          display: block; width: 100%; padding: 0.7rem 0;
          background: transparent;
          color: rgba(253,250,246,0.55);
          border: 1px solid rgba(255,255,255,0.15);
          font-family: var(--font-body); font-size: 0.6rem;
          letter-spacing: 0.18em; text-transform: uppercase;
          cursor: pointer; text-align: center; text-decoration: none;
          transition: border-color var(--transition-fast), color var(--transition-fast);
        }
        .fs-btn-register:hover { border-color: var(--color-accent); color: var(--color-accent-light); }

        /* Logged-in user row */
        .fs-user-name {
          font-family: var(--font-body); font-size: 0.65rem;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--color-text-inverse); margin: 0;
        }
        .fs-user-sub {
          font-family: var(--font-body); font-size: 0.6rem;
          color: rgba(253,250,246,0.4); letter-spacing: 0.1em; margin: 0;
        }
        .fs-chip {
          padding: 0.25rem 0.65rem;
          border: 1px solid rgba(201,169,110,0.25);
          font-family: var(--font-body); font-size: 0.55rem;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--color-accent-light); text-decoration: none;
          background: rgba(201,169,110,0.07); cursor: pointer;
          transition: background var(--transition-fast), color var(--transition-fast);
        }
        .fs-chip:hover { background: var(--color-accent); color: var(--color-primary-dark); border-color: var(--color-accent); }
        .fs-chip.danger { border-color: rgba(192,57,43,0.3); color: #e07070; }
        .fs-chip.danger:hover { background: var(--color-error); color: #fff; border-color: var(--color-error); }
        .fs-user-chips {
          display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.85rem;
        }

        /* Nav links */
        .fs-nav { flex: 1; padding: 0.5rem 0; }
        .fs-nav-link {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.5rem;
          font-family: var(--font-display);
          font-size: 1.5rem; font-weight: 300; font-style: italic;
          color: rgba(253,250,246,0.7); text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          transition: color var(--transition-fast), padding-left var(--transition-base);
        }
        .fs-nav-link:hover { color: var(--color-accent-light); padding-left: 2rem; }
        .fs-nav-arrow {
          color: var(--color-accent); opacity: 0; font-size: 1rem;
          transition: opacity var(--transition-fast), transform var(--transition-fast);
        }
        .fs-nav-link:hover .fs-nav-arrow { opacity: 1; transform: translateX(4px); }

        /* Disclosure (accordions) */
        .fs-disclosure-btn {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 1rem 1.5rem;
          font-family: var(--font-display);
          font-size: 1.5rem; font-weight: 300; font-style: italic;
          color: rgba(253,250,246,0.7);
          background: none; border: none; border-bottom: 1px solid rgba(255,255,255,0.06);
          cursor: pointer; text-align: left;
          transition: color var(--transition-fast), padding-left var(--transition-base);
        }
        .fs-disclosure-btn:hover { color: var(--color-accent-light); padding-left: 2rem; }
        .fs-sub-item {
          display: block; width: 100%; padding: 0.7rem 2.5rem;
          font-family: var(--font-body); font-size: 0.6rem;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(253,250,246,0.4);
          background: rgba(0,0,0,0.15);
          border: none; border-bottom: 1px solid rgba(255,255,255,0.04);
          cursor: pointer; text-align: left;
          transition: color var(--transition-fast), background var(--transition-fast);
        }
        .fs-sub-item:hover { color: var(--color-accent-light); background: rgba(201,169,110,0.08); }

        /* CTA */
        .fs-cta { padding: 1.25rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); }
        .fs-cta-btn {
          display: block; text-align: center; padding: 0.85rem 0;
          background: var(--color-accent); color: var(--color-primary-dark);
          font-family: var(--font-body); font-size: 0.6rem; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase; text-decoration: none;
          transition: background var(--transition-fast);
        }
        .fs-cta-btn:hover { background: var(--color-accent-light); }

        /* Currency footer */
        .fs-currency {
          padding: 0.85rem 1.5rem;
          display: flex; align-items: center; gap: 0.6rem;
          font-family: var(--font-body); font-size: 0.6rem;
          letter-spacing: 0.12em; color: rgba(253,250,246,0.3);
          text-decoration: none; border-top: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 64px; /* clear the bottom bar */
        }
      `}</style>

      {/* ══ BOTTOM NAVIGATION BAR ══ */}
      <div className="bn-bar lg:hidden">
        <Link href={route("home")} className="bn-tab">
          <HomeIcon size={20} strokeWidth={1.5} />
          <span className="bn-tab-label">Home</span>
        </Link>

        <button className="bn-tab" onClick={scrollToTop} aria-label="Search">
          <SearchBar keyword={keyword} />
          <span className="bn-tab-label">Search</span>
        </button>

        <div className="bn-tab" style={{ position: "relative" }}>
          <MiniCartDropdownBottom />
        </div>

        <button
          className="bn-tab"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Bars3Icon style={{ width: 32, height: 32, strokeWidth: 1.5 }} />
          <span className="bn-tab-label">Menu</span>
        </button>
      </div>

      {/* ══ FULL-SCREEN MOBILE DRAWER ══ */}
      <Dialog
        open={mobileOpen}
        onClose={setMobileOpen}
        className="relative z-[250] lg:hidden"
      >
        {/* Backdrop */}
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
          <div
            className="fixed inset-0"
            style={{ background: "var(--color-overlay)" }}
          />
        </Transition>

        <div className="fixed inset-0 z-[260]">
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
              <div className="fs-right">
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="fs-close"
                  aria-label="Close menu"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {/* ── Auth block ── */}
                <div className="fs-auth">
                  {!user ? (
                    <>
                      <p className="fs-auth-guest-label">Your account</p>
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          onLogin();
                        }}
                        className="fs-btn-signin"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          setRegisterOpen(true);
                        }}
                        className="fs-btn-register"
                      >
                        Create Account
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1.5px solid rgba(212,175,90,0.4)",
                          }}
                        />
                        <div>
                          <p className="fs-user-name">{user.name}</p>
                          <p className="fs-user-sub">My Account</p>
                        </div>
                      </div>
                      <div className="fs-user-chips">
                        <Link
                          href={route("vouchers.index")}
                          className="fs-chip"
                          onClick={() => setMobileOpen(false)}
                        >
                          Vouchers
                        </Link>
                        <Link
                          href={route("profile.edit")}
                          className="fs-chip"
                          onClick={() => setMobileOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          href={route("bookings.history")}
                          className="fs-chip"
                          onClick={() => setMobileOpen(false)}
                        >
                          Bookings
                        </Link>
                        <Link
                          href={route("orders.history")}
                          className="fs-chip"
                          onClick={() => setMobileOpen(false)}
                        >
                          Orders
                        </Link>
                        <Link
                          href={route("logout")}
                          method="post"
                          as="button"
                          className="fs-chip danger"
                          onClick={() => setMobileOpen(false)}
                        >
                          Logout
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                {/* ── Nav links ── */}
                <nav className="fs-nav">
                  {[
                    { label: "Services", href: route("shop.search") },
                    { label: "About", href: route("about") },
                    { label: "Gallery", href: route("gallery.index") },
                    {
                      label: "Gift Cards",
                      href: route("gift-voucher.purchase"),
                    },
                    { label: "Contact Us", href: route("contact.index") },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="fs-nav-link"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                      <span className="fs-nav-arrow">→</span>
                    </Link>
                  ))}

                  {/* Collections accordion — uncomment if needed */}
                  {/* <Disclosure>
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="fs-disclosure-btn">
                          Collections
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ color: "var(--color-text-light)", transition: "transform var(--transition-base)", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </Disclosure.Button>
                        <Disclosure.Panel>
                          {groups.filter((g) => g.active).map((g) => (
                            <button key={g.id} className="fs-sub-item"
                              onClick={() => { router.visit(`/?scrollToCategoryId=${g.id}`, { preserveScroll: true, preserveState: true }); setMobileOpen(false); }}>
                              {g.name}
                            </button>
                          ))}
                          {pGroups.map((g) => (
                            <button key={g.id} className="fs-sub-item"
                              onClick={() => { router.visit(route("productGroup.show", { productGroup: g.slug }), { preserveScroll: true, preserveState: true }); setMobileOpen(false); }}>
                              {g.name}
                            </button>
                          ))}
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure> */}
                </nav>

                {/* ── CTA ── */}
                <div className="fs-cta">
                  <Link
                    href={route("bookings.store")}
                    className="fs-cta-btn"
                    onClick={() => setMobileOpen(false)}
                  >
                    Book a Consultation
                  </Link>
                </div>

                {/* ── Currency ── */}
                <a href="#" className="fs-currency">
                  <img
                    src="https://tailwindcss.com/plus-assets/img/flags/flag-australia.svg"
                    alt="AUD"
                    style={{ width: 18, height: "auto" }}
                  />
                  AUD — Australian Dollar
                </a>
              </div>
            </Dialog.Panel>
          </Transition>
        </div>
      </Dialog>

      {/* ── Auth modals ── */}

      <RegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSwitchToLogin={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
      />
    </>
  );
}
