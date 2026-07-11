'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Flag, CheckCircle, XCircle, Trash2, Ban } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CommentReport {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  reportedContent: string;
  comment: { id: string; content: string; createdAt: string; car: { id: string; slug: string } } | null;
  reporter: { id: string; name: string };
  reportedUser: { id: string; name: string; carCommentBannedUntil: string | null };
}

const durationOptions = [
  { value: 'none', label: 'دون حظر' },
  { value: '30min', label: '30 دقيقة' },
  { value: '1h', label: 'ساعة' },
  { value: '2h', label: 'ساعتين' },
  { value: '1d', label: 'يوم' },
  { value: '3d', label: '3 أيام' },
  { value: '1w', label: 'أسبوع' },
  { value: '2w', label: 'أسبوعين' },
  { value: '1m', label: 'شهر' },
  { value: 'permanent', label: 'دائم' },
];

function isBanned(until: string | null): boolean {
  if (!until) return false;
  return new Date(until) > new Date();
}

function banLabel(until: string | null): string {
  if (!until) return 'غير محظور';
  const d = new Date(until);
  if (d.getFullYear() >= 2099) return 'محظور دائم';
  if (d <= new Date()) return 'انتهت المدة';
  return `حتى ${formatDate(until)}`;
}

export default function AdminCarCommentReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [banning, setBanning] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/login'); return; }
    loadReports();
  }, [user]);

  const loadReports = async () => {
    const res = await fetch('/api/admin/car-comment-reports');
    const d = await res.json();
    if (d.success) setReports(d.data.data);
    setLoading(false);
  };

  const applyBan = async (userId: string, duration: string) => {
    setBanning(userId);
    const res = await fetch(`/api/admin/car-comment-users/${userId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration }),
    });
    const d = await res.json();
    if (d.success) { toast.success('تم تطبيق الحظر'); loadReports(); }
    else toast.error('فشل');
    setBanning(null);
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch('/api/admin/car-comment-reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    const d = await res.json();
    if (d.success) { toast.success(status === 'RESOLVED' ? 'تم حل البلاغ' : 'تم رفض البلاغ'); loadReports(); }
    else toast.error('فشل');
  };

  const deleteReport = async (id: string) => {
    if (!confirm('حذف البلاغ نهائياً؟')) return;
    const res = await fetch('/api/admin/car-comment-reports', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const d = await res.json();
    if (d.success) { toast.success('تم الحذف'); loadReports(); }
    else toast.error('فشل');
  };

  const reasonLabels: Record<string, string> = { SPAM: 'رسائل مزعجة', ABUSE: 'إساءة', INAPPROPRIATE: 'محتوى غير لائق', OFFENSIVE: 'مسيء', OTHER: 'أخرى' };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Flag className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-bold">بلاغات تعليقات السيارات</h1>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-20">
            <Flag className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-gray-500">لا توجد بلاغات</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${report.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : report.status === 'RESOLVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {report.status === 'PENDING' ? 'قيد الانتظار' : report.status === 'RESOLVED' ? 'تم الحل' : 'مرفوض'}
                    </span>
                    <span className="text-xs text-gray-500">{reasonLabels[report.reason] || report.reason}</span>
                    <span className="text-xs text-gray-400">{formatDate(report.createdAt)}</span>
                  </div>
                </div>

                {report.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">{report.description}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                  <div><span className="text-gray-500 text-xs">المبلغ: </span><span className="font-medium">{report.reporter.name}</span></div>
                  <div><span className="text-gray-500 text-xs">صاحب التعليق: </span><span className="font-medium">{report.reportedUser.name}</span></div>
                  <div><span className="text-gray-500 text-xs">السيارة: </span>
                    {report.comment ? (
                      <Link href={`/cars/${report.comment.car.slug}`} target="_blank" className="text-blue-500 hover:underline">فتح</Link>
                    ) : <span className="text-gray-400">محذوفة</span>}
                  </div>
                </div>

                <details className="mt-3">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    مشاهدة التعليق {report.comment ? '' : '(محذوف)'}
                  </summary>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg whitespace-pre-wrap">
                    {report.comment ? report.comment.content : report.reportedContent}
                  </p>
                </details>

                <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Ban className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">حظر التعليقات:</span>
                    <span className={`text-xs font-medium ${isBanned(report.reportedUser.carCommentBannedUntil) ? 'text-red-600' : 'text-green-600'}`}>
                      {banLabel(report.reportedUser.carCommentBannedUntil)}
                    </span>
                    <select
                      disabled={banning === report.reportedUser.id}
                      onChange={e => applyBan(report.reportedUser.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      defaultValue=""
                    >
                      <option value="" disabled>تغيير المدة</option>
                      {durationOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mr-auto flex gap-2">
                    {report.status === 'PENDING' && (
                      <>
                        <button onClick={() => updateStatus(report.id, 'RESOLVED')} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">
                          <CheckCircle className="w-3 h-3" /> حل
                        </button>
                        <button onClick={() => updateStatus(report.id, 'DISMISSED')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-medium hover:bg-gray-300">
                          <XCircle className="w-3 h-3" /> رفض
                        </button>
                      </>
                    )}
                    {report.status !== 'PENDING' && (
                      <button onClick={() => deleteReport(report.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-600 rounded-lg text-xs font-medium hover:bg-red-500/20">
                        <Trash2 className="w-3 h-3" /> حذف البلاغ
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
