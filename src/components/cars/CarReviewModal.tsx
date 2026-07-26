'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CarReviewModalProps {
  carId: string;
  bookingId: string;
  carName: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewed?: () => void;
}

type Rating = 0 | 1 | 2 | 3 | 4 | 5;

const SUB_RATINGS: { key: SubRatingKey; label: string; desc: string }[] = [
  { key: 'carConditionRating', label: 'حالة السيارة',     desc: 'مطابقة الحالة العامة للوصف' },
  { key: 'descriptionAccuracy', label: 'مطابقة الوصف',    desc: 'هل كانت الإعلان واضحة ودقيقة' },
  { key: 'valueForMoney',       label: 'القيمة مقابل السعر', desc: 'هل تستحق السيارة سعرها' },
  { key: 'dealerExperience',   label: 'خبرة التعامل',     desc: 'كيف كانت معاملتك مع التاجر' },
];
type SubRatingKey = 'carConditionRating' | 'descriptionAccuracy' | 'valueForMoney' | 'dealerExperience';

export function CarReviewModal({ carId, bookingId, carName, isOpen, onClose, onReviewed }: CarReviewModalProps) {
  const [rating, setRating] = useState<Rating>(0);
  const [hover, setHover] = useState<Rating>(0);
  const [subRatings, setSubRatings] = useState<Record<SubRatingKey, Rating>>({
    carConditionRating: 0, descriptionAccuracy: 0, valueForMoney: 0, dealerExperience: 0,
  });
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setRating(0); setHover(0);
    setSubRatings({
      carConditionRating: 0, descriptionAccuracy: 0, valueForMoney: 0, dealerExperience: 0,
    });
    setComment(''); setLoading(false); setDone(false);
  }, [isOpen]);

  const submit = async () => {
    if (rating === 0) { toast.error('الرجاء اختيار التقييم العام'); return; }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        bookingId,
        rating,
        // Don't send subratings equal to 0 — let them be null in DB.
      };
      for (const k of Object.keys(subRatings) as SubRatingKey[]) {
        const v = subRatings[k];
        if (v > 0) payload[k] = v;
      }
      if (comment.trim()) payload.comment = comment.trim();

      const res = await fetch(`/api/cars/${carId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم نشر تقييمك — شكرًا لك');
        setDone(true);
        onReviewed?.();
      } else {
        toast.error(data.error || 'فشل إرسال التقييم');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => { if (!loading) onClose(); }} />
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 16 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-900 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">تقييم السيارة والتاجر</h3>
                </div>
                <button onClick={() => { if (!loading) onClose(); }}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  سيارة: <span className="font-medium text-gray-700 dark:text-gray-200">{carName}</span>
                </p>

                {done ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">تم النشر بنجاح</p>
                    <p className="text-sm text-gray-500 mb-4">شكرًا لك — تقييمك سيساعد غيرك على الاختيار.</p>
                    <button onClick={onClose}
                      className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600">
                      إغلاق
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Overall */}
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">التقييم العام</p>
                      <div className="flex items-center justify-center gap-1" dir="ltr">
                        {([1, 2, 3, 4, 5] as const).map((star) => (
                          <button key={star} type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                            className="p-1 transition-transform hover:scale-110">
                            <Star className={`w-8 h-8 transition-colors ${
                              star <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'
                            }`} />
                          </button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <p className="text-xs text-amber-500 mt-1">
                          {['', 'سيئ', 'مقبول', 'جيد', 'جيد جدًا', 'ممتاز'][rating]}
                        </p>
                      )}
                    </div>

                    {/* Subratings */}
                    <div className="space-y-3">
                      {SUB_RATINGS.map((sub) => (
                        <SubRating key={sub.key}
                          label={sub.label}
                          desc={sub.desc}
                          value={subRatings[sub.key]}
                          onChange={(v) => setSubRatings(s => ({ ...s, [sub.key]: v }))}
                        />
                      ))}
                    </div>

                    {/* Comment */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تعليق (اختياري)</p>
                      <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                        placeholder="شارك تفاصيل تجربتك مع السيارة والتاجر…"
                        maxLength={1000} rows={4}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-amber-500 resize-none" />
                      <p className="text-[11px] text-gray-400 mt-1">{comment.length}/1000</p>
                    </div>

                    <button onClick={submit} disabled={loading || rating === 0}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                      {loading ? 'جاري الإرسال...' : 'نشر التقييم'}
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

function SubRating({ label, desc, value, onChange }: {
  label: string; desc: string; value: Rating; onChange: (v: Rating) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
        <p className="text-[11px] text-gray-400">{desc}</p>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0" dir="ltr">
        {([1, 2, 3, 4, 5] as const).map((star) => (
          <button key={star} type="button" onClick={() => onChange(star)}
            className="p-0.5 transition-transform hover:scale-110">
            <Star className={`w-4 h-4 transition-colors ${
              star <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
}
