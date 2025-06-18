'use client';

import { useEffect } from 'react';

interface ReloadConfirmationProps {
  children: React.ReactNode;
}

const ReloadConfirmation: React.FC<ReloadConfirmationProps> = ({ children }) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = 'Do you want to reload? This will create a new session.';
      // Set flag to indicate reload was confirmed
      localStorage.setItem('arc_reload_confirmed', 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return <>{children}</>;
};

export default ReloadConfirmation;