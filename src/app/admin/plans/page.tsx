'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Package, Plus, Edit2, Trash2, Check, X, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Plan } from '@/types';

const defaultFeatures = [
  { key: 'badge', label: 'شارة مميزة' },
  { key: 'topList', label: 'ظهور في أول القائمة' },
  { key: 'homePage', label: 'ظهور في الصفحة الرئيسية' },
  { key: 'socialPromote', label: 'ترويج في وسائل التواصل' },
  { key: 'vipSupport', label: 'دعم VIP' },
];

export default function AdminPlansPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', nameAr: '', nameEn: '', description: '',
    price: '', durationDays: '30', isActive: true,
    features: {} as Record<string, boolean>,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    loadPlans();
  }, [isAuthenticated, user, router]);

  const loadPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      const data = await res.json();
      setPlans(data.data || []);
    } catch { toast.error('فشل تحميل الباقات'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', nameAr: '', nameEn: '', description: '', price: '', durationDays: '30', isActive: true, features: {} });
    setShowForm(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      nameAr: plan.nameAr,
      nameEn: plan.nameEn,
      description: plan.description,
      price: String(plan.price),
      durationDays: String(plan.durationDays),
      isActive: plan.isActive,
      features: typeof plan.features === 'object' ? plan.features : {},
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nameAr || !form.price) { toast.error('الاسم والسعر مطلوبان'); return; }
    try {
      const url = editingId ? `/api/admin/plans/${editingId}` : '/api/admin/plans';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editingId ? 'تم تحديث الباقة' : 'تم إنشاء الباقة');
        setShowForm(false);
        loadPlans();
      } else { toast.error('فشل الحفظ'); }
    } catch { toast.error('فشل الحفظ'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    try {
      const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('تم حذف الباقة'); loadPlans(); }
      else { toast.error('فشل الحذف'); }
    } catch { toast.error('فشل الحذف'); }
  };

  const toggleFeature = (key: string) => {
    setForm(prev => ({ ...prev, features: { ...prev.features, [key]: !prev.features[key] } }));
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الباقات</h1>
          </div>
          <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>إضافة باقة</Button>
        </div>

        {showForm && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'تعديل باقة' : 'إضافة باقة جديدة'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input label="الاسم (عربي)" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} />
              <Input label="الاسم (إنجليزي)" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} />
              <Input label="نظام (System Name)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: SILVER" />
              <Input label="السعر (دينار)" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              <Input label="المدة (أيام)" type="number" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الوصف</label>
              <textarea className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">المميزات</label>
              <div className="flex flex-wrap gap-3">
                {defaultFeatures.map(f => (
                  <button key={f.key} type="button" onClick={() => toggleFeature(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      form.features[f.key]
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                    {form.features[f.key] ? <Check className="w-3 h-3 inline ml-1" /> : <Plus className="w-3 h-3 inline ml-1" />}
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                فعالة
              </label>
              <Button onClick={handleSave}>حفظ</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className={`card p-6 ${!plan.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-gray-900 dark:text-white">{plan.nameAr}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(plan)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(plan.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3">{plan.description || plan.nameEn}</p>
              <div className="text-2xl font-bold text-blue-500 mb-3">{plan.price} <span className="text-sm font-normal">د.أ</span></div>
              <div className="text-sm text-gray-500 mb-3">لمدة {plan.durationDays} يوم</div>
              {plan.features && typeof plan.features === 'object' && Object.keys(plan.features).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(plan.features).filter(([, v]) => v).map(([key]) => (
                    <span key={key} className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-500/10 text-green-600 text-xs">
                      {defaultFeatures.find(f => f.key === key)?.label || key}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {plans.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-gray-500">
              لا توجد باقات مضافة. اضف الباقة الأولى!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
