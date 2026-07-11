'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function AddWantedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [brands, setBrands] = useState<{ id: string; nameAr: string }[]>([]);
  const [models, setModels] = useState<{ id: string; nameAr: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; nameAr: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', brandId: '', modelId: '', yearFrom: '', yearTo: '', maxPrice: '', phone: user?.phone || '', whatsapp: '', cityId: '' });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetch('/api/brands').then(r => r.json()).then(d => { if (d.success) setBrands(d.data); });
    fetch('/api/cities').then(r => r.json()).then(d => { if (d.success) setCities(d.data); });
  }, [user]);

  useEffect(() => {
    if (!form.brandId) { setModels([]); return; }
    fetch(`/api/models?brandId=${form.brandId}`).then(r => r.json()).then(d => { if (d.success) setModels(d.data); });
  }, [form.brandId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/wanted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (d.success) { toast.success('تم النشر'); router.push(`/wanted/${d.data.id}`); }
    else toast.error('فشل');
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">إعلان مطلوب</h1>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">عنوان الإعلان *</label>
            <input type="text" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: مطلوب تويوتا كورولا 2020" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">الماركة</label>
              <select value={form.brandId} onChange={e => setForm(p => ({ ...p, brandId: e.target.value, modelId: '' }))} className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500">
                <option value="">الكل</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الموديل</label>
              <select value={form.modelId} onChange={e => setForm(p => ({ ...p, modelId: e.target.value }))} disabled={!form.brandId} className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500 disabled:opacity-50">
                <option value="">الكل</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.nameAr}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">سنة من</label>
              <input type="number" value={form.yearFrom} onChange={e => setForm(p => ({ ...p, yearFrom: e.target.value }))} placeholder="2018" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">سنة إلى</label>
              <input type="number" value={form.yearTo} onChange={e => setForm(p => ({ ...p, yearTo: e.target.value }))} placeholder="2024" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">السعر الأقصى</label>
              <input type="number" value={form.maxPrice} onChange={e => setForm(p => ({ ...p, maxPrice: e.target.value }))} placeholder="15000" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المدينة</label>
              <select value={form.cityId} onChange={e => setForm(p => ({ ...p, cityId: e.target.value }))} className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500">
                <option value="">اختر</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف *</label>
            <input type="text" required value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="079xxxxxxx" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رقم واتساب (اختياري)</label>
            <input type="text" value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="079xxxxxxx" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">تفاصيل إضافية</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} placeholder="اكتب أي تفاصيل إضافية عن السيارة المطلوبة..." className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
          </div>

          <button type="submit" disabled={submitting} className="w-full h-11 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'نشر الإعلان'}
          </button>
        </form>
      </div>
    </div>
  );
}
