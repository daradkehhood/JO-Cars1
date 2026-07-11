'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Send, Loader2, ChevronRight, Clock, MessageCircle, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface TicketDetail {
  id: string; subject: string; message: string; status: string; priority: string; category: string;
  createdAt: string; closedAt: string | null;
  assignee: { id: string; name: string } | null;
  messages: { id: string; content: string; isStaff: boolean; createdAt: string; user: { id: string; name: string; role: string; image: string | null } }[];
}

const statusLabels: Record<string, string> = { OPEN: 'مفتوحة', IN_PROGRESS: 'قيد المعالجة', RESOLVED: 'تم الحل', CLOSED: 'مغلقة' };
const statusColors: Record<string, string> = {
  OPEN: 'bg-green-100 dark:bg-green-500/10 text-green-600',
  IN_PROGRESS: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600',
  RESOLVED: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600',
  CLOSED: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
};
const categoryLabels: Record<string, string> = { GENERAL: 'عام', TECHNICAL: 'تقني', ACCOUNT: 'حساب', PAYMENT: 'دفع', REPORT: 'بلاغ' };

export default function TicketDetailPage() {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetch(`/api/tickets/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setTicket(data.data);
        else { toast.error('التذكرة غير موجودة'); router.push('/tickets'); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id, isAuthenticated, router]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticket!.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        const res2 = await fetch(`/api/tickets/${ticket!.id}`);
        const data2 = await res2.json();
        if (data2.success) setTicket(data2.data);
      } else toast.error(data.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
    setSending(false);
  };

  const handleClose = async () => {
    if (!confirm('إغلاق التذكرة؟')) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/tickets/${ticket!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم إغلاق التذكرة');
        setTicket({ ...ticket!, status: 'CLOSED', closedAt: new Date().toISOString() });
      } else toast.error(data.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
    setClosing(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!ticket) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-3xl">
        <Link href="/tickets" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
          <ChevronRight className="w-4 h-4" /> عودة للتذاكر
        </Link>

        <div className="card p-6 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{ticket.subject}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[ticket.status] || ''}`}>
                  {statusLabels[ticket.status] || ticket.status}
                </span>
                <span className="text-xs text-gray-400">{categoryLabels[ticket.category] || ticket.category}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString('ar-JO')}</span>
              </div>
            </div>
            {ticket.status !== 'CLOSED' && (
              <button onClick={handleClose} disabled={closing}
                className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center gap-1">
                {closing ? <Loader2 className="w-3 h-3 animate-spin" /> : null} إغلاق
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {ticket.messages.map(msg => (
            <div key={msg.id} className={`card p-4 ${msg.isStaff ? 'border-indigo-200 dark:border-indigo-500/20' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {msg.user.name?.charAt(0) || '?'}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{msg.user.name}</span>
                {msg.isStaff && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600">الدعم</span>}
                <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString('ar-JO')}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
        </div>

        {ticket.status !== 'CLOSED' && (
          <div className="card p-4">
            <div className="flex gap-2">
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                placeholder="اكتب رداً..." maxLength={2000} rows={2}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-indigo-500 resize-none" />
              <button onClick={handleReply} disabled={sending || !replyText.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center gap-1.5 self-end">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                إرسال
              </button>
            </div>
          </div>
        )}

        {ticket.closedAt && (
          <p className="text-center text-xs text-gray-400 mt-4">أغلقت في {new Date(ticket.closedAt).toLocaleString('ar-JO')}</p>
        )}
      </div>
    </div>
  );
}
