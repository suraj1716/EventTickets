import { useState } from 'react';
import LoginModal from './Login';
import { router } from '@inertiajs/react';

export default function LoginPage(props: { status?: string; canResetPassword?: boolean }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <LoginModal
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
        // Standalone page, not an overlay — without somewhere to go,
        // closing just leaves a blank page (isOpen=false -> null).
        router.visit('/');
      }}
      status={props.status}
      canResetPassword={props.canResetPassword ?? true}
    />
  );
}
