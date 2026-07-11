'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { MessageCircle, Loader2, Plus, X, Trash2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  _count: { topics: number };
}

export default function AdminForumCategoriesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nameAr: '', nameEn: '', slug: '', description: '', icon: 'MessageCircle', color: '#3b82f6', sortOrder: '0' });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/login'); return; }
    loadCategories();
  }, [isAuthenticated, user, router]);

  const loadCategories = () => {
    fetch('/api/admin/forum-categories')
      .then(r => r.json())
      .then(data => { setCategories(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const openNew = () => {
    setEditId(null);
    setForm({ nameAr: '', nameEn: '', slug: '', description: '', icon: 'MessageCircle', color: '#3b82f6', sortOrder: '0' });
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setForm({ nameAr: cat.nameAr, nameEn: cat.nameEn, slug: cat.slug, description: cat.description || '', icon: cat.icon, color: cat.color, sortOrder: String(cat.sortOrder) });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.nameAr || !form.nameEn || !form.slug) { toast.error('الاسم وال slug مطلوب'); return; }
    const url = editId ? `/api/admin/forum-categories/${editId}` : '/api/admin/forum-categories';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, sortOrder: parseInt(form.sortOrder) || 0 }),
    });
    const data = await res.json();
    if (data.success) { toast.success(editId ? 'تم التحديث' : 'تمت الإضافة'); setShowForm(false); loadCategories(); }
    else toast.error(data.error || 'فشل');
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('حذف القسم نهائياً؟')) return;
    const res = await fetch(`/api/admin/forum-categories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('تم الحذف'); loadCategories(); }
    else toast.error(data.error || 'فشل');
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">أقسام المنتدى</h1>
            </div>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl">
            <Plus className="w-4 h-4" /> قسم جديد
          </button>
        </div>

        {showForm && (
          <div className="card p-5 mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">الاسم (عربي)</label>
                <input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">الاسم (إنجليزي)</label>
                <input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Slug</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" placeholder="q-a" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الوصف</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">اللون</label>
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                  className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white cursor-pointer" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">الترتيب</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={save} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm">حفظ</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl text-sm">إلغاء</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : (
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: cat.color }}>
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{cat.nameAr} <span className="text-gray-400 text-xs">({cat.nameEn})</span></p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>{cat._count.topics} مواضيع</span>
                      <span>/slug: {cat.slug}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
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
