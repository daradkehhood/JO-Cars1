'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useCompareStore, useNotificationStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  Home, Car, Plus, Wrench, MoreHorizontal, X, Heart, MessageCircle,
  Tag, Bell, Store, Calculator, Bot, DollarSign, BadgePercent, Newspaper,
  Ticket, ShieldCheck, Moon, Sun, Search, LogOut, User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/cars', label: 'السيارات', icon: Car },
  { href: '/cars/add', label: 'بيع', icon: Plus, highlight: true },
  { href: '/workshops', label: 'الورش', icon: Wrench },
  { href: 'more', label: 'المزيد', icon: MoreHorizontal, isMore: true },
];

const mainLinks = [
  { href: '/cars', label: 'السيارات', icon: Car },
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

const userLinks = [
  { href: '/favorites', label: 'المفضلة', icon: Heart },
  { href: '/messages', label: 'الرسائل', icon: MessageCircle, badge: true },
  { href: '/my-cars', label: 'إعلاناتي', icon: Car },
  { href: '/my-wants', label: 'طلباتي', icon: Tag },
  { href: '/price-alerts', label: 'تنبيهات الأسعار', icon: Bell },
  { href: '/tickets', label: 'التذاكر', icon: Ticket },
  { href: '/auth/profile', label: 'الملف الشخصي', icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { cars: compareCars } = useCompareStore();
  const { unreadCount } = useNotificationStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.035, delayChildren: 0.04 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.985 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/cars') return pathname.startsWith('/cars') && !pathname.startsWith('/cars/add');
    if (href === '/cars/add') return pathname.startsWith('/cars/add');
    if (href === '/workshops') return pathname.startsWith('/workshops');
    return false;
  };

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(3);
  const centerItem = navItems[2];

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div className="px-3 pb-3">
          <div className="relative mx-auto max-w-md">
            <div className="relative">
              {/* Main bar body */}
              <div className="relative bg-surface-900/80 backdrop-blur-xl rounded-2xl border border-surface-700/30 overflow-visible">

                <div className="flex items-center justify-between h-[60px] px-2 pt-1">
                  {/* Left items (الرئيسية, السيارات) */}
                  {leftItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link key={item.href} href={item.href}
                        className={cn(
                          'relative flex flex-col items-center justify-center min-w-[3.2rem] gap-0.5 transition-all duration-200 active:scale-90',
                          active ? 'text-white' : 'text-surface-400'
                        )}>
                        <div className="relative">
                          {active && (
                            <motion.div
                              layoutId="bottomNavIndicator"
                              className="absolute -inset-2 bg-accent-500/20 rounded-xl blur-[6px]"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                          <Icon className={cn('w-[22px] h-[22px] relative z-10', active && 'stroke-[2.2]')} strokeWidth={active ? 2.2 : 1.8} />
                          {item.href === '/cars' && compareCars.length > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] rounded-full bg-gold-100 text-gold-900 text-[8px] font-bold flex items-center justify-center px-0.5"
                            >
                              {compareCars.length}
                            </motion.span>
                          )}
                        </div>
                        <span className={cn('text-[10px] font-medium leading-none', active && 'font-bold')}>{item.label}</span>
                        {active && (
                          <motion.div
                            layoutId="bottomNavLine"
                            className="absolute -bottom-[5px] w-5 h-[3px] rounded-full bg-accent-400 shadow-[0_0_8px_rgba(100,160,255,0.6)]"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                      </Link>
                    );
                  })}

                  {/* Center Sell Button */}
                  <Link href={centerItem.href}
                    className="relative flex flex-col items-center justify-center -mt-7 active:scale-90 transition-transform duration-150 z-30">
                    <div className="relative">
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-b from-gold-100/60 via-gold-100/30 to-gold-200/10 blur-[4px]" />
                      <div className="relative w-[56px] h-[56px] rounded-full bg-gradient-to-b from-gold-100 via-gold-100 to-gold-200 flex items-center justify-center shadow-[0_4px_20px_rgba(255,198,64,0.45),0_0_40px_rgba(255,198,64,0.15)] ring-[3px] ring-surface-900/80">
                        <Plus className="w-7 h-7 text-gold-900" strokeWidth={2.5} />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gold-200 mt-1">{centerItem.label}</span>
                  </Link>

                  {/* Right items (الورش, المزيد) */}
                  {rightItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    // Handle "More" button — opens bottom sheet, does NOT navigate
                    if (item.isMore) {
                      return (
                        <button
                          key="more"
                          onClick={() => setMoreOpen(true)}
                          className="relative flex flex-col items-center justify-center min-w-[3.2rem] gap-0.5 text-surface-400 active:scale-90 transition-all duration-200"
                          aria-label="المزيد"
                        >
                          <div className="relative">
                            {isAuthenticated ? (
                              <div className="w-6 h-6 rounded-full bg-accent-600 flex items-center justify-center text-white text-[10px] font-bold ring-1 ring-surface-600/30">
                                {user?.image ? (
                                  <img src={user.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  user?.name?.charAt(0) || 'U'
                                )}
                              </div>
                            ) : (
                              <Icon className="w-[22px] h-[22px]" strokeWidth={1.8} />
                            )}
                          </div>
                          <span className="text-[10px] font-medium leading-none">{item.label}</span>
                        </button>
                      );
                    }

                    return (
                      <Link key={item.href} href={item.href}
                        className={cn(
                          'relative flex flex-col items-center justify-center min-w-[3.2rem] gap-0.5 transition-all duration-200 active:scale-90',
                          active ? 'text-white' : 'text-surface-400'
                        )}>
                        <div className="relative">
                          {active && (
                            <motion.div
                              layoutId="bottomNavIndicator"
                              className="absolute -inset-2 bg-accent-500/20 rounded-xl blur-[6px]"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                          <Icon className={cn('w-[22px] h-[22px] relative z-10', active && 'stroke-[2.2]')} strokeWidth={active ? 2.2 : 1.8} />
                        </div>
                        <span className={cn('text-[10px] font-medium leading-none', active && 'font-bold')}>{item.label}</span>
                        {active && (
                          <motion.div
                            layoutId="bottomNavLine"
                            className="absolute -bottom-[5px] w-5 h-[3px] rounded-full bg-accent-400 shadow-[0_0_8px_rgba(100,160,255,0.6)]"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Unified More Bottom Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <div className="lg:hidden fixed inset-0 z-[96]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[88dvh] bg-surface-800 rounded-t-2xl overflow-hidden flex flex-col shadow-soft-xl"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-100 to-gold-200" />
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-surface-600" />
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-b border-surface-700/50">
                <h3 className="font-bold text-surface-200">المزيد من الخيارات</h3>
                <button onClick={() => setMoreOpen(false)} className="p-2 -mr-2 rounded-lg hover:bg-surface-700">
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-3">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    window.location.href = `/cars?search=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }} className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن سيارة..."
                      className="input-field w-full h-12 pl-11 pr-4 text-sm"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  </div>
                </form>

                <Link
                  href="/cars/add"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center justify-center gap-2 w-full h-12 bg-gold-100 text-gold-900 font-bold text-sm rounded-lg mb-3 shadow-gold active:scale-[0.98] transition-transform"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  بيع سيارتك
                </Link>

                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold text-surface-400 hover:bg-surface-700 mb-3 transition-all duration-200"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  {theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
                </button>

                {isAuthenticated && (
                  <div className="mb-3">
                    <Link href="/auth/profile" onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 p-3 mb-2 rounded-lg bg-accent-500/10 border border-accent-500/20">
                      <div className="w-10 h-10 rounded-full bg-accent-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-gold-100/20">
                        {user?.image ? (
                          <img src={user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          user?.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-surface-200 text-sm truncate">{user?.name}</p>
                        <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                      </div>
                    </Link>
                    <p className="text-xs font-bold text-surface-500 px-3 mb-2">حسابي</p>
                    <motion.div
                      variants={listVariants}
                      initial="hidden"
                      animate="show"
                      className="space-y-0.5"
                    >
                      {userLinks.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                          <motion.div key={item.href} variants={itemVariants}>
                            <Link
                              href={item.href}
                              onClick={() => setMoreOpen(false)}
                              className={cn(
                                'flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200',
                                active
                                  ? 'text-accent-300 bg-accent-500/15'
                                  : 'text-surface-400 hover:bg-surface-700/50'
                              )}
                            >
                              <span className="flex items-center gap-3">
                                <Icon className="w-5 h-5" />
                                {item.label}
                              </span>
                              {item.badge && unreadCount > 0 && (
                                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center">
                                  {unreadCount}
                                </span>
                              )}
                            </Link>
                          </motion.div>
                        );
                      })}
                      {user?.role === 'ADMIN' && (
                        <motion.div variants={itemVariants}>
                          <Link
                            href="/admin"
                            onClick={() => setMoreOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-surface-400 hover:bg-surface-700/50 transition-all duration-200"
                          >
                            <ShieldCheck className="w-5 h-5" />
                            لوحة التحكم
                          </Link>
                        </motion.div>
                      )}
                    </motion.div>
                    <div className="border-t border-surface-700/50 my-3" />
                  </div>
                )}

                <p className="text-xs font-bold text-surface-500 px-3 mb-2">الاستكشاف</p>
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-0.5"
                >
                  {mainLinks.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <motion.div key={item.href} variants={itemVariants}>
                        <Link
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200',
                            active
                              ? 'text-accent-300 bg-accent-500/15'
                              : 'text-surface-400 hover:bg-surface-700/50'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          {item.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {!isAuthenticated && (
                  <div className="border-t border-surface-700/50 mt-3 pt-3 space-y-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center justify-center gap-2 w-full h-11 btn-primary text-sm rounded-lg"
                    >
                      تسجيل دخول
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center justify-center gap-2 w-full h-11 btn-secondary text-sm rounded-lg"
                    >
                      حساب جديد
                    </Link>
                  </div>
                )}

                {isAuthenticated && (
                  <div className="border-t border-surface-700/50 mt-3 pt-3">
                    <button
                      onClick={() => { logout(); setMoreOpen(false); }}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg text-sm font-semibold text-error-400 bg-error-500/10 hover:bg-error-500/20 transition-all duration-200"
                    >
                      <LogOut className="w-5 h-5" />
                      تسجيل خروج
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
