'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CarGrid } from '@/components/cars/CarGrid';
import { ArrowLeft, Clock } from 'lucide-react';
import { useInScrollView } from '@/hooks/useInScrollView';
import { cn } from '@/lib/utils';
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
    <section ref={ref} className="py-16 sm:py-20">
      <div className="container-custom">
        <div className={cn('mb-10 rounded-[1.75rem] border border-surface-200/70 dark:border-surface-700/70 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl p-5 sm:p-6 shadow-soft-lg', isInView ? 'scroll-visible' : 'scroll-hidden')}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('w-9 h-9 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center', isInView ? 'scroll-visible-scale' : 'scroll-hidden-scale')} style={{ transitionDelay: '0.1s' }}>
                  <Clock className="w-4.5 h-4.5 text-primary-500" />
                </div>
                <span className={cn('text-sm font-semibold text-primary-600 dark:text-primary-400', isInView ? 'scroll-visible-right' : 'scroll-hidden-right')} style={{ transitionDelay: '0.2s' }}>
                  جديد
                </span>
              </div>
              <h2 className={cn('section-title', isInView ? 'scroll-visible' : 'scroll-hidden')} style={{ transitionDelay: '0.15s' }}>
                أحدث السيارات
              </h2>
              <p className={cn('section-subtitle max-w-xl', isInView ? 'scroll-visible' : 'scroll-hidden')} style={{ transitionDelay: '0.25s' }}>
                أحدث الإعلانات تظهر هنا أولًا، مع تصميم يسهّل التصفح السريع من الهاتف.
              </p>
            </div>
            <div className={cn('hidden sm:flex', isInView ? 'scroll-visible-right' : 'scroll-hidden-right')} style={{ transitionDelay: '0.3s' }}>
              <Link
                href="/cars"
                className="inline-flex items-center gap-2 rounded-full border border-primary-200 dark:border-primary-500/20 bg-primary-50 dark:bg-primary-500/10 px-4 py-2.5 text-sm font-semibold text-primary-700 dark:text-primary-300 transition-all duration-200 hover:bg-primary-100 dark:hover:bg-primary-500/20"
              >
                عرض الكل
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <CarGrid cars={cars} loading={loading} />

        <div className={cn('sm:hidden mt-6 text-center', isInView ? 'scroll-visible' : 'scroll-hidden')} style={{ transitionDelay: '0.4s' }}>
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
