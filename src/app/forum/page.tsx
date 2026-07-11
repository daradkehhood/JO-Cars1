'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageCircle, MessageSquare, ChevronLeft, Loader2, Clock,
  Sparkles, Plus, X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface ForumCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  topicsCount: number;
  postsCount: number;
  lastTopic: {
    title: string;
    slug: string;
    createdAt: string;
    user: { id: string; name: string };
  } | null;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageCircle: <MessageCircle className="w-6 h-6" />,
  MessageSquare: <MessageSquare className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
};

export default function ForumPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nameAr: '', nameEn: '', slug: '', description: '', icon: 'MessageCircle', color: '#3b82f6', sortOrder: '0' });
  const [saving, setSaving] = useState(false);

  const loadCategories = () => {
    fetch('/api/forum/categories')
      .then((r) => r.json())
      .then((data) => { setCategories(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadCategories(); }, []);

  const saveCategory = async () => {
    if (!form.nameAr || !form.nameEn || !form.slug) { toast.error('الاسم والرابط المختصر مطلوب'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/forum-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, sortOrder: parseInt(form.sortOrder) || 0 }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('تمت إضافة القسم');
      setShowForm(false);
      setForm({ nameAr: '', nameEn: '', slug: '', description: '', icon: 'MessageCircle', color: '#3b82f6', sortOrder: '0' });
      loadCategories();
    } else toast.error(data.error || 'فشل');
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">المنتدى</h1>
          <p className="text-gray-500 mt-2">نقاشات، استفسارات، ونصائح حول السيارات</p>
          {user?.role === 'ADMIN' && (
            <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:opacity-90 transition-all text-sm font-medium">
              <Plus className="w-4 h-4" /> إضافة قسم جديد
            </button>
          )}
        </div>

        {showForm && user?.role === 'ADMIN' && (
          <div className="card p-5 mb-6 space-y-4 border-r-4" style={{ borderRightColor: '#10b981' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">إضافة قسم جديد</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">الاسم (عربي)</label>
                <input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">الاسم (إنجليزي)</label>
                <input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الرابط المختصر</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" placeholder="نقاشات-عامة" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الوصف</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">اللون</label>
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white cursor-pointer" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">الترتيب</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              </div>
            </div>
            <button onClick={saveCategory} disabled={saving} className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              إضافة القسم
            </button>
          </div>
        )}

        <div className="grid gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                href={`/forum/c/${cat.slug}`}
                className="card p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 block group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    {ICON_MAP[cat.icon] || <MessageCircle className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors text-lg">
                        {cat.nameAr}
                      </h3>
                      <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0" />
                    </div>
                    {cat.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{cat.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{cat.topicsCount} مواضيع</span>
                      <span>{cat.postsCount} ردود</span>
                    </div>
                    {cat.lastTopic && (
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-2">
                        <Clock className="w-3 h-3" />
                        <span>آخر موضوع:</span>
                        <span className="text-gray-600 dark:text-gray-300 truncate max-w-[200px]">
                          {cat.lastTopic.title}
                        </span>
                        <span>بواسطة {cat.lastTopic.user.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
