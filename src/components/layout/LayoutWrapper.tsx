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
        <div className="absolute inset-0 aurora-sheen" />
        <div className="absolute inset-0 soft-noise" />
        <div className="absolute inset-0 ambient-grid" />
        <div className="ambient-orb absolute -top-32 -right-24 h-96 w-96 rounded-full bg-sky-300/20 dark:bg-cyan-400/15" />
        <div className="ambient-orb ambient-orb-slow absolute top-1/4 -left-28 h-[28rem] w-[28rem] rounded-full bg-violet-300/15 dark:bg-violet-500/10" />
        <div className="ambient-orb absolute bottom-[-8rem] left-1/2 h-[24rem] w-[36rem] -translate-x-1/2 rounded-full bg-amber-200/20 dark:bg-amber-400/10" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/40 via-white/10 to-transparent dark:from-surface-900/25 dark:via-surface-900/10" />
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
