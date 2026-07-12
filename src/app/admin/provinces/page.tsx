"use client";

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import type { Province } from '@/types';
import toast from 'react-hot-toast';

export default function AdminProvincesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = require('next/navigation').useRouter();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nameAr: '', nameEn: '' });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    loadProvinces();
  }, [isAuthenticated, user, router]);

  const loadProvinces = async () => {
    try {
      const res = await fetch('/api/admin/provinces');
      const d = await res.json();
      if (d.success) setProvinces(d.data);
    } catch {
      toast.error('فشل تحميل المحافظات');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const res = await fetch('/api/admin/provinces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provinces: [],
          cities: [],
          autoCreate: true,
        }),
      });
      const d = await res.json();
      if (d.success) { toast.success(`تم إضافة ${d.data.provinces} محافظات و ${d.data.cities} مدينة`); loadProvinces(); }
      else toast.error('فشل');
    } catch {
      toast.error('فشل العملية');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr.trim()) return;
    const res = await fetch('/api/admin/provinces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (d.success) { toast.success('تمت الإضافة'); setForm({ nameAr: '', nameEn: '' }); setShowAdd(false); loadProvinces(); }
    else toast.error('فشل');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف المحافظة؟')) return;
    const res = await fetch(`/api/admin/provinces/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { toast.success('تم الحذف'); setProvinces(p => p.filter(x => x.id !== id)); }
    else toast.error('فشل');
  };

  const toggleActive = async (province: Province) => {
    const res = await fetch(`/api/admin/provinces/${province.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !province.isActive }),
    });
    const d = await res.json();
    if (d.success) { loadProvinces(); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold">المحافظات</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleImport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
              <Plus className="w-4 h-4" /> استيراد البيانات الأصلية
            </button>
            <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> إضافة محافظة
            </button>
          </div>
        </div>

        {showAdd && (
          <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAdd} className="card p-4 mb-6 flex gap-3">
            <input required value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} placeholder="الاسم بالعربية" className="flex-1 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
            <input value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} placeholder="English name" className="flex-1 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">حفظ</button>
          </motion.form>
        )}

        {provinces.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-gray-500">لا توجد محافظات بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {provinces.map(p => (
              <div key={p.id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <div>
                    <span className="font-medium">{p.nameAr}</span>
                    {p.nameEn && <span className="mr-2 text-xs text-gray-400">({p.nameEn})</span>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${p.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                    {p.isActive ? 'نشط' : 'معطل'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(p)} className={`px-3 py-1 rounded-lg text-xs font-medium ${p.isActive ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                    {p.isActive ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
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
