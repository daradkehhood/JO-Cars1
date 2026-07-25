'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, ArrowUpLeft } from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';
import type { Brand } from '@/types';

function BrandCard({ brand, index }: { brand: Brand; index: number }) {
  const { ref, isInView } = useInScrollView(0.05);

  return (
    <div ref={ref} style={scrollStyle(isInView, { delay: index * 0.04 })}>
      <Link
        href={`/cars?brandId=${brand.slug}`}
        className="group relative flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl bg-white dark:bg-surface-800/80 border border-surface-200/70 dark:border-surface-700/50 hover:border-gold-400 dark:hover:border-gold-500 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-center overflow-hidden"
      >
        {/* Hover gold gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold-50/0 to-gold-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:from-gold-500/0 dark:to-gold-500/5" />

        {/* Gold top accent on hover */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative w-14 h-14 rounded-xl bg-surface-50 dark:bg-surface-700/50 flex items-center justify-center group-hover:bg-gold-50 dark:group-hover:bg-gold-500/15 transition-all duration-300 group-hover:scale-110">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-500/20 dark:to-primary-500/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-lg transition-transform duration-300 group-hover:scale-110">
            {brand.nameAr?.charAt(0) || 'B'}
          </div>
        </div>
        <span className="relative text-sm font-semibold text-surface-700 dark:text-surface-300 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors duration-300">
          {brand.nameAr}
        </span>

        {/* Arrow on hover */}
        <ArrowUpLeft className="absolute top-3 left-3 w-4 h-4 text-gold-500 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </div>
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
    <section className="py-16 sm:py-20 relative">
      <div className="container-custom">
        <div className="text-center mb-10 sm:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-luxury shadow-primary">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight">
            تصفح حسب الماركة
          </h2>
          <p className="text-surface-500 dark:text-surface-400 mt-2 text-sm sm:text-base">
            اختر الماركة المفضلة لديك
          </p>
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
