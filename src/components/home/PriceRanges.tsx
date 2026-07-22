'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CircleDollarSign } from 'lucide-react';
import { useInScrollView } from '@/hooks/useInScrollView';

const ranges = [
  { label: 'أقل من 5,000 دينار', min: 0, max: 5000, icon: '💰' },
  { label: '5,000 - 10,000 دينار', min: 5000, max: 10000, icon: '💵' },
  { label: '10,000 - 15,000 دينار', min: 10000, max: 15000, icon: '🏦' },
  { label: '15,000 - 25,000 دينار', min: 15000, max: 25000, icon: '💎' },
  { label: '25,000 - 50,000 دينار', min: 25000, max: 50000, icon: '🏆' },
  { label: 'أكثر من 50,000 دينار', min: 50000, max: undefined, icon: '👑' },
];

function RangeCard({ range, index }: { range: typeof ranges[0]; index: number }) {
  const { ref, isInView } = useInScrollView(0.1);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/cars?priceMin=${range.min}${range.max ? `&priceMax=${range.max}` : ''}`}
        className="group flex items-center justify-between p-5 rounded-xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-soft transition-all duration-200"
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl">{range.icon}</span>
          <p className="font-semibold text-surface-900 dark:text-white text-sm">{range.label}</p>
        </div>
        <svg className="w-4 h-4 text-surface-400 group-hover:text-primary-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </motion.div>
  );
}

export function PriceRanges() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container-custom">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
              <CircleDollarSign className="w-4 h-4 text-primary-500" />
            </div>
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">الميزانية</span>
          </div>
          <h2 className="section-title">تصفح حسب السعر</h2>
          <p className="section-subtitle">اختر الميزانية المناسبة لك</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ranges.map((range, i) => (
            <RangeCard key={range.label} range={range} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
