import { useState } from 'react';
import RegisterModal from './Register';
import { router } from '@inertiajs/react';

export default function RegisterPage(props: { status?: string }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <RegisterModal
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
        // This is a standalone page, not an overlay on top of other
        // content, so closing it needs somewhere to go — otherwise the
        // page goes blank (isOpen=false -> component returns null).
        router.visit('/');
      }}
      status={props.status}
    />
  );
}
