import "../css/app.css";
import "./bootstrap";
import { createInertiaApp, router } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot, hydrateRoot } from "react-dom/client";
import AppWrapper from "./Components/Core/AppWrapper";
import ErrorBoundary from "./Components/Core/ErrorBoundary";
import { AuthModalProvider } from "./Contexts/AuthModalContext";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";
let root: ReturnType<typeof createRoot> | null = null;

router.on("error", (event) => {
  const errors = event.detail.errors;
  if (errors && Object.keys(errors).length > 0) {
    const firstError = Object.values(errors)[0] as string;
    toast.error(firstError);
  }
});

// Force a fresh Inertia partial reload when a page is restored from
// the browser's back-forward cache (e.g. pressing Back after leaving
// for Stripe Checkout). Without this, the page resumes frozen JS
// state instead of re-fetching current server data.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    router.reload();
  }
});

// ── TEMP DEBUG: disabled so raw Laravel error responses (Whoops/Ignition,
// or the default Laravel error page) render instead of being swallowed by
// a toast. Restore the preventDefault() block once /admindashboard is fixed.
router.on("invalid", (event) => {
  console.error("Invalid Inertia response:", event.detail.response);

  /*
  const isAdminRoute = window.location.pathname.startsWith("/dashboard");

  if (isAdminRoute) {
    event.preventDefault();
    toast.error("Something went wrong. Please try again.");
    console.error("Invalid Inertia response:", event.detail.response);
  }
  */
});

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) =>
    resolvePageComponent(
      `./Pages/${name}.tsx`,
      import.meta.glob("./Pages/**/*.tsx"),
    ),

  // Previously missing entirely, which is why the default Inertia bar
  // (blue, 250ms delay, spinner on) was showing on every navigation.
  progress: {
    color: "var(--color-primary)",
    showSpinner: false,
    delay: 350,
    includeCSS: true,
  },

  setup({ el, App, props }) {
    if (import.meta.env.SSR) {
      // TEMP DEBUG: ErrorBoundary removed so SSR render errors surface
      // instead of being caught and replaced with a fallback UI.
      hydrateRoot(el, <AppWrapper App={App} props={props} />);
    } else {
      if (!root) {
        root = createRoot(el);
      }
     root.render(
    <AuthModalProvider>
        <AppWrapper App={App} props={props} />
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    border: "1px solid var(--color-border)",
                    padding: "10px 16px",
                },
            }}
        />
    </AuthModalProvider>
);
    }
  },
});
