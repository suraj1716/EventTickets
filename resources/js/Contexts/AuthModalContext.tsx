// resources/js/Contexts/AuthModalContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

interface AuthModalContextType {
  loginOpen: boolean;
  registerOpen: boolean;
  openLogin: () => void;
  openRegister: () => void;
  closeAll: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <AuthModalContext.Provider
      value={{
        loginOpen,
        registerOpen,
        openLogin: () => { setRegisterOpen(false); setLoginOpen(true); },
        openRegister: () => { setLoginOpen(false); setRegisterOpen(true); },
        closeAll: () => { setLoginOpen(false); setRegisterOpen(false); },
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
