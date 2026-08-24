import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import { Link, usePage } from "@inertiajs/react";
import LoginModal from "@/Pages/Auth/Login";
import { CurrencyFormatter } from "@/utils/CurrencyFormatter";

export default function MiniCartDropdownBottom() {
  const { auth, totalPrice, totalQuantity, miniCartItems } = usePage().props as any;
  const user = (auth as any)?.user ?? null;
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <><style>{` .bn-tab {
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
        }`}</style>
      {/* Cart Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative rounded-md  btn-tab"
        aria-label="Open cart"
      >

        <ShoppingBagIcon className="w-6 h-6" />
         <span className="btn-tab mt-5">Cart</span>
        {totalQuantity > 0 && (
          <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
            {totalQuantity}
          </span>
        )}
      </button>

      {/* Dialog & Transition for fullscreen sliding panel */}
      <Transition show={open} as={Fragment}>
        <Dialog as="div" className="relative z-[9999]" onClose={setOpen}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          {/* Slide-up Panel */}
       <div className="fixed inset-0 z-[9999] flex">
      <Transition.Child
        as={Fragment}
        enter="transition ease-out duration-300 transform"
        enterFrom="translate-y-full"
        enterTo="translate-y-0"
        leave="transition ease-in duration-200 transform"
        leaveFrom="translate-y-0"
        leaveTo="translate-y-full"
      >
        <Dialog.Panel className="w-full h-screen bg-white overflow-y-auto shadow-xl p-5">
          {/* Close Button */}
          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

                {/* Cart content */}
                <h2 className="text-xl font-semibold mb-4">
                  Cart ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})
                </h2>

                {miniCartItems?.length === 0 ? (
                  <div className="text-gray-500 text-center py-20">
                    Your cart is empty.
                  </div>
                ) : (
                  <div className="space-y-4 p-8">
                    {miniCartItems?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <Link
                        href='#'
                        // href={route("product.show", item.slug)}
                        className="w-16 h-16">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover rounded"
                          />
                        </Link>
                        <div className="flex-1 text-sm">
                          <Link
                            href='#'
                            // href={route("product.show", item.slug)}
                            className="block font-medium line-clamp-2 hover:underline"
                          >
                            {item.title}
                          </Link>
                          <div className="text-xs text-gray-600 flex justify-between mt-1">
                            Qty: {item.quantity}
                            <CurrencyFormatter
                              amount={item.quantity * item.price}
                              currency="AUD"
                            />
                          </div>

                          {/* Variations */}
                          {item.options && item.options.length > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              {item.options.map((opt: any) => (
                                <div key={opt.id}>
                                  {opt.type.name}: {opt.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subtotal & Action Button */}
                {miniCartItems?.length > 0 && (
                  <>
                    <hr className="my-4" />
                    <div className="flex justify-between text-sm font-semibold mb-4">
                      <span>Subtotal:</span>
                      <CurrencyFormatter amount={totalPrice} currency="AUD" />
                    </div>

                    {user ? (
                      <Link
                        href={route("cart.index")}
                        className="w-full block text-center bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md transition"
                        onClick={() => setOpen(false)}
                      >
                        View Cart
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          setLoginOpen(true);
                          setOpen(false);
                        }}
                        className="w-full block text-center bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md transition"
                      >
                        Login to View Cart
                      </button>
                    )}
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        canResetPassword
      />
    </>
  );
}
