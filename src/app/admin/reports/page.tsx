'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Flag, CheckCircle, XCircle, Loader2, AlertTriangle, ExternalLink, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  user: { id: string; name: string; email: string; phone: string | null };
  car: {
    id: string; slug: string; price: number; year: number;
    brand: { nameAr: string; nameEn: string };
    model: { nameAr: string; nameEn: string };
  };
}

const reasonLabels: Record<string, string> = {
  SPAM: 'إعلان مزعج', FAKE_PRICE: 'سعر وهمي', WRONG_INFO: 'معلومات خاطئة',
  SOLD: 'السيارة مباعة', DUPLICATE: 'إعلان مكرر', OFFENSIVE: 'محتوى مسيء',
  SCAM: 'احتيال', OTHER: 'سبب آخر',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

export default function AdminReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    loadReports();
  }, [isAuthenticated, user, router, statusFilter]);

  const loadReports = () => {
    fetch(`/api/admin/reports?status=${statusFilter}`)
      .then(r => r.json())
      .then(d => { setReports(d.data?.reports || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleResolve = async (id: string) => {
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'RESOLVED' }),
    });
    const d = await res.json();
    if (d.success) { toast.success('تم حل البلاغ'); loadReports(); }
    else toast.error('فشل تحديث البلاغ');
  };

  const handleReject = async (id: string) => {
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'REJECTED' }),
    });
    const d = await res.json();
    if (d.success) { toast.success('تم رفض البلاغ'); loadReports(); }
    else toast.error('فشل تحديث البلاغ');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف البلاغ؟')) return;
    setDeleting(id);
    const res = await fetch('/api/admin/reports', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const d = await res.json();
    if (d.success) { toast.success('تم حذف البلاغ'); loadReports(); }
    else toast.error('فشل حذف البلاغ');
    setDeleting(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
            <Flag className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">البلاغات</h1>
            <p className="text-sm text-gray-500">إدارة البلاغات المقدمة من المستخدمين</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['PENDING', 'RESOLVED', 'REJECTED'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === s
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>
            {s === 'PENDING' ? 'قيد الانتظار' : s === 'RESOLVED' ? 'تم الحل' : 'مرفوض'}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد بلاغات</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${statusColors[report.status]}`}>
                      {report.status === 'PENDING' ? 'قيد الانتظار' : report.status === 'RESOLVED' ? 'تم الحل' : 'مرفوض'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[11px]">
                      {reasonLabels[report.reason] || report.reason}
                    </span>
                  </div>

                  <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                    {/* @ts-ignore */}
                    {report.car?.brand?.nameAr || ''} {report.car?.model?.nameAr || ''} {report.car?.year || ''}
                  </p>

                  {report.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mt-2">
                      {report.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
                    <span>📅 {new Date(report.createdAt).toLocaleDateString('ar-JO')}</span>
                    <span>👤 {report.user?.name || report.user?.email || 'غير معروف'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {report.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleResolve(report.id)}
                        className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10 text-green-500 transition-colors" title="حل البلاغ">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleReject(report.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors" title="رفض البلاغ">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <a href={`/cars/${report.car?.slug || report.car?.id}`} target="_blank"
                    className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition-colors" title="عرض الإعلان">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <button onClick={() => handleDelete(report.id)} disabled={deleting === report.id}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 transition-colors" title="حذف">
                    {deleting === report.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
