import React from "react";
import { Link, usePage } from "@inertiajs/react";
import { FaUserCircle } from "react-icons/fa";
import type { PageProps } from "@/types"; // your PageProps type with user info

type ResponsiveMenuProps = {
  openNav: boolean;
  setOpenNav: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function ResponsiveMenu({ openNav, setOpenNav }: ResponsiveMenuProps) {
  // Assuming your backend shares user info via Inertia's page props, e.g. auth.user
  const { auth } = usePage<PageProps>().props;
  const user = auth?.user;

  return (
    <div
      className={`fixed bottom-0 top-0 z-20 flex h-screen w-[75%] flex-col justify-between bg-white px-8 pb-6 pt-16 text-black md:hidden rounded-r-xl shadow-md transition-all ${
        openNav ? "left-0" : "-left-[100%]"
      }`}
    >
      <div>
        <div className="flex items-center justify-start gap-3">
          {user ? (
            // Show user avatar or placeholder circle with initials
            user.name ? (
              <img
                src={user.name}
                alt={`${user.name}'s avatar`}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-400 flex items-center justify-center text-white text-xl font-semibold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )
          ) : (
            <FaUserCircle size={50} />
          )}
          <div>
            <h1>Hello, {user?.name || "Guest"}</h1>
            <h1 className="text-sm text-slate-500">Premium User</h1>
          </div>
        </div>

        <nav className="mt-12">
          <ul className="flex flex-col gap-7 text-2xl font-semibold">
            <li>
              <Link href="/" onClick={() => setOpenNav(false)} className="cursor-pointer">
                Home
              </Link>
            </li>
            <li>
              <Link href="/products" onClick={() => setOpenNav(false)} className="cursor-pointer">
                Products
              </Link>
            </li>
            <li>
              <Link href="/about" onClick={() => setOpenNav(false)} className="cursor-pointer">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" onClick={() => setOpenNav(false)} className="cursor-pointer">
                Contact
              </Link>
            </li>

            {user ? (
              <li>
                {/* Logout link using POST method */}
                <Link
                  href={route("logout")}
                  method="post"
                  as="button"
                  onClick={() => setOpenNav(false)}
                  className="cursor-pointer text-red-600"
                >
                  Logout
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link href={route("login")} onClick={() => setOpenNav(false)} className="cursor-pointer">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href={route("register")} onClick={() => setOpenNav(false)} className="cursor-pointer">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}
