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
    <section ref={ref} className="py-16 sm:py-20 bg-surface-50/50 dark:bg-surface-900/50">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-10" style={scrollStyle(isInView)}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center"
                style={scrollStyle(isInView, { delay: 0.1, direction: 'up' })}>
                <Clock className="w-4 h-4 text-primary-500" />
              </div>
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400"
                style={scrollStyle(isInView, { delay: 0.2, direction: 'right' })}>
                جديد
              </span>
            </div>
            <h2 className="section-title" style={scrollStyle(isInView, { delay: 0.15 })}>
              أحدث السيارات
            </h2>
            <p className="section-subtitle" style={scrollStyle(isInView, { delay: 0.25 })}>
              أحدث السيارات المضافة للمنصة
            </p>
          </div>
          <div className="hidden sm:block" style={scrollStyle(isInView, { delay: 0.3, direction: 'right' })}>
            <Link
              href="/cars"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <CarGrid cars={cars} loading={loading} />

        <div className="sm:hidden mt-6 text-center" style={scrollStyle(isInView, { delay: 0.4 })}>
          <Link
            href="/cars"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400"
          >
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
