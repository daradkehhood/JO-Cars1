'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCompareStore, useNotificationStore } from '@/store';
import { cn } from '@/lib/utils';
import { Home, Car, Plus, User, GitCompare, Bell, Wrench } from 'lucide-react';

const navItems = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/cars', label: 'السيارات', icon: Car },
  { href: '/workshops', label: 'الورش', icon: Wrench },
  { href: '/cars/add', label: 'بيع', icon: Plus, highlight: true },
  { href: '/auth/login', label: 'حسابي', icon: User, authRequired: 'logout' },
  { href: '/profile', label: 'حسابي', icon: User, authRequired: 'login' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { cars: compareCars } = useCompareStore();
  const { unreadCount } = useNotificationStore();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/cars') return pathname.startsWith('/cars') && !pathname.startsWith('/cars/add');
    if (href === '/cars/add') return pathname.startsWith('/cars/add');
    if (href === '/financing') return pathname.startsWith('/financing');
    if (href === '/workshops') return pathname.startsWith('/workshops');
    if (href === '/profile') return pathname.startsWith('/profile') || pathname.startsWith('/my-cars') || pathname.startsWith('/favorites') || pathname.startsWith('/tickets');
    return false;
  };

  const displayItems = navItems.filter(item => {
    if (item.authRequired === 'login') return isAuthenticated;
    if (item.authRequired === 'logout') return !isAuthenticated;
    return true;
  });

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 backdrop-blur-xl bg-white/90 dark:bg-black/90 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {displayItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.highlight) {
            return (
              <Link key={item.href} href={item.href}
                className="relative flex flex-col items-center justify-center w-16 h-full">
                <div className="w-12 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 -mt-2">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] text-blue-500 font-medium mt-0.5">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-colors',
                active
                  ? 'text-blue-500'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
              )}>
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.href === '/profile' && isAuthenticated && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {item.href === '/cars' && compareCars.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center">
                    {compareCars.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && (
                <div className="absolute top-0 w-6 h-0.5 rounded-full bg-blue-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
