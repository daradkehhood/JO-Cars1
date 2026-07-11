"use client";

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, MapPin, Edit3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Province, City } from '@/types';
import toast from 'react-hot-toast';

export default function AdminCitiesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editCity, setEditCity] = useState<City | null>(null);
  const [form, setForm] = useState({ nameAr: '', nameEn: '', provinceId: '' });

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/login'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [provinceRes, cityRes] = await Promise.all([
        fetch('/api/admin/provinces'),
        fetch('/api/admin/cities'),
      ]);
      const pData = await provinceRes.json();
      const cData = await cityRes.json();
      if (pData.success) setProvinces(pData.data);
      if (cData.success) setCities(cData.data);
    } catch {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr.trim() || !form.provinceId) return;

    const url = editCity
      ? `/api/admin/cities/${editCity.id}`
      : '/api/admin/cities';
    const method = editCity ? 'PUT' : 'POST';

    const body = editCity ? { ...form } : { ...form };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await res.json();

    if (d.success) {
      toast.success(editCity ? 'تم التحديث' : 'تمت الإضافة');
      setForm({ nameAr: '', nameEn: '', provinceId: '' });
      setEditCity(null);
      setShowAdd(false);
      loadData();
    } else {
      toast.error(d.error || 'فشل');
    }
  };

  const handleEdit = (city: City) => {
    setEditCity(city);
    setForm({ nameAr: city.nameAr, nameEn: city.nameEn || '', provinceId: city.provinceId || '' });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف المدينة؟')) return;
    const res = await fetch(`/api/admin/cities/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { toast.success('تم الحذف'); setCities(c => c.filter(x => x.id !== id)); }
    else toast.error('فشل');
  };

  const toggleActive = async (city: City) => {
    const res = await fetch(`/api/admin/cities/${city.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !city.isActive }),
    });
    const d = await res.json();
    if (d.success) { loadData(); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold">المدن والمناطق</h1>
          </div>
          <button onClick={() => { setShowAdd(!showAdd); setEditCity(null); setForm({ nameAr: '', nameEn: '', provinceId: '' }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> {showAdd ? 'إلغاء' : 'إضافة مدينة'}
          </button>
        </div>

        {showAdd && (
          <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAddOrUpdate} className="card p-4 mb-6 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">المحافظة *</label>
              <select required value={form.provinceId} onChange={e => setForm(p => ({ ...p, provinceId: e.target.value }))} className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500">
                <option value="">اختر المحافظة</option>
                {provinces.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">الاسم بالعربية *</label>
              <input required value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} placeholder="الاسم بالعربية" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">الاسم بالإنجليزية</label>
              <input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} placeholder="English name" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="w-full flex justify-end">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">حفظ</button>
            </div>
          </motion.form>
        )}

        {cities.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-gray-500">لا توجد مدن بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cities.map(c => (
              <div key={c.id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <div>
                    <span className="font-medium">{c.nameAr}</span>
                    {c.nameEn && <span className="mr-2 text-xs text-gray-400">({c.nameEn})</span>}
                    <span className="mr-2 text-xs text-gray-400">({c.province?.nameAr})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${c.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                    {c.isActive ? 'نشط' : 'معطل'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(c)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleActive(c)} className={`px-3 py-1 rounded-lg text-xs font-medium ${c.isActive ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                    {c.isActive ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
