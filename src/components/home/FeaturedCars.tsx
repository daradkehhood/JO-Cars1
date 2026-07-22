'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CarGrid } from '@/components/cars/CarGrid';
import { ArrowLeft, Star } from 'lucide-react';
import type { Car } from '@/types';

export function FeaturedCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

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
    <section className="py-16 sm:py-20">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
              </div>
              <span className="text-sm font-semibold text-warning-600 dark:text-warning-400">مميزة</span>
            </div>
            <h2 className="section-title">السيارات المميزة</h2>
            <p className="section-subtitle">أفضل العروض من الوكلاء والمعارض الموثوقة</p>
          </div>
          <Link
            href="/cars?featured=true"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <CarGrid cars={cars} featured loading={loading} />

        <div className="sm:hidden mt-6 text-center">
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
