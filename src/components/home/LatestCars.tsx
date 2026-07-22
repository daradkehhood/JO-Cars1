'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CarGrid } from '@/components/cars/CarGrid';
import { ArrowLeft, Clock } from 'lucide-react';
import type { Car } from '@/types';

export function LatestCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

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
    <section className="py-16 sm:py-20 bg-surface-50/50 dark:bg-surface-900/50">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary-500" />
              </div>
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">جديد</span>
            </div>
            <h2 className="section-title">أحدث السيارات</h2>
            <p className="section-subtitle">أحدث السيارات المضافة للمنصة</p>
          </div>
          <Link
            href="/cars"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <CarGrid cars={cars} loading={loading} />

        <div className="sm:hidden mt-6 text-center">
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
