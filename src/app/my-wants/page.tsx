'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, MessageCircle, Plus, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDate } from '@/lib/utils';
import type { WantedAd } from '@/types';
import toast from 'react-hot-toast';

export default function MyWantsPage() {
  const { user } = useAuth();
  const [ads, setAds] = useState<WantedAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/wanted?status=ALL&userId=${user.id}`).then(r => r.json()).then(d => {
      if (d.success) setAds(d.data.ads);
      setLoading(false);
    });
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('حذف الإعلان؟')) return;
    const res = await fetch(`/api/wanted/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { toast.success('تم الحذف'); setAds(p => p.filter(a => a.id !== id)); }
    else toast.error('فشل');
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">إعلاناتي المطلوبة</h1>
          <Link href="/wanted/add" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> إعلان جديد
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : ads.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">لا توجد إعلانات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map(ad => (
              <motion.div key={ad.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 flex items-center justify-between">
                <Link href={`/wanted/${ad.id}`} className="flex-1">
                  <h3 className="font-bold">{ad.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${ad.status === 'ACTIVE' ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 'text-gray-600 bg-gray-100 dark:bg-gray-800'}`}>
                      {ad.status === 'ACTIVE' ? 'نشط' : ad.status === 'FOUND' ? 'تم العثور' : 'مغلق'}
                    </span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{ad.views}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{ad._count?.offers || 0} عروض</span>
                    <span>{formatDate(ad.createdAt)}</span>
                  </div>
                </Link>
                <button onClick={() => handleDelete(ad.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
