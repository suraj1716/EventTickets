import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head, useForm, usePage } from "@inertiajs/react";
import React, { FormEvent, FormEventHandler, useEffect, useState } from "react";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import VendorDetails from "./Partials/VendorDetails";
import ShippingAddresses, { ShippingAddress } from "./ShippingAddresses";
import { X } from "lucide-react";

const C = {
  bg: "#0B0B10",
  surface: "#15141B",
  border: "#26232E",
  borderDashed: "#33303C",
  text: "#F7F5F2",
  textMuted: "#9C97A8",
  textFaint: "#6B6775",
  amber: "#FFB627",
  amberHover: "#ffc75c",
  overlay: "rgba(11,11,16,0.7)",
};

/* ── self-contained "ticket stub" card, replaces the shared <Card> ── */
function Card({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pf-card">
      <div className="pf-card-header">
        <h2 className="pf-card-title">{title}</h2>
        {badge && <span className="pf-card-badge">{badge}</span>}
      </div>
      <div className="pf-perf" />
      <div className="pf-card-body">{children}</div>
    </div>
  );
}

/* ── self-contained modal, replaces the shared <Modal> ── */
function Modal({
  show,
  onClose,
  children,
}: {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="pf-modal-overlay" onClick={onClose}>
      <div className="pf-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="pf-modal-close" onClick={onClose} aria-label="Close">
          <X size={18} strokeWidth={1.5} />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function Edit() {
  const { auth } = usePage<PageProps>().props;
  const isVendor = auth.user?.vendor?.status === "approved";

  const [showBecomeVendorConfirmation, setShowBecomeVendorConfirmation] =
    useState(false);
  const { vendorOwnerEmail } = usePage().props as { vendorOwnerEmail: string };

  const { data, setData, errors, post, processing, recentlySuccessful } =
    useForm({
      store_name: "",
      store_address: "",
      booking_fee: "",
      vendor_type: "",
      start_time: "",
      end_time: "",
      slot_interval: 15,
      recurring_closed_days: [] as string[],
      closed_dates: [] as string[],
    });
  const [successMessage, setSuccessMessage] = useState("");
  const closeModal = () => setShowBecomeVendorConfirmation(false);

  const becomeVendor: FormEventHandler = (ev: FormEvent<Element>) => {
    ev.preventDefault();
    post(route("vendor.become-vendor"), {
      preserveScroll: true,
      onSuccess: () => {
        closeModal();
        setSuccessMessage("you can now create and publish products");
      },
      onError: () => {},
    });
  };
  const user = usePage().props.auth.user;

  const page = usePage<
    PageProps<{
      mustVerifyEmail: boolean;
      status?: string;
      shipping_addresses: ShippingAddress[];
    }>
  >();
  const { mustVerifyEmail, status, shipping_addresses } = page.props;

  useEffect(() => {
    if (window.location.hash === "#vendor-details") {
      document
        .getElementById("vendor-details")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <AuthenticatedLayout>
      <Head title="Profile">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="pf-page">
        <style>{`
          .pf-page {
            font-family: 'Manrope', sans-serif;
            background: ${C.bg};
            color: ${C.text};
            min-height: 100%;
          }

          /* ── Hero ── */
          .pf-hero {
            background: ${C.surface};
            border-bottom: 1px solid ${C.border};
            padding: 4rem 24px 3rem;
            text-align: center;
          }
          .pf-hero-eyebrow {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 11px;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: ${C.amber};
            margin-bottom: 14px;
          }
          .pf-hero-dot {
            display: inline-block;
            height: 6px;
            width: 6px;
            border-radius: 50%;
            background: ${C.amber};
          }
          .pf-hero-title {
            font-family: 'Anton', sans-serif;
            text-transform: uppercase;
            font-size: 2.25rem;
            line-height: 1.15;
            color: ${C.text};
            margin: 0;
          }
          .pf-hero-title em {
            font-style: normal;
            color: ${C.amber};
          }

          /* ── Card (ticket stub) ── */
          .pf-card {
            background: ${C.surface};
            border: 1px solid ${C.border};
            border-radius: 16px;
            overflow: hidden;
          }
          .pf-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 22px 26px 18px;
          }
          .pf-card-title {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: ${C.text};
            margin: 0;
          }
          .pf-card-badge {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 10px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: ${C.amber};
            border: 1px solid rgba(255,182,39,0.3);
            background: rgba(255,182,39,0.06);
            border-radius: 999px;
            padding: 4px 10px;
          }
          .pf-perf {
            position: relative;
            height: 1px;
            border-top: 1px dashed ${C.borderDashed};
            margin: 0 26px;
          }
          .pf-perf::before, .pf-perf::after {
            content: '';
            position: absolute;
            top: -10px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${C.bg};
          }
          .pf-perf::before { left: -10px; }
          .pf-perf::after { right: -10px; }
          .pf-card-body { padding: 22px 26px 26px; }

          .pf-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.75rem;
            max-width: 640px;
            margin: 0 auto;
          }
          .pf-stack {
            display: flex;
            flex-direction: column;
            gap: 1.75rem;
          }

          .pf-btn-primary {
            border: none;
            border-radius: 10px;
            background: ${C.amber};
            color: ${C.bg};
            padding: 12px 20px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.15s ease;
          }
          .pf-btn-primary:hover:not(:disabled) { background: ${C.amberHover}; }
          .pf-btn-primary:disabled { opacity: 0.6; cursor: default; }

          .pf-btn-ghost {
            border: 1px solid ${C.border};
            border-radius: 10px;
            background: transparent;
            color: ${C.textMuted};
            padding: 11px 18px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 11px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
            transition: border-color 0.15s ease, color 0.15s ease;
          }
          .pf-btn-ghost:hover { border-color: rgba(255,182,39,0.5); color: ${C.text}; }

          /* ── Modal ── */
          .pf-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: ${C.overlay};
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .pf-modal-card {
            width: 100%;
            max-width: 440px;
            background: ${C.surface};
            border: 1px solid ${C.border};
            border-radius: 16px;
            padding: 32px;
            position: relative;
          }
          .pf-modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            color: ${C.textFaint};
            cursor: pointer;
          }
          .pf-modal-close:hover { color: ${C.amber}; }
          .pf-modal-title {
            font-family: 'Anton', sans-serif;
            text-transform: uppercase;
            font-size: 1.3rem;
            color: ${C.text};
            margin: 0;
          }
        `}</style>

        {/* ── Hero ── */}
        <div className="pf-hero">
          <div className="pf-hero-eyebrow">
            <span className="pf-hero-dot" />
            Account
          </div>
          <h1 className="pf-hero-title">
            Your <em>Profile</em>
          </h1>
        </div>

        {/* ── Content ── */}
        <section style={{ padding: "3.5rem 24px 5rem" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            {isVendor && (
              <div
                id="vendor-details"
                className="pf-stack"
                style={{
                  maxWidth: 640,
                  margin: "0 auto",
                  marginBottom: 28,
                }}
              >
                <Card
                  title="Vendor Details"
                  badge={auth.user.vendor?.status_label}
                >
                  <VendorDetails />
                </Card>
              </div>
            )}

            <div className="pf-grid">
              <div className="pf-stack">
                {auth.user.email === vendorOwnerEmail && !isVendor && (
                  <button
                    className="pf-btn-primary"
                    disabled={processing}
                    onClick={() => setShowBecomeVendorConfirmation(true)}
                  >
                    Become a Vendor
                  </button>
                )}
                <Card title="Profile Information">
                  <UpdateProfileInformationForm
                    mustVerifyEmail={mustVerifyEmail}
                    status={status}
                  />
                </Card>
                <Card title="Security">
                  <UpdatePasswordForm />
                </Card>
                <Card title="Danger Zone">
                  <DeleteUserForm />
                </Card>
              </div>
            </div>
          </div>

          <Modal show={showBecomeVendorConfirmation} onClose={closeModal}>
            <form onSubmit={becomeVendor}>
              <h3 className="pf-modal-title">
                Are you sure you want to be a Vendor?
              </h3>
              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                }}
              >
                <button type="button" className="pf-btn-ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="pf-btn-primary" disabled={processing}>
                  Confirm
                </button>
              </div>
            </form>
          </Modal>
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
