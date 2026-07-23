'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, ChevronDown, AlertCircle } from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';

interface CityData {
  id: string;
  nameAr: string;
  slug: string;
  _count?: { cars: number };
}

function CityCard({ city, index }: { city: CityData; index: number }) {
  const { ref, isInView } = useInScrollView(0.05);

  return (
    <div ref={ref} style={scrollStyle(isInView, { delay: index * 0.04 })}>
      <Link
        href={`/cars?cityId=${city.id}`}
        className="group flex items-center justify-between p-4 rounded-xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-soft transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-50 dark:bg-surface-700 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-500/10 transition-colors duration-200">
            <MapPin className="w-4.5 h-4.5 text-primary-500" />
          </div>
          <div>
            <p className="font-semibold text-surface-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
              {city.nameAr}
            </p>
            <p className="text-xs text-surface-500">{city._count?.cars || 0} سيارة</p>
          </div>
        </div>
        <svg className="w-4 h-4 text-surface-400 group-hover:text-primary-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
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
      .catch(() => {
        if (cancelled) return;
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
      <section className="py-16 sm:py-20">
        <div className="container-custom text-center">
          <AlertCircle className="w-12 h-12 text-accent-400 mx-auto mb-4" />
          <p className="text-accent-600 dark:text-accent-400 mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-2">
            إعادة المحاولة
          </button>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="py-16 sm:py-20">
        <div className="container-custom text-center">
          <div className="w-10 h-10 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-500 text-sm">جاري تحميل المحافظات...</p>
        </div>
      </section>
    );
  }

  if (cities.length === 0) {
    return (
      <section className="py-16 sm:py-20">
        <div className="container-custom text-center">
          <MapPin className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h2 className="section-title">السيارات حسب المحافظة</h2>
          <p className="text-surface-500 text-sm">لا توجد محافظات متاحة حالياً.</p>
        </div>
      </section>
    );
  }

  const displayCities = showAll ? cities : cities.slice(0, INITIAL_COUNT);
  const hasMore = cities.length > INITIAL_COUNT;

  return (
    <section className="py-16 sm:py-20 bg-surface-50/50 dark:bg-surface-900/50">
      <div className="container-custom">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary-500" />
            </div>
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">المحافظات</span>
          </div>
          <h2 className="section-title">تصفح حسب المحافظة</h2>
          <p className="section-subtitle">اعثر على سيارتك في محافظتك</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {displayCities.map((city, i) => (
            <CityCard key={city.slug || city.id} city={city} index={i} />
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm font-medium text-surface-700 dark:text-surface-300 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-soft transition-all duration-200"
            >
              {showAll ? 'إظهار أقل' : 'المزيد من المحافظات'}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
