'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CarGrid } from '@/components/cars/CarGrid';
import { ArrowLeft, Star } from 'lucide-react';
import { useInScrollView } from '@/hooks/useInScrollView';
import { cn } from '@/lib/utils';
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
        <div className={cn('flex items-end justify-between mb-10', isInView ? 'scroll-visible' : 'scroll-hidden')}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center', isInView ? 'scroll-visible-scale' : 'scroll-hidden-scale')} style={{ transitionDelay: '0.1s' }}>
                <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
              </div>
              <span className={cn('text-sm font-semibold text-warning-600 dark:text-warning-400', isInView ? 'scroll-visible-right' : 'scroll-hidden-right')} style={{ transitionDelay: '0.2s' }}>
                مميزة
              </span>
            </div>
            <h2 className={cn('section-title', isInView ? 'scroll-visible' : 'scroll-hidden')} style={{ transitionDelay: '0.15s' }}>
              السيارات المميزة
            </h2>
            <p className={cn('section-subtitle', isInView ? 'scroll-visible' : 'scroll-hidden')} style={{ transitionDelay: '0.25s' }}>
              أفضل العروض من الوكلاء والمعارض الموثوقة
            </p>
          </div>
          <div className={cn('hidden sm:block', isInView ? 'scroll-visible-right' : 'scroll-hidden-right')} style={{ transitionDelay: '0.3s' }}>
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

        <div className={cn('sm:hidden mt-6 text-center', isInView ? 'scroll-visible' : 'scroll-hidden')} style={{ transitionDelay: '0.4s' }}>
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
