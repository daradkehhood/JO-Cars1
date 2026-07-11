'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Car, TrendingUp, Eye, MessageCircle, Clock, BarChart3, Trash2, RotateCcw, CheckCircle, Timer, Loader2, X, Plus, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Car as CarType } from '@/types';

export default function MyCarsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [cars, setCars] = useState<(CarType & { _count: { favorites: number; messages: number; carViews: number } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'sold' | 'deleted'>('active');

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadCars();
  }, [isAuthenticated, router, activeTab]);

  const loadCars = () => {
    setLoading(true);
    const params = activeTab === 'sold' ? '?status=SOLD' : activeTab === 'deleted' ? '?status=DELETED' : '';
    fetch(`/api/cars/my${params}`)
      .then(r => r.json())
      .then(data => {
        const list = (data.data || []).filter((c: any) => {
          if (activeTab === 'deleted') return c.deletedAt;
          if (activeTab === 'sold') return c.status === 'SOLD';
          return !c.deletedAt && c.status !== 'SOLD';
        });
        setCars(list); setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const markSold = async (carId: string) => {
    if (!confirm('تأكيد بيع السيارة؟ يمكنك إعادة تفعيلها لاحقاً.')) return;
    const res = await fetch(`/api/cars/${carId}/sold`, { method: 'POST' });
    const d = await res.json();
    if (d.success) { toast.success('تم تحديد السيارة كمباعة'); loadCars(); }
    else toast.error(d.error || 'فشل');
  };

  const reactivate = async (carId: string) => {
    const res = await fetch(`/api/cars/${carId}/reactivate`, { method: 'POST' });
    const d = await res.json();
    if (d.success) { toast.success('تم إعادة تفعيل الإعلان'); loadCars(); }
    else toast.error(d.error || 'فشل');
  };

  const deleteCar = async (carId: string) => {
    if (!confirm('هل أنت متأكد من حذف الإعلان؟ يمكن استعادته من قبل الإدارة.')) return;
    const res = await fetch(`/api/cars/${carId}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { toast.success('تم حذف الإعلان'); loadCars(); }
    else toast.error(d.error || 'فشل');
  };

  const stats = {
    active: cars.filter(c => !c.deletedAt && c.status !== 'SOLD').length,
    sold: cars.filter(c => c.status === 'SOLD').length,
    views: cars.reduce((a, c) => a + (c.views || 0), 0),
    messages: cars.reduce((a, c) => a + ((c as any)._count?.messages || 0), 0),
    avgDays: (() => {
      const sold = cars.filter(c => c.soldAt && c.status === 'SOLD');
      if (sold.length === 0) return 0;
      const total = sold.reduce((a, c) => a + (new Date(c.soldAt!).getTime() - new Date(c.createdAt).getTime()), 0);
      return Math.round(total / sold.length / 86400000);
    })(),
  };

  if (!isAuthenticated) return null;

  const tabs = [
    { id: 'active' as const, label: 'نشطة', icon: Car },
    { id: 'sold' as const, label: 'تم البيع', icon: CheckCircle },
    { id: 'deleted' as const, label: 'محذوفة', icon: Trash2 },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">سياراتي</h1>
              <p className="text-sm text-gray-500">إدارة إعلاناتك ومراجعة إحصائياتك</p>
            </div>
          </div>
          <Link href="/cars/add" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25">
            <Plus className="w-4 h-4" /> إضافة إعلان
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { icon: Car, label: 'نشطة', value: stats.active, color: 'from-blue-500 to-blue-600' },
            { icon: CheckCircle, label: 'مباعة', value: stats.sold, color: 'from-green-500 to-emerald-600' },
            { icon: Eye, label: 'مشاهدات', value: stats.views, color: 'from-purple-500 to-violet-600' },
            { icon: MessageCircle, label: 'رسائل', value: stats.messages, color: 'from-cyan-500 to-teal-600' },
            { icon: Timer, label: 'متوسط البيع', value: `${stats.avgDays} يوم`, color: 'from-amber-500 to-orange-600' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}><s.icon className="w-4 h-4 text-white" /></div>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === t.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Car List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : cars.length === 0 ? (
          <div className="text-center py-16">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">لا توجد سيارات في هذا القسم</p>
            <Link href="/cars/add" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600">
              <Plus className="w-4 h-4" /> إضافة إعلان
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cars.map((car, i) => {
              const daysOnline = Math.round((Date.now() - new Date(car.createdAt).getTime()) / 86400000);
              return (
                <motion.div key={car.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`card p-4 flex items-center gap-4 ${car.deletedAt ? 'opacity-50' : ''}`}>
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    {car.images?.[0] ? (
                      <img src={car.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400"><Car className="w-6 h-6" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/cars/${car.slug || car.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-500 transition-colors">
                      {car.brand?.nameAr} {car.model?.nameAr} {car.year}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      {car.status === 'SOLD' && <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 font-semibold">تم البيع</span>}
                      {car.deletedAt && <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold">محذوف</span>}
                      <span><Eye className="w-3 h-3 inline" /> {car.views || 0}</span>
                      <span><Clock className="w-3 h-3 inline" /> {daysOnline} يوم</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeTab === 'active' && (
                      <>
                        <button onClick={() => markSold(car.id)}
                          className="px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> تم البيع
                        </button>
                        <button onClick={() => deleteCar(car.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> حذف
                        </button>
                        <Link href={`/cars/${car.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                          <Settings className="w-4 h-4" />
                        </Link>
                      </>
                    )}
                    {activeTab === 'sold' && (
                      <button onClick={() => reactivate(car.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> إعادة تفعيل
                      </button>
                    )}
                    {activeTab === 'deleted' && (
                      <span className="text-xs text-gray-400">بانتظار استعادة المدير</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
