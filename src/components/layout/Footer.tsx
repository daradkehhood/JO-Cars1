'use client';

import Link from 'next/link';
import { Car, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-black mt-20">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                <span className="gradient-text">JO</span> Cars
              </span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed max-w-sm">
              أفضل منصة أردنية متخصصة في بيع وشراء السيارات. نوفر لك تجربة آمنة وسهلة مع أحدث التقنيات.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Facebook, href: '#', label: 'فيسبوك' },
                { icon: Twitter, href: '#', label: 'تويتر' },
                { icon: Instagram, href: '#', label: 'انستغرام' },
                { icon: Youtube, href: '#', label: 'يوتيوب' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-500 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">روابط سريعة</h3>
            <ul className="space-y-3">
              {[
                { href: '/cars', label: 'جميع السيارات' },
                { href: '/cars?featured=true', label: 'السيارات المميزة' },
                { href: '/cars?condition=NEW', label: 'السيارات الجديدة' },
                { href: '/cars?condition=USED', label: 'السيارات المستعملة' },
                { href: '/dealers', label: 'الوكلاء والمعارض' },
                { href: '/cars/compare', label: 'مقارنة السيارات' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">المساعدة</h3>
            <ul className="space-y-3">
              {[
                { href: '#', label: 'سياسة الخصوصية' },
                { href: '#', label: 'شروط الاستخدام' },
                { href: '#', label: 'الشروط والأحكام' },
                { href: '#', label: 'سياسة الإعلانات' },
                { href: '#', label: 'الأسئلة الشائعة' },
                { href: '#', label: 'اتصل بنا' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">معلومات الاتصال</h3>
            <ul className="space-y-4">
              {[
                { icon: Phone, text: '+962 7 7145 8569' },
                { icon: Mail, text: 'daradkehhood@gmail.com' },
                { icon: MapPin, text: 'الأردن-إربد' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-sm">
                  <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800">
        <div className="container-custom py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} JO Cars. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>صنع بـ</span>
            <span className="text-red-500">♥</span>
            <span>في الأردن</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
