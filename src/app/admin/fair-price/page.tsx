'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, RefreshCw, TrendingDown, TrendingUp, Minus, CheckCircle, XCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFairPricePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<{ total: number; withEstimate: number; withoutEstimate: number; thresholds: { belowMarket: number; aboveMarket: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN') { router.push('/'); return; }
    fetch('/api/admin/fair-price')
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, router]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch('/api/admin/fair-price', { method: 'POST' });
      const d = await res.json();
      if (d.success) {
        toast.success(`تم إعادة حساب ${d.data.recalculated} سيارة`);
        const r = await fetch('/api/admin/fair-price').then(r => r.json());
        if (r.success) setData(r.data);
      } else toast.error(d.error || 'فشل');
    } catch { toast.error('فشل'); }
    setRecalculating(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">مؤشر عدالة السعر</h1>
          <button onClick={handleRecalculate} disabled={recalculating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            إعادة حساب الكل
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-5 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.total || 0}</p>
            <p className="text-xs text-gray-500 mt-1">إجمالي السيارات</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-2xl font-bold text-green-600">{data?.withEstimate || 0}</p>
            <p className="text-xs text-gray-500 mt-1">بها تقدير</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-2xl font-bold text-red-500">{data?.withoutEstimate || 0}</p>
            <p className="text-xs text-gray-500 mt-1">بدون تقدير</p>
          </div>
        </div>

        {/* Indicator Types */}
        <h2 className="text-lg font-bold mb-4">أنواع المؤشرات</h2>
        <div className="space-y-3 mb-8">
          <div className="card p-5 flex items-center gap-4 border-r-4 border-green-500">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-xl">🟢</div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">أقل من سعر السوق</p>
              <p className="text-sm text-gray-500">يظهر عندما يكون السعر أقل من سعر السوق بـ {Math.abs(data?.thresholds?.belowMarket || 8)}% أو أكثر</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4 border-r-4 border-amber-500">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-xl">🟡</div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">مطابق للسوق</p>
              <p className="text-sm text-gray-500">يظهر عندما يكون السعر ضمن ±{data?.thresholds?.aboveMarket || 8}% من سعر السوق</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4 border-r-4 border-red-500">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-xl">🔴</div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">أعلى من سعر السوق</p>
              <p className="text-sm text-gray-500">يظهر عندما يكون السعر أعلى من سعر السوق بـ {data?.thresholds?.aboveMarket || 8}% أو أكثر</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">كيف يعمل التقدير؟</h3>
          </div>
          <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
            <li>يبحث عن سيارات مشابهة (نفس الشركة والموديل، ±2 سنة، كيلومترات مشابهة، نفس الوقود)</li>
            <li>إذا لم يجد كمية كافية، يوسع البحث ليشمل نفس الشركة فقط</li>
            <li>إذا لا يزال غير كافٍ، يستخدم جميع السيارات من نفس الفئة العمرية</li>
            <li>كحل أخير، يستخدم نموذج استهلاك بناءً على سعر العلامة التجارية الأساسي والسنة والحالة</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
