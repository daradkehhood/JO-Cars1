'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCompareStore, useNotificationStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { Home, Car, Plus, User, Wrench, MoreHorizontal, X, Heart, MessageCircle, Tag, Bell, Store, Calculator, Bot, DollarSign, BadgePercent, Newspaper, Ticket, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/cars', label: 'السيارات', icon: Car },
  { href: '/cars/add', label: 'بيع', icon: Plus, highlight: true },
  { href: '/workshops', label: 'الورش', icon: Wrench },
  { href: 'more', label: 'المزيد', icon: MoreHorizontal, isMore: true },
];

const moreMenuItems = [
  { href: '/parts', label: 'قطع الغيار', icon: Wrench },
  { href: '/forum', label: 'المنتدى', icon: MessageCircle },
  { href: '/dealers', label: 'الوكلاء', icon: Store },
  { href: '/financing', label: 'التمويل', icon: Calculator },
  { href: '/ai', label: 'المساعد الذكي', icon: Bot },
  { href: '/car-finder', label: 'هل تناسبني؟', icon: Car },
  { href: '/resale-value', label: 'قيمة إعادة البيع', icon: DollarSign },
  { href: '/maintenance', label: 'الصيانة', icon: Wrench },
  { href: '/my-garage', label: 'مرآبي', icon: Wrench },
  { href: '/wanted', label: 'مطلوب', icon: Tag },
  { href: '/plates', label: 'لوحات', icon: BadgePercent },
  { href: '/news', label: 'الأخبار', icon: Newspaper },
];

const userMenuItems = [
  { href: '/favorites', label: 'المفضلة', icon: Heart },
  { href: '/messages', label: 'الرسائل', icon: MessageCircle },
  { href: '/my-cars', label: 'إعلاناتي', icon: Car },
  { href: '/my-wants', label: 'طلباتي', icon: Tag },
  { href: '/price-alerts', label: 'تنبيهات الأسعار', icon: Bell },
  { href: '/tickets', label: 'التذاكر', icon: Ticket },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { cars: compareCars } = useCompareStore();
  const { unreadCount } = useNotificationStore();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/cars') return pathname.startsWith('/cars') && !pathname.startsWith('/cars/add');
    if (href === '/cars/add') return pathname.startsWith('/cars/add');
    if (href === '/workshops') return pathname.startsWith('/workshops');
    return false;
  };

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div className="px-2 pb-2">
          <div className="relative mx-auto max-w-lg bg-white/95 dark:bg-surface-800/95 backdrop-blur-xl border border-surface-200/80 dark:border-surface-700/80 rounded-2xl shadow-soft-lg">
            <div className="flex items-center justify-around h-16">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                if (item.highlight) {
                  return (
                    <Link key={item.href} href={item.href}
                      className="relative flex flex-col items-center justify-center -mt-5">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center shadow-primary-lg">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 mt-1">{item.label}</span>
                    </Link>
                  );
                }

                if (item.isMore) {
                  return (
                    <button
                      key="more"
                      onClick={() => setMoreOpen(true)}
                      className="relative flex flex-col items-center justify-center min-w-[3.5rem] h-full gap-0.5 text-surface-400 dark:text-surface-500"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                  );
                }

                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      'relative flex flex-col items-center justify-center min-w-[3.5rem] h-full gap-0.5 transition-all duration-200',
                      active
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-400'
                    )}>
                    <div className="relative">
                      {active && (
                        <motion.div
                          layoutId="bottomNavIndicator"
                          className="absolute -inset-1.5 bg-primary-50 dark:bg-primary-500/10 rounded-xl"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon className={cn('w-5 h-5 relative z-10', active && 'font-semibold')} />
                      {item.href === '/cars' && compareCars.length > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] rounded-full bg-primary-500 text-white text-[9px] font-bold flex items-center justify-center px-1"
                        >
                          {compareCars.length}
                        </motion.span>
                      )}
                    </div>
                    <span className={cn('text-[10px] font-medium', active && 'font-semibold')}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* More Menu Bottom Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <div className="lg:hidden fixed inset-0 z-[96]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[80dvh] bg-white dark:bg-surface-900 rounded-t-3xl overflow-hidden flex flex-col shadow-soft-xl"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-b border-surface-100 dark:border-surface-800">
                <h3 className="font-bold text-surface-900 dark:text-white">المزيد من الخيارات</h3>
                <button onClick={() => setMoreOpen(false)} className="p-2 -mr-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800">
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-3">
                {/* User section if authenticated */}
                {isAuthenticated && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-surface-400 px-3 mb-2">حسابي</p>
                    <div className="space-y-0.5">
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMoreOpen(false)}
                            className={cn(
                              'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                              active
                                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10'
                                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
                            )}
                          >
                            <span className="flex items-center gap-3">
                              <Icon className="w-5 h-5" />
                              {item.label}
                            </span>
                            {item.label === 'الرسائل' && unreadCount > 0 && (
                              <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                                {unreadCount}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                      {user?.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setMoreOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-200"
                        >
                          <ShieldCheck className="w-5 h-5" />
                          لوحة التحكم
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-surface-100 dark:border-surface-800 my-3" />
                  </div>
                )}

                {/* All links */}
                <p className="text-xs font-semibold text-surface-400 px-3 mb-2">الاستكشاف</p>
                <div className="space-y-0.5">
                  {moreMenuItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                          active
                            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10'
                            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
