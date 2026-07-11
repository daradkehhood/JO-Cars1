'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, Building2 } from 'lucide-react';
import type { Brand } from '@/types';

export function BrandsSection() {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    fetch('/api/cars/brands')
      .then((res) => res.json())
      .then((data) => setBrands((data.data || []).slice(0, 12)))
      .catch(() => {});
  }, []);

  const defaultBrands = [
    { id: '1', nameAr: 'تويوتا', slug: 'toyota', logo: null },
    { id: '2', nameAr: 'هيونداي', slug: 'hyundai', logo: null },
    { id: '3', nameAr: 'كيا', slug: 'kia', logo: null },
    { id: '4', nameAr: 'نيسان', slug: 'nissan', logo: null },
    { id: '5', nameAr: 'مرسيدس', slug: 'mercedes', logo: null },
    { id: '6', nameAr: 'بي إم دبليو', slug: 'bmw', logo: null },
    { id: '7', nameAr: 'هوندا', slug: 'honda', logo: null },
    { id: '8', nameAr: 'ميتسوبيشي', slug: 'mitsubishi', logo: null },
    { id: '9', nameAr: 'شيفروليه', slug: 'chevrolet', logo: null },
    { id: '10', nameAr: 'فورد', slug: 'ford', logo: null },
    { id: '11', nameAr: 'هيونداي', slug: 'hyundai', logo: null },
    { id: '12', nameAr: 'لكزس', slug: 'lexus', logo: null },
  ];

  const displayBrands = brands.length > 0 ? brands : defaultBrands;

  return (
    <section className="py-16 bg-gray-50/50 dark:bg-gray-900/30">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-500">الشركات</span>
            </div>
            <h2 className="section-title">السيارات حسب الشركة</h2>
            <p className="section-subtitle">تصفح السيارات حسب الشركة المصنعة</p>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayBrands.map((brand, i) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/cars?brandId=${brand.slug}`}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-500/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center group"
              >
                <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-500/5 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {brand.nameAr?.charAt(0) || 'B'}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">
                  {brand.nameAr}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
