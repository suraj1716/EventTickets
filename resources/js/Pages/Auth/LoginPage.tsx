import { useState } from 'react';
import LoginModal from './Login';

export default function LoginPage(props: { status?: string; canResetPassword?: boolean }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
 <LoginModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        status={props.status}
        canResetPassword={props.canResetPassword ?? true}
      />
    </>
  );
}
