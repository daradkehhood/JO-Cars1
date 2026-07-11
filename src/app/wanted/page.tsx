'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Plus, MapPin, Calendar, Tag, Eye, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDate } from '@/lib/utils';
import type { WantedAd } from '@/types';

export default function WantedPage() {
  const { user } = useAuth();
  const [ads, setAds] = useState<WantedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brandId, setBrandId] = useState('');
  const [brands, setBrands] = useState<{ id: string; nameAr: string }[]>([]);

  useEffect(() => {
    loadAds();
    fetch('/api/brands').then(r => r.json()).then(d => { if (d.success) setBrands(d.data); }).catch(() => {});
  }, [brandId]);

  const loadAds = async () => {
    const params = new URLSearchParams({ status: 'ACTIVE' });
    if (brandId) params.set('brandId', brandId);
    const res = await fetch(`/api/wanted?${params}`);
    const d = await res.json();
    if (d.success) setAds(d.data.ads);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAds();
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">إعلانات الطلب</h1>
          {user && (
            <Link href="/wanted/add" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> إعلان مطلوب
            </Link>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن مطلوب..." className="w-full h-11 pr-10 pl-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
          </div>
          <select value={brandId} onChange={e => setBrandId(e.target.value)} className="h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500">
            <option value="">كل الماركات</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
          </select>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">بحث</button>
        </form>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : ads.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-gray-500">لا توجد إعلانات طلب حالياً</p>
            {user && <Link href="/wanted/add" className="text-blue-500 hover:underline text-sm mt-2 inline-block">أضف إعلانك الأول</Link>}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map(ad => (
              <motion.div key={ad.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 hover:shadow-lg transition-all">
                <Link href={`/wanted/${ad.id}`} className="block">
                  <h3 className="font-bold text-lg mb-2">{ad.title}</h3>
                  {ad.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{ad.description}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {ad.brand && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{ad.brand.nameAr}</span>}
                    {ad.yearFrom && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{ad.yearFrom}{ad.yearTo ? ` - ${ad.yearTo}` : '+'}</span>}
                    {ad.maxPrice && <span className="flex items-center gap-1 font-medium text-blue-600">{formatPrice(ad.maxPrice)}</span>}
                    {ad.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ad.city.nameAr}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{ad.views}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{ad._count?.offers || 0}</span>
                    <span>{formatDate(ad.createdAt)}</span>
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
