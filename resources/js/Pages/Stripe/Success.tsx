import { Head, Link, router } from "@inertiajs/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps, Order } from "@/types";
import { useEffect } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

function Success({ orders }: PageProps<{ orders: Order[] }>) {
  useEffect(() => {
    router.reload({
      only: ["cartCount", "cartItems"],
    });
  }, []);

  const grandTotal = orders.reduce(
    (sum, order) => sum + Number(order.total_price ?? 0),
    0,
  );

  return (
    <AuthenticatedLayout>
      <Head title="Payment Completed">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen bg-[#0B0B10] text-[#F7F5F2] font-['Manrope']">
        <div className="mx-auto max-w-xl px-4 sm:px-6 py-16 sm:py-24">
          {/* ===================================================
              CONFIRMATION MARK
          =================================================== */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFB627] shadow-[0_10px_40px_rgba(255,182,39,0.25)]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.4, delay: 0.35, ease: EASE }}
            >
              <CheckIcon className="h-9 w-9 text-[#0B0B10]" strokeWidth={3} />
            </motion.div>
          </motion.div>

          {/* ===================================================
              HEADLINE
          =================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
            className="text-center"
          >
            <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#FFB627] mb-3">
              Payment confirmed
            </p>

            <h1 className="font-['Anton'] uppercase leading-[0.95] text-4xl sm:text-5xl tracking-tight text-white">
              You're going
            </h1>

            <p className="text-sm text-[#9C97A8] mt-3">
              {orders.length === 1
                ? "Your order is confirmed. Details are below."
                : `${orders.length} orders confirmed. Details are below.`}
            </p>
          </motion.div>

          {/* ===================================================
              ORDERS
          =================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
            className="mt-10 space-y-4"
          >
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-[#26232E] bg-[#15141B] p-5 sm:p-6"
              >
                {/* Order header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#26232E]">
                  <div>
                    <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider text-[#6B6775]">
                      Order number
                    </p>
                    <p className="font-['IBM_Plex_Mono'] text-lg font-semibold text-white mt-0.5">
                      #{order.id}
                    </p>
                  </div>

                  {order.vendor?.name && (
                    <span className="rounded-full border border-[#26232E] bg-[#0B0B10] px-3 py-1.5 text-[11px] text-[#9C97A8]">
                      {order.vendor.name}
                    </span>
                  )}
                </div>

                {/* Line items */}
                {order.orderItems && order.orderItems.length > 0 && (
                  <div className="py-4 space-y-2.5 border-b border-[#26232E]">
                   {order.orderItems.map((item, i) => {
  const title =
    item.ticketTier?.name ??
    item.product?.title ??
    (item.booking ? "Service booking" : null) ??
    "Item";

  const ticketMeta = item.ticketTier
    ? [
        item.ticketTier.event_name,
        item.seats?.length
          ? `Seat${item.seats.length > 1 ? "s" : ""} ${item.seats.map((s) => s.label).join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <div
      key={item.id ?? i}
      className="flex items-start justify-between gap-3 text-sm"
    >
      <div className="min-w-0">
        <span className="text-[#D8D5DE] truncate block">
          {title}
          {item.quantity ? ` × ${item.quantity}` : ""}
        </span>
        {ticketMeta && (
          <span className="text-xs text-[#6B6775]">{ticketMeta}</span>
        )}
      </div>

      <span className="font-['IBM_Plex_Mono'] text-white shrink-0">
        $
        {(
          Number(item.price ?? 0) * (item.quantity ?? 1)
        ).toFixed(2)}
      </span>
    </div>
  );
})}
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between pt-4">
                  <span className="text-sm font-semibold text-white">
                    Total
                  </span>
                  <span className="font-['IBM_Plex_Mono'] text-lg font-semibold text-[#FFB627]">
                    ${Number(order.total_price ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {orders.length > 1 && (
              <div className="flex items-center justify-between rounded-xl border border-[#26232E] bg-[#0B0B10] px-5 py-4">
                <span className="text-sm text-[#9C97A8]">
                  Total across all orders
                </span>
                <span className="font-['IBM_Plex_Mono'] text-base font-semibold text-white">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            )}
          </motion.div>

          {/* ===================================================
              ACTIONS
          =================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <Link
              href={route("orders.history")}
              className="flex items-center justify-center rounded-xl bg-[#FFB627] px-5 py-3.5 text-sm font-bold text-[#0B0B10] transition-colors hover:bg-[#ffc355]"
            >
              View order details
            </Link>

            <Link
              href={route("home")}
              className="flex items-center justify-center rounded-xl border border-[#26232E] bg-[#15141B] px-5 py-3.5 text-sm font-semibold text-[#D8D5DE] transition-colors hover:border-[#3a3745] hover:text-white"
            >
              Back to home
            </Link>
          </motion.div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default Success;
