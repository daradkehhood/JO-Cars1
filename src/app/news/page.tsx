'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Newspaper, Fuel, Truck, FileText, Lightbulb, Loader2, Clock, User, ChevronLeft, Trash2, Plus } from 'lucide-react';
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

export default function NewsPage() {
  const { user, isAuthenticated } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [deleting, setDeleting] = useState(false);
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  useEffect(() => {
    setLoading(true);
    const params = category ? `?category=${category}` : '';
    fetch(`/api/articles${params}`)
      .then(r => r.json())
      .then(data => { if (data.success) setArticles(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category]);

  return (
    <div className="min-h-screen pb-16">
      <div className="container-custom py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">أخبار السيارات</h1>
            <p className="text-gray-500 mt-1">آخر الأخبار والمقالات عن عالم السيارات في الأردن</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Link href="/admin/articles/add"
                className="px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20">
                <Plus className="w-4 h-4" /> إضافة خبر
              </Link>
              {articles.length > 0 && (
                <button onClick={async () => {
                  if (!confirm(`حذف جميع المقالات (${articles.length})؟`)) return;
                  setDeleting(true);
                  try {
                    const res = await fetch('/api/articles', { method: 'DELETE' });
                    const d = await res.json();
                    if (d.success) { toast.success('تم الحذف'); setArticles([]); }
                    else toast.error(d.error || 'فشل');
                  } catch { toast.error('حدث خطأ'); }
                  setDeleting(false);
                }}
                  className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-red-500/20"
                  disabled={deleting}>
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} حذف الكل
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
              !category ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }`}>
            الجميع
          </button>
          {Object.entries(categories).map(([key, cat]) => (
            <button key={key} onClick={() => setCategory(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                category === key ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد مقالات بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, i) => {
              const cat = categories[article.category] || categories.NEWS;
              const tags = (() => { try { return JSON.parse(article.tags); } catch { return []; } })();
              return (
                <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/news/${article.slug}`} className="block card overflow-hidden group hover:border-blue-200 dark:hover:border-blue-500/20 transition-all">
                    {article.image && (
                      <div className="h-48 overflow-hidden">
                        <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-xs font-bold ${cat.color} mb-3`}>
                        {cat.icon} {cat.label}
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-500 transition-colors">{article.title}</h3>
                      {article.excerpt && <p className="text-sm text-gray-500 line-clamp-3 mb-4">{article.excerpt}</p>}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500">{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.author?.name}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('ar-JO') : new Date(article.createdAt).toLocaleDateString('ar-JO')}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
