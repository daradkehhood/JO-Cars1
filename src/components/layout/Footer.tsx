'use client';

import Link from 'next/link';
import { Car, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube, ArrowUp } from 'lucide-react';
import { useInScrollView } from '@/hooks/useInScrollView';
import { cn } from '@/lib/utils';

export function Footer() {
  const { ref, isInView } = useInScrollView(0.05);
  const { ref: bottomRef, isInView: bottomInView } = useInScrollView(0.05);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'فيسبوك' },
    { icon: Twitter, href: '#', label: 'تويتر' },
    { icon: Instagram, href: '#', label: 'انستغرام' },
    { icon: Youtube, href: '#', label: 'يوتيوب' },
  ];

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-surface-200/60 bg-surface-50/90 pb-20 dark:border-surface-700/60 dark:bg-surface-900/70 lg:pb-0">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute top-0 left-1/3 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-warning-500/10 blur-3xl" />
      </div>

      <div ref={ref} className="container-custom relative z-10 py-14 lg:py-16">
        <div className={cn('grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12', isInView ? 'scroll-visible' : 'scroll-hidden')}>
          <div className={cn('sm:col-span-2 lg:col-span-1', isInView ? 'scroll-visible' : 'scroll-hidden')} style={{ transitionDelay: '0.05s' }}>
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 shadow-primary-lg">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-surface-950 dark:text-white">
                <span className="gradient-text">JO</span>Cars
              </span>
            </Link>
            <p className="mb-5 max-w-xs text-sm leading-7 text-surface-500 dark:text-surface-400">
              سوق سيارات أردني بتجربة أوضح، أسرع، وأكثر جمالية على الهاتف والكمبيوتر.
            </p>
            <div className="flex items-center gap-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-surface-200 bg-white text-surface-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-600 hover:shadow-soft dark:border-surface-700 dark:bg-surface-800 dark:hover:border-primary-800"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className={isInView ? 'scroll-visible' : 'scroll-hidden'} style={{ transitionDelay: '0.1s' }}>
            <h3 className="mb-4 text-sm font-bold text-surface-950 dark:text-white">روابط سريعة</h3>
            <ul className="space-y-3">
              {[
                { href: '/cars', label: 'جميع السيارات' },
                { href: '/cars?featured=true', label: 'السيارات المميزة' },
                { href: '/dealers', label: 'الوكلاء والمعارض' },
                { href: '/cars/compare', label: 'مقارنة السيارات' },
                { href: '/cars/add', label: 'بيع سيارتك' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-surface-500 transition-colors hover:text-primary-600 dark:text-surface-400 dark:hover:text-primary-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={isInView ? 'scroll-visible' : 'scroll-hidden'} style={{ transitionDelay: '0.15s' }}>
            <h3 className="mb-4 text-sm font-bold text-surface-950 dark:text-white">الخدمات</h3>
            <ul className="space-y-3">
              {[
                { href: '/financing', label: 'حاسبة التمويل' },
                { href: '/ai', label: 'المساعد الذكي' },
                { href: '/car-finder', label: 'اختيار السيارة' },
                { href: '/resale-value', label: 'قيمة إعادة البيع' },
                { href: '/workshops', label: 'ورش العمل' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-surface-500 transition-colors hover:text-primary-600 dark:text-surface-400 dark:hover:text-primary-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={isInView ? 'scroll-visible' : 'scroll-hidden'} style={{ transitionDelay: '0.2s' }}>
            <h3 className="mb-4 text-sm font-bold text-surface-950 dark:text-white">تواصل معنا</h3>
            <ul className="space-y-3.5">
              <li className="flex items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
                  <Phone className="w-4 h-4 text-primary-500" />
                </div>
                <span dir="ltr">+962 7 7145 8569</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
                  <Mail className="w-4 h-4 text-primary-500" />
                </div>
                <span className="truncate">daradkehhood@gmail.com</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
                  <MapPin className="w-4 h-4 text-primary-500" />
                </div>
                <span>الأردن - إربد</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div ref={bottomRef} className="relative border-t border-surface-200/60 dark:border-surface-700/60">
        <div className={cn('container-custom flex flex-col items-center justify-between gap-4 py-5 sm:flex-row', bottomInView ? 'scroll-visible' : 'scroll-hidden')} style={{ transitionDelay: '0.1s' }}>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            © {new Date().getFullYear()} JO Cars. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-sm text-surface-500 transition-colors hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200">
              الخصوصية
            </Link>
            <Link href="/terms" className="text-sm text-surface-500 transition-colors hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200">
              الشروط
            </Link>
            <button
              onClick={scrollToTop}
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-surface-200 bg-white text-surface-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-600 hover:shadow-soft dark:border-surface-700 dark:bg-surface-800 dark:hover:border-primary-800"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
