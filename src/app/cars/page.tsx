'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CarGrid } from '@/components/cars/CarGrid';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Search, SlidersHorizontal, X, ChevronDown, LayoutGrid, List,
  ArrowUpDown, MapPin, Fuel, Settings, Gauge, Sparkles, Loader2, Bell
} from 'lucide-react';
import type { Car, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

export default function CarsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <CarsPage />
    </Suspense>
  );
}

function CarsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState<{ id: string; nameAr: string }[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, hasMore: false });
  const [filters, setFilters] = useState({
    query: searchParams.get('search') || '',
    brandId: searchParams.get('brandId') || '',
    modelId: searchParams.get('modelId') || '',
    yearMin: searchParams.get('yearMin') || '',
    yearMax: searchParams.get('yearMax') || '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    cityId: searchParams.get('cityId') || '',
    fuelType: searchParams.get('fuelType') || '',
    transmission: searchParams.get('transmission') || '',
    kilometersMin: searchParams.get('kilometersMin') || '',
    kilometersMax: searchParams.get('kilometersMax') || '',
    condition: searchParams.get('condition') || '',
    featured: searchParams.get('featured') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  const fetchCars = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    params.append('page', String(pagination.page));
    params.append('limit', '20');

    try {
      const res = await fetch(`/api/cars?${params}`);
      const data: PaginatedResponse<Car> = await res.json();
      setCars(data.data || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch {
      toast.error('حدث خطأ في تحميل السيارات');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page]);

  useEffect(() => { fetchCars(); }, [fetchCars]);
  useEffect(() => {
    fetch('/api/cars/cities').then(r => r.json()).then(d => setCities(d.data || [])).catch(() => {});
  }, []);

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      query: '', brandId: '', modelId: '', yearMin: '', yearMax: '',
      priceMin: '', priceMax: '', cityId: '', fuelType: '', transmission: '',
      kilometersMin: '', kilometersMax: '', condition: '', featured: '',
      sortBy: 'createdAt', sortOrder: 'desc',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const fuelTypes = ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUGIN_HYBRID'];
  const fuelLabels = ['بنزين', 'ديزل', 'هايبرد', 'كهرباء', 'هايبرد بلق إن'];
  const transmissions = ['MANUAL', 'AUTOMATIC', 'CVT', 'DCT', 'SEMI_AUTOMATIC'];
  const transLabels = ['يدوي', 'أوتوماتيك', 'CVT', 'DCT', 'نصف أتوماتيك'];
  const conditions = ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'NEEDS_MAINTENANCE', 'NEEDS_INSPECTION'];
  const condLabels = ['ممتازة', 'ممتازة جداً', 'جيدة جداً', 'جيدة', 'تحتاج صيانة', 'تحتاج فحص'];

  const FilterSelect = ({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-3 py-2.5 text-sm appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none">
        <option value="">الكل</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'createdAt' && v !== 'desc');

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">البحث عن سيارات</h1>
            <p className="text-gray-500 text-sm">{pagination.total} سيارة متاحة</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" icon={<ArrowUpDown className="w-4 h-4" />}
              onClick={() => updateFilter('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}>
              {filters.sortOrder === 'desc' ? 'الأحدث' : 'الأقدم'}
            </Button>
            <Button variant={showFilters ? 'primary' : 'secondary'}
              icon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setShowFilters(!showFilters)}>
              فلتر
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-4">
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">بحث متقدم</h3>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600">مسح الكل</button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">بحث</label>
                  <div className="relative">
                    <input value={filters.query} onChange={e => updateFilter('query', e.target.value)}
                      placeholder="ابحث..."
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  </div>
                </div>

                <FilterSelect label="الشركة" value={filters.brandId} onChange={v => updateFilter('brandId', v)} options={[]} />
                <FilterSelect label="الموديل" value={filters.modelId} onChange={v => updateFilter('modelId', v)} options={[]} />

                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="السنة من" value={filters.yearMin} onChange={e => updateFilter('yearMin', e.target.value)} />
                  <Input placeholder="السنة إلى" value={filters.yearMax} onChange={e => updateFilter('yearMax', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="السعر من" value={filters.priceMin} onChange={e => updateFilter('priceMin', e.target.value)} />
                  <Input placeholder="السعر إلى" value={filters.priceMax} onChange={e => updateFilter('priceMax', e.target.value)} />
                </div>

                <FilterSelect label="نوع الوقود" value={filters.fuelType} onChange={v => updateFilter('fuelType', v)}
                  options={fuelTypes.map((v, i) => ({ value: v, label: fuelLabels[i] }))} />
                <FilterSelect label="ناقل الحركة" value={filters.transmission} onChange={v => updateFilter('transmission', v)}
                  options={transmissions.map((v, i) => ({ value: v, label: transLabels[i] }))} />
                <FilterSelect label="الحالة" value={filters.condition} onChange={v => updateFilter('condition', v)}
                  options={conditions.map((v, i) => ({ value: v, label: condLabels[i] }))} />
                <FilterSelect label="المحافظة" value={filters.cityId} onChange={v => updateFilter('cityId', v)}
                  options={cities.map(c => ({ value: c.id, label: c.nameAr }))} />

                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="كم من" value={filters.kilometersMin} onChange={e => updateFilter('kilometersMin', e.target.value)} />
                  <Input placeholder="كم إلى" value={filters.kilometersMax} onChange={e => updateFilter('kilometersMax', e.target.value)} />
                </div>

                <Button onClick={fetchCars} className="w-full" icon={<Search className="w-4 h-4" />}>
                  بحث
                </Button>

                {hasActiveFilters && (
                  <a href="/price-alerts"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all text-sm mt-2"
                  >
                    <Bell className="w-4 h-4" />
                    أنشئ تنبيهاً لهذا البحث
                  </a>
                )}
              </div>
            </motion.div>
          )}

          {/* Results */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <CarGrid cars={cars} loading={loading} emptyMessage="لا توجد سيارات مطابقة للبحث" />

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button variant="ghost" disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>
                  السابق
                </Button>
                {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                        pagination.page === pageNum
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}>
                      {pageNum}
                    </button>
                  );
                })}
                <Button variant="ghost" disabled={!pagination.hasMore}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>
                  التالي
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
