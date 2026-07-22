'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { UserMenuSheet } from './UserMenuSheet';

const FULLSCREEN_ROUTES = ['/messages'];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));

  if (isFullscreen) {
    return (
      <>
        <main className="min-h-screen">
          {children}
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="site-shell pt-20 min-h-screen pb-16 lg:pb-0">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="hero-orb hero-orb-blue animate-float-slow top-[-8rem] right-[-6rem] h-72 w-72" />
          <div className="hero-orb hero-orb-amber animate-float-slow bottom-[-8rem] left-[-6rem] h-80 w-80" style={{ animationDelay: '1.5s' }} />
          <div className="absolute inset-0 hero-grid opacity-[0.45] dark:opacity-[0.12]" />
        </div>
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <UserMenuSheet />
    </>
  );
}
