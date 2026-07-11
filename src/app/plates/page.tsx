'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search, Filter, Plus, Phone, MessageCircle, Eye,
  Loader2, SlidersHorizontal, Grid3X3, List, ChevronLeft, Timer, BadgePercent
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Plate } from '@/types';

const plateTypes: Record<string, string> = {
  STANDARD: 'عادي', THREE_DIGIT: '3 أرقام', FOUR_DIGIT: '4 أرقام',
  FIVE_DIGIT: '5 أرقام', SIX_DIGIT: '6 أرقام', CUSTOM: 'مميز',
};
const plateColors: Record<string, string> = {
  STANDARD: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  THREE_DIGIT: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  FOUR_DIGIT: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  FIVE_DIGIT: 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  SIX_DIGIT: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  CUSTOM: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-600 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-400',
};

export default function PlatesPage() {
  const [plates, setPlates] = useState<Plate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (search) params.set('search', search);
    params.set('sort', sort);
    fetch(`/api/plates?${params}`)
      .then(r => r.json())
      .then(data => { if (data.success) setPlates(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [typeFilter, sort, search]);

  return (
    <div className="min-h-screen pb-16">
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">لوحات الأرقام المميزة</h1>
            <p className="text-gray-500 mt-1">سوق لبيع وشراء الأرقام المميزة</p>
          </div>
          <Link href="/plates/add"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20">
            <Plus className="w-4 h-4" /> إضافة لوحة
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث برقم اللوحة..." maxLength={10}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pr-10 pl-4 py-2.5 text-sm outline-none focus:border-amber-500" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm outline-none focus:border-amber-500">
            <option value="">جميع الأنواع</option>
            {Object.entries(plateTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm outline-none focus:border-amber-500">
            <option value="newest">الأحدث أولاً</option>
            <option value="price_asc">السعر: الأقل أولاً</option>
            <option value="price_desc">السعر: الأعلى أولاً</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
        ) : plates.length === 0 ? (
          <div className="text-center py-20">
            <BadgePercent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">لا توجد لوحات متاحة حالياً</p>
            <Link href="/plates/add" className="text-amber-500 hover:text-amber-600 font-medium">أضف لوحتك الآن</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plates.map((plate, i) => (
              <motion.div key={plate.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link href={`/plates/${plate.id}`} className="block card p-5 hover:border-amber-200 dark:hover:border-amber-500/20 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${plateColors[plate.type] || plateColors.STANDARD}`}>
                      {plateTypes[plate.type] || plate.type}
                    </span>
                    {plate.isNegotiable && <span className="text-xs text-amber-500">قابل للتفاوض</span>}
                  </div>
                  <div className="text-center py-4 mb-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-100 dark:border-amber-500/10">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-widest font-mono">{plate.plateNumber}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(plate.price)}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Eye className="w-3 h-3" /> {plate.views}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
                    <span>{plate.seller?.dealerName || plate.seller?.name}</span>
                    <span className="text-gray-300">·</span>
                    <span>{new Date(plate.createdAt).toLocaleDateString('ar-JO')}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
