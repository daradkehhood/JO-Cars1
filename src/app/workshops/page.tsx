'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  Search, SlidersHorizontal, X, MapPin, Star, Wrench, Store,
  Filter, Calendar, MessageCircle,
  ChevronLeft, ChevronRight, ShieldCheck, Clock, Plus,
} from 'lucide-react';

interface Workshop {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  workingHours: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  priceRange: string | null;
  recommendPercent: number;
  provinceId: string | null;
  cityId: string | null;
  services: { id: string; name: string; category: string | null }[];
  brands: { id: string; brand: string }[];
  user: { id: string; name: string; image: string | null };
}

const SORT_OPTIONS = [
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'reviews', label: 'الأكثر تقييمات' },
  { value: 'newest', label: 'الأحدث' },
];

const SERVICE_OPTIONS = [
  'ميكانيك', 'كهرباء', 'برمجة', 'تغيير زيت', 'ميزان',
  'فحص كمبيوتر', 'سمكرة', 'دهان', 'بطاريات', 'إطارات',
  'تكييف', 'هايبرد', 'سيارات كهربائية', 'خدمات متنقلة', 'سحب سيارات',
];

export default function WorkshopsPage() {
  const { isAuthenticated } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [sortBy, setSortBy] = useState('rating');
  const [filterService, setFilterService] = useState('');
  const [filterProvince, setFilterProvince] = useState('');

  const fetchWorkshops = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterService) params.append('service', filterService);
      if (filterProvince) params.append('province', filterProvince);
      params.append('sortBy', sortBy);
      params.append('page', page.toString());
      params.append('limit', '12');

      const res = await fetch(`/api/workshops?${params}`);
      const json = await res.json();
      if (json.success && json.data) {
        setWorkshops(json.data.workshops || []);
        setTotalPages(json.data.pagination?.totalPages || 1);
        setTotal(json.data.pagination?.total || 0);
      } else {
        setWorkshops([]);
      }
    } catch {
      setWorkshops([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterService, filterProvince, sortBy, page]);

  useEffect(() => { fetchWorkshops(); }, [fetchWorkshops]);

  const resetFilters = () => {
    setSearch('');
    setFilterService('');
    setFilterProvince('');
    setSortBy('rating');
    setPage(1);
  };

  const activeFilterCount = [filterService, filterProvince].filter(Boolean).length;

  return (
    <div className="min-h-screen">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-2">ورش السيارات</h1>
              <p className="text-surface-500 dark:text-surface-400 text-sm">ابحث عن أفضل ورش السيارات في الأردن</p>
            </div>
            {isAuthenticated && (
              <Link
                href="/workshops/create"
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                أضف ورشتك
              </Link>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchWorkshops(); } }}
                placeholder="ابحث عن ورشة..."
                className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-4 py-3 pr-11 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:border-primary-500 hover:text-primary-500 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm">فلاتر</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 text-sm outline-none focus:border-primary-500 appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={() => { setPage(1); fetchWorkshops(); }}
                className="px-5 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
              >
                بحث
              </button>
            </div>
          </div>

          {/* Mobile Filter Chips */}
          <div className="sm:hidden mt-3 flex flex-wrap gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-accent-600 bg-accent-50 dark:bg-accent-500/10 rounded-full"
              >
                <X className="w-3 h-3" />
                مسح الكل
              </button>
            )}
            {filterService && (
              <button
                onClick={() => { setFilterService(''); setPage(1); }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-500/10 rounded-full"
              >
                {filterService}
                <X className="w-3 h-3" />
              </button>
            )}
            {filterProvince && (
              <button
                onClick={() => { setFilterProvince(''); setPage(1); }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-500/10 rounded-full"
              >
                {filterProvince}
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Advanced Filters - Desktop */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden sm:block mt-4 p-5 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  فلاتر متقدمة
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    مسح الكل
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-1">نوع الخدمة</label>
                  <select
                    value={filterService}
                    onChange={(e) => { setFilterService(e.target.value); setPage(1); }}
                    className="w-full h-10 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm outline-none focus:border-primary-500"
                  >
                    <option value="">كل الخدمات</option>
                    {SERVICE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-1">المحافظة</label>
                  <select
                    value={filterProvince}
                    onChange={(e) => { setFilterProvince(e.target.value); setPage(1); }}
                    className="w-full h-10 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm outline-none focus:border-primary-500"
                  >
                    <option value="">كل المحافظات</option>
                    <option value="عمّان">عمّان</option>
                    <option value="إربد">إربد</option>
                    <option value="الزرقاء">الزرقاء</option>
                    <option value="العقبة">العقبة</option>
                    <option value="البلقاء">البلقاء</option>
                    <option value="الكرك">الكرك</option>
                    <option value="المفرق">المفرق</option>
                    <option value="معان">معان</option>
                    <option value="الطفيلة">الطفيلة</option>
                    <option value="عجلون">عجلون</option>
                    <option value="جرش">جرش</option>
                    <option value="مادبا">مادبا</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Advanced Filters - Mobile Bottom Sheet */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 sm:hidden"
              >
                <div className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 bg-white dark:bg-surface-900 rounded-t-3xl max-h-[80vh] overflow-y-auto"
                >
                  <div className="sticky top-0 bg-white dark:bg-surface-900 p-4 border-b border-surface-200 dark:border-surface-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-surface-900 dark:text-white">فلاتر متقدمة</h3>
                      <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl">
                        <X className="w-5 h-5 text-surface-500" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-surface-500 mb-1">نوع الخدمة</label>
                      <select
                        value={filterService}
                        onChange={(e) => { setFilterService(e.target.value); setPage(1); }}
                        className="w-full h-12 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm outline-none focus:border-primary-500"
                      >
                        <option value="">كل الخدمات</option>
                        {SERVICE_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-surface-500 mb-1">المحافظة</label>
                      <select
                        value={filterProvince}
                        onChange={(e) => { setFilterProvince(e.target.value); setPage(1); }}
                        className="w-full h-12 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm outline-none focus:border-primary-500"
                      >
                        <option value="">كل المحافظات</option>
                        <option value="عمّان">عمّان</option>
                        <option value="إربد">إربد</option>
                        <option value="الزرقاء">الزرقاء</option>
                        <option value="العقبة">العقبة</option>
                        <option value="البلقاء">البلقاء</option>
                        <option value="الكرك">الكرك</option>
                        <option value="المفرق">المفرق</option>
                        <option value="معان">معان</option>
                        <option value="الطفيلة">الطفيلة</option>
                        <option value="عجلون">عجلون</option>
                        <option value="جرش">جرش</option>
                        <option value="مادبا">مادبا</option>
                      </select>
                    </div>
                    <div className="sticky bottom-0 bg-white dark:bg-surface-900 pt-4 pb-2">
                      <button
                        onClick={() => { setPage(1); setShowFilters(false); }}
                        className="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
                      >
                        تطبيق الفلاتر
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-surface-500 dark:text-surface-400 text-sm">
            {loading ? 'جاري البحث...' : `${total} ورشة`}
          </p>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 animate-pulse">
                <div className="h-48 bg-surface-200 dark:bg-surface-700" />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-surface-200 dark:bg-surface-700" />
                    <div className="flex-1">
                      <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-full mb-2" />
                  <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-4/5 mb-4" />
                  <div className="flex gap-2">
                    <div className="h-9 bg-surface-200 dark:bg-surface-700 rounded-lg flex-1" />
                    <div className="h-9 bg-surface-200 dark:bg-surface-700 rounded-lg flex-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : workshops.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <Store className="w-16 h-16 mx-auto text-surface-300 dark:text-surface-600 mb-4" />
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">لا توجد ورش</h3>
            <p className="text-surface-500 dark:text-surface-400 text-sm mb-6">لم نتمكن من إيجاد ورش تطابق بحثك</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-xl text-sm font-medium hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
              >
                مسح الفلاتر
              </button>
              {isAuthenticated && (
                <Link
                  href="/workshops/create"
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  أضف ورشتك
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Workshop Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {workshops.map((workshop, index) => (
              <motion.div
                key={workshop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-soft-md transition-all group"
              >
                {/* Cover */}
                <div className="relative h-48 overflow-hidden">
                  {workshop.coverImage ? (
                    <Image
                      src={workshop.coverImage}
                      alt={workshop.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-50 to-surface-100 dark:from-surface-700 dark:to-surface-800 flex items-center justify-center">
                      <Wrench className="w-16 h-16 text-primary-300 dark:text-primary-700" />
                    </div>
                  )}
                  {workshop.isVerified && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-primary-600 text-white flex items-center gap-1 shadow-md">
                        <ShieldCheck className="w-3 h-3" />
                        موثّق
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full border-2 border-surface-200 dark:border-surface-700 overflow-hidden shrink-0 bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                      {workshop.logo ? (
                        <Image src={workshop.logo} alt={workshop.name} width={44} height={44} className="object-cover" />
                      ) : (
                        <Wrench className="w-4 h-4 text-primary-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-surface-900 dark:text-white truncate">{workshop.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{workshop.address || 'الأردن'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(workshop.rating)
                              ? 'text-warning-400 fill-warning-400'
                              : 'text-surface-300 dark:text-surface-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-surface-900 dark:text-white">{workshop.rating.toFixed(1)}</span>
                    <span className="text-xs text-surface-400">({workshop.reviewCount})</span>
                  </div>

                  {/* Services */}
                  {workshop.services && workshop.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {workshop.services.slice(0, 3).map((service) => (
                        <span key={service.id} className="px-2 py-0.5 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs rounded-lg font-medium">
                          {service.name}
                        </span>
                      ))}
                      {workshop.services.length > 3 && (
                        <span className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400 text-xs rounded-lg">
                          +{workshop.services.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Working Hours */}
                  <div className="flex items-center gap-1.5 text-xs text-surface-400 dark:text-surface-500 mb-4">
                    <Clock className="w-3 h-3" />
                    <span>{workshop.workingHours}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/workshops/${workshop.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
                    >
                      عرض التفاصيل
                    </Link>
                    <Link
                      href={`/workshops/${workshop.id}#book`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 rounded-xl text-sm hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/messages?workshop=${workshop.id}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 rounded-xl text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-500 hover:border-primary-500 hover:text-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 2 && pageNum <= page + 2)) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                      page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-500 hover:border-primary-500 hover:text-primary-500'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-500 hover:border-primary-500 hover:text-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
