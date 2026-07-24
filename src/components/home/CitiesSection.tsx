'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';

const cities = [
  { slug: 'amman', name: 'عمّان', count: '800+' },
  { slug: 'irbid', name: 'إربد', count: '120+' },
  { slug: 'zarqa', name: 'الزرقاء', count: '80+' },
  { slug: 'aqaba', name: 'العقبة', count: '40+' },
  { slug: 'mafraq', name: 'المفرق', count: '30+' },
  { slug: 'jerash', name: 'جرش', count: '25+' },
  { slug: 'ajloun', name: 'عجلون', count: '15+' },
  { slug: 'karak', name: 'الكرك', count: '20+' },
  { slug: 'salt', name: 'السلط', count: '15+' },
  { slug: 'madaba', name: 'مادبا', count: '10+' },
  { slug: 'tafileh', name: 'الطفيلة', count: '8+' },
  { slug: 'maan', name: 'معان', count: '8+' },
];

export function CitiesSection() {
  const [expanded, setExpanded] = useState(false);
  const { ref, isInView } = useInScrollView(0.05);

  const visibleCities = expanded ? cities : cities.slice(0, 8);

  return (
    <section ref={ref} className="py-20 sm:py-24 bg-surface-50/50 dark:bg-surface-900/30 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-surface-200/60 to-transparent dark:via-surface-700/30" />

      <div className="container-custom">
        <div className="text-center mb-12" style={scrollStyle(isInView)}>
          <div className="flex items-center justify-center gap-3 mb-4" style={scrollStyle(isInView, { delay: 0.05 })}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-success-400 to-success-500 shadow-lg shadow-success-500/20">
              <MapPin className="w-5 h-5 text-white" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white"
            style={scrollStyle(isInView, { delay: 0.1 })}>
            تصفح حسب المدينة
          </h2>
          <p className="text-surface-500 dark:text-surface-400 mt-2 text-base"
            style={scrollStyle(isInView, { delay: 0.15 })}>
            اختر مدينتك للبحث عن سيارات بالقرب منك
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {visibleCities.map((city, i) => (
            <div key={city.slug} style={scrollStyle(isInView, { delay: Math.min(i * 0.03, 0.4) })}>
              <Link
                href={`/cars?city=${city.slug}`}
                className="group flex items-center gap-3 rounded-2xl bg-white dark:bg-surface-800/80 border border-surface-100 dark:border-surface-700/50 px-4 py-3.5 transition-all duration-300 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-soft-md hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-50 dark:bg-success-500/10 text-success-500 transition-all duration-300 group-hover:bg-primary-50 group-hover:text-primary-500 dark:group-hover:bg-primary-500/15">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {city.name}
                  </span>
                  <span className="text-xs text-surface-400 dark:text-surface-500">{city.count} إعلان</span>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center" style={scrollStyle(isInView, { delay: 0.45 })}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {expanded ? (
              <>إظهار أقل <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>عرض جميع المدن <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
