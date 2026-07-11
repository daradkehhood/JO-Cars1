'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CircleDollarSign } from 'lucide-react';

const ranges = [
  { label: 'أقل من 5,000 دينار', min: 0, max: 5000, color: 'from-green-500 to-emerald-500' },
  { label: '5,000 - 10,000 دينار', min: 5000, max: 10000, color: 'from-blue-500 to-cyan-500' },
  { label: '10,000 - 15,000 دينار', min: 10000, max: 15000, color: 'from-indigo-500 to-blue-500' },
  { label: '15,000 - 25,000 دينار', min: 15000, max: 25000, color: 'from-purple-500 to-indigo-500' },
  { label: '25,000 - 50,000 دينار', min: 25000, max: 50000, color: 'from-amber-500 to-orange-500' },
  { label: 'أكثر من 50,000 دينار', min: 50000, max: undefined, color: 'from-red-500 to-rose-500' },
];

export function PriceRanges() {
  return (
    <section className="py-16 bg-gray-50/50 dark:bg-gray-900/30">
      <div className="container-custom">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CircleDollarSign className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-blue-500">السعر</span>
          </div>
          <h2 className="section-title">السيارات حسب السعر</h2>
          <p className="section-subtitle">اختر الميزانية المناسبة لك</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ranges.map((range, i) => (
            <motion.div
              key={range.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/cars?priceMin=${range.min}${range.max ? `&priceMax=${range.max}` : ''}`}
                className="relative group block p-6 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 hover:border-transparent overflow-hidden transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${range.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity`} />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${range.color} flex items-center justify-center shadow-lg`}>
                      <CircleDollarSign className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">{range.label}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
