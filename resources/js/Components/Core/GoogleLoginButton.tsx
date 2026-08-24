import React from 'react';
import clsx from 'clsx';

interface GoogleLoginButtonProps {
  processing?: boolean;
  className?: string;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  processing = false,
  className = '',
}) => {
  return (
    <a
      href={processing ? undefined : '/auth/google'}
      className={clsx(
        'flex items-center justify-center w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 font-medium shadow-sm',
        'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        processing && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google logo"
        className="w-5 h-5 mr-3"
      />
      {processing ? 'Signing in...' : 'Sign in with Google'}
    </a>
  );
};

export default GoogleLoginButton;
