'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CarGrid } from '@/components/cars/CarGrid';
import { ArrowLeft, Star, Sparkles } from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';
import type { Car } from '@/types';

export function FeaturedCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref, isInView } = useInScrollView(0.05);

  useEffect(() => {
    fetch('/api/cars?featured=true&limit=6')
      .then((res) => res.json())
      .then((data) => {
        setCars(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section ref={ref} className="py-20 sm:py-24 relative">
      {/* Subtle background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="container-custom relative">
        <div className="flex items-end justify-between mb-12" style={scrollStyle(isInView)}>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-warning-400 to-warning-500 shadow-lg shadow-warning-500/20"
                style={scrollStyle(isInView, { delay: 0.1 })}>
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-warning-600 dark:text-warning-400"
                style={scrollStyle(isInView, { delay: 0.15 })}>
                مميزة
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white"
              style={scrollStyle(isInView, { delay: 0.2 })}>
              السيارات المميزة
            </h2>
            <p className="text-surface-500 dark:text-surface-400 mt-2 text-base"
              style={scrollStyle(isInView, { delay: 0.25 })}>
              أفضل العروض من الوكلاء والمعارض الموثوقة
            </p>
          </div>
          <div className="hidden sm:block" style={scrollStyle(isInView, { delay: 0.3, direction: 'right' })}>
            <Link
              href="/cars?featured=true"
              className="group inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-100 hover:shadow-primary dark:border-primary-800 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20"
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>

        <CarGrid cars={cars} featured loading={loading} />

        <div className="sm:hidden mt-8 text-center" style={scrollStyle(isInView, { delay: 0.4 })}>
          <Link
            href="/cars?featured=true"
            className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-5 py-3 text-sm font-semibold text-primary-600 dark:border-primary-800 dark:bg-primary-500/10 dark:text-primary-400"
          >
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
