'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Plus, SlidersHorizontal, X, MapPin, Loader2, Settings, Gauge, Cpu } from 'lucide-react';
import type { UsedPart } from '@/types';
import { formatPrice } from '@/lib/utils';

const PART_TYPES = [
  { value: 'engine', label: 'محرك' },
  { value: 'transmission', label: 'جير' },
  { value: 'body', label: 'هيكل' },
  { value: 'electrical', label: 'كهرباء' },
  { value: 'suspension', label: 'تعليق' },
  { value: 'brake', label: 'فرامل' },
  { value: 'cooling', label: 'تبريد' },
  { value: 'exhaust', label: 'عادم' },
  { value: 'interior', label: 'داخلي' },
  { value: 'wheel', label: 'جنط' },
  { value: 'turbo', label: 'توربو' },
  { value: 'ac', label: 'مكيف' },
  { value: 'other', label: 'أخرى' },
];

const CONDITIONS = [
  { value: 'NEW', label: 'جديد' },
  { value: 'USED', label: 'مستعمل' },
  { value: 'REFURBISHED', label: 'مُجدد' },
];

export default function PartsPage() {
  const [parts, setParts] = useState<UsedPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [partType, setPartType] = useState('');
  const [condition, setCondition] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState<{ id: string; nameAr: string }[]>([]);
  const [cityId, setCityId] = useState('');
  const [brands, setBrands] = useState<{ id: string; nameAr: string }[]>([]);
  const [brandId, setBrandId] = useState('');

  useEffect(() => {
    fetchParts();
    fetch('/api/cars/cities').then(r => r.json()).then(d => setCities(d.data || [])).catch(() => {});
    fetch('/api/cars/brands').then(r => r.json()).then(d => setBrands(d.data || [])).catch(() => {});
  }, []);

  const fetchParts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (partType) params.append('partType', partType);
    if (condition) params.append('condition', condition);
    if (cityId) params.append('cityId', cityId);
    if (brandId) params.append('brandId', brandId);
    try {
      const res = await fetch(`/api/parts?${params}`);
      const data = await res.json();
      setParts(data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const getImages = (part: UsedPart): string[] => {
    try { return JSON.parse(part.images || '[]'); } catch { return []; }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">قطع غيار</h1>
            <p className="text-gray-500 text-sm">قطع غيار سيارات مستعملة وجديدة</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <Link href="/parts/add"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:opacity-90 transition-all">
              <Plus className="w-4 h-4" /> إضافة قطعة
            </Link>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-[250px]">
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchParts()}
              placeholder="ابحث عن قطعة..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-500" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <select value={partType} onChange={e => { setPartType(e.target.value); setTimeout(fetchParts, 0); }}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm">
            <option value="">كل الأنواع</option>
            {PART_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button onClick={fetchParts}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-all">
            بحث
          </button>
        </div>

        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="card p-5 mb-8 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">الحالة</label>
              <select value={condition} onChange={e => setCondition(e.target.value)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm">
                <option value="">الكل</option>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">العلامة التجارية</label>
              <select value={brandId} onChange={e => setBrandId(e.target.value)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm">
                <option value="">الكل</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">المدينة</label>
              <select value={cityId} onChange={e => setCityId(e.target.value)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm">
                <option value="">الكل</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={fetchParts}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm">تطبيق</button>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : parts.length === 0 ? (
          <div className="text-center py-20">
            <Cpu className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 text-lg">لا توجد قطع متاحة</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {parts.map((part, i) => {
              const images = getImages(part);
              return (
                <motion.div key={part.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Link href={`/parts/${part.slug}`} className="block card p-0 overflow-hidden hover:shadow-xl transition-all group">
                    <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                      {images[0] ? (
                        <img src={images[0]} alt={part.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Cpu className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300">
                          {PART_TYPES.find(t => t.value === part.partType)?.label || part.partType}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{part.title}</h3>
                      <p className="text-lg font-bold text-blue-500 mt-1">{formatPrice(part.price)}</p>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500">
                        <span>{part.user?.dealerName || part.user?.name}</span>
                        {part.city && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{part.city.nameAr}</span>}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
