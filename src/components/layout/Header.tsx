'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore, useNotificationStore, useCompareStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  Search, User, Heart, MessageCircle, Plus, Moon, Sun,
  ChevronDown, LogOut, ShieldCheck, Bot, Wrench, DollarSign, Tag,
  BadgePercent, Newspaper, Car, Store, Bell, GitCompare, Ticket,
  Calculator, Cpu,
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setMobileMenuOpen } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const { cars: compareCars } = useCompareStore();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const userBtnRef = useRef<HTMLButtonElement>(null);

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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreBtnRef.current && !moreBtnRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
      if (userBtnRef.current && !userBtnRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openUserMenu = useCallback(() => {
    window.dispatchEvent(new CustomEvent('toggleUserMenu'));
  }, []);

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

  const desktopUserMenuItems = [
    { href: '/auth/profile', label: 'الملف الشخصي', icon: User },
    { href: '/favorites', label: 'المفضلة', icon: Heart },
    { href: '/messages', label: 'الرسائل', icon: MessageCircle, badge: unreadCount },
    { href: '/my-cars', label: 'إعلاناتي', icon: Car },
    { href: '/my-garage', label: 'مرآبي', icon: Wrench },
    { href: '/my-wants', label: 'طلباتي', icon: Tag },
    { href: '/price-alerts', label: 'تنبيهات الأسعار', icon: Bell },
  ];

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-white/90 dark:bg-surface-950/90 backdrop-blur-xl border-b border-surface-200/60 dark:border-surface-800/60 shadow-soft'
            : 'bg-white/70 dark:bg-surface-950/70 backdrop-blur-sm'
        )}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-luxury flex items-center justify-center shadow-primary transition-transform duration-300 group-hover:scale-105">
                <Car className="w-5 h-5 text-white" />
                <div className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-gold-400 shadow-gold" />
              </div>
              <span className="text-lg font-bold text-surface-900 dark:text-white hidden sm:block tracking-tight">
                <span className="gradient-text">JO</span>
                <span className="text-gold-500 dark:text-gold-400">Cars</span>
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
                      'relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      active
                        ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-500/10'
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}

              {/* More dropdown button */}
              <button
                ref={moreBtnRef}
                onClick={() => setMoreOpen(!moreOpen)}
                className={cn(
                  'flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  moreOpen
                    ? 'text-surface-900 dark:text-white bg-surface-100 dark:bg-surface-800'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800'
                )}
              >
                المزيد
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', moreOpen && 'rotate-180')} />
              </button>
            </nav>

            {/* Search */}
            <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
              <form onSubmit={handleSearch} className="relative w-full group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن سيارة..."
                  className="w-full h-10 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 pl-10 pr-4 text-sm text-surface-900 dark:text-surface-100 placeholder-surface-400 transition-all duration-200 focus:border-primary-500 focus:bg-white dark:focus:bg-surface-700 focus:ring-2 focus:ring-primary-500/10 focus:shadow-soft outline-none"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
              </form>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {/* Compare */}
              {compareCars.length > 0 && (
                <Link
                  href="/cars/compare"
                  className="relative p-2 rounded-xl text-surface-500 hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
                  title="مقارنة"
                >
                  <GitCompare className="w-5 h-5" />
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-gold-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                    {compareCars.length}
                  </span>
                </Link>
              )}

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hidden md:flex p-2 rounded-xl text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
                aria-label="تبديل المظهر"
              >
                {mounted ? (theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />) : <div className="w-5 h-5" />}
              </button>

              {/* User area */}
              {isAuthenticated ? (
                <>
                  {/* Desktop: user dropdown button */}
                  <button
                    ref={userBtnRef}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="hidden md:flex items-center gap-1.5 p-1.5 pr-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-gold-400/30">
                      {user?.image ? (
                        <img src={user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        user?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <ChevronDown className={cn('w-4 h-4 text-surface-400 transition-transform duration-200', userMenuOpen && 'rotate-180')} />
                  </button>

                  {/* Mobile: user avatar */}
                  <button
                    onClick={openUserMenu}
                    className="md:hidden p-1 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
                    aria-label="حسابي"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold ring-2 ring-gold-400/40">
                      {user?.image ? (
                        <img src={user.image} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        user?.name?.charAt(0) || 'U'
                      )}
                    </div>
                  </button>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5">
                  <Link href="/auth/login" className="px-3.5 py-1.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200">
                    دخول
                  </Link>
                  <Link href="/auth/register" className="btn-primary text-sm px-3.5 py-1.5">
                    حساب جديد
                  </Link>
                </div>
              )}

              {/* Sell button */}
              <Link
                href="/cars/add"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-gold text-primary-900 font-bold text-sm px-4 py-2 shadow-gold hover:shadow-gold-lg active:scale-[0.97] transition-all duration-200"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">بيع سيارتك</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── "More" dropdown portal (renders OUTSIDE the header) ── */}
      {moreOpen && (
        <div
          className="fixed z-[70] w-60 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-soft-xl overflow-hidden"
          ref={(el) => {
            if (!el) return;
            const rect = moreBtnRef.current?.getBoundingClientRect();
            if (rect) {
              el.style.left = `${Math.min(rect.left, window.innerWidth - 260)}px`;
              el.style.top = `${rect.bottom + 6}px`;
            }
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-gold opacity-80" />
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
                      ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-500/10'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── User dropdown portal (renders OUTSIDE the header) ── */}
      {userMenuOpen && isAuthenticated && (
        <div
          className="fixed z-[70] w-64 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-soft-xl overflow-hidden"
          ref={(el) => {
            if (!el) return;
            const rect = userBtnRef.current?.getBoundingClientRect();
            if (rect) {
              el.style.left = `${Math.max(8, rect.right - 256)}px`;
              el.style.top = `${rect.bottom + 6}px`;
            }
          }}
        >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-gold opacity-80" />
            {/* User header */}
            <div className="p-4 border-b border-surface-100 dark:border-surface-700 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold ring-2 ring-gold-400/30">
                  {user?.image ? (
                    <img src={user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-surface-900 dark:text-white text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="p-1.5 max-h-[300px] overflow-y-auto">
              {desktopUserMenuItems.map((item) => {
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
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center">
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
        </div>
      )}
    </>
  );
}
