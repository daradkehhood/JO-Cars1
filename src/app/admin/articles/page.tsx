'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Newspaper, Plus, Pencil, Eye, Loader2, Trash2, Clock, User, AlertTriangle } from 'lucide-react';
import type { Article } from '@/types';
import toast from 'react-hot-toast';

export default function AdminArticlesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    fetch('/api/articles?limit=100&all=true')
      .then(r => r.json())
      .then(data => { if (data.success) setArticles(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  const handleDelete = async (slug: string) => {
    if (!confirm('حذف المقال؟')) return;
    try {
      const res = await fetch(`/api/articles/${slug}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) { toast.success('تم الحذف'); setArticles(prev => prev.filter(a => a.slug !== slug)); }
      else toast.error(d.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">المقالات والأخبار</h1>
            <p className="text-sm text-gray-500">إدارة المحتوى الإخباري</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={async () => {
            if (!confirm(`حذف جميع المقالات (${articles.length})؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
            setDeletingAll(true);
            try {
              const res = await fetch('/api/articles', { method: 'DELETE' });
              const d = await res.json();
              if (d.success) { toast.success('تم حذف جميع المقالات'); setArticles([]); }
              else toast.error(d.error || 'فشل');
            } catch { toast.error('حدث خطأ'); }
            setDeletingAll(false);
          }}
            className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
            disabled={deletingAll || articles.length === 0}>
            {deletingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} حذف الكل
          </button>
          <Link href="/admin/articles/add"
            className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة مقال
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد مقالات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map(article => (
            <div key={article.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                {article.image && <img src={article.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{article.title}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.author?.name}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('ar-JO') : 'غير منشور'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/news/${article.slug}`}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  <Eye className="w-4 h-4" />
                </Link>
                <Link href={`/admin/articles/${article.slug}`}
                  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all">
                  <Pencil className="w-4 h-4" />
                </Link>
                <button onClick={() => handleDelete(article.slug)}
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
