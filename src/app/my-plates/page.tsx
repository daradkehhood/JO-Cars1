'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Plus, Loader2, Eye, BadgePercent, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Plate } from '@/types';
import toast from 'react-hot-toast';

const plateTypes: Record<string, string> = {
  STANDARD: 'عادي', THREE_DIGIT: '3 أرقام', FOUR_DIGIT: '4 أرقام',
  FIVE_DIGIT: '5 أرقام', SIX_DIGIT: '6 أرقام', CUSTOM: 'مميز',
};
const statusColors: Record<string, string> = {
  AVAILABLE: 'text-green-600 bg-green-50 dark:bg-green-500/10',
  PENDING: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',
  SOLD: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
};

export default function MyPlatesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [plates, setPlates] = useState<Plate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    fetch(`/api/plates?status=`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setPlates(data.data.filter((p: Plate) => p.sellerId === user?.id));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuthenticated, user]);

  const handleDelete = async (id: string) => {
    if (!confirm('حذف اللوحة؟')) return;
    try {
      const res = await fetch(`/api/plates/${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) { toast.success('تم الحذف'); setPlates(prev => prev.filter(p => p.id !== id)); }
      else toast.error(d.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
  };

  const handleSold = async (id: string) => {
    try {
      const res = await fetch(`/api/plates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SOLD' }),
      });
      const d = await res.json();
      if (d.success) { toast.success('تم'); setPlates(prev => prev.map(p => p.id === id ? { ...p, status: 'SOLD' } : p)); }
      else toast.error(d.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen pb-16">
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <BadgePercent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحاتي</h1>
              <p className="text-sm text-gray-500">{plates.length} لوحة</p>
            </div>
          </div>
          <Link href="/plates/add"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
        ) : plates.length === 0 ? (
          <div className="text-center py-20">
            <BadgePercent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">لا توجد لوحات لديك</p>
            <Link href="/plates/add" className="text-amber-500 hover:text-amber-600 font-medium">أضف لوحة جديدة</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plates.map(plate => (
              <motion.div key={plate.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[plate.status] || ''}`}>
                    {plate.status === 'AVAILABLE' ? 'متاحة' : plate.status === 'PENDING' ? 'قيد المراجعة' : 'مباعة'}
                  </span>
                  <span className="text-xs text-gray-400"><Eye className="w-3 h-3 inline" /> {plate.views}</span>
                </div>
                <Link href={`/plates/${plate.id}`}>
                  <div className="text-center py-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-100 dark:border-amber-500/10 mb-3">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-widest font-mono">{plate.plateNumber}</p>
                  </div>
                </Link>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-900 dark:text-white">{formatPrice(plate.price)}</span>
                  <span className="text-xs text-gray-400">{plateTypes[plate.type] || plate.type}</span>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  {plate.status !== 'SOLD' && (
                    <button onClick={() => handleSold(plate.id)}
                      className="flex-1 py-1.5 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-500/20 transition-all">
                      تم البيع
                    </button>
                  )}
                  <button onClick={() => handleDelete(plate.id)}
                    className="flex-1 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center gap-1">
                    <Trash2 className="w-3 h-3" /> حذف
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
