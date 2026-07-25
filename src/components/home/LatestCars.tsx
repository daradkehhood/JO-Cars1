'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CarGrid } from '@/components/cars/CarGrid';
import { ArrowLeft, Clock } from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';
import type { Car } from '@/types';

export function LatestCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref, isInView } = useInScrollView(0.05);

  useEffect(() => {
    fetch('/api/cars?sortBy=createdAt&sortOrder=desc&limit=9')
      .then((res) => res.json())
      .then((data) => {
        setCars(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section ref={ref} className="py-16 sm:py-20 bg-surface-50/60 dark:bg-surface-900/40 relative">
      {/* Decorative gold top edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />

      <div className="container-custom relative">
        <div className="flex items-end justify-between mb-10 sm:mb-12" style={scrollStyle(isInView)}>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-luxury shadow-primary"
                style={scrollStyle(isInView, { delay: 0.1 })}>
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300"
                style={scrollStyle(isInView, { delay: 0.15 })}>
                جديد
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight"
              style={scrollStyle(isInView, { delay: 0.2 })}>
              أحدث السيارات
            </h2>
            <p className="text-surface-500 dark:text-surface-400 mt-2 text-sm sm:text-base"
              style={scrollStyle(isInView, { delay: 0.25 })}>
              أحدث السيارات المضافة للمنصة
            </p>
          </div>
          <div className="hidden sm:block" style={scrollStyle(isInView, { delay: 0.3 })}>
            <Link
              href="/cars"
              className="group inline-flex items-center gap-2 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-500/10 px-4 py-2.5 text-sm font-semibold text-primary-700 dark:text-primary-300 transition-all duration-200 hover:bg-primary-100 dark:hover:bg-primary-500/20 hover:shadow-soft"
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>

        <CarGrid cars={cars} loading={loading} />

        <div className="sm:hidden mt-8 text-center" style={scrollStyle(isInView, { delay: 0.4 })}>
          <Link
            href="/cars"
            className="inline-flex items-center gap-2 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-500/10 px-5 py-3 text-sm font-semibold text-primary-700 dark:text-primary-300 active:scale-95 transition-transform"
          >
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
