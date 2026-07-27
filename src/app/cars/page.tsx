'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, SlidersHorizontal, X, ChevronDown, LayoutGrid, List,
  ArrowUpDown, MapPin, Fuel, Settings, Gauge, Heart, Loader2, Bell,
  RotateCcw, Calendar, ChevronLeft, ChevronRight, Car
} from 'lucide-react';
import type { Car as CarType, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';
import { formatPrice, formatDistance } from '@/lib/utils';

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
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [cities, setCities] = useState<{ id: string; nameAr: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; nameAr: string; nameEn: string }[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, hasMore: false });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  const bodyTypeFilters = [
    { id: 'all', label: 'الكل', icon: LayoutGrid },
    { id: 'SEDAN', label: 'سيارات', icon: Car },
    { id: 'SUV', label: 'SUV', icon: Car },
    { id: 'COUPE', label: ' كوبيه', icon: Car },
    { id: 'HATCHBACK', label: 'هاتشباك', icon: Car },
  ];

  const fetchCars = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    params.append('page', String(pagination.page));
    params.append('limit', '12');

    try {
      const res = await fetch(`/api/cars?${params}`);
      const data: PaginatedResponse<CarType> = await res.json();
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
    fetch('/api/cars/brands').then(r => r.json()).then(d => setBrands(d.data || [])).catch(() => {});
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

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'createdAt' && v !== 'desc');

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container-custom py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-500 transition-colors">الرئيسية</Link>
          <ChevronLeft className="w-3 h-3" />
          <span className="text-gray-900 dark:text-white font-medium">السيارات</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">جميع السيارات</h1>
            <p className="text-gray-500 text-sm mt-1">اكتشف مجموعة متنوعة وواسعة من السيارات المتاحة للبيع</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:inline">عرض {Math.min((pagination.page - 1) * 12 + 1, pagination.total)}-{Math.min(pagination.page * 12, pagination.total)} من {pagination.total} سيارة</span>
            <div className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
              <button
                onClick={() => updateFilter('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                الترتيب: الأحدث
              </button>
            </div>
            <div className="flex items-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters - Always visible on desktop */}
          <div className="hidden lg:block space-y-5">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">تصفية البحث</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" />
                    إعادة تعيين
                  </button>
                )}
              </div>

              {/* Keywords search */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-2 text-right">الكلمات المفتاحية</label>
                <div className="relative">
                  <input
                    value={filters.query}
                    onChange={e => updateFilter('query', e.target.value)}
                    placeholder="ابحث عن ماركة أو كلمة مشابهة."
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Body type */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-2 text-right">الفئة</label>
                <div className="flex flex-wrap gap-2">
                  {bodyTypeFilters.map(type => {
                    const Icon = type.icon;
                    const active = (type.id === 'all' && !filters.fuelType) || filters.fuelType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => updateFilter('fuelType', type.id === 'all' ? '' : type.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                          active
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-2 text-right">الماركة</label>
                <div className="relative">
                  <select
                    value={filters.brandId}
                    onChange={e => updateFilter('brandId', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  >
                    <option value="">اختر الماركة</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.nameAr}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Price range slider */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-2 text-right">السعر</label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="1000"
                    value={filters.priceMax || 200000}
                    onChange={e => updateFilter('priceMax', e.target.value === '200000' ? '' : e.target.value)}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{filters.priceMin ? `${Number(filters.priceMin).toLocaleString()} دينار` : '1,000 دينار'}</span>
                    <span>{filters.priceMax ? `${Number(filters.priceMax).toLocaleString()}+ دينار` : '200,000+ دينار'}</span>
                  </div>
                </div>
              </div>

              {/* Year */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-2 text-right">سنة الصنع</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <select
                      value={filters.yearMin}
                      onChange={e => updateFilter('yearMin', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm appearance-none focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">إلى</option>
                      {Array.from({ length: 30 }, (_, i) => 2026 - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={filters.yearMax}
                      onChange={e => updateFilter('yearMax', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm appearance-none focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">من</option>
                      {Array.from({ length: 30 }, (_, i) => 2026 - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Model (optional) */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 text-right">الموديل</label>
                <div className="relative">
                  <select
                    value={filters.modelId}
                    onChange={e => updateFilter('modelId', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm appearance-none focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">اختر الموديل</option>
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile filter button */}
          <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30"
            >
              <SlidersHorizontal className="w-4 h-4" />
              تصفية البحث
              {hasActiveFilters && (
                <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">
                  {Object.values(filters).filter(v => v && v !== 'createdAt' && v !== 'desc').length}
                </span>
              )}
            </button>
          </div>

          {/* Mobile filter bottom sheet */}
          <AnimatePresence>
            {showMobileFilters && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl max-h-[85vh] overflow-y-auto"
                >
                  <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-100 dark:border-gray-800 z-10">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 dark:text-white">تصفية البحث</h3>
                      <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-5">
                    {/* Mobile body type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 text-right">الفئة</label>
                      <div className="flex flex-wrap gap-2">
                        {bodyTypeFilters.map(type => {
                          const Icon = type.icon;
                          const active = (type.id === 'all' && !filters.fuelType) || filters.fuelType === type.id;
                          return (
                            <button
                              key={type.id}
                              onClick={() => updateFilter('fuelType', type.id === 'all' ? '' : type.id)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                                active
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {type.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 text-right">الماركة</label>
                      <div className="relative">
                        <select value={filters.brandId} onChange={e => updateFilter('brandId', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm appearance-none focus:border-blue-500 outline-none">
                          <option value="">اختر الماركة</option>
                          {brands.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
                        </select>
                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 text-right">السعر</label>
                      <input type="range" min="0" max="200000" step="1000"
                        value={filters.priceMax || 200000}
                        onChange={e => updateFilter('priceMax', e.target.value === '200000' ? '' : e.target.value)}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1,000 دينار</span>
                        <span>{filters.priceMax ? `${Number(filters.priceMax).toLocaleString()}+` : '200,000+'} دينار</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2 text-right">سنة الصنع من</label>
                        <div className="relative">
                          <select value={filters.yearMin} onChange={e => updateFilter('yearMin', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm appearance-none focus:border-blue-500 outline-none">
                            <option value="">من</option>
                            {Array.from({ length: 30 }, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2 text-right">إلى</label>
                        <div className="relative">
                          <select value={filters.yearMax} onChange={e => updateFilter('yearMax', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm appearance-none focus:border-blue-500 outline-none">
                            <option value="">إلى</option>
                            {Array.from({ length: 30 }, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 pb-2 space-y-2 border-t border-gray-100 dark:border-gray-800">
                      <button onClick={() => { fetchCars(); setShowMobileFilters(false); }}
                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm">
                        تطبيق الفلاتر
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : cars.length === 0 ? (
              <div className="text-center py-20">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد سيارات</h3>
                <p className="text-gray-500 text-sm">جرب تغيير معايير البحث</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="mt-4 text-blue-500 text-sm font-medium hover:text-blue-600">
                    مسح الفلاتر
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {cars.map(car => (
                    <Link key={car.id} href={`/cars/${car.slug || car.id}`}
                      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        {car.coverImage || car.images?.[0]?.url ? (
                          <Image
                            src={car.coverImage || car.images?.[0]?.url || ''}
                            alt={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-500 transition-colors">
                          {car.brand?.nameEn || ''} {car.model?.nameEn || ''} {car.year}
                        </h3>
                        <p className="text-blue-600 font-bold text-lg mt-1">
                          {formatPrice(car.price)}
                        </p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Gauge className="w-3.5 h-3.5" />
                            {formatDistance(car.kilometers)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Settings className="w-3.5 h-3.5" />
                            {car.transmission === 'AUTOMATIC' ? 'أوتوماتيك' : 'يدوي'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Fuel className="w-3.5 h-3.5" />
                            {car.fuelType === 'PETROL' ? 'بنزين' : car.fuelType === 'DIESEL' ? 'ديزل' : car.fuelType}
                          </span>
                        </div>
                        {car.city && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />
                            {car.city.nameAr}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      className="w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors disabled:opacity-30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
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
                    {pagination.totalPages > 5 && (
                      <span className="text-gray-400 px-1">...</span>
                    )}
                    <button
                      disabled={!pagination.hasMore}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      className="w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
