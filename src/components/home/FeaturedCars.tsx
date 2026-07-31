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
    <section ref={ref} className="py-16 sm:py-20 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold-100/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="container-custom relative">
        <div className="flex items-end justify-between mb-10 sm:mb-12" style={scrollStyle(isInView)}>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100 shadow-gold"
                style={scrollStyle(isInView, { delay: 0.1 })}>
                <Star className="w-5 h-5 text-gold-900 fill-gold-900" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-gold-200"
                style={scrollStyle(isInView, { delay: 0.15 })}>
                مميزة
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-surface-200 tracking-tight"
              style={scrollStyle(isInView, { delay: 0.2 })}>
              السيارات المميزة
            </h2>
            <p className="text-surface-500 mt-2 text-sm sm:text-base"
              style={scrollStyle(isInView, { delay: 0.25 })}>
              أفضل العروض من الوكلاء والمعارض الموثوقة
            </p>
          </div>
          <div className="hidden sm:block" style={scrollStyle(isInView, { delay: 0.3 })}>
            <Link
              href="/cars?featured=true"
              className="group inline-flex items-center gap-2 rounded-lg border border-surface-700 bg-surface-800 px-4 py-2.5 text-sm font-semibold text-surface-300 transition-all duration-200 hover:bg-surface-700 hover:shadow-soft"
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
            className="inline-flex items-center gap-2 rounded-lg border border-surface-700 bg-surface-800 px-5 py-3 text-sm font-semibold text-surface-300 active:scale-95 transition-transform"
          >
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
