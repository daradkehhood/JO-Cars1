'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Plus, MessageCircle, Clock, Loader2, ChevronLeft } from 'lucide-react';

interface TicketItem {
  id: string; subject: string; status: string; priority: string; category: string;
  createdAt: string; updatedAt: string;
  assignee: { id: string; name: string } | null;
  _count: { messages: number };
}

const statusLabels: Record<string, string> = { OPEN: 'مفتوحة', IN_PROGRESS: 'قيد المعالجة', RESOLVED: 'تم الحل', CLOSED: 'مغلقة' };
const statusColors: Record<string, string> = {
  OPEN: 'bg-green-100 dark:bg-green-500/10 text-green-600',
  IN_PROGRESS: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600',
  RESOLVED: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600',
  CLOSED: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
};
const priorityLabels: Record<string, string> = { URGENT: 'عاجل', HIGH: 'مهم', NORMAL: 'عادي', LOW: 'منخفض' };
const priorityColors: Record<string, string> = {
  URGENT: 'text-red-600 bg-red-50 dark:bg-red-500/10',
  HIGH: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10',
  NORMAL: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
  LOW: 'text-gray-600 bg-gray-50 dark:bg-gray-500/10',
};

export default function TicketsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetch('/api/tickets')
      .then(r => r.json())
      .then(data => { setTickets(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-indigo-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تذاكري</h1>
          </div>
          <Link href="/tickets/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-all">
            <Plus className="w-4 h-4" /> تذكرة جديدة
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">لا توجد تذاكر بعد</p>
            <Link href="/tickets/new" className="text-indigo-500 hover:text-indigo-600 font-medium">إنشاء تذكرة جديدة</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(ticket => (
              <Link key={ticket.id} href={`/tickets/${ticket.id}`}
                className="card p-4 block hover:shadow-lg transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{ticket.subject}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[ticket.status] || ''}`}>
                        {statusLabels[ticket.status] || ticket.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColors[ticket.priority] || ''}`}>
                        {priorityLabels[ticket.priority] || ticket.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {ticket._count.messages}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString('ar-JO')}</span>
                    <ChevronLeft className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
