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
    <section ref={ref} className="py-16 sm:py-20 bg-surface-900/40 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-surface-700/50 to-transparent" />

      <div className="container-custom">
        <div className="text-center mb-10 sm:mb-12" style={scrollStyle(isInView)}>
          <div className="flex items-center justify-center gap-3 mb-4" style={scrollStyle(isInView, { delay: 0.05 })}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-600 shadow-lg shadow-success-500/20">
              <MapPin className="w-5 h-5 text-white" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-surface-200 tracking-tight"
            style={scrollStyle(isInView, { delay: 0.1 })}>
            تصفح حسب المدينة
          </h2>
          <p className="text-surface-500 mt-2 text-sm sm:text-base"
            style={scrollStyle(isInView, { delay: 0.15 })}>
            اختر مدينتك للبحث عن سيارات بالقرب منك
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {visibleCities.map((city, i) => (
            <div key={city.slug} style={scrollStyle(isInView, { delay: Math.min(i * 0.03, 0.4) })}>
              <Link
                href={`/cars?city=${city.slug}`}
                className="group flex items-center gap-3 rounded-xl bg-surface-800 border border-surface-700/50 px-4 py-3.5 transition-all duration-300 hover:border-accent-500/50 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-500/15 text-success-400 transition-all duration-300 group-hover:bg-accent-500/15 group-hover:text-accent-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-surface-200 group-hover:text-accent-300 transition-colors">
                    {city.name}
                  </span>
                  <span className="text-xs text-surface-500">{city.count} إعلان</span>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center" style={scrollStyle(isInView, { delay: 0.45 })}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent-400 hover:text-accent-300 transition-colors px-4 py-2 rounded-lg hover:bg-accent-500/10"
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
