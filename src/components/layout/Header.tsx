'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore, useNotificationStore, useCompareStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  Search, Menu, X, User, Heart, MessageCircle, Plus, Moon, Sun,
  ChevronDown, LogOut, ShieldCheck, Bot, Wrench, DollarSign, Tag,
  BadgePercent, Newspaper, Car, Store, Bell, GitCompare, Ticket,
  Calculator, Cpu, Settings, CreditCard,
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const { cars: compareCars } = useCompareStore();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cars?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const primaryLinks = [
    { href: '/cars', label: 'السيارات', icon: Car },
    { href: '/parts', label: 'قطع الغيار', icon: Cpu },
    { href: '/workshops', label: 'الورش', icon: Wrench },
    { href: '/forum', label: 'المنتدى', icon: MessageCircle },
  ];

  const secondaryLinks = [
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
    ...(isAuthenticated ? [{ href: '/tickets', label: 'التذاكر', icon: Ticket }] : []),
  ];

  const userMenuItems = [
    { href: '/auth/profile', label: 'الملف الشخصي', icon: User },
    { href: '/favorites', label: 'المفضلة', icon: Heart },
    { href: '/messages', label: 'الرسائل', icon: MessageCircle, badge: unreadCount },
    { href: '/my-cars', label: 'إعلاناتي', icon: Car },
    { href: '/my-garage', label: 'مرآبي', icon: Wrench },
    { href: '/my-wants', label: 'طلباتي', icon: Tag },
    { href: '/price-alerts', label: 'تنبيهات الأسعار', icon: Bell },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[60] transition-all duration-300',
        scrolled
          ? 'bg-white/90 dark:bg-surface-900/90 backdrop-blur-xl border-b border-surface-200/60 dark:border-surface-700/60 shadow-soft'
          : 'bg-white/70 dark:bg-surface-900/70 backdrop-blur-sm'
      )}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Car className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-base font-bold text-surface-900 dark:text-white hidden sm:block">
              <span className="gradient-text">JO</span>Cars
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {primaryLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                    active
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                  moreOpen
                    ? 'text-surface-900 dark:text-white bg-surface-100 dark:bg-surface-800'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800'
                )}
              >
                المزيد
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', moreOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-soft-xl overflow-hidden z-50"
                    >
                      <div className="p-1.5">
                        {secondaryLinks.map((link) => {
                          const Icon = link.icon;
                          const active = pathname === link.href || pathname.startsWith(link.href + '/');
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setMoreOpen(false)}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                active
                                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10'
                                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'
                              )}
                            >
                              <Icon className="w-4 h-4" />
                              {link.label}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن سيارة..."
                className="w-full h-9 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 pl-9 pr-4 text-sm text-surface-900 dark:text-surface-100 placeholder-surface-400 transition-all duration-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 outline-none"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            </form>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5">
            {/* Compare */}
            {compareCars.length > 0 && (
              <Link
                href="/cars/compare"
                className="relative p-2 rounded-lg text-surface-500 hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
              >
                <GitCompare className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {compareCars.length}
                </span>
              </Link>
            )}

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
            >
              {mounted ? (theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />) : <div className="w-5 h-5" />}
            </button>

            {/* User menu - works on ALL screens */}
            {isAuthenticated ? (
              <>
                {/* Desktop: dropdown */}
                <div className="hidden md:block relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-1.5 pr-2.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs font-semibold">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <ChevronDown className={cn('w-4 h-4 text-surface-400 transition-transform duration-200', userMenuOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-2 w-60 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-soft-xl overflow-hidden z-50"
                        >
                          <div className="p-3 border-b border-surface-100 dark:border-surface-700">
                            <p className="font-semibold text-surface-900 dark:text-white text-sm">{user?.name}</p>
                            <p className="text-xs text-surface-500 mt-0.5 truncate">{user?.email}</p>
                          </div>
                          <div className="p-1.5 max-h-[300px] overflow-y-auto">
                            {userMenuItems.map((item) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setUserMenuOpen(false)}
                                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 transition-all duration-200"
                                >
                                  <span className="flex items-center gap-3">
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                  </span>
                                  {item.badge ? (
                                    <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                                      {item.badge}
                                    </span>
                                  ) : null}
                                </Link>
                              );
                            })}
                            {user?.role === 'ADMIN' && (
                              <Link
                                href="/admin"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 transition-all duration-200"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                لوحة التحكم
                              </Link>
                            )}
                          </div>
                          <div className="p-1.5 border-t border-surface-100 dark:border-surface-700">
                            <button
                              onClick={() => { logout(); setUserMenuOpen(false); }}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-500/10 w-full transition-all duration-200"
                            >
                              <LogOut className="w-4 h-4" />
                              تسجيل خروج
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile: open user bottom sheet */}
                <button
                  onClick={() => setUserMenuOpen(true)}
                  className="md:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs font-semibold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <Link href="/auth/login" className="px-3 py-1.5 rounded-lg text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200">
                  دخول
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm px-3 py-1.5">
                  حساب جديد
                </Link>
              </div>
            )}

            {/* Sell button */}
            <Link
              href="/cars/add"
              className="hidden lg:flex items-center gap-1.5 btn-primary text-sm px-3 py-1.5"
            >
              <Plus className="w-4 h-4" />
              بيع سيارتك
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile User Bottom Sheet */}
      <AnimatePresence>
        {userMenuOpen && isAuthenticated && (
          <div className="md:hidden fixed inset-0 z-[97]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
              onClick={() => setUserMenuOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[80dvh] bg-white dark:bg-surface-900 rounded-t-3xl overflow-hidden flex flex-col shadow-soft-xl"
            >
              {/* Handle - tappable to close */}
              <button
                onClick={() => setUserMenuOpen(false)}
                className="flex justify-center pt-3 pb-1 w-full"
              >
                <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
              </button>

              {/* User info */}
              <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 text-lg font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-surface-900 dark:text-white">{user?.name}</p>
                    <p className="text-sm text-surface-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-3">
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 active:bg-surface-100 dark:active:bg-surface-700 transition-all duration-200"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-surface-400" />
                        {item.label}
                      </span>
                      {item.badge ? (
                        <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {item.badge}
                        </span>
                      ) : (
                        <svg className="w-4 h-4 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </Link>
                  );
                })}
                {user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-200"
                  >
                    <ShieldCheck className="w-5 h-5 text-surface-400" />
                    لوحة التحكم
                  </Link>
                )}
              </div>

              {/* Logout */}
              <div className="p-3 border-t border-surface-100 dark:border-surface-800">
                <button
                  onClick={() => { logout(); setUserMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold text-accent-600 bg-accent-50 dark:bg-accent-500/10 hover:bg-accent-100 dark:hover:bg-accent-500/20 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  تسجيل خروج
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Menu (hamburger) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[97]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85dvh] bg-white dark:bg-surface-900 rounded-t-3xl overflow-hidden flex flex-col shadow-soft-xl"
            >
              {/* Handle - tappable to close */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex justify-center pt-3 pb-1 w-full"
              >
                <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
              </button>

              <div className="flex items-center justify-between px-5 py-3 border-b border-surface-100 dark:border-surface-800">
                <h3 className="font-bold text-surface-900 dark:text-white">القائمة</h3>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800">
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن سيارة..."
                      className="input-field pl-11 h-12"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  </div>
                </form>

                {/* Auth buttons */}
                {!isAuthenticated && (
                  <div className="flex gap-3 mb-4">
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 h-11 btn-primary text-sm justify-center rounded-xl">
                      تسجيل دخول
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 h-11 btn-secondary text-sm justify-center rounded-xl">
                      حساب جديد
                    </Link>
                  </div>
                )}

                {/* Quick actions for authenticated users */}
                {isAuthenticated && (
                  <div className="mb-3">
                    <Link
                      href="/cars/add"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full h-11 btn-primary text-sm rounded-xl"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة سيارة
                    </Link>
                  </div>
                )}

                {/* Links */}
                <div className="space-y-0.5">
                  {[...primaryLinks, ...secondaryLinks].map((link) => {
                    const Icon = link.icon;
                    const active = pathname === link.href || pathname.startsWith(link.href + '/');
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                          active
                            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10'
                            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {link.label}
                      </Link>
                    );
                  })}
                  {user?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-200"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      لوحة التحكم
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
