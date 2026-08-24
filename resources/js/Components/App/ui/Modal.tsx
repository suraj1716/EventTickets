// resources/js/Components/App/ui/Modal.tsx
//
// Drop-in replacement for Components/Core/Modal — same prop API
// (show, maxWidth, closeable, onClose), so existing call sites don't need
// to change anything except the import path. The only difference is visual:
// Core/Modal used generic Tailwind gray-500/75 overlay + bg-white panel;
// this version uses the theme's CSS variables so modals match the rest of
// the app (About.tsx, Cart, Vouchers, etc.) instead of looking like an
// unstyled Breeze default.
//
// Usage (identical to Core/Modal):
//   <Modal show={open} onClose={closeModal}>
//     <div style={{ padding: 32 }}>...</div>
//   </Modal>

import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { PropsWithChildren } from "react";

const maxWidthPx: Record<"sm" | "md" | "lg" | "xl" | "2xl", string> = {
  sm: "384px",
  md: "448px",
  lg: "512px",
  xl: "576px",
  "2xl": "672px",
};

export default function Modal({
  children,
  show = false,
  maxWidth = "2xl",
  closeable = true,
  onClose = () => {},
}: PropsWithChildren<{
  show: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  closeable?: boolean;
  onClose: CallableFunction;
}>) {
  const close = () => {
    if (closeable) {
      onClose();
    }
  };

  return (
    <Transition show={show} leave="duration-200">
      <Dialog
        as="div"
        id="modal"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflowY: "auto",
          padding: "1.5rem 1rem",
        }}
        onClose={close}
      >
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--color-overlay)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          />
        </TransitionChild>

        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enterTo="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 translate-y-0 sm:scale-100"
          leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <DialogPanel
            style={{
              position: "relative",
              width: "100%",
              maxWidth: maxWidthPx[maxWidth],
              margin: "0 auto",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-xl)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            {children}
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}
