'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Send, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewTopicPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>}>
    <NewTopicForm />
  </Suspense>;
}

function NewTopicForm() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<{ id: string; nameAr: string; slug: string }[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetch('/api/forum/categories')
      .then(r => r.json())
      .then(data => {
        const cats = data.data || [];
        setCategories(cats);
        const preset = searchParams.get('categoryId');
        if (preset) {
          const found = cats.find((c: any) => c.slug === preset);
          if (found) setCategoryId(found.id);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, router, searchParams]);

  const submit = async () => {
    if (!title.trim() || !content.trim() || !categoryId) {
      toast.error('العنوان، المحتوى، والقسم مطلوب'); return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, categoryId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم نشر الموضوع');
        router.push(`/forum/t/${data.data.slug}`);
      } else toast.error(data.error || 'فشل');
    } catch { toast.error('فشل'); }
    setSending(false);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-2xl">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/forum" className="hover:text-blue-500">المنتدى</Link>
          <ChevronLeft className="w-3 h-3" />
          <span className="text-gray-900 dark:text-white font-medium">موضوع جديد</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">موضوع جديد</h1>

        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">القسم</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="">اختر القسم</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="مثال: كيف أختار زيت محرك مناسب؟"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المحتوى</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="اكتب موضوعك هنا..."
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" />
          </div>

          <button onClick={submit} disabled={sending}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            نشر الموضوع
          </button>
        </div>
      </div>
    </div>
  );
}
