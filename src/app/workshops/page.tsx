'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, MapPin, Star, Wrench, Store,
  Filter, DollarSign, Calendar, MessageCircle, ChevronDown,
  ChevronLeft, ChevronRight, Phone, ShieldCheck, Clock,
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
    <div className="min-h-screen" style={{ background: '#1a1a2e' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">ورش السيارات</h1>
          <p className="text-gray-400">ابحث عن أفضل ورش السيارات في الأردن</p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchWorkshops(); } }}
                placeholder="ابحث عن ورشة..."
                className="w-full rounded-xl border border-gray-700 bg-[#16213e] text-white px-4 py-3 pr-12 text-sm outline-none focus:border-[#0084ff] transition-colors"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-700 bg-[#16213e] text-gray-300 hover:border-[#0084ff] hover:text-[#0084ff] transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm">فلاتر</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-[#0084ff] text-white text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="px-4 py-3 rounded-xl border border-gray-700 bg-[#16213e] text-gray-300 text-sm outline-none focus:border-[#0084ff] appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={() => { setPage(1); fetchWorkshops(); }}
                className="px-6 py-3 bg-[#0084ff] text-white rounded-xl text-sm font-medium hover:bg-[#006cd9] transition-colors"
              >
                بحث
              </button>
            </div>
          </div>

          {/* Mobile Filter Chips */}
          <div className="md:hidden mt-3 flex flex-wrap gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-900/20 rounded-full"
              >
                <X className="w-3 h-3" />
                مسح الكل
              </button>
            )}
            {filterService && (
              <button
                onClick={() => { setFilterService(''); setPage(1); }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0084ff] bg-[#0084ff]/10 rounded-full"
              >
                {filterService}
                <X className="w-3 h-3" />
              </button>
            )}
            {filterProvince && (
              <button
                onClick={() => { setFilterProvince(''); setPage(1); }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0084ff] bg-[#0084ff]/10 rounded-full"
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
              className="hidden md:block mt-4 p-5 rounded-xl border border-gray-700 bg-[#16213e]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  فلاتر متقدمة
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-sm text-[#0084ff] hover:underline">
                    مسح الكل
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">نوع الخدمة</label>
                  <select
                    value={filterService}
                    onChange={(e) => { setFilterService(e.target.value); setPage(1); }}
                    className="w-full h-10 px-3 rounded-lg border border-gray-700 bg-[#0f3460] text-white text-sm outline-none focus:border-[#0084ff]"
                  >
                    <option value="">كل الخدمات</option>
                    {SERVICE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">المحافظة</label>
                  <select
                    value={filterProvince}
                    onChange={(e) => { setFilterProvince(e.target.value); setPage(1); }}
                    className="w-full h-10 px-3 rounded-lg border border-gray-700 bg-[#0f3460] text-white text-sm outline-none focus:border-[#0084ff]"
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
                    <option value="الجبلة">الجبلة</option>
                    <option value="عجلون">عجلون</option>
                    <option value="جرش">جرش</option>
                    <option value="المADABA">مادبا</option>
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
                className="fixed inset-0 z-50 md:hidden"
              >
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl max-h-[80vh] overflow-y-auto"
                >
                  <div className="sticky top-0 bg-[#1a1a2e] p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">فلاتر متقدمة</h3>
                      <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-800 rounded-full">
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">نوع الخدمة</label>
                      <select
                        value={filterService}
                        onChange={(e) => { setFilterService(e.target.value); setPage(1); }}
                        className="w-full h-12 px-3 rounded-lg border border-gray-700 bg-[#0f3460] text-white text-sm outline-none focus:border-[#0084ff]"
                      >
                        <option value="">كل الخدمات</option>
                        {SERVICE_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">المحافظة</label>
                      <select
                        value={filterProvince}
                        onChange={(e) => { setFilterProvince(e.target.value); setPage(1); }}
                        className="w-full h-12 px-3 rounded-lg border border-gray-700 bg-[#0f3460] text-white text-sm outline-none focus:border-[#0084ff]"
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
                        <option value="الجبلة">الجبلة</option>
                        <option value="عجلون">عجلون</option>
                        <option value="جرش">جرش</option>
                        <option value="المADABA">مادبا</option>
                      </select>
                    </div>
                    <div className="sticky bottom-0 bg-[#1a1a2e] pt-4 pb-2">
                      <button
                        onClick={() => { setPage(1); setShowFilters(false); }}
                        className="w-full py-3 bg-[#0084ff] text-white rounded-xl text-sm font-medium hover:bg-[#006cd9] transition-colors"
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
          <p className="text-gray-400 text-sm">
            {loading ? 'جاري البحث...' : `${total} ورشة`}
          </p>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-700 bg-[#16213e] animate-pulse">
                <div className="h-48 bg-gray-700/50" />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gray-700/50" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700/50 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-gray-700/50 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-700/50 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-700/50 rounded w-4/5 mb-4" />
                  <div className="flex gap-2">
                    <div className="h-9 bg-gray-700/50 rounded-lg flex-1" />
                    <div className="h-9 bg-gray-700/50 rounded-lg flex-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : workshops.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <Store className="w-20 h-20 mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl text-white font-semibold mb-2">لا توجد ورش</h3>
            <p className="text-gray-400 mb-6">لم نتمكن من إيجاد ورش تطابق بحثك</p>
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-[#0084ff] text-white rounded-xl hover:bg-[#006cd9] transition-colors"
            >
              مسح الفلاتر
            </button>
          </div>
        ) : (
          /* Workshop Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workshops.map((workshop, index) => (
              <motion.div
                key={workshop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl overflow-hidden border border-gray-700 bg-[#16213e] hover:border-[#0084ff]/50 transition-all group"
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
                    <div className="w-full h-full bg-gradient-to-br from-[#0f3460] to-[#1a1a2e] flex items-center justify-center">
                      <Wrench className="w-16 h-16 text-[#0084ff]/30" />
                    </div>
                  )}
                  {workshop.isVerified && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#0084ff]/90 text-white flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        موثّق
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full border-2 border-gray-700 overflow-hidden shrink-0 bg-[#0f3460] flex items-center justify-center">
                      {workshop.logo ? (
                        <Image src={workshop.logo} alt={workshop.name} width={48} height={48} className="object-cover" />
                      ) : (
                        <Wrench className="w-5 h-5 text-[#0084ff]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">{workshop.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
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
                          className={`w-4 h-4 ${
                            i < Math.round(workshop.rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-white text-sm font-medium">{workshop.rating.toFixed(1)}</span>
                    <span className="text-gray-500 text-xs">({workshop.reviewCount} تقييم)</span>
                  </div>

                  {/* Services */}
                  {workshop.services && workshop.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {workshop.services.slice(0, 3).map((service) => (
                        <span key={service.id} className="px-2 py-0.5 bg-[#0084ff]/10 text-[#0084ff] text-xs rounded-full">
                          {service.name}
                        </span>
                      ))}
                      {workshop.services.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">
                          +{workshop.services.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Working Hours */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                    <Clock className="w-3 h-3" />
                    <span>{workshop.workingHours}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/workshops/${workshop.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#0084ff] text-white rounded-lg text-sm font-medium hover:bg-[#006cd9] transition-colors"
                    >
                      عرض التفاصيل
                    </Link>
                    <Link
                      href={`/workshops/${workshop.id}#book`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-[#0084ff] text-[#0084ff] rounded-lg text-sm hover:bg-[#0084ff]/10 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/messages?workshop=${workshop.id}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-600 text-gray-300 rounded-lg text-sm hover:bg-gray-700/50 transition-colors"
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
              className="p-2 rounded-lg border border-gray-700 bg-[#16213e] text-gray-400 hover:border-[#0084ff] hover:text-[#0084ff] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      page === pageNum
                        ? 'bg-[#0084ff] text-white'
                        : 'border border-gray-700 bg-[#16213e] text-gray-400 hover:border-[#0084ff] hover:text-[#0084ff]'
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
              className="p-2 rounded-lg border border-gray-700 bg-[#16213e] text-gray-400 hover:border-[#0084ff] hover:text-[#0084ff] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
