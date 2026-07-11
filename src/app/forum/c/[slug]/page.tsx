'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageCircle, Plus, ChevronLeft, Loader2, Pin, Lock, Clock, User,
  Eye, MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Topic {
  id: string;
  title: string;
  slug: string;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  lastPostAt: string;
  user: { id: string; name: string; dealerName?: string | null };
  _count: { posts: number };
}

export default function CategoryTopicsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [category, setCategory] = useState<{ nameAr: string; nameEn: string; slug: string; icon?: string; color?: string; description?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slug = params.slug as string;
    setLoading(true);
    Promise.all([
      fetch(`/api/forum/topics?categorySlug=${slug}`).then(r => r.json()),
      fetch('/api/forum/categories').then(r => r.json()),
    ])
      .then(([topicsData, catsData]) => {
        const cats = catsData.data || [];
        const cat = cats.find((c: any) => c.slug === slug);
        if (cat) setCategory(cat);
        setTopics(topicsData.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">القسم غير موجود</p>
          <Link href="/forum" className="text-blue-500 mt-2 inline-block">العودة للمنتدى</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/forum" className="hover:text-blue-500">المنتدى</Link>
          <ChevronLeft className="w-3 h-3" />
          <span className="text-gray-900 dark:text-white font-medium">{category.nameAr}</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{category.nameAr}</h1>
            {category.description && <p className="text-gray-500 text-sm mt-1">{category.description}</p>}
          </div>
          {isAuthenticated ? (
            <Link
              href={`/forum/new?categoryId=${category.slug}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" /> موضوع جديد
            </Link>
          ) : (
            <button onClick={() => router.push('/login')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl text-sm">
              سجل الدخول للإضافة
            </button>
          )}
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 text-lg">لا توجد مواضيع بعد</p>
            {isAuthenticated && (
              <Link href={`/forum/new?categoryId=${category.slug}`}
                className="inline-flex items-center gap-2 mt-4 text-emerald-500 hover:text-emerald-600 font-medium">
                <Plus className="w-4 h-4" /> كن أول من يضيف موضوع
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {topics.map((topic, i) => (
              <motion.div key={topic.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link
                  href={`/forum/t/${topic.slug}`}
                  className="card p-4 hover:shadow-lg transition-all block group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {topic.isPinned && <Pin className="w-4 h-4 text-amber-500 shrink-0" />}
                        {topic.isLocked && <Lock className="w-4 h-4 text-gray-400 shrink-0" />}
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-1">
                          {topic.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{topic.user?.dealerName || topic.user?.name}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(topic.createdAt)}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{topic._count.posts}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{topic.views}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
