'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, ChevronDown, AlertCircle } from 'lucide-react';

interface CityData {
  id: string;
  nameAr: string;
  slug: string;
  _count?: { cars: number };
}

export function CitiesSection() {
  const [cities, setCities] = useState<CityData[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const INITIAL_COUNT = 8;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    fetch('/api/cars/cities', { signal: controller.signal, cache: 'no-store' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (cancelled) return;
        if (d?.success && Array.isArray(d.data)) {
          setCities(d.data);
        } else {
          setError('فشل تحميل البيانات');
        }
      })
      .catch(e => {
        if (cancelled) return;
        console.error('Cities fetch error:', e);
        setError('تعذّر الاتصال بالخادم. حاول مرة أخرى.');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          clearTimeout(timeout);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  if (error) {
    return (
      <section className="py-16">
        <div className="container-custom text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-4">تأكّد من اتصالك بالإنترنت ومن تشغيل المنصة.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            إعادة المحاولة
          </button>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="py-16">
        <div className="container-custom text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل المحافظات...</p>
        </div>
      </section>
    );
  }

  if (cities.length === 0) {
    return (
      <section className="py-16">
        <div className="container-custom text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="section-title">السيارات حسب المحافظة</h2>
          <p className="text-gray-500">لا توجد محافظات متاحة حالياً.</p>
        </div>
      </section>
    );
  }

  const displayCities = showAll ? cities : cities.slice(0, INITIAL_COUNT);
  const hasMore = cities.length > INITIAL_COUNT;

  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-blue-500">المحافظات</span>
          </div>
          <h2 className="section-title">السيارات حسب المحافظة</h2>
          <p className="section-subtitle">اعثر على سيارتك في محافظتك</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[calc(8*84px)] overflow-hidden">
          {displayCities.map((city, i) => (
            <motion.div
              key={city.slug || city.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/cars?cityId=${city.id}`}
                className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-500/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                      {city.nameAr}
                    </p>
                    <p className="text-xs text-gray-400">{city._count?.cars || 0} سيارة</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-500/20 hover:shadow-lg transition-all duration-300 text-blue-600 dark:text-blue-400 font-medium"
            >
              {showAll ? 'إظهار أقل' : 'المزيد من المحافظات'}
              <ChevronDown className={`w-5 h-5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
