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
          <div key={i} className="rounded-xl overflow-hidden bg-surface-800 border border-surface-700/50">
            <div className="h-56 bg-surface-900 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-surface-700 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-surface-700 rounded w-1/2 animate-pulse" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="h-3 bg-surface-700 rounded animate-pulse" />
                ))}
              </div>
              <div className="h-10 bg-surface-700/50 rounded-lg animate-pulse mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!cars || cars.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-xl bg-surface-800 border border-surface-700/50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-surface-200 mb-2">
          {emptyMessage || 'لا توجد سيارات'}
        </h3>
        <p className="text-surface-500 text-sm">حاول تغيير معايير البحث أو تصفح الأقسام الأخرى</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {cars.map((car, index) => (
        <CarCard key={car.id} car={car} index={index} />
      ))}
    </div>
  );
}
