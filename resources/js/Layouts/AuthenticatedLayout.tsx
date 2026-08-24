import ApplicationLogo from "@/Components/App/ApplicationLogo";
import Footer from "@/Components/App/Footer";
import Navbar from "@/Components/App/Navbar";
import useScrollInfo from "@/hooks/useScrollDirection";
import DepartmentComponent from "@/Components/App/Department";
import { ChevronUp } from "lucide-react"; // Or any icon library
import { Link, usePage } from "@inertiajs/react";
import { MessageCircle } from "lucide-react";
import {
  PropsWithChildren,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import NavbarBottom from "@/Components/App/NavbarBottom";
import { useAuthModal } from "@/Contexts/AuthModalContext";

export default function AuthenticatedLayout({
  header,
  children,
}: PropsWithChildren<{ header?: ReactNode }>) {
  const props = usePage().props;
  const user = props.auth?.user;

  const showScrollTop = useScrollInfo(200);
  const showBar = useScrollInfo(0); // show after 100px scroll
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // showBar is a boolean, not a function, so we cannot call it
  };

  const [visible, setVisible] = useState(false);
  const { openLogin } = useAuthModal();

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 1000); // delay show
    return () => clearTimeout(timeout);
  }, []);

  const [successMessages, setSuccessMessages] = useState<any[]>([]);
  const timeoutRefs = useRef<{ [Key: number]: ReturnType<typeof setTimeout> }>(
    {},
  );
  const [showingNavigationDropdown, setShowingNavigationDropdown] =
    useState(false);

  useEffect(() => {
    if (props?.success?.message) {
      const newMessage = {
        ...props.success,
        id: props.success.time,
      };

      setSuccessMessages((prevMessages) => [newMessage, ...prevMessages]);

      const timeoutId = setTimeout(() => {
        setSuccessMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id != newMessage.id),
        );
        delete timeoutRefs.current[newMessage.id];
      }, 5000);

      timeoutRefs.current[newMessage.id] = timeoutId;
    }
  }, [props.success]);

  const [showBarnav, setShowBarnav] = useState(false);
  // Trigger bar to show after mount (simulate toggle)
  useEffect(() => {
    const timer = setTimeout(() => setShowBarnav(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-100 isolate">
      <Navbar />

      <div
        className={` md:hidden
          fixed bottom-0 left-0 w-full z-[10] transition-all duration-500 ease-in
          transform bg-white shadow-md
          ${
            showBar
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-5 pointer-events-none"
          }
        `}
      >
        <div
          className={`fixed bottom-0 left-0 w-full ${
            showBar ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        ></div>

        {/* <LoginModal
          isOpen={loginOpen}
          onClose={() => setLoginOpen(false)}
          canResetPassword
          onSwitchToRegister={() => {
            setLoginOpen(false);
            setRegisterOpen(true);
          }}
        /> */}
      </div>

      {successMessages.length > 0 && (
        <div className="toast toast-top toast-end z-[1000] mt-16">
          {successMessages.map((msg) => (
            <div className="alert laert-success" key={msg.id}>
              <span>{msg.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* <div
        className={`
          fixed top-0 left-0 w-full z-[40] transition-all duration-500 ease-in
          transform bg-white shadow-md
          ${
            showBar
              ? "opacity-100 -translate-y-0"
              : "opacity-0 -translate-y-5 pointer-events-none"
          }
        `}
      >
        <DepartmentComponent />
      </div> */}

      <main>{children}</main>

      {/* 💬 Messenger Chat Button */}

      <a
        href="https://m.me/YOUR_PAGE_USERNAME" // 🔁 replace with your Messenger username
        target="_blank"
        rel="noopener noreferrer"
        className={`
    fixed z-[9000] flex items-center gap-2
    bottom-24 right-6 sm:bottom-24 lg:bottom-28
    bg-[var(--color-accent-light)] text-green-950 px-4 py-2 rounded-full shadow-lg
    hover:bg-[var(--color-accent-dark)] transition-all
    transform duration-500 ease-in-out
    ${
      showScrollTop
        ? "opacity-100 scale-100"
        : "opacity-0 scale-0 pointer-events-none"
    }
  `}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-medium text-sm">Let's Chat</span>
      </a>

      {/* 🔼 Go To Top Button */}
      <button
        onClick={scrollToTop}
        aria-label="Go to top"
        className={`
    fixed z-[9000]
    bottom-6 right-6 sm:bottom-8 lg:bottom-10
    bg-[var(--color-accent-light)] text-green-950 p-3 rounded-full shadow-lg
    hover:bg-[var(--color-accent-dark)] transition
    transform duration-500 ease-in-out
    ${
      showScrollTop
        ? "opacity-100 scale-100"
        : "opacity-0 scale-0 pointer-events-none"
    }
  `}
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      <Footer />
    </div>
  );
}
