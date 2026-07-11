'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Sparkles, ImageOff, Search, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminContentToolsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [carId, setCarId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [resultType, setResultType] = useState<'desc' | 'dup' | null>(null);
  const [recentCars, setRecentCars] = useState<{ id: string; slug: string; brand: { nameAr: string }; model: { nameAr: string }; year: number; user: { name: string } }[]>([]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    fetch('/api/admin/cars?status=APPROVED')
      .then(r => r.json())
      .then(data => setRecentCars((data.data || []).slice(0, 20)))
      .catch(() => {});
  }, [isAuthenticated, user, router]);

  const generateDescription = async () => {
    if (!carId) { toast.error('اختر سيارة أولاً'); return; }
    setGenerating(true); setResult(null); setResultType(null);
    try {
      const res = await fetch('/api/admin/content-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-description', carId }),
      });
      const data = await res.json();
      if (data.success) { setResult(data.data); setResultType('desc'); toast.success('تم إنشاء الوصف'); }
      else toast.error(data.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
    setGenerating(false);
  };

  const checkDuplicates = async () => {
    if (!carId) { toast.error('اختر سيارة أولاً'); return; }
    setChecking(true); setResult(null); setResultType(null);
    try {
      const res = await fetch('/api/admin/content-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-duplicates', carId }),
      });
      const data = await res.json();
      if (data.success) { setResult(data.data); setResultType('dup'); }
      else toast.error(data.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
    setChecking(false);
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة المحتوى بالذكاء الاصطناعي</h1>
          <p className="text-sm text-gray-500">منشئ أوصاف، تدقيق الصور المكررة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" /> منشئ الأوصاف الذكي
          </h2>
          <p className="text-sm text-gray-500 mb-4">إنشاء وصف احترافي للسيارة باستخدام الذكاء الاصطناعي</p>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اختر السيارة</p>
            <div className="flex gap-2">
              <input value={carId} onChange={e => setCarId(e.target.value)} placeholder="أو أدخل ID السيارة..."
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-blue-500" />
              <select onChange={e => setCarId(e.target.value)} value={carId}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:border-blue-500">
                <option value="">— اختر من القائمة —</option>
                {recentCars.map(c => (
                  <option key={c.id} value={c.id}>{c.brand?.nameAr} {c.model?.nameAr} {c.year} — {c.user?.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={generateDescription} disabled={generating || !carId}
            className="w-full py-2.5 rounded-xl bg-gradient-to-l from-blue-500 to-purple-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'جاري الإنشاء...' : 'إنشاء وصف ذكي'}
          </button>

          {resultType === 'desc' && result && (
            <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-1.5 text-green-600 text-xs mb-2">
                <CheckCircle className="w-3 h-3" /> تم الإنشاء
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{(result as any).description}</p>
              {(result as any).tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(result as any).tags.map((t: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 text-xs">{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ImageOff className="w-5 h-5 text-orange-500" /> كشف الصور المكررة
          </h2>
          <p className="text-sm text-gray-500 mb-4">فحص إذا كانت صور السيارة مستخدمة في إعلانات أخرى</p>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اختر السيارة</p>
            <div className="flex gap-2">
              <input value={carId} onChange={e => setCarId(e.target.value)} placeholder="أو أدخل ID السيارة..."
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-orange-500" />
              <select onChange={e => setCarId(e.target.value)} value={carId}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:border-orange-500">
                <option value="">— اختر من القائمة —</option>
                {recentCars.map(c => (
                  <option key={c.id} value={c.id}>{c.brand?.nameAr} {c.model?.nameAr} {c.year}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={checkDuplicates} disabled={checking || !carId}
            className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {checking ? 'جاري الفحص...' : 'فحص الصور المكررة'}
          </button>

          {resultType === 'dup' && result && (
            <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-1.5 text-sm mb-2">
                {(result as any).duplicatesFound > 0 ? (
                  <span className="flex items-center gap-1 text-orange-600"><AlertTriangle className="w-4 h-4" /> تم العثور على {(result as any).duplicatesFound} صور مكررة</span>
                ) : (
                  <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> لا توجد صور مكررة</span>
                )}
              </div>
              <p className="text-xs text-gray-500">إجمالي الصور: {(result as any).totalImages}</p>
              {(result as any).results?.length > 0 && (
                <div className="mt-2 space-y-2">
                  {(result as any).results.map((r: Record<string, unknown>, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-orange-50 dark:bg-orange-500/5">
                      <p className="text-xs text-gray-500 truncate font-mono">{r.image as string}</p>
                      {(r.duplicates as Record<string, unknown>[]).map((d: Record<string, unknown>, j: number) => (
                        <p key={j} className="text-xs text-orange-600 mt-1">→ {d.carTitle as string}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
