'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Building2, Plus, X, Loader2, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Brand {
  id: string; nameAr: string; nameEn: string; slug: string; country?: string; logo?: string; isActive: boolean;
  _count?: { cars: number; models: number };
}

export default function AdminBrandsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [nameAr, setNameAr] = useState(''); const [nameEn, setNameEn] = useState('');
  const [country, setCountry] = useState(''); const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    fetch('/api/admin/brands').then(r => r.json()).then(d => { setBrands(d.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  const load = () => fetch('/api/admin/brands').then(r => r.json()).then(d => setBrands(d.data || []));

  const openAdd = () => { setEditing(null); setNameAr(''); setNameEn(''); setCountry(''); setIsActive(true); setModal(true); };
  const openEdit = (b: Brand) => { setEditing(b); setNameAr(b.nameAr); setNameEn(b.nameEn); setCountry(b.country || ''); setIsActive(b.isActive); setModal(true); };

  const handleSubmit = async () => {
    if (!nameAr.trim() || !nameEn.trim()) { toast.error('الاسم مطلوب'); return; }
    setSubmitting(true);
    const method = editing ? 'PATCH' : 'POST';
    const body = editing ? { id: editing.id, nameAr, nameEn, country, isActive } : { nameAr, nameEn, country, isActive };
    const res = await fetch('/api/admin/brands', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await res.json();
    if (d.success) { toast.success(editing ? 'تم التحديث' : 'تمت الإضافة'); setModal(false); load(); }
    else toast.error(d.error || 'فشل');
    setSubmitting(false);
  };

  const handleDelete = async (b: Brand) => {
    if (!confirm(`حذف ${b.nameAr}؟`)) return;
    const res = await fetch('/api/admin/brands', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id }) });
    const d = await res.json();
    if (d.success) { toast.success('تم الحذف'); load(); } else toast.error(d.error || 'فشل الحذف');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-purple-500" />
          </div>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">الشركات</h1><p className="text-sm text-gray-500">إدارة شركات السيارات</p></div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25">
          <Plus className="w-4 h-4" /> إضافة شركة
        </button>
      </div>
      {brands.length === 0 ? (
        <div className="text-center py-16"><Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">لا توجد شركات</p></div>
      ) : (
        <div className="grid gap-3">
          {brands.map(b => (
            <div key={b.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {b.logo ? <img src={b.logo} alt={b.nameAr} className="w-10 h-10 rounded-xl object-cover" /> :
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-purple-500" /></div>}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{b.nameAr}</span>
                    <span className="text-sm text-gray-400">({b.nameEn})</span>
                    {!b.isActive && <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-semibold">غير فعال</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span>{b._count?.cars || 0} سيارة</span>
                    <span>{b._count?.models || 0} موديل</span>
                    {b.country && <span>{b.country}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(b)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Edit3 className="w-4 h-4 text-blue-500" /></button>
                <button onClick={() => handleDelete(b)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2"><Building2 className="w-5 h-5 text-purple-500" /><h3 className="font-semibold text-gray-900 dark:text-white">{editing ? 'تعديل شركة' : 'إضافة شركة'}</h3></div>
                <button onClick={() => setModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div><p className="text-sm font-medium mb-1.5">الاسم بالعربية</p><input value={nameAr} onChange={e => setNameAr(e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
                <div><p className="text-sm font-medium mb-1.5">الاسم بالإنجليزية</p><input value={nameEn} onChange={e => setNameEn(e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
                <div><p className="text-sm font-medium mb-1.5">الدولة</p><input value={country} onChange={e => setCountry(e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-blue-500" /><span className="text-sm">فعال</span></label>
                <button onClick={handleSubmit} disabled={submitting} className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{submitting ? 'جاري...' : editing ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
