'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Star,
  Clock,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Wrench,
  Store,
  Filter,
  ArrowUpDown,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface Workshop {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  priceRange: string | null;
  distance: number | null;
  province: { id: string; nameAr: string } | null;
  city: { id: string; nameAr: string } | null;
  services: { id: string; nameAr: string }[];
  brands: { id: string; nameAr: string }[];
  isVerified: boolean;
  createdAt: string;
}

interface Province {
  id: string;
  nameAr: string;
}

interface CityOption {
  id: string;
  nameAr: string;
  provinceId: string;
}

interface ServiceType {
  id: string;
  nameAr: string;
}

interface Brand {
  id: string;
  nameAr: string;
}

const SORT_OPTIONS = [
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'distance', label: 'الأقرب' },
  { value: 'reviews', label: 'الأكثر تقييمات' },
  { value: 'newest', label: 'الأحدث' },
];

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [filteredCities, setFilteredCities] = useState<CityOption[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [provinceId, setProvinceId] = useState('');
  const [cityId, setCityId] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [brandId, setBrandId] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    fetch('/api/cars/provinces')
      .then((r) => r.json())
      .then((d) => setProvinces(d.data || []))
      .catch(() => {});
    fetch('/api/cars/cities')
      .then((r) => r.json())
      .then((d) => setCities(d.data || []))
      .catch(() => {});
    fetch('/api/workshops/service-types')
      .then((r) => r.json())
      .then((d) => setServiceTypes(d.data || []))
      .catch(() => {});
    fetch('/api/cars/brands')
      .then((r) => r.json())
      .then((d) => setBrands(d.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (provinceId) {
      setFilteredCities(cities.filter((c) => c.provinceId === provinceId));
      setCityId('');
    } else {
      setFilteredCities(cities);
    }
  }, [provinceId, cities]);

  const fetchWorkshops = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (provinceId) params.append('provinceId', provinceId);
    if (cityId) params.append('cityId', cityId);
    if (serviceType) params.append('serviceType', serviceType);
    if (brandId) params.append('brandId', brandId);
    params.append('sortBy', sortBy);
    params.append('page', page.toString());
    params.append('limit', '12');
    try {
      const res = await fetch(`/api/workshops?${params}`);
      const data = await res.json();
      setWorkshops(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setWorkshops([]);
    } finally {
      setLoading(false);
    }
  }, [search, provinceId, cityId, serviceType, brandId, sortBy, page]);

  useEffect(() => {
    fetchWorkshops();
  }, [fetchWorkshops]);

  const resetFilters = () => {
    setSearch('');
    setProvinceId('');
    setCityId('');
    setServiceType('');
    setBrandId('');
    setSortBy('rating');
    setPage(1);
  };

  const activeFilterCount = [provinceId, cityId, serviceType, brandId].filter(Boolean).length;

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
                onKeyDown={(e) => e.key === 'Enter' && fetchWorkshops()}
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
                onClick={fetchWorkshops}
                className="px-6 py-3 bg-[#0084ff] text-white rounded-xl text-sm font-medium hover:bg-[#006cd9] transition-colors"
              >
                بحث
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-5 rounded-xl border border-gray-700 bg-[#16213e]"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">المحافظة</label>
                  <select
                    value={provinceId}
                    onChange={(e) => { setProvinceId(e.target.value); setPage(1); }}
                    className="w-full h-10 px-3 rounded-lg border border-gray-700 bg-[#0f3460] text-white text-sm outline-none focus:border-[#0084ff]"
                  >
                    <option value="">كل المحافظات</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>{p.nameAr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">المدينة</label>
                  <select
                    value={cityId}
                    onChange={(e) => { setCityId(e.target.value); setPage(1); }}
                    className="w-full h-10 px-3 rounded-lg border border-gray-700 bg-[#0f3460] text-white text-sm outline-none focus:border-[#0084ff]"
                  >
                    <option value="">كل المدن</option>
                    {filteredCities.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameAr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">نوع الخدمة</label>
                  <select
                    value={serviceType}
                    onChange={(e) => { setServiceType(e.target.value); setPage(1); }}
                    className="w-full h-10 px-3 rounded-lg border border-gray-700 bg-[#0f3460] text-white text-sm outline-none focus:border-[#0084ff]"
                  >
                    <option value="">كل الخدمات</option>
                    {serviceTypes.map((s) => (
                      <option key={s.id} value={s.id}>{s.nameAr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">ماركة السيارة</label>
                  <select
                    value={brandId}
                    onChange={(e) => { setBrandId(e.target.value); setPage(1); }}
                    className="w-full h-10 px-3 rounded-lg border border-gray-700 bg-[#0f3460] text-white text-sm outline-none focus:border-[#0084ff]"
                  >
                    <option value="">كل الماركات</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.nameAr}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results Header */}
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
          /* Workshop Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workshops.map((workshop, index) => (
              <motion.div
                key={workshop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl overflow-hidden border border-gray-700 bg-[#16213e] hover:border-[#0084ff]/50 transition-all group"
              >
                {/* Cover Image */}
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
                  {/* Open/Closed Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        workshop.isOpen
                          ? 'bg-green-500/90 text-white'
                          : 'bg-red-500/90 text-white'
                      }`}
                    >
                      {workshop.isOpen ? 'مفتوح' : 'مغلق'}
                    </span>
                  </div>
                  {/* Verified Badge */}
                  {workshop.isVerified && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#0084ff]/90 text-white flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        موثّق
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {/* Logo */}
                    <div className="w-12 h-12 rounded-full border-2 border-gray-700 overflow-hidden shrink-0 bg-[#0f3460] flex items-center justify-center">
                      {workshop.logo ? (
                        <Image
                          src={workshop.logo}
                          alt={workshop.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <Wrench className="w-5 h-5 text-[#0084ff]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">{workshop.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {workshop.city?.nameAr || ''}{workshop.city && workshop.province ? '، ' : ''}{workshop.province?.nameAr || ''}
                        </span>
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
                        <span
                          key={service.id}
                          className="px-2 py-0.5 bg-[#0084ff]/10 text-[#0084ff] text-xs rounded-full"
                        >
                          {service.nameAr}
                        </span>
                      ))}
                      {workshop.services.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">
                          +{workshop.services.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price & Distance */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    {workshop.priceRange && (
                      <span className="flex items-center gap-1 text-green-400">
                        <DollarSign className="w-3.5 h-3.5" />
                        {workshop.priceRange}
                      </span>
                    )}
                    {workshop.distance != null && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <MapPin className="w-3.5 h-3.5" />
                        {workshop.distance.toFixed(1)} كم
                      </span>
                    )}
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
              if (pageNum === page - 3 || pageNum === page + 3) {
                return <span key={pageNum} className="text-gray-600">...</span>;
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
