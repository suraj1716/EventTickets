import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head, useForm, usePage } from "@inertiajs/react";
import React, { FormEvent, FormEventHandler, useEffect, useState } from "react";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import VendorDetails from "./Partials/VendorDetails";
import ShippingAddresses, { ShippingAddress } from "./ShippingAddresses";
import Card from "@/Components/App/Card";
import SectionHeading from "@/Components/App/ui/SectionHeading";
import Button from "@/Components/App/ui/Button";
import Modal from "@/Components/App/ui/Modal";
import PageHero from "@/Components/Page/PageHero";

export default function Edit() {
  const { auth } = usePage<PageProps>().props;
  const isVendor = auth.user?.vendor?.status === "approved"; // or: auth.user?.role === 'vendor'
  // if you can access the Inertia page object
  console.log(window.location.pathname);

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
      <Head title="Profile" />

      <div
        style={{
          fontFamily: "var(--font-body)",
          background: "var(--color-bg)",
          minHeight: "100%",
        }}
      >
        <style>{`
        .pf-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 2rem;
          position: relative;
          overflow: hidden;
          transition: border-color var(--transition-base), box-shadow var(--transition-base);
        }
        .pf-card:hover {
          border-color: var(--color-accent-light);
          box-shadow: var(--shadow-lg);
        }
        .pf-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-accent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease;
        }
        .pf-card:hover::before {
          transform: scaleX(1);
        }
   .pf-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.75rem;
    max-width: 640px;
    margin: 0 auto;
  }
        @media (min-width: 1980px) {
          .pf-grid {
            grid-template-columns: 1fr 1fr;
            align-items: start;
          }
        }
        .pf-grid--single {
          grid-template-columns: 1fr;
          max-width: 640px;
          margin: 0 auto;
        }
       .pf-stack {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }
      `}</style>

        {/* ── Hero ── */}
        <PageHero
          eyebrow="Account"
          title={
            <>
              Your<em>Profile</em>
            </>
          }
          breadcrumbs={[
            { label: "Home", href: route("home") },
            { label: "Gallery" },
          ]}
        />

        {/* ── Content ── */}
        <section style={{ padding: "3.5rem 0 5rem" }}>
          <div
            style={{
              maxWidth: "var(--container-max)",
              margin: "0 auto",
              padding: "0 7vw",
            }}
          >
            {isVendor && (
              <div
                id="vendor-details"
                className="pf-stack"
                style={{
                  maxWidth: 640,
                  margin: "0 auto",
                  marginBottom: "var(--space-lg)",
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
                  <Button
                    variant="primary"
                    disabled={processing}
                    onClick={() => setShowBecomeVendorConfirmation(true)}
                  >
                    Become a Vendor
                  </Button>
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
            <form onSubmit={becomeVendor} style={{ padding: 32 }}>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: "var(--text-lg)",
                  color: "var(--color-text)",
                }}
              >
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
                <Button type="button" variant="ghost" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={processing}>
                  Confirm
                </Button>
              </div>
            </form>
          </Modal>
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
