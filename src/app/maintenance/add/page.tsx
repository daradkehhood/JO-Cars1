'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, ChevronDown, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import type { City } from '@/types';
import toast from 'react-hot-toast';

const categories = [
  { value: 'OIL_CHANGE', label: 'تغيير زيت' },
  { value: 'TIRES', label: 'بنشر وإطارات' },
  { value: 'BODYWORK', label: 'سمكرة ودهان' },
  { value: 'MECHANIC', label: 'ميكانيك' },
  { value: 'ELECTRICAL', label: 'كهرباء سيارات' },
  { value: 'AC', label: 'تكييف' },
  { value: 'DETAILING', label: 'تلميع وتنظيف' },
  { value: 'OTHER', label: 'أخرى' },
];

function CitySelector({ cities, selected, onSelect }: { cities: City[]; selected: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedCity = cities.find(c => c.id === selected);
  const filtered = cities.filter(c => c.nameAr.includes(search));

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => { setOpen(!open); setSearch(''); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500 flex items-center justify-between text-right">
        <span className={selected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}>{selectedCity?.nameAr || 'اختر المدينة'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input ref={inputRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ابحث عن مدينة..." className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400" />
              {search && <button type="button" onClick={() => setSearch('')}><X className="w-3 h-3 text-gray-400" /></button>}
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">لا توجد نتائج</div>
              ) : (
                filtered.map(c => (
                  <button key={c.id} type="button" onClick={() => { onSelect(c.id); setOpen(false); }}
                    className={`w-full px-4 py-2 text-right text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${selected === c.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {c.nameAr}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AddMaintenanceServicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'MECHANIC', price: '', phone: user?.phone || '', whatsapp: user?.whatsapp || '', cityId: '' });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetch('/api/admin/cities?active=true').then(r => r.json()).then(d => { if (d.success) setCities(d.data); });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cityId) { toast.error('اختر المدينة'); return; }
    setSubmitting(true);
    const selectedCity = cities.find(c => c.id === form.cityId);
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, provinceId: selectedCity?.provinceId || '' }),
    });
    const d = await res.json();
    if (d.success) { toast.success('تم النشر'); router.push('/maintenance'); }
    else toast.error('فشل');
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">إضافة خدمة صيانة</h1>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">عنوان الخدمة *</label>
            <input type="text" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: ورشة سمكرة فلان" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">التصنيف *</label>
              <select required value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المدينة *</label>
              <CitySelector cities={cities} selected={form.cityId} onSelect={id => setForm(p => ({ ...p, cityId: id }))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">السعر (اختياري)</label>
            <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="مثال: 15" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
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
            <label className="block text-sm font-medium mb-1">وصف الخدمة</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="تفاصيل عن الخدمة... الموقع، أوقات العمل، الخدمات المتاحة..." className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full h-11 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'نشر الخدمة'}
          </button>
        </form>
      </div>
    </div>
  );
}
