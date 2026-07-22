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
    <footer className="relative mt-16 pb-20 lg:pb-0 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-200/60 dark:border-surface-700/60">
      <div ref={ref} className="container-custom py-14 lg:py-16">
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12', isInView ? 'scroll-visible' : 'scroll-hidden')}>
          {/* Brand */}
          <div className={cn('sm:col-span-2 lg:col-span-1', isInView ? 'scroll-visible' : 'scroll-hidden')} style={{ transitionDelay: '0.05s' }}>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-primary">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-surface-900 dark:text-white">
                <span className="gradient-text">JO</span>Cars
              </span>
            </Link>
            <p className="text-surface-500 text-sm leading-relaxed mb-5 max-w-xs">
              أفضل منصة أردنية متخصصة في بيع وشراء السيارات. نوفر لك تجربة آمنة وسهلة.
            </p>
            <div className="flex items-center gap-2">
              {socialLinks.map(({ icon: Icon, href, label }, i) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-center text-surface-500 hover:text-primary-600 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-soft hover:scale-110 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className={isInView ? 'scroll-visible' : 'scroll-hidden'} style={{ transitionDelay: '0.1s' }}>
            <h3 className="font-bold text-surface-900 dark:text-white mb-4 text-sm">روابط سريعة</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/cars', label: 'جميع السيارات' },
                { href: '/cars?featured=true', label: 'السيارات المميزة' },
                { href: '/dealers', label: 'الوكلاء والمعارض' },
                { href: '/cars/compare', label: 'مقارنة السيارات' },
                { href: '/cars/add', label: 'بيع سيارتك' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className={isInView ? 'scroll-visible' : 'scroll-hidden'} style={{ transitionDelay: '0.15s' }}>
            <h3 className="font-bold text-surface-900 dark:text-white mb-4 text-sm">الخدمات</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/financing', label: 'حاسبة التمويل' },
                { href: '/ai', label: 'المساعد الذكي' },
                { href: '/car-finder', label: 'اختيار السيارة' },
                { href: '/resale-value', label: 'قيمة إعادة البيع' },
                { href: '/workshops', label: 'ورش العمل' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className={isInView ? 'scroll-visible' : 'scroll-hidden'} style={{ transitionDelay: '0.2s' }}>
            <h3 className="font-bold text-surface-900 dark:text-white mb-4 text-sm">تواصل معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-surface-500 text-sm">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-primary-500" />
                </div>
                <span dir="ltr">+962 7 7145 8569</span>
              </li>
              <li className="flex items-center gap-3 text-surface-500 text-sm">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary-500" />
                </div>
                <span className="truncate">daradkehhood@gmail.com</span>
              </li>
              <li className="flex items-center gap-3 text-surface-500 text-sm">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary-500" />
                </div>
                <span>الأردن - إربد</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div ref={bottomRef} className="border-t border-surface-200/60 dark:border-surface-700/60">
        <div className={cn('container-custom py-5 flex flex-col sm:flex-row items-center justify-between gap-4', bottomInView ? 'scroll-visible' : 'scroll-hidden')} style={{ transitionDelay: '0.1s' }}>
          <p className="text-surface-500 text-sm">
            © {new Date().getFullYear()} JO Cars. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 text-sm transition-colors">
              الخصوصية
            </Link>
            <Link href="/terms" className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 text-sm transition-colors">
              الشروط
            </Link>
            <button
              onClick={scrollToTop}
              className="w-8 h-8 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-center text-surface-500 hover:text-primary-600 hover:border-primary-200 dark:hover:border-primary-800 hover:scale-110 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
