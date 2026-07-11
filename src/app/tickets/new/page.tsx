'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Send, Loader2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewTicketPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) { router.push('/login'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) { toast.error('العنوان والرسالة مطلوبان'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, category, priority }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم إنشاء التذكرة');
        router.push(`/tickets/${data.data.id}`);
      } else {
        toast.error(data.error || 'فشل');
      }
    } catch { toast.error('حدث خطأ'); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-2xl">
        <Link href="/tickets" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
          <ChevronRight className="w-4 h-4" /> عودة للتذاكر
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
            <Ticket className="w-5 h-5 text-indigo-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تذكرة جديدة</h1>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">القسم</p>
            <div className="flex gap-2">
              {[{ value: 'GENERAL', label: 'عام' }, { value: 'TECHNICAL', label: 'مشكلة تقنية' }, { value: 'ACCOUNT', label: 'الحساب' }, { value: 'PAYMENT', label: 'الدفع' }, { value: 'REPORT', label: 'بلاغ' }].map(c => (
                <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${category === c.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الأولوية</p>
            <div className="flex gap-2">
              {[{ value: 'LOW', label: 'منخفضة' }, { value: 'NORMAL', label: 'عادية' }, { value: 'HIGH', label: 'مهمة' }, { value: 'URGENT', label: 'عاجلة' }].map(p => (
                <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${priority === p.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">العنوان</p>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="ملخص المشكلة..." maxLength={200}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الرسالة</p>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="اشرح المشكلة بالتفصيل..." maxLength={5000} rows={6}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none" />
          </div>

          <button type="submit" disabled={submitting || !subject.trim() || !message.trim()}
            className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'جاري الإرسال...' : 'إرسال التذكرة'}
          </button>
        </form>
      </div>
    </div>
  );
}
