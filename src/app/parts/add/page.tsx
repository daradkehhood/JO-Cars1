'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PART_TYPES = [
  { value: 'engine', label: 'محرك' },
  { value: 'transmission', label: 'جير' },
  { value: 'body', label: 'هيكل' },
  { value: 'electrical', label: 'كهرباء' },
  { value: 'suspension', label: 'تعليق' },
  { value: 'brake', label: 'فرامل' },
  { value: 'cooling', label: 'تبريد' },
  { value: 'exhaust', label: 'عادم' },
  { value: 'interior', label: 'داخلي' },
  { value: 'wheel', label: 'جنط' },
  { value: 'turbo', label: 'توربو' },
  { value: 'ac', label: 'مكيف' },
  { value: 'other', label: 'أخرى' },
];

const CONDITIONS = [
  { value: 'NEW', label: 'جديد' },
  { value: 'USED', label: 'مستعمل' },
  { value: 'REFURBISHED', label: 'مُجدد' },
];

export default function AddPartPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<{ id: string; nameAr: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; nameAr: string }[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '', description: '', partType: '', brandId: '', partNumber: '',
    condition: 'USED', price: '', currency: 'JOD', quantity: '1',
    phone: '', whatsapp: '', cityId: '', isNegotiable: false,
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.phone) setForm(f => ({ ...f, phone: user.phone || '' }));
    fetch('/api/cars/brands').then(r => r.json()).then(d => setBrands(d.data || [])).catch(() => {});
    fetch('/api/cars/cities').then(r => r.json()).then(d => setCities(d.data || [])).catch(() => {});
  }, [isAuthenticated, router, user]);

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 10 - images.length);
    setImages(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    if (!form.title || !form.partType || !form.price || !form.phone) {
      toast.error('العنوان، النوع، السعر، والهاتف مطلوب'); return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      images.forEach(img => fd.append('images', img));
      const res = await fetch('/api/parts', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        toast.success('تم إضافة القطعة، قيد المراجعة');
        router.push('/parts');
      } else toast.error(data.error || 'فشل');
    } catch { toast.error('فشل'); }
    setLoading(false);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">إضافة قطعة غيار</h1>

        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="مثلاً: مكينة هايلكس 2015"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4} placeholder="حالة القطعة، سبب البيع..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">النوع *</label>
              <select value={form.partType} onChange={e => setForm({ ...form, partType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">اختر</option>
                {PART_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحالة</label>
              <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العلامة التجارية</label>
              <select value={form.brandId} onChange={e => setForm({ ...form, brandId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">اختر</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم القطعة (OEM)</label>
              <input value={form.partNumber} onChange={e => setForm({ ...form, partNumber: e.target.value })}
                placeholder="مثال: 23100-0C010"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر *</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العملة</label>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="JOD">د.أ</option>
                <option value="USD">$</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الكمية</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الهاتف *</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">واتساب</label>
              <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدينة</label>
              <select value={form.cityId} onChange={e => setForm({ ...form, cityId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">اختر</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isNegotiable} onChange={e => setForm({ ...form, isNegotiable: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300">قابل للتفاوض</span>
              </label>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الصور (اختياري)</label>
            <div className="flex flex-wrap gap-3">
              {previews.map((p, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img src={p} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <input type="file" accept="image/*" multiple className="absolute w-0 h-0 opacity-0 overflow-hidden" onChange={e => handleImages(e.target.files)} />
                </label>
              )}
            </div>
          </div>

          <button onClick={submit} disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            إضافة القطعة
          </button>
        </div>
      </div>
    </div>
  );
}
