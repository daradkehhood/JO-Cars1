'use client';

import Link from 'next/link';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';

const priceRanges = [
  { label: 'أقل من 5,000', min: 0, max: 5000, icon: '💰', color: 'from-emerald-400 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { label: '5,000 - 10,000', min: 5000, max: 10000, icon: '🏷️', color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { label: '10,000 - 20,000', min: 10000, max: 20000, icon: '💎', color: 'from-violet-400 to-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  { label: '20,000 - 40,000', min: 20000, max: 40000, icon: '🚗', color: 'from-amber-400 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { label: 'أكثر من 40,000', min: 40000, max: 0, icon: '👑', color: 'from-rose-400 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
];

export function PriceRanges() {
  const { ref, isInView } = useInScrollView(0.05);

  return (
    <section ref={ref} className="py-20 sm:py-24 relative">
      <div className="container-custom">
        <div className="text-center mb-12" style={scrollStyle(isInView)}>
          <h2 className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white"
            style={scrollStyle(isInView, { delay: 0.1 })}>
            تصفح حسب الميزانية
          </h2>
          <p className="text-surface-500 dark:text-surface-400 mt-2 text-base"
            style={scrollStyle(isInView, { delay: 0.15 })}>
            اختر النطاق السعري المناسب لميزانيتك
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {priceRanges.map((range, i) => {
            const href = range.max === 0
              ? `/cars?minPrice=${range.min}`
              : `/cars?minPrice=${range.min}&maxPrice=${range.max}`;

            return (
              <div key={range.label} style={scrollStyle(isInView, { delay: Math.min(i * 0.05, 0.4) })}>
                <Link
                  href={href}
                  className={`group flex flex-col items-center gap-3 rounded-2xl border border-surface-100 dark:border-surface-700/50 bg-white dark:bg-surface-800/80 p-5 transition-all duration-300 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-soft-md hover:-translate-y-1`}
                >
                  <span className="text-3xl transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">{range.icon}</span>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white text-center leading-tight">
                    {range.label}
                  </span>
                  <span className="text-xs text-surface-400 dark:text-surface-500">دولار أمريكي</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
