'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CarGrid } from '@/components/cars/CarGrid';
import { ArrowLeft, Star } from 'lucide-react';
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
    <section ref={ref} className="py-16 sm:py-20">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-10" style={scrollStyle(isInView)}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center"
                style={scrollStyle(isInView, { delay: 0.1, direction: 'up' })}>
                <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
              </div>
              <span className="text-sm font-semibold text-warning-600 dark:text-warning-400"
                style={scrollStyle(isInView, { delay: 0.2, direction: 'right' })}>
                مميزة
              </span>
            </div>
            <h2 className="section-title" style={scrollStyle(isInView, { delay: 0.15 })}>
              السيارات المميزة
            </h2>
            <p className="section-subtitle" style={scrollStyle(isInView, { delay: 0.25 })}>
              أفضل العروض من الوكلاء والمعارض الموثوقة
            </p>
          </div>
          <div className="hidden sm:block" style={scrollStyle(isInView, { delay: 0.3, direction: 'right' })}>
            <Link
              href="/cars?featured=true"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <CarGrid cars={cars} featured loading={loading} />

        <div className="sm:hidden mt-6 text-center" style={scrollStyle(isInView, { delay: 0.4 })}>
          <Link
            href="/cars?featured=true"
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
