'use client';

import { CarCard } from './CarCard';
import type { Car } from '@/types';

interface CarGridProps {
  cars: Car[];
  featured?: boolean;
  columns?: 2 | 3 | 4;
  loading?: boolean;
  emptyMessage?: string;
}

export function CarGrid({ cars, featured, columns = 3, loading, emptyMessage }: CarGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (loading) {
    return (
      <div className={`grid ${gridCols[columns]} gap-6`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800">
            <div className="h-56 bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
              <div className="flex gap-3">
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-12 animate-pulse" />
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-24 animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-12 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!cars || cars.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {emptyMessage || 'لا توجد سيارات'}
        </h3>
        <p className="text-gray-500 text-sm">حاول تغيير معايير البحث أو تصفح الأقسام الأخرى</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {cars.map((car, index) => (
        <CarCard key={car.id} car={car} featured={featured} index={index} />
      ))}
    </div>
  );
}
