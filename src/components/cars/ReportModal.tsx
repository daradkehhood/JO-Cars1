'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const reportReasons = [
  { value: 'SPAM', label: 'إعلان مزعج' },
  { value: 'FAKE_PRICE', label: 'سعر وهمي' },
  { value: 'WRONG_INFO', label: 'معلومات خاطئة' },
  { value: 'SOLD', label: 'السيارة مباعة' },
  { value: 'DUPLICATE', label: 'إعلان مكرر' },
  { value: 'OFFENSIVE', label: 'محتوى مسيء' },
  { value: 'SCAM', label: 'احتيال' },
  { value: 'OTHER', label: 'سبب آخر' },
];

interface ReportModalProps {
  carId: string;
  carTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ carId, carTitle, isOpen, onClose }: ReportModalProps) {
  const { isAuthenticated } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('الرجاء اختيار سبب البلاغ');
      return;
    }

    if (!isAuthenticated) {
      toast.error('الرجاء تسجيل الدخول أولاً');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId, reason, description: description || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم إرسال البلاغ بنجاح');
        onClose();
        setReason('');
        setDescription('');
      } else {
        toast.error(data.error || 'فشل إرسال البلاغ');
      }
    } catch {
      toast.error('حدث خطأ في إرسال البلاغ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">الإبلاغ عن إعلان</h3>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  الإبلاغ عن: <span className="font-medium text-gray-700 dark:text-gray-300">{carTitle}</span>
                </p>

                {!isAuthenticated ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-3">الرجاء تسجيل الدخول للإبلاغ</p>
                    <a href="/auth/login" className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">
                      تسجيل الدخول
                    </a>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">سبب البلاغ</p>
                      <div className="grid grid-cols-2 gap-2">
                        {reportReasons.map((r) => (
                          <button key={r.value} onClick={() => setReason(r.value)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                              reason === r.value
                                ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-600'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}>
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تفاصيل إضافية (اختياري)</p>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="اكتب تفاصيل إضافية عن البلاغ..."
                        maxLength={500} rows={3}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-blue-500 transition-colors resize-none" />
                      <p className="text-[11px] text-gray-400 mt-1">{description.length}/500</p>
                    </div>

                    <button onClick={handleSubmit} disabled={!reason || submitting}
                      className="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                      {submitting ? 'جاري الإرسال...' : 'إرسال البلاغ'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
