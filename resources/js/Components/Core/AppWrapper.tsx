import React, { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { createPortal } from "react-dom";
import ErrorPage from "@/Pages/ErrorPage";
import { useAuthModal } from "@/Contexts/AuthModalContext";
import LoginModal from "@/Pages/Auth/Login";
import RegisterModal from "@/Pages/Auth/Register";

const Loader = () =>
  createPortal(
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none
                 transition-opacity duration-200 opacity-100"
    >
      <div className="mt-2 w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>,
    document.body
  );

interface AppWrapperProps {
    App: React.ComponentType<any>;
    props: Record<string, any>;
}

const AppWrapper: React.FC<AppWrapperProps> = ({ App, props }) => {
    const { loginOpen, registerOpen, openLogin, openRegister, closeAll } = useAuthModal();
    const [loading, setLoading] = useState(false);
    const [networkError, setNetworkError] = useState(false);
    const [errorStatus, setErrorStatus] = useState<number>(500);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        const removeStart = router.on("start", (event: any) => {
            timer = setTimeout(() => setLoading(true), 150);
        });

        const removeFinish = router.on("finish", () => {
            clearTimeout(timer);
            setLoading(false);
        });

        // ── TEMP DEBUG: no longer flips networkError/setErrorStatus, so the
        // custom <ErrorPage> below won't intercept real error responses.
        // Restore the two setState calls once /admindashboard is fixed.
        const removeError = router.on("error", (event: any) => {
            const status = event.detail?.response?.status ?? 500;
            console.error("Inertia router error:", status, event.detail);
            // setErrorStatus(status);
            // setNetworkError(true);
        });

        const removeInvalid = router.on("invalid", () => {
            clearTimeout(timer);
            setLoading(false);
        });

        const onUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error("Unhandled rejection:", event.reason);
            // TEMP DEBUG: disabled so an unrelated JS promise rejection
            // elsewhere on the page can't trigger the custom ErrorPage either.
            // setErrorStatus(0);
            // setNetworkError(true);
        };
        window.addEventListener("unhandledrejection", onUnhandledRejection);

        return () => {
            clearTimeout(timer);
            removeStart();
            removeFinish();
            removeError();
            removeInvalid();
            window.removeEventListener("unhandledrejection", onUnhandledRejection);
        };
    }, []);

    return (
        <>
            {loading && <Loader />}
            <App {...props} />
            <LoginModal
                isOpen={loginOpen}
                onClose={closeAll}
                onSwitchToRegister={openRegister}
                canResetPassword
            />
            <RegisterModal
                isOpen={registerOpen}
                onClose={closeAll}
                onSwitchToLogin={openLogin}
            />
        </>
    );
};

export default AppWrapper;
