'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Newspaper, Fuel, Truck, FileText, Lightbulb, Loader2, Clock, User, ChevronLeft, Share2, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Article } from '@/types';
import toast from 'react-hot-toast';

const categories: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  NEWS: { label: 'أخبار السيارات', icon: <Newspaper className="w-4 h-4" />, color: 'bg-blue-500' },
  FUEL_PRICES: { label: 'أسعار البنزين والديزل', icon: <Fuel className="w-4 h-4" />, color: 'bg-green-500' },
  CUSTOMS: { label: 'الجمارك والضرائب', icon: <Truck className="w-4 h-4" />, color: 'bg-amber-500' },
  REVIEWS: { label: 'مراجعات السيارات', icon: <FileText className="w-4 h-4" />, color: 'bg-purple-500' },
  TIPS: { label: 'نصائح وإرشادات', icon: <Lightbulb className="w-4 h-4" />, color: 'bg-indigo-500' },
};

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  useEffect(() => {
    fetch(`/api/articles/${params.slug}`)
      .then(r => r.json())
      .then(data => { if (data.success) setArticle(data.data); else router.push('/news'); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.slug, router]);

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: article?.title || '', url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); toast.success('تم نسخ الرابط'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!article) return null;

  const cat = categories[article.category] || categories.NEWS;

  return (
    <div className="min-h-screen pb-16">
      <div className="container-custom py-8 max-w-4xl">
        <Link href="/news" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ChevronLeft className="w-4 h-4" /> العودة للأخبار
        </Link>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {article.image && (
            <div className="h-64 sm:h-96 rounded-3xl overflow-hidden mb-8">
              <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold ${cat.color}`}>
              {cat.icon} {cat.label}
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('ar-JO') : new Date(article.createdAt).toLocaleDateString('ar-JO')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">{article.title}</h1>

          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                {article.author?.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{article.author?.name}</p>
                <p className="text-xs text-gray-500">كاتب في جو كارز</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button onClick={async () => {
                  if (!confirm('حذف هذا الخبر؟')) return;
                  try {
                    const res = await fetch(`/api/articles/${article.slug}`, { method: 'DELETE' });
                    const d = await res.json();
                    if (d.success) { toast.success('تم الحذف'); router.push('/news'); }
                    else toast.error(d.error || 'فشل');
                  } catch { toast.error('حدث خطأ'); }
                }}
                  className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all text-sm flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4" /> حذف
                </button>
              )}
              <button onClick={handleShare} className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm flex items-center gap-1.5">
                <Share2 className="w-4 h-4" /> مشاركة
              </button>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            {article.content.split('\n').map((line, i) => (
              line.startsWith('## ') ? <h2 key={i} className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">{line.replace('## ', '')}</h2> :
              line.startsWith('# ') ? <h1 key={i} className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4">{line.replace('# ', '')}</h1> :
              line.trim() ? <p key={i} className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{line}</p> :
              <br key={i} />
            ))}
          </div>
        </motion.article>
      </div>
    </div>
  );
}
