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
        <div className="ambient-orb absolute -top-32 -right-24 h-96 w-96 rounded-full bg-sky-300/25 dark:bg-cyan-400/15" />
        <div className="ambient-orb ambient-orb-slow absolute top-1/4 -left-28 h-[26rem] w-[26rem] rounded-full bg-violet-300/18 dark:bg-violet-500/10" />
        <div className="ambient-orb absolute bottom-[-10rem] left-1/2 h-[24rem] w-[34rem] -translate-x-1/2 rounded-full bg-amber-200/18 dark:bg-amber-400/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/20 dark:from-surface-900/20 dark:via-transparent dark:to-surface-900/10" />
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
