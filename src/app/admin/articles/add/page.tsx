'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Plus, Loader2, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddArticlePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', slug: '', content: '', excerpt: '', image: '',
    category: 'NEWS', tags: '', published: false,
  });

  if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { toast.error('العنوان والمحتوى مطلوبان'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? JSON.stringify(form.tags.split(',').map(t => t.trim())) : '[]',
        }),
      });
      const data = await res.json();
      if (data.success) { toast.success('تم إنشاء المقال'); router.push(`/admin/articles`); }
      else toast.error(data.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/admin/articles')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إضافة مقال جديد</h1>
          <p className="text-sm text-gray-500">إنشاء محتوى إخباري أو مقال</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">العنوان *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: e.target.value.replace(/\s+/g, '-').slice(0, 80) })}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">الرابط (slug)</label>
            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">التصنيف</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-blue-500">
              <option value="NEWS">أخبار السيارات</option>
              <option value="FUEL_PRICES">أسعار البنزين والديزل</option>
              <option value="CUSTOMS">الجمارك والضرائب</option>
              <option value="REVIEWS">مراجعات السيارات</option>
              <option value="TIPS">نصائح وإرشادات</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">صورة المقال</label>
            <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
              placeholder="رابط الصورة"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">وسوم (مفصولة بفاصلة)</label>
            <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
              placeholder="سيارات, أردن, 2026"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">منشور</span>
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ملخص</label>
          <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })}
            placeholder="ملخص قصير للمقال..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 min-h-[80px] resize-y" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">المحتوى *</label>
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="اكتب المحتوى هنا... استخدم ## للعناوين الفرعية"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 min-h-[300px] resize-y font-mono text-xs leading-relaxed" />
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/articles')}>إلغاء</Button>
          <Button type="submit" loading={loading} icon={<Plus className="w-4 h-4" />}>إنشاء المقال</Button>
        </div>
      </form>
    </div>
  );
}
