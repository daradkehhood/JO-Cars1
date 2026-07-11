'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Award, Plus, X, Loader2, Edit3, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const EMOJIS = ['🏆', '🥇', '🥈', '🥉', '⭐', '💎', '👑', '🔥', '✅', '🌟', '✨', '💫', '🎯', '🏅', '🎖️', '💪', '👍', '📦', '🚗', '🏪'];

interface BadgeItem {
  id: string;
  nameAr: string;
  nameEn: string | null;
  icon: string;
  color: string;
  isActive: boolean;
}

export default function AdminBadgesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; edit?: BadgeItem }>({ open: false });
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('🏆');
  const [formColor, setFormColor] = useState('#f59e0b');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    fetch('/api/admin/badges')
      .then(r => r.json())
      .then(data => { setBadges(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  const openAdd = () => { setFormName(''); setFormIcon('🏆'); setFormColor('#f59e0b'); setModal({ open: true }); };
  const openEdit = (b: BadgeItem) => { setFormName(b.nameAr); setFormIcon(b.icon); setFormColor(b.color); setModal({ open: true, edit: b }); };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('الاسم مطلوب'); return; }
    setSubmitting(true);
    try {
      const isEdit = modal.edit;
      const url = isEdit ? `/api/admin/badges/${modal.edit!.id}` : '/api/admin/badges';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameAr: formName, icon: formIcon, color: formColor }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(isEdit ? 'تم تحديث الشارة' : 'تم إضافة الشارة');
        if (isEdit) setBadges(badges.map(b => b.id === d.data.id ? d.data : b));
        else setBadges([d.data, ...badges]);
        setModal({ open: false });
      } else toast.error(d.error || 'فشل الحفظ');
    } catch { toast.error('حدث خطأ'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (b: BadgeItem) => {
    if (!confirm(`حذف الشارة "${b.nameAr}"؟`)) return;
    const res = await fetch(`/api/admin/badges/${b.id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { toast.success('تم الحذف'); setBadges(badges.filter(x => x.id !== b.id)); }
    else toast.error(d.error || 'فشل الحذف');
  };

  const toggleActive = async (b: BadgeItem) => {
    const res = await fetch(`/api/admin/badges/${b.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    const d = await res.json();
    if (d.success) { setBadges(badges.map(x => x.id === b.id ? d.data : x)); toast.success(b.isActive ? 'تم التعطيل' : 'تم التفعيل'); }
    else toast.error('فشل التحديث');
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">نظام الشارات</h1>
            <p className="text-sm text-gray-500">إدارة شارات المستخدمين والتجار</p>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/25">
          <Plus className="w-4 h-4" /> إضافة شارة
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : badges.length === 0 ? (
        <div className="text-center py-16">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد شارات بعد</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">
            إضافة أول شارة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map(b => (
            <div key={b.id} className={`card p-5 ${!b.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: b.color + '20' }}>
                    {b.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{b.nameAr}</h3>
                    {b.nameEn && <p className="text-xs text-gray-400 dir-ltr">{b.nameEn}</p>}
                  </div>
                </div>
                <button onClick={() => toggleActive(b)}
                  className={`p-1.5 rounded-lg transition-colors ${b.isActive ? 'bg-green-50 dark:bg-green-500/10 text-green-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}
                  title={b.isActive ? 'تعطيل' : 'تفعيل'}>
                  {b.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800">اللون: {b.color}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(b)}
                  className="flex-1 py-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1">
                  <Edit3 className="w-3 h-3" /> تعديل
                </button>
                <button onClick={() => handleDelete(b)}
                  className="flex-1 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
                  <Trash2 className="w-3 h-3" /> حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal.open && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setModal({ ...modal, open: false })} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /><h3 className="font-semibold text-gray-900 dark:text-white">{modal.edit ? 'تعديل' : 'إضافة'} شارة</h3></div>
                <button onClick={() => setModal({ ...modal, open: false })} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الاسم</p>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="مثال: بائع موثوق"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الرمز</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setFormIcon(e)}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${formIcon === e ? 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-500/10 scale-110' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <input value={formIcon} onChange={e => setFormIcon(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-center outline-none focus:border-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اللون</p>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-700" />
                    <input value={formColor} onChange={e => setFormColor(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-amber-500 font-mono" />
                  </div>
                </div>
                <button onClick={handleSave} disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                  {submitting ? 'جاري الحفظ...' : modal.edit ? 'حفظ التغييرات' : 'إضافة الشارة'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
