'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Ticket, MessageCircle, UserCheck, Clock, Loader2, Send, X, ChevronDown, ChevronUp, Flag, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TicketItem {
  id: string; subject: string; message: string; status: string; priority: string; category: string;
  createdAt: string; updatedAt: string; closedAt: string | null;
  user: { id: string; name: string; email: string; image: string | null };
  assignee: { id: string; name: string } | null;
  _count: { messages: number };
  messages?: { id: string; content: string; isStaff: boolean; createdAt: string; user: { id: string; name: string; role: string; image: string | null } }[];
}

const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
const priorityLabels: Record<string, string> = { URGENT: 'عاجل', HIGH: 'مهم', NORMAL: 'عادي', LOW: 'منخفض' };
const priorityColors: Record<string, string> = {
  URGENT: 'text-red-600 bg-red-50 dark:bg-red-500/10',
  HIGH: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10',
  NORMAL: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
  LOW: 'text-gray-600 bg-gray-50 dark:bg-gray-500/10',
};
const statusLabels: Record<string, string> = { OPEN: 'مفتوحة', IN_PROGRESS: 'قيد المعالجة', RESOLVED: 'تم الحل', CLOSED: 'مغلقة' };
const statusColors: Record<string, string> = {
  OPEN: 'bg-green-100 dark:bg-green-500/10 text-green-600',
  IN_PROGRESS: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600',
  RESOLVED: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600',
  CLOSED: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
};
const categoryLabels: Record<string, string> = { GENERAL: 'عام', TECHNICAL: 'تقني', ACCOUNT: 'حساب', PAYMENT: 'دفع', REPORT: 'بلاغ' };

export default function AdminTicketsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [admins, setAdmins] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, TicketItem['messages']>>({});

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    loadTickets();
  }, [isAuthenticated, user, router, filter]);

  const loadTickets = () => {
    const params = filter ? `?status=${filter}` : '';
    fetch(`/api/admin/tickets${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const sorted = (data.data.tickets || []).sort((a: TicketItem, b: TicketItem) =>
            (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
          );
          setTickets(sorted);
          setAdmins(data.data.admins || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const toggleExpand = async (ticket: TicketItem) => {
    if (expanded === ticket.id) { setExpanded(null); return; }
    setExpanded(ticket.id);
    if (!expandedMessages[ticket.id]) {
      try {
        const res = await fetch(`/api/tickets/${ticket.id}`);
        const data = await res.json();
        if (data.success) setExpandedMessages(prev => ({ ...prev, [ticket.id]: data.data.messages }));
      } catch {}
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم إرسال الرد');
        setReplyText('');
        const res2 = await fetch(`/api/tickets/${ticketId}`);
        const data2 = await res2.json();
        if (data2.success) setExpandedMessages(prev => ({ ...prev, [ticketId]: data2.data.messages }));
        loadTickets();
      } else toast.error(data.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
    setSending(false);
  };

  const handleAction = async (ticketId: string, action: string, assigneeId?: string) => {
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, action, assigneeId }),
      });
      const data = await res.json();
      if (data.success) { toast.success('تم'); loadTickets(); }
      else toast.error(data.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
            <Ticket className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">التذاكر</h1>
            <p className="text-sm text-gray-500">إدارة تذاكر الدعم الفني</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ value: '', label: 'الكل' }, { value: 'OPEN', label: 'مفتوحة' }, { value: 'IN_PROGRESS', label: 'قيد المعالجة' }, { value: 'RESOLVED', label: 'تم الحل' }, { value: 'CLOSED', label: 'مغلقة' }].map(f => (
          <button key={f.value} onClick={() => { setFilter(f.value); setLoading(true); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              filter === f.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16"><Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">لا توجد تذاكر</p></div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div key={ticket.id} className="card overflow-hidden">
              <div className="p-4 cursor-pointer" onClick={() => toggleExpand(ticket)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {ticket.user.name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{ticket.subject}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ticket.user.name} · {categoryLabels[ticket.category] || ticket.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColors[ticket.priority] || ''}`}>
                      {priorityLabels[ticket.priority] || ticket.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[ticket.status] || ''}`}>
                      {statusLabels[ticket.status] || ticket.status}
                    </span>
                    {expanded === ticket.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString('ar-JO')}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {ticket._count.messages} رسالة</span>
                  {ticket.assignee && <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {ticket.assignee.name}</span>}
                </div>
              </div>

              {expanded === ticket.id && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                  <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                    {(expandedMessages[ticket.id] || []).map(msg => (
                      <div key={msg.id} className={`flex gap-2 ${msg.isStaff ? 'flex-row-reverse' : ''}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                          msg.isStaff
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-gray-900 dark:text-white'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }`}>
                          <p className="text-xs text-gray-400 mb-1">{msg.user.name} {msg.isStaff ? '(الدعم)' : ''}</p>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleString('ar-JO')}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-4 pb-4">
                    {ticket.status !== 'CLOSED' && (
                      <div className="flex gap-2 mb-2">
                        <input value={replyText} onChange={e => setReplyText(e.target.value)}
                          placeholder="اكتب رداً..." maxLength={2000}
                          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                        <button onClick={() => handleReply(ticket.id)} disabled={sending || !replyText.trim()}
                          className="px-3 py-2 rounded-xl bg-indigo-500 text-white text-sm hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center gap-1.5">
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {!ticket.assignee && (
                        <select onChange={e => { if (e.target.value) handleAction(ticket.id, 'ASSIGN', e.target.value); }}
                          className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 outline-none">
                          <option value="">تعيين لـ...</option>
                          {admins.filter(a => a.id !== user.id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      )}
                      {ticket.status !== 'CLOSED' && (
                        <button onClick={() => handleAction(ticket.id, 'CLOSE')}
                          className="text-xs px-2 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                          إغلاق
                        </button>
                      )}
                      <button onClick={() => {
                        if (window.confirm('هل أنت متأكد من حذف هذه التذكرة؟')) handleAction(ticket.id, 'DELETE');
                      }}
                        className="text-xs px-2 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> حذف
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
