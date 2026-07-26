'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Check, X, Loader2, Clock, Mail, Phone, Store, MapPin,
  FileText, Calendar, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

type VerificationRow = {
  id: string;
  status: string;
  dealerName: string;
  dealerLogo: string | null;
  dealerDescription: string | null;
  dealerAddress: string | null;
  dealerLat: number | null;
  dealerLng: number | null;
  commercialReg: string | null;
  notes: string | null;
  rejectReason: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; phone: string | null; image: string | null; createdAt: string };
};

const filters = [
  { value: 'PENDING', label: 'معلق' },
  { value: 'APPROVED', label: 'مقبول' },
  { value: 'REJECTED', label: 'مرفوض' },
  { value: '', label: 'الكل' },
];

const statusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':
      return { label: 'معلق', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' };
    case 'APPROVED':
      return { label: 'مقبول', cls: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' };
    case 'REJECTED':
      return { label: 'مرفوض', cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' };
    default:
      return { label: status, cls: 'bg-gray-100 text-gray-700' };
  }
};

export default function AdminTradersApprovalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<VerificationRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.push('/');
  }, [user, router]);

  if (!user) return null;
  if (user.role !== 'ADMIN') return null;

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/traders-approval?status=${filter}`);
      const d = await res.json();
      if (d.success) setRequests(d.data || []);
      else toast.error(d.error || 'فشل التحميل');
    } catch {
      toast.error('فشل الاتصال');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleApprove = async (id: string, dealerName: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/traders-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, action: 'APPROVE' }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`تم اعتماد التاجر «${dealerName}»`);
        loadRequests();
      } else {
        toast.error(d.error || 'فشل الاعتماد');
      }
    } catch {
      toast.error('فشل الاتصال');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      toast.error('يرجى كتابة سبب الرفض');
      return;
    }
    setActionLoading(rejectModal.id);
    try {
      const res = await fetch('/api/admin/traders-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: rejectModal.id, action: 'REJECT', rejectReason }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('تم رفض الطلب');
        setRejectModal(null);
        setRejectReason('');
        loadRequests();
      } else {
        toast.error(d.error || 'فشل الرفض');
      }
    } catch {
      toast.error('فشل الاتصال');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container-custom py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">اعتماد التجار</h1>
          <p className="text-xs text-gray-500">مراجعة طلبات إنشاء حسابات تجار السيارات وقبولها أو رفضها</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-surface-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-surface-700 hover:bg-gray-50 dark:hover:bg-surface-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="card p-12 text-center text-gray-500 dark:text-gray-400">
          <Store className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>لا توجد طلبات {filter === 'PENDING' ? 'بانتظار المراجعة' : 'بهذه الحالة'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const badge = statusBadge(req.status);
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-surface-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {req.dealerLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={req.dealerLogo} alt={req.dealerName} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-7 h-7 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{req.dealerName}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                      </div>

                      <Link href={`/profile/${req.user.id}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        المتقدم: {req.user.name}
                      </Link>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {req.user.email && (
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{req.user.email}</span>
                        )}
                        {req.user.phone && (
                          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{req.user.phone}</span>
                        )}
                        {req.dealerAddress && (
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{req.dealerAddress}</span>
                        )}
                        {req.commercialReg && (
                          <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />السجل: {req.commercialReg}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      {req.dealerDescription && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{req.dealerDescription}</p>
                      )}

                      {req.notes && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500 italic">ملاحظات المتقدم: {req.notes}</p>
                      )}

                      {req.status === 'REJECTED' && req.rejectReason && (
                        <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                          <p className="text-xs text-red-700 dark:text-red-400">سبب الرفض: {req.rejectReason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(req.id, req.dealerName)}
                        disabled={actionLoading === req.id}
                        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        اعتماد
                      </button>
                      <button
                        onClick={() => { setRejectModal(req); setRejectReason(''); }}
                        disabled={actionLoading === req.id}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        رفض
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Reject reason modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRejectModal(null)}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 w-full max-w-md shadow-soft-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">رفض طلب التاجر</h3>
                  <p className="text-xs text-gray-500">{rejectModal.dealerName}</p>
                </div>
              </div>
              <label className="text-sm font-medium text-gray-700 dark:text-surface-300 block mb-1.5">سبب الرفض</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="اكتب سبب واضح سيظهر للمتقدم…"
                className="input-field resize-none w-full"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading === rejectModal.id}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === rejectModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  تأكيد الرفض
                </button>
                <button
                  onClick={() => setRejectModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-surface-700"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
