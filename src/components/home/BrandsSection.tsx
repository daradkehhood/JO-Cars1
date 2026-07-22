'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { useInScrollView } from '@/hooks/useInScrollView';
import type { Brand } from '@/types';

function BrandCard({ brand, index }: { brand: Brand; index: number }) {
  const { ref, isInView } = useInScrollView(0.1);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        href={`/cars?brandId=${brand.slug}`}
        className="group flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-soft transition-all duration-200 text-center"
      >
        <div className="w-14 h-14 rounded-xl bg-surface-50 dark:bg-surface-700 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-500/10 transition-colors duration-200">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
            {brand.nameAr?.charAt(0) || 'B'}
          </div>
        </div>
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
          {brand.nameAr}
        </span>
      </Link>
    </motion.div>
  );
}

export function BrandsSection() {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    fetch('/api/cars/brands')
      .then((res) => res.json())
      .then((data) => setBrands((data.data || []).slice(0, 12)))
      .catch(() => {});
  }, []);

  const defaultBrands: Brand[] = [
    { id: '1', nameAr: 'تويوتا', nameEn: 'Toyota', slug: 'toyota', logo: null, models: [] },
    { id: '2', nameAr: 'هيونداي', nameEn: 'Hyundai', slug: 'hyundai', logo: null, models: [] },
    { id: '3', nameAr: 'كيا', nameEn: 'Kia', slug: 'kia', logo: null, models: [] },
    { id: '4', nameAr: 'نيسان', nameEn: 'Nissan', slug: 'nissan', logo: null, models: [] },
    { id: '5', nameAr: 'مرسيدس', nameEn: 'Mercedes', slug: 'mercedes', logo: null, models: [] },
    { id: '6', nameAr: 'بي إم دبليو', nameEn: 'BMW', slug: 'bmw', logo: null, models: [] },
    { id: '7', nameAr: 'هوندا', nameEn: 'Honda', slug: 'honda', logo: null, models: [] },
    { id: '8', nameAr: 'ميتسوبيشي', nameEn: 'Mitsubishi', slug: 'mitsubishi', logo: null, models: [] },
    { id: '9', nameAr: 'شيفروليه', nameEn: 'Chevrolet', slug: 'chevrolet', logo: null, models: [] },
    { id: '10', nameAr: 'فورد', nameEn: 'Ford', slug: 'ford', logo: null, models: [] },
    { id: '11', nameAr: 'لكزس', nameEn: 'Lexus', slug: 'lexus', logo: null, models: [] },
    { id: '12', nameAr: 'لاند روفر', nameEn: 'Land Rover', slug: 'land-rover', logo: null, models: [] },
  ];

  const displayBrands = brands.length > 0 ? brands : defaultBrands;

  return (
    <section className="py-16 sm:py-20">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary-500" />
              </div>
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">الماركات</span>
            </div>
            <h2 className="section-title">تصفح حسب الماركة</h2>
            <p className="section-subtitle">اختر الماركة المفضلة لديك</p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
          {displayBrands.map((brand, i) => (
            <BrandCard key={brand.id} brand={brand} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
