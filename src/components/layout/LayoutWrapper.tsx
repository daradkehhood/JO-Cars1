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
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 ambient-grid" />
        <div className="ambient-orb absolute -top-24 -right-20 h-72 w-72 rounded-full bg-primary-300/20 dark:bg-primary-500/15" />
        <div className="ambient-orb ambient-orb-slow absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-warning-300/15 dark:bg-warning-500/10" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[32rem] -translate-x-1/2 rounded-full bg-surface-200/30 dark:bg-surface-700/20 blur-3xl" />
      </div>
      <div className="relative z-10">
        <Header />
        <main className="pt-20 min-h-screen pb-16 lg:pb-0">
          {children}
        </main>
        <Footer />
        <MobileBottomNav />
        <UserMenuSheet />
      </div>
    </>
  );
}
