'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, Plus, X, Trash2, BellOff, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface PriceAlert {
  id: string;
  userId: string;
  brandId: string | null;
  modelId: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  yearFrom: number | null;
  yearTo: number | null;
  cityId: string | null;
  isActive: boolean;
  lastNotifiedAt: string | null;
  notifiedCount: number;
  createdAt: string;
  brand?: { id: string; nameAr: string; nameEn: string; logo?: string } | null;
  model?: { id: string; nameAr: string; nameEn: string } | null;
  city?: { id: string; nameAr: string; nameEn: string } | null;
}

interface Brand {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface City {
  id: string;
  nameAr: string;
  nameEn: string;
}

export default function PriceAlertsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [models, setModels] = useState<{ id: string; nameAr: string; nameEn: string; brandId: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    brandId: '', modelId: '', minPrice: '', maxPrice: '',
    yearFrom: '', yearTo: '', cityId: '',
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadData();
  }, [isAuthenticated, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsRes, brandsRes, citiesRes] = await Promise.all([
        fetch('/api/price-alerts'),
        fetch('/api/cars/brands'),
        fetch('/api/cars/cities'),
      ]);
      const [alertsData, brandsData, citiesData] = await Promise.all([
        alertsRes.json(), brandsRes.json(), citiesRes.json(),
      ]);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setBrands(Array.isArray(brandsData) ? brandsData : brandsData.data || []);
      setCities(Array.isArray(citiesData) ? citiesData : citiesData.data || []);
    } catch { toast.error('فشل التحميل'); }
    setLoading(false);
  };

  const loadModels = async (brandId: string) => {
    if (!brandId) { setModels([]); return; }
    try {
      const res = await fetch(`/api/cars/models?brandId=${brandId}`);
      const data = await res.json();
      setModels(data.data || []);
    } catch { setModels([]); }
  };

  const createAlert = async () => {
    if (!form.brandId && !form.modelId && !form.minPrice && !form.maxPrice && !form.yearFrom && !form.yearTo && !form.cityId) {
      toast.error('حدد معيار واحد على الأقل'); return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('تم إنشاء التنبيه');
        setShowCreate(false);
        setForm({ brandId: '', modelId: '', minPrice: '', maxPrice: '', yearFrom: '', yearTo: '', cityId: '' });
        loadData();
      } else toast.error(data.error || 'فشل');
    } catch { toast.error('فشل'); }
    setCreating(false);
  };

  const toggleAlert = async (alert: PriceAlert) => {
    const res = await fetch(`/api/price-alerts/${alert.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !alert.isActive }),
    });
    if (res.ok) {
      toast.success(alert.isActive ? 'تم إيقاف التنبيه' : 'تم تفعيل التنبيه');
      loadData();
    } else toast.error('فشل');
  };

  const deleteAlert = async (id: string) => {
    if (!confirm('حذف التنبيه؟')) return;
    const res = await fetch(`/api/price-alerts/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('تم الحذف'); loadData(); }
    else toast.error('فشل');
  };

  const formatAlertDescription = (alert: PriceAlert) => {
    const parts: string[] = [];
    if (alert.brand) parts.push(alert.brand.nameAr);
    if (alert.model) parts.push(alert.model.nameAr);
    if (alert.minPrice || alert.maxPrice) {
      parts.push(`سعر: ${alert.minPrice || 0} - ${alert.maxPrice || '∞'} د.أ`);
    }
    if (alert.yearFrom || alert.yearTo) {
      parts.push(`موديل: ${alert.yearFrom || 0} - ${alert.yearTo || '∞'}`);
    }
    if (alert.city) parts.push(alert.city.nameAr);
    return parts.join(' • ') || 'تنبيه عام';
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-[80vh] py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تنبيهات الأسعار</h1>
              <p className="text-gray-500 text-sm">اشعارات عند توفر سيارة ضمن مواصفاتك</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            تنبيه جديد
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 text-lg">لا توجد تنبيهات</p>
            <p className="text-gray-400 text-sm mt-2">أنشئ تنبيهاً ليصلك إشعار عند توفر سيارة ضمن مواصفاتك</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alert.isActive ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Bell className={`w-5 h-5 ${alert.isActive ? 'text-amber-500' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{formatAlertDescription(alert)}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {alert.notifiedCount > 0 && <span>تم الإشعار {alert.notifiedCount} مرات</span>}
                      <span>{alert.isActive ? 'نشط' : 'متوقف'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleAlert(alert)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all" title={alert.isActive ? 'إيقاف' : 'تفعيل'}>
                    {alert.isActive ? <BellOff className="w-4 h-4 text-gray-500" /> : <Bell className="w-4 h-4 text-amber-500" />}
                  </button>
                  <button onClick={() => deleteAlert(alert.id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !creating && setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">تنبيه جديد</h2>
              <button onClick={() => !creating && setShowCreate(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">العلامة التجارية</label>
                <select
                  value={form.brandId}
                  onChange={e => { setForm({ ...form, brandId: e.target.value, modelId: '' }); loadModels(e.target.value); }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">الكل</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
                </select>
              </div>
              {form.brandId && (
                <div>
                  <label className="block text-sm text-gray-500 mb-1">الموديل</label>
                  <select
                    value={form.modelId}
                    onChange={e => setForm({ ...form, modelId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">الكل</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.nameAr}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">أقل سعر</label>
                  <input type="number" value={form.minPrice} onChange={e => setForm({ ...form, minPrice: e.target.value })} placeholder="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">أعلى سعر</label>
                  <input type="number" value={form.maxPrice} onChange={e => setForm({ ...form, maxPrice: e.target.value })} placeholder="50000" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">من سنة</label>
                  <input type="number" value={form.yearFrom} onChange={e => setForm({ ...form, yearFrom: e.target.value })} placeholder="2020" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">إلى سنة</label>
                  <input type="number" value={form.yearTo} onChange={e => setForm({ ...form, yearTo: e.target.value })} placeholder="2025" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">المدينة</label>
                <select
                  value={form.cityId}
                  onChange={e => setForm({ ...form, cityId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">الكل</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                </select>
              </div>
              <button
                onClick={createAlert}
                disabled={creating}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                إنشاء التنبيه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
