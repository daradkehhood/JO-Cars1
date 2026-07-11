'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Tag, Plus, Edit3, Trash2, X, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface CarTag {
  id: string;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  icon: string;
  color: string;
  isActive: boolean;
  _count: { assignments: number };
}

export default function AdminTagsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tags, setTags] = useState<CarTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; edit: CarTag | null }>({ open: false, edit: null });
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#3b82f6');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    loadTags();
  }, [isAuthenticated, user, router]);

  const loadTags = () => {
    fetch('/api/admin/tags')
      .then(r => r.json())
      .then(data => { setTags(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const openCreate = () => {
    setNameAr(''); setNameEn(''); setSlug(''); setIcon('Tag'); setColor('#3b82f6');
    setModal({ open: true, edit: null });
  };

  const openEdit = (tag: CarTag) => {
    setNameAr(tag.nameAr); setNameEn(tag.nameEn || ''); setSlug(tag.slug);
    setIcon(tag.icon); setColor(tag.color);
    setModal({ open: true, edit: tag });
  };

  const handleSave = async () => {
    if (!nameAr.trim() || !slug.trim()) { toast.error('الاسم والرابط مطلوبان'); return; }
    setSubmitting(true);
    try {
      const isEdit = !!modal.edit;
      const url = isEdit ? `/api/admin/tags/${modal.edit!.id}` : '/api/admin/tags';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameAr, nameEn: nameEn || null, slug: slug.toLowerCase().replace(/\s+/g, '-'), icon, color }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(isEdit ? 'تم تحديث الوسم' : 'تم إنشاء الوسم');
        setModal({ open: false, edit: null });
        loadTags();
      } else {
        toast.error(d.error || 'فشل');
      }
    } catch { toast.error('حدث خطأ'); }
    setSubmitting(false);
  };

  const handleDelete = async (tag: CarTag) => {
    if (!confirm(`حذف الوسم "${tag.nameAr}"؟`)) return;
    try {
      const res = await fetch(`/api/admin/tags/${tag.id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) { toast.success('تم حذف الوسم'); loadTags(); }
      else toast.error(d.error || 'فشل الحذف');
    } catch { toast.error('حدث خطأ'); }
  };

  const toggleActive = async (tag: CarTag) => {
    try {
      const res = await fetch(`/api/admin/tags/${tag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !tag.isActive }),
      });
      const d = await res.json();
      if (d.success) { toast.success(tag.isActive ? 'تم إيقاف الوسم' : 'تم تفعيل الوسم'); loadTags(); }
      else toast.error(d.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
  };

  const iconOptions = ['Tag', 'Star', 'Flame', 'Zap', 'Shield', 'Award', 'Sparkles', 'Gem', 'Crown', 'Heart', 'Target', 'BadgeCheck'];

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
            <Tag className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة وسوم السيارات</h1>
            <p className="text-sm text-gray-500">وسوم مثل "مميزة"، "عرض خاص"، "وارد أمريكا"، "كاش فقط"</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 transition-all">
          <Plus className="w-4 h-4" /> وسم جديد
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
      ) : tags.length === 0 ? (
        <div className="text-center py-16"><Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">لا توجد وسوم</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map(tag => (
            <div key={tag.id} className="card p-5 hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: tag.color }}>
                  <Tag className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(tag)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleActive(tag)}
                    className={`p-1.5 rounded-lg transition-colors ${tag.isActive ? 'hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-500' : 'text-green-500'}`}>
                    {tag.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(tag)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{tag.nameAr}</h3>
              {tag.nameEn && <p className="text-xs text-gray-400">{tag.nameEn}</p>}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">الرابط: {tag.slug}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${tag.isActive ? 'bg-green-100 dark:bg-green-500/10 text-green-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  {tag.isActive ? 'نشط' : 'موقف'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                مستخدم في {tag._count.assignments} سيارة
              </p>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setModal({ ...modal, open: false })} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2"><Tag className="w-5 h-5 text-purple-500" /><h3 className="font-semibold text-gray-900 dark:text-white">{modal.edit ? 'تعديل وسم' : 'وسم جديد'}</h3></div>
                <button onClick={() => setModal({ ...modal, open: false })} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الاسم (عربي)</p>
                  <input value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder="مثال: مميزة"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الاسم (إنجليزي) - اختياري</p>
                  <input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="مثال: Featured" dir="ltr"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الرابط (slug)</p>
                  <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="featured" dir="ltr"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الأيقونة</p>
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map(ic => (
                      <button key={ic} onClick={() => setIcon(ic)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${icon === ic ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اللون</p>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)}
                    className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer" />
                </div>
                <button onClick={handleSave} disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                  {submitting ? 'جاري الحفظ...' : modal.edit ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
