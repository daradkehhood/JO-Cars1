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
  ChevronDown, LogOut, Settings, Car, Store, Bell, GitCompare,
  ShieldCheck, SlidersHorizontal, Cpu, Hammer, Gavel, Ticket,
  Calculator, BadgePercent, Newspaper, Star as StarIcon, ChevronLeft, Tag, Wrench, DollarSign,
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

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cars?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const [moreOpen, setMoreOpen] = useState(false);

  const primaryLinks = [
    { href: '/cars', label: 'جميع السيارات', icon: Car },
    { href: '/parts', label: 'قطع غيار', icon: Cpu },
    { href: '/financing', label: 'التمويل', icon: Calculator },
    { href: '/forum', label: 'المنتدى', icon: MessageCircle },
    { href: '/dealers', label: 'الوكلاء', icon: Store },
  ];

  const secondaryLinks = [
    { href: '/cars?featured=true', label: 'مميزة', icon: StarIcon },
    { href: '/car-finder', label: 'هل تناسبني؟', icon: Car },
    { href: '/resale-value', label: 'قيمة إعادة البيع', icon: DollarSign },
    { href: '/maintenance', label: 'صيانة وإصلاح', icon: Wrench },
    { href: '/my-garage', label: 'مرآبي', icon: Wrench },
    { href: '/wanted', label: 'إعلانات الطلب', icon: Tag },
    { href: '/plates', label: 'لوحات مميزة', icon: BadgePercent },
    { href: '/news', label: 'الأخبار', icon: Newspaper },
    ...(isAuthenticated ? [{ href: '/tickets', label: 'التذاكر', icon: Ticket }] : []),
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-white/90 dark:bg-black/90 backdrop-blur-xl shadow-lg shadow-black/5'
          : 'bg-transparent'
      )}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                <span className="gradient-text">JO</span> Cars
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {primaryLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap',
                      pathname === link.href || pathname.startsWith(link.href + '/')
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}

              {/* More dropdown */}
              {secondaryLinks.length > 0 && (
                <div className="relative">
                  <button onClick={() => setMoreOpen(!moreOpen)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                      moreOpen ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    )}>
                    <ChevronDown className={`w-4 h-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                    المزيد
                  </button>

                  <AnimatePresence>
                    {moreOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl shadow-black/10 overflow-hidden z-50">
                        <div className="p-2 space-y-0.5">
                          {secondaryLinks.map((link) => {
                            const Icon = link.icon;
                            const active = pathname === link.href || pathname.startsWith(link.href + '/');
                            return (
                              <Link key={link.href} href={link.href} onClick={() => setMoreOpen(false)}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                  active
                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                )}>
                                <Icon className="w-4 h-4" />
                                {link.label}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </nav>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن سيارتك..."
                className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm pl-11 pr-4 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="flex items-center gap-2">
            {compareCars.length > 0 && (
              <Link
                href="/cars/compare"
                className="relative p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <GitCompare className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {compareCars.length}
                </span>
              </Link>
            )}

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              {mounted ? (theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />) : <div className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl shadow-black/10 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                        <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        {[
                          { href: '/auth/profile', label: 'الملف الشخصي', icon: User },
                          { href: '/favorites', label: 'المفضلة', icon: Heart },
                          { href: '/price-alerts', label: 'تنبيهات الأسعار', icon: Bell },
                          { href: '/messages', label: 'الرسائل', icon: MessageCircle, badge: unreadCount },
                          { href: '/my-cars', label: 'سياراتي', icon: Car },
                          { href: '/my-garage', label: 'مرآبي', icon: Wrench },
                          { href: '/my-auctions', label: 'مزاداتي', icon: Hammer },
                          { href: '/my-bids', label: 'المزادات', icon: Gavel },
                          { href: '/my-wants', label: 'إعلاناتي المطلوبة', icon: Tag },
                          { href: '/my-services', label: 'خدماتي', icon: Wrench },
                          { href: '/my-plates', label: 'لوحاتي', icon: BadgePercent },
                          { href: '/parts', label: 'قطع غيار', icon: Cpu },
                          { href: '/cars/add', label: 'إضافة سيارة', icon: Plus },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                            >
                              <span className="flex items-center gap-3">
                                <Icon className="w-4 h-4" />
                                {item.label}
                              </span>
                              {item.badge ? (
                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
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
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            لوحة التحكم
                          </Link>
                        )}
                      </div>
                      <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          تسجيل خروج
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="btn-ghost text-sm">
                  تسجيل دخول
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm !px-5 !py-2.5">
                  إنشاء حساب
                </Link>
              </div>
            )}

            <Link
              href="/cars/add"
              className="hidden lg:flex btn-primary text-sm !px-5 !py-2.5 gap-2"
            >
              <Plus className="w-4 h-4" />
              بيع سيارتك
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-black backdrop-blur-xl"
          >
            <div className="container-custom py-4 space-y-3">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن سيارتك..."
                    className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 pl-11 pr-4 text-sm outline-none focus:border-blue-500"
                  />
                  <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>
              {[...primaryLinks, ...secondaryLinks].map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Star(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
