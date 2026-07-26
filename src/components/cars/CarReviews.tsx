'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Star, Loader2, MessageSquare, ShieldCheck, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CarReviewModal } from './CarReviewModal';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  carConditionRating: number | null;
  descriptionAccuracy: number | null;
  valueForMoney: number | null;
  dealerExperience: number | null;
  createdAt: string;
  dealerReply: string | null;
  repliedAt: string | null;
  user: { id: string; name: string; image: string | null };
}

interface Props {
  carId: string;
  carName: string;
  /** Optional pre-known aggregate rating — falls back to displayed average from reviews. */
  aggregate?: { rating: number; reviewCount: number };
}

const PER_PAGE = 5;

export function CarReviews({ carId, carName, aggregate }: Props) {
  const { user, _hydrated } = useAuth();
  const authLoading = !_hydrated;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Rateable completed bookings for the current user on this car
  const [rateableBookings, setRateableBookings] = useState<{ id: string; createdAt: string }[]>([]);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [modalBookingId, setModalBookingId] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cars/${carId}/reviews?page=${page}&limit=${PER_PAGE}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data.reviews as Review[]);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch {
      /* silent — non-critical section */
    } finally {
      setLoading(false);
    }
  }, [carId, page]);

  const loadRateable = useCallback(async () => {
    if (!user) {
      setRateableBookings([]); setReviewedBookingIds(new Set());
      return;
    }
    try {
      // Completed bookings of this user on this car
      const res = await fetch(`/api/bookings?role=buyer&status=COMPLETED&carId=${carId}&limit=50`);
      const data = await res.json();
      if (data.success) {
        const completed = (data.data.bookings as { id: string; createdAt: string }[]) || [];
        setRateableBookings(completed);
      }
    } catch { /* silent */ }
    // Existing reviews authored by the current user for this car — to dedupe.
    try {
      const res = await fetch(`/api/cars/${carId}/reviews?limit=50`);
      const data = await res.json();
      if (data.success) {
        const mine = (data.data.reviews as Review[])
          .filter((r) => r.user.id === user.id)
          .map((r) => r.id);
        setReviewedBookingIds(new Set(mine));
      }
    } catch { /* silent */ }
  }, [user, carId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);
  useEffect(() => {
    if (!authLoading) loadRateable();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, carId]);

  const onReviewed = () => {
    loadReviews();
    loadRateable();
  };

  // Compute adjusted average from already-loaded reviews (inputs the
  // API doesn't paginate-compute) — fall back to the prop aggregate
  // if provided (which is more accurate; it counts hidden=false too).
  const avg = aggregate && aggregate.reviewCount > 0
    ? aggregate.rating
    : reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;
  const count = aggregate && aggregate.reviewCount > 0
    ? aggregate.reviewCount
    : reviews.length;

  // Rateable prompts — bookings the user completed but has no review on yet
  const prompts = rateableBookings.filter((b) => !reviewedBookingIds.has(b.id));

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">تقييمات السيارة والتاجر</h2>
      </div>

      {/* Average block */}
      <div className="card p-5 mb-5 flex items-center gap-5 flex-wrap">
        <div className="text-center">
          <p className="text-4xl font-extrabold text-amber-500">{avg.toFixed(1)}</p>
          <div className="flex items-center justify-center gap-0.5 mt-1" dir="ltr">
            {[1,2,3,4,5].map((s) => (
              <Star key={s}
                className={`w-4 h-4 ${s <= Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">{count} تقييم</p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 flex-1 min-w-[200px]">
          التقييمات هنا مبنية على تجارب حقيقية لمشترين أتموا صفقة عبر منصة الحجز.
          كل تقييم موثّق بطلب حجز مكتمل ✓
        </p>
      </div>

      {/* Rating prompts for the current user */}
      {prompts.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 p-5 mb-5 border-2 border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <p className="font-semibold text-gray-900 dark:text-white">قم بتقييم هذه التجربة</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            لديك {prompts.length} حجز {prompts.length === 1 ? 'مكتمل لم تُقيّمه بعد' : 'مكتملة لم تُقيّمها بعد'} على هذه السيارة. ملاحظاتك تساعد غيرك في القرار.
          </p>
          <div className="flex flex-wrap gap-2">
            {prompts.map((b) => (
              <button key={b.id} onClick={() => setModalBookingId(b.id)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 flex items-center gap-2">
                <Star className="w-4 h-4" /> تقييم الحجز
              </button>
            ))}
          </div>
        </div>
      )}

      {modalBookingId && (
        <CarReviewModal carId={carId} bookingId={modalBookingId} carName={carName}
          isOpen={!!modalBookingId}
          onClose={() => setModalBookingId(null)}
          onReviewed={onReviewed} />
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="card p-8 text-center">
          <Star className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="font-medium text-gray-700 dark:text-gray-200">لا توجد تقييمات بعد</p>
          <p className="text-sm text-gray-400">تظهر التقييمات هنا بعد إتمام الصفقات.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <motion.div key={r.id} layout
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="card p-5">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                  {r.user.image ? (
                    <img src={r.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    r.user.name?.charAt(0) || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{r.user.name}</p>
                  <div className="flex items-center gap-1" dir="ltr">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s}
                        className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                    <span className="text-xs text-gray-400 mr-1">
                      {new Date(r.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-500" aria-label="تقييم موثّق بصفقة مكتملة" />
              </div>

              {r.comment && <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">{r.comment}</p>}

              {/* Subratings grid */}
              {(r.carConditionRating || r.descriptionAccuracy || r.valueForMoney || r.dealerExperience) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs">
                  <SubChip label="الحالة"        v={r.carConditionRating} />
                  <SubChip label="مطابقة الوصف"   v={r.descriptionAccuracy} />
                  <SubChip label="القيمة"        v={r.valueForMoney} />
                  <SubChip label="خبرة التعامل"  v={r.dealerExperience} />
                </div>
              )}

              {/* Dealer reply */}
              {r.dealerReply && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3 mt-2">
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">رد التاجر</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{r.dealerReply}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm disabled:opacity-50 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4 rotate-180" /> السابق
          </button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm disabled:opacity-50 flex items-center gap-1">
            التالي <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}

function SubChip({ label, v }: { label: string; v: number | null }) {
  if (v == null) return null;
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2 text-center">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <div className="flex items-center justify-center gap-0.5" dir="ltr">
        {[1,2,3,4,5].map((s) => (
          <Star key={s} className={`w-3 h-3 ${s <= v ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
        ))}
      </div>
    </div>
  );
}
