import { Head, Link, router } from "@inertiajs/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps, Order } from "@/types";
import { useEffect } from "react";

function Success({ orders }: PageProps<{ orders: Order[] }>) {

    useEffect(() => {
   router.reload({
  only: ['cartCount', 'cartItems'],
});
  }, []);

    return (
        <AuthenticatedLayout>
            <Head title="Payment Completed" />

            <div
                style={{
                    minHeight: "calc(100vh - 80px)",
                    backgroundColor: "var(--color-bg)",
                    padding: "clamp(32px, 8vw, 96px) 16px",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: 560,
                        margin: "0 auto",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                    }}
                >
                    {/* Tick — plays once on mount, no looping pulse */}
                    <div
                        style={{
                            width: "clamp(72px, 18vw, 96px)",
                            height: "clamp(72px, 18vw, 96px)",
                            marginBottom: "clamp(20px, 4vw, 28px)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "var(--color-primary)",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
                            animation:
                                "successReveal 0.6s cubic-bezier(.34,1.56,.64,1) both",
                        }}
                    >
                        <CheckIcon
                            style={{
                                width: "42%",
                                height: "42%",
                                color: "#fff",
                                strokeWidth: 3,
                                animation:
                                    "successCheck 0.4s ease-out 0.35s both",
                            }}
                        />
                    </div>

                    <h1
                        style={{
                            margin: 0,
                            fontFamily: "var(--font-display)",
                            fontSize: "clamp(1.75rem, 6vw, var(--text-4xl))",
                            lineHeight: 1.15,
                            fontWeight: 500,
                            color: "var(--color-text)",
                        }}
                    >
                        Payment successful
                    </h1>

                    <p
                        style={{
                            margin: "10px 0 0",
                            fontFamily: "var(--font-body)",
                            fontSize: "clamp(0.9rem, 2.5vw, var(--text-base))",
                            color: "var(--color-text-muted)",
                        }}
                    >
                        Order confirmed
                    </p>

                    {/* One card per order — number + buttons only */}
                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                            marginTop: "clamp(28px, 6vw, 40px)",
                        }}
                    >
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                style={{
                                    width: "100%",
                                    backgroundColor: "var(--color-surface)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-lg)",
                                    padding: "clamp(20px, 5vw, 28px)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "clamp(16px, 4vw, 22px)",
                                }}
                            >
                                <div
                                    style={{
                                        fontFamily: "var(--font-body)",
                                        fontSize: "var(--text-sm)",
                                        color: "var(--color-text-muted)",
                                    }}
                                >
                                    Order number
                                    <span
                                        style={{
                                            display: "block",
                                            marginTop: 4,
                                            fontFamily: "var(--font-display)",
                                            fontSize:
                                                "clamp(1.1rem, 3vw, var(--text-xl))",
                                            fontWeight: 500,
                                            color: "var(--color-text)",
                                        }}
                                    >
                                        #{order.id}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        width: "100%",
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(auto-fit, minmax(160px, 1fr))",
                                        gap: 10,
                                    }}
                                >
                                    <Link
                                        href={route("orders.history")}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            minHeight: 46,
                                            padding: "11px 18px",
                                            borderRadius: "var(--radius-md)",
                                            background: "var(--color-primary)",
                                            color: "#fff",
                                            textDecoration: "none",
                                            fontFamily: "var(--font-body)",
                                            fontSize: "var(--text-sm)",
                                            fontWeight: 600,
                                        }}
                                    >
                                        View order details
                                    </Link>

                                    <Link
                                        href={route("home")}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            minHeight: 46,
                                            padding: "11px 18px",
                                            borderRadius: "var(--radius-md)",
                                            border: "1px solid var(--color-border)",
                                            background: "transparent",
                                            color: "var(--color-text)",
                                            textDecoration: "none",
                                            fontFamily: "var(--font-body)",
                                            fontSize: "var(--text-sm)",
                                            fontWeight: 500,
                                        }}
                                    >
                                        Back to home
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>
                {`
                    @keyframes successReveal {
                        0% {
                            transform: scale(0);
                            opacity: 0;
                        }
                        70% {
                            transform: scale(1.08);
                            opacity: 1;
                        }
                        100% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }

                    @keyframes successCheck {
                        0% {
                            opacity: 0;
                            transform: scale(0.5) rotate(-15deg);
                        }
                        100% {
                            opacity: 1;
                            transform: scale(1) rotate(0);
                        }
                    }

                    @media (prefers-reduced-motion: reduce) {
                        *,
                        *::before,
                        *::after {
                            animation-duration: 0.01ms !important;
                            animation-iteration-count: 1 !important;
                        }
                    }
                `}
            </style>
        </AuthenticatedLayout>
    );
}

export default Success;
