'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageCircle, Send, Flag, Loader2, Trash2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { CarComment } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  carId: string;
  currentUser: { id: string; name: string; role: string; image?: string | null } | null;
}

export function CarComments({ carId, currentUser }: Props) {
  const [comments, setComments] = useState<CarComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reporting, setReporting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadComments(); }, [carId]);

  const loadComments = async () => {
    const res = await fetch(`/api/cars/${carId}/comments`);
    const d = await res.json();
    if (d.success) setComments(d.data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { toast.error('سجل الدخول أولاً'); return; }
    if (!content.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/cars/${carId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim() }),
    });
    const d = await res.json();
    if (d.success) { setComments(p => [d.data, ...p]); setContent(''); }
    else toast.error('فشل');
    setSubmitting(false);
  };

  const handleReport = async (commentId: string) => {
    if (!currentUser) { toast.error('سجل الدخول أولاً'); return; }
    const reasons = [
      { value: 'SPAM', label: 'رسائل مزعجة / سبام' },
      { value: 'ABUSE', label: 'إساءة أو تهديد' },
      { value: 'INAPPROPRIATE', label: 'محتوى غير لائق' },
      { value: 'OFFENSIVE', label: 'محتوى مسيء' },
      { value: 'OTHER', label: 'سبب آخر' },
    ];
    const choice = prompt('اختر سبب البلاغ:\n1 - رسائل مزعجة / سبام\n2 - إساءة أو تهديد\n3 - محتوى غير لائق\n4 - محتوى مسيء\n5 - سبب آخر\n\nأدخل الرقم (1-5):');
    if (!choice) return;
    const idx = parseInt(choice) - 1;
    if (idx < 0 || idx >= reasons.length) { toast.error('رقم غير صحيح'); return; }
    const reason = reasons[idx].value;
    setReporting(commentId);
    const res = await fetch(`/api/car-comments/${commentId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, description: '' }),
    });
    const d = await res.json();
    if (d.success) toast.success('تم الإبلاغ');
    else toast.error(d.error || 'فشل');
    setReporting(null);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('حذف التعليق؟')) return;
    setDeleting(commentId);
    // Delete via a dedicated endpoint - we don't have one, use a general approach
    const res = await fetch(`/api/car-comments/${commentId}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { setComments(p => p.filter(c => c.id !== commentId)); toast.success('تم الحذف'); }
    else toast.error('فشل');
    setDeleting(null);
  };

  return (
    <div>
      {/* Add comment */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <input ref={inputRef} type="text" value={content} onChange={e => setContent(e.target.value)}
            placeholder="اكتب تعليقك..." maxLength={500}
            className="flex-1 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
          <button type="submit" disabled={submitting || !content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">إرسال</span>
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 mb-6">سجل الدخول لإضافة تعليق</p>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-10 h-10 mx-auto text-gray-200 dark:text-gray-700 mb-2" />
          <p className="text-sm text-gray-500">لا توجد تعليقات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {comment.user.name?.[0] || '?'}
                  </div>
                  <div>
                    <span className="text-sm font-medium">{comment.user.name}</span>
                    {comment.user.role === 'ADMIN' && <span className="mr-1 text-xs text-amber-500">مدير</span>}
                    <span className="mr-2 text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {currentUser && currentUser.id !== comment.userId && (
                    <button onClick={() => handleReport(comment.id)} disabled={reporting === comment.id}
                      className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-400 hover:text-amber-500 transition-all">
                      {reporting === comment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {(currentUser?.id === comment.userId || currentUser?.role === 'ADMIN') && (
                    <button onClick={() => handleDelete(comment.id)} disabled={deleting === comment.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all">
                      {deleting === comment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
