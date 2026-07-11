'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

function ProfileRefresher() {
  const { token, isAuthenticated, refreshProfile, _hydrated } = useAuth();

  useEffect(() => {
    if (_hydrated && token && isAuthenticated) {
      refreshProfile();
    }
  }, [_hydrated, token, isAuthenticated, refreshProfile]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="jo-cars-theme"
    >
      <ProfileRefresher />
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            direction: 'rtl',
            fontFamily: 'Tajawal, sans-serif',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </ThemeProvider>
  );
}
