'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageCircle, ChevronLeft, Loader2, Lock, Eye, Clock, User, Send, Trash2,
  ShieldCheck, Flag,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import toast from 'react-hot-toast';

interface ForumPost {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string | null;
    dealerName?: string | null;
    rating: number;
    ratingCount: number;
    role: string;
    badges?: string | string[];
  };
}

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  slug: string;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  user: { id: string; name: string; image?: string | null; dealerName?: string | null };
  category: { id: string; nameAr: string; nameEn: string; slug: string; icon?: string; color?: string };
  posts: ForumPost[];
}

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPostId, setReportPostId] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadTopic = () => {
    const slug = params.slug as string;
    const viewed = JSON.parse(localStorage.getItem('viewedTopics') || '[]');
    const alreadyViewed = viewed.includes(slug);
    if (!alreadyViewed) {
      viewed.push(slug);
      localStorage.setItem('viewedTopics', JSON.stringify(viewed));
    }
    fetch(`/api/forum/topics/${slug}${alreadyViewed ? '' : '?trackView=true'}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) { setTopic(data.data); document.title = `${data.data.title} | المنتدى`; }
        else toast.error('الموضوع غير موجود');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadTopic(); }, [params.slug]);

  const submitReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply, topicId: topic!.id }),
      });
      const data = await res.json();
      if (data.success) {
        setReply('');
        loadTopic();
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else toast.error(data.error || 'فشل');
    } catch { toast.error('فشل'); }
    setSending(false);
  };

  const deletePost = async (postId: string) => {
    if (!confirm('حذف الرد؟')) return;
    const res = await fetch(`/api/forum/posts/${postId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('تم الحذف'); loadTopic(); }
    else toast.error('فشل');
  };

  const submitReport = async () => {
    if (!reportReason) return;
    setSubmittingReport(true);
    try {
      const res = await fetch(`/api/forum/posts/${reportPostId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason, description: reportDescription }),
      });
      const data = await res.json();
      if (data.success) { toast.success('تم الإبلاغ'); setShowReportModal(false); setReportReason(''); setReportDescription(''); }
      else toast.error(data.error || 'فشل');
    } catch { toast.error('فشل'); }
    setSubmittingReport(false);
  };

  const deleteTopic = async () => {
    if (!confirm('حذف الموضوع وجميع ردوده؟')) return;
    const res = await fetch(`/api/forum/topics/${topic!.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('تم الحذف'); router.push(`/forum/c/${topic!.category.slug}`); }
    else toast.error('فشل');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">الموضوع غير موجود</p>
          <Link href="/forum" className="text-blue-500 mt-2 inline-block">العودة للمنتدى</Link>
        </div>
      </div>
    );
  }

  const allPosts = [
    { ...topic, user: { ...topic.user, rating: 0, ratingCount: 0, role: '', badges: '' }, isMain: true },
    ...topic.posts.map(p => ({ ...p, isMain: false })),
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/forum" className="hover:text-blue-500">المنتدى</Link>
          <ChevronLeft className="w-3 h-3" />
          <Link href={`/forum/c/${topic.category.slug}`} className="hover:text-blue-500">{topic.category.nameAr}</Link>
          <ChevronLeft className="w-3 h-3" />
          <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">{topic.title}</span>
        </div>

        <div className="space-y-4">
          {allPosts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`card p-5 ${post.isMain ? 'border-r-4' : ''}`} style={post.isMain ? { borderRightColor: topic.category.color || '#3b82f6' } : {}}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                      {post.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{post.user?.dealerName || post.user?.name}</p>
                        {post.user?.role === 'ADMIN' && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                        {post.user?.badges && <BadgeDisplay badges={typeof post.user.badges === 'string' ? JSON.parse(post.user.badges || '[]') : post.user.badges} />}
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!post.isMain && user && user.id !== post.user.id && (
                      <button onClick={() => { setReportPostId(post.id); setShowReportModal(true); }} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-400 hover:text-amber-500 transition-all">
                        <Flag className="w-4 h-4" />
                      </button>
                    )}
                    {!post.isMain && user && (user.id === post.user.id || user.role === 'ADMIN') && (
                      <button onClick={() => deletePost(post.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                  {post.content}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {topic.isLocked && (
          <div className="text-center py-10">
            <Lock className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500">الموضوع مغلق، لا يمكن إضافة ردود جديدة</p>
          </div>
        )}

        {!topic.isLocked && (
          <div className="mt-6" ref={bottomRef}>
            {isAuthenticated ? (
              <div className="card p-5">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="اكتب ردك..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none text-sm"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    {user?.name}
                  </div>
                  <button
                    onClick={submitReply}
                    disabled={sending || !reply.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    إرسال
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <button onClick={() => router.push('/login')} className="text-blue-500 hover:text-blue-600 font-medium">
                  سجل الدخول للمشاركة في النقاش
                </button>
              </div>
            )}
          </div>
        )}

        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowReportModal(false)}>
            <div className="card p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">الإبلاغ عن رد</h3>
              <select value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-3 text-sm">
                <option value="">اختر السبب</option>
                <option value="SPAM">رسائل مزعجة</option>
                <option value="ABUSE">إساءة</option>
                <option value="INAPPROPRIATE">محتوى غير لائق</option>
                <option value="OTHER">أخرى</option>
              </select>
              <textarea value={reportDescription} onChange={e => setReportDescription(e.target.value)} placeholder="تفاصيل إضافية (اختياري)" rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none text-sm mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setShowReportModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium">إلغاء</button>
                <button onClick={submitReport} disabled={submittingReport || !reportReason} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50">
                  {submittingReport ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'إرسال البلاغ'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {topic.views} مشاهدة</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {topic.posts.length + 1} مشاركة</span>
          </div>
          {user && (user.id === topic.user.id || user.role === 'ADMIN') && (
            <button onClick={deleteTopic} className="text-red-500 hover:text-red-600 flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> حذف الموضوع
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
