'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Loader2, Trash2, Wrench, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils';
import type { MaintenanceService } from '@/types';
import toast from 'react-hot-toast';

const categoryLabels: Record<string, string> = {
  OIL_CHANGE: 'تغيير زيت', TIRES: 'بنشر وإطارات', BODYWORK: 'سمكرة ودهان',
  MECHANIC: 'ميكانيك', ELECTRICAL: 'كهرباء سيارات', AC: 'تكييف',
  DETAILING: 'تلميع وتنظيف', OTHER: 'أخرى',
};

export default function MyServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<MaintenanceService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch('/api/maintenance?status=ALL').then(r => r.json()).then(d => {
      if (d.success) setServices(d.data);
      setLoading(false);
    });
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('حذف الخدمة؟')) return;
    const res = await fetch(`/api/maintenance/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { toast.success('تم الحذف'); setServices(p => p.filter(s => s.id !== id)); }
    else toast.error('فشل');
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">خدماتي</h1>
          <Link href="/maintenance/add" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> إضافة خدمة
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : services.length === 0 ? (
          <div className="text-center py-20">
            <Wrench className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-gray-500">لا توجد خدمات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map(s => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold">{s.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600">{categoryLabels[s.category] || s.category}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.province?.nameAr}{s.city?.nameAr ? ` - ${s.city.nameAr}` : ''}</span>
                    {s.price && <span className="text-blue-600 font-medium">{formatPrice(s.price)}</span>}
                    <span className={`${s.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'}`}>{s.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
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
