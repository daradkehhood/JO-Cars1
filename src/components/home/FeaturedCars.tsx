'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CarGrid } from '@/components/cars/CarGrid';
import { ChevronLeft, Sparkles } from 'lucide-react';
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
    <section className="py-16 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-950/10 dark:to-transparent" />
      <div className="container-custom relative">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-500">مميزة</span>
            </div>
            <h2 className="section-title">السيارات المميزة</h2>
            <p className="section-subtitle">أفضل العروض من الوكلاء والمعارض الموثوقة</p>
          </div>
          <Link
            href="/cars?featured=true"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
          >
            عرض الكل
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        <CarGrid cars={cars} featured loading={loading} />
      </div>
    </section>
  );
}
