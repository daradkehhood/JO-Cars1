'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock, Check, X, MessageCircle, CheckCircle2, Loader2,
  ShoppingBag, Search as SearchIcon, KeyRound, Users, Coins,
  Phone, MapPin, Mail, Car as CarIcon, Clock,
  TrendingUp, TrendingDown, ShieldAlert, LayoutDashboard,
  ArrowLeft, ChevronLeft, XCircle, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

type BookingStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

interface BookingListItem {
  id: string;
  status: BookingStatus;
  wantsPurchase: boolean;
  wantsInspection: boolean;
  wantsTestDrive: boolean;
  visitDate: string | null;
  visitTime: string | null;
  headcount: number;
  proposedPrice: number | null;
  notes: string | null;
  rejectReason: string | null;
  finalPrice: number | null;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  buyerCity: string | null;
  buyerContactPref: string | null;
  conversationId: string | null;
  createdAt: string;
  car: {
    id: string;
    slug: string;
    price: number;
    year: number;
    brand?: { nameAr: string } | null;
    model?: { nameAr: string } | null;
    images?: { url: string }[];
  };
  buyer: { id: string; name: string; image: string | null; phone: string | null };
  dealer?: { id: string; name: string };
  conversation?: { id: string } | null;
}

interface Paginated { bookings: BookingListItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'كل الحجوزات' },
  { value: 'PENDING', label: 'قيد الانتظار' },
  { value: 'ACCEPTED', label: 'مقبولة' },
  { value: 'COMPLETED', label: 'مكتملة' },
  { value: 'REJECTED', label: 'مرفوضة' },
  { value: 'CANCELLED', label: 'ملغاة' },
];

const STATUS_MAP: Record<BookingStatus, { label: string; cls: string; dot: string }> = {
  PENDING:   { label: 'قيد الانتظار', cls: 'text-yellow-400 bg-yellow-400/10',  dot: 'bg-yellow-400' },
  ACCEPTED:  { label: 'مقبولة',       cls: 'text-green-400 bg-green-400/10',   dot: 'bg-green-400' },
  COMPLETED: { label: 'مكتملة',       cls: 'text-blue-400 bg-blue-400/10',     dot: 'bg-blue-400' },
  REJECTED:  { label: 'مرفوضة',       cls: 'text-red-400 bg-red-400/10',       dot: 'bg-red-400' },
  CANCELLED: { label: 'ملغاة',        cls: 'text-gray-400 bg-gray-400/10',     dot: 'bg-gray-400' },
};

export default function TraderBookingsDashboard() {
  const router = useRouter();
  const { user, _hydrated } = useAuth();
  const authLoading = !_hydrated;

  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  // Modal state
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [completeOpen, setCompleteOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [finalPrice, setFinalPrice] = useState<number | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter
        ? `/api/bookings?role=dealer&status=${filter}`
        : `/api/bookings?role=dealer`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setBookings((data.data as Paginated).bookings);
      else toast.error(data.error || 'فشل تحميل الحجوزات');
    } catch {
      toast.error('حدث خطأ في تحميل الحجوزات');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    // المدير = تاجر + مدير: يدخل اللوحة ويرى حجوزاته الواردة كتاجر
    // (لا يُطرد منها). التاجر العادي `dealerVerified=false` يرى رسالة
    // "بانتظار الاعتماد"؛ المدير يتجاوزها (لأنه يملك صلاحية الإدارة).
    if (user.role !== 'TRADER' && user.role !== 'ADMIN') { router.push('/'); return; }
    if (user.role === 'TRADER' && !user.dealerVerified) { return; } // show not-approved state below
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, filter]);

  // Stats — derive client-side from currently-loaded list (works because
  // we expand the list section to many records; the API caps at 50 per page
  // but stats are also computed on the dashboard server-side when needed).
  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1; return acc;
  }, {} as Record<BookingStatus, number>);
  const totals = {
    all: bookings.length,
    pending: counts.PENDING || 0,
    accepted: counts.ACCEPTED || 0,
    completed: counts.COMPLETED || 0,
    rejected: counts.REJECTED || 0,
    cancelled: counts.CANCELLED || 0,
  };

  const acting = async (id: string, status: string, body?: Record<string, unknown>) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...body }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          status === 'ACCEPTED' ? 'تم قبول الحجز ودمج محادثة'
          : status === 'REJECTED' ? 'تم رفض الحجز'
          : status === 'COMPLETED' ? 'تم إكمال الصفقة'
          : status === 'CANCELLED' ? 'تم إلغاء الحجز'
          : 'تم التحديث'
        );
        await load();
      } else {
        toast.error(data.error || 'فشل تنفيذ الإجراء');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setActingId(null);
    }
  };

  const handleAccept = (id: string) => acting(id, 'ACCEPTED');

  const handleConfirmReject = async () => {
    if (!rejectOpen) return;
    if (!rejectReason.trim()) { toast.error('اكتب سبب الرفض'); return; }
    await acting(rejectOpen, 'REJECTED', { rejectReason: rejectReason.trim() });
    setRejectOpen(null); setRejectReason('');
  };

  const handleConfirmComplete = async () => {
    if (!completeOpen) return;
    const body: Record<string, unknown> = {};
    if (finalPrice !== '' && !Number.isNaN(Number(finalPrice))) body.finalPrice = Number(finalPrice);
    await acting(completeOpen, 'COMPLETED', body);
    setCompleteOpen(null); setFinalPrice('');
  };

  // --- Auth / role gates -------------------------------------------------

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (user.role !== 'TRADER' && user.role !== 'DEALER' && user.role !== 'ADMIN') {
    return (
      <CenterMessage
        icon={<ShieldAlert className="w-12 h-12 text-red-400" />}
        title="هذه الصفحة مخصصة للتجار فقط"
        desc="إن كنت تاجرًا، سجّل حساب تاجر وانتظر اعتماد الإدارة."
        cta={{ href: '/', label: 'العودة للرئيسية' }}
      />
    );
  }

  if (user.role === 'TRADER' && !user.dealerVerified) {
    const waiting = (
      <>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          طلب الاعتماد قيد المراجعة من الإدارة، وسيتم تفعيل لوحة الحجوزات فور اعتمادك.
        </p>
        <Link href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
          <ArrowLeft className="w-4 h-4 rotate-180" /> العودة للرئيسية
        </Link>
      </>
    );
    return (
      <CenterMessage
        icon={<Clock className="w-12 h-12 text-amber-400" />}
        title="حسابك ليس موثّقًا بعد"
        desc="يرجى الانتظار حتى تعتمد الإدارة طلب التاجر الخاص بك."
        extra={waiting}
      />
    );
  }

  // --- Render -------------------------------------------------------------

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة تحكم التاجر</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">إدارة طلبات الحجز والشراء</p>
            </div>
          </div>
          <Link href={`/profile/${user.id}`}
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> عرض ملفي العام
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="إجمالي الحجوزات" value={totals.all}      icon={<CalendarClock className="w-5 h-5" />} color="text-emerald-400 bg-emerald-400/10" />
          <StatCard label="قيد الانتظار"     value={totals.pending}  icon={<Clock className="w-5 h-5" />}        color="text-yellow-400 bg-yellow-400/10" />
          <StatCard label="مقبولة"          value={totals.accepted} icon={<Check className="w-5 h-5" />}        color="text-green-400 bg-green-400/10" />
          <StatCard label="مكتملة"          value={totals.completed}icon={<CheckCircle2 className="w-5 h-5" />}color="text-blue-400 bg-blue-400/10" />
          <StatCard label="مرفوضة/ملغاة"     value={totals.rejected + totals.cancelled} icon={<X className="w-5 h-5" />} color="text-red-400 bg-red-400/10" />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : bookings.length === 0 ? (
          <CenterMessage
            icon={<CalendarClock className="w-12 h-12 text-gray-300" />}
            title="لا توجد حجوزات في هذا التصنيف"
            desc="عندما يطلب أحد شراء أو معاينة سياراتك، ستظهر هنا تلقائيًا."
          />
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {bookings.map((b) => (
                <motion.div key={b.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  layout
                  className="card p-5">
                  {/* Top row — status + car */}
                  <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {b.car.images?.[0]?.url ? (
                          <img src={b.car.images[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <CarIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <Link href={`/cars/${b.car.id}`}
                          className="font-semibold text-gray-900 dark:text-white hover:text-emerald-500 transition-colors">
                          {b.car.brand?.nameAr} {b.car.model?.nameAr} {b.car.year}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(b.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                          <StatusChip status={b.status} />
                        </div>
                      </div>
                    </div>

                    <div className="text-end">
                      <p className="text-[11px] text-gray-400">السعر المطلوب</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{b.car.price.toLocaleString('en-US')} د.أ</p>
                      {b.proposedPrice != null && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${b.proposedPrice < b.car.price ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {b.proposedPrice < b.car.price ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          السعر المقترح: {b.proposedPrice.toLocaleString('en-US')} د.أ
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Request type chips */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {b.wantsPurchase  && <Tag icon={<ShoppingBag className="w-3.5 h-3.5" />} label="شراء مباشر"   color="emerald" />}
                    {b.wantsInspection && <Tag icon={<SearchIcon className="w-3.5 h-3.5" />} label="معاينة"         color="blue" />}
                    {b.wantsTestDrive && <Tag icon={<KeyRound className="w-3.5 h-3.5" />}   label="اختبار قيادة"  color="amber" />}
                  </div>

                  {/* Visit data */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <Info icon={<Clock className="w-4 h-4" />} label="موعد الزيارة"
                      value={b.visitDate ? `${new Date(b.visitDate).toLocaleDateString('ar-EG')} ${b.visitTime || ''}` : '—'} />
                    <Info icon={<Users className="w-4 h-4" />} label="عدد الأشخاص" value={String(b.headcount)} />
                    <Info icon={<Coins className="w-4 h-4" />} label="السعر النهائي"
                      value={b.finalPrice != null ? `${b.finalPrice.toLocaleString('en-US')} د.أ` : '—'} />
                  </div>

                  {/* Buyer */}
                  <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 space-y-2 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xs font-bold">
                        {b.buyerName?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{b.buyerName}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /><a href={`tel:${b.buyerPhone}`} className="hover:underline">{b.buyerPhone}</a></span>
                      {b.buyerEmail && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /><a href={`mailto:${b.buyerEmail}`} className="hover:underline truncate">{b.buyerEmail}</a></span>}
                      {b.buyerCity && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" />{b.buyerCity}</span>}
                      {b.buyerContactPref && (
                        <span className="flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                          {b.buyerContactPref === 'whatsapp' ? 'واتساب' : b.buyerContactPref === 'phone' ? 'اتصال هاتفي' : 'بريد إلكتروني'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {b.notes && (
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 mb-4">
                      <p className="text-[11px] text-gray-400 mb-1">ملاحظات المشتري</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200">{b.notes}</p>
                    </div>
                  )}

                  {/* Reject reason (if rejected) */}
                  {b.status === 'REJECTED' && b.rejectReason && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 mb-4 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-400">سبب الرفض: {b.rejectReason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    {b.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleAccept(b.id)} disabled={actingId === b.id}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5">
                          {actingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          قبول وفتح محادثة
                        </button>
                        <button onClick={() => { setRejectOpen(b.id); setRejectReason(''); }} disabled={actingId === b.id}
                          className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4" /> رفض مع سبب
                        </button>
                      </>
                    )}
                    {b.status === 'ACCEPTED' && (
                      <>
                        {b.conversationId && (
                          <Link href={`/messages?conversationId=${b.conversationId}`}
                            className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4" /> محادثة
                          </Link>
                        )}
                        <button onClick={() => { setCompleteOpen(b.id); setFinalPrice(b.proposedPrice ?? b.car.price); }} disabled={actingId === b.id}
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
                          {actingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          إكمال الصفقة
                        </button>
                      </>
                    )}
                    {b.status === 'COMPLETED' && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-2">
                        <CheckCircle2 className="w-4 h-4" /> الصفقة مكتملة — يمكن للمشتري التقييم الآن
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
              onClick={() => { setRejectOpen(null); setRejectReason(''); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">رفض الحجز مع سبب</h3>
                  </div>
                  <button onClick={() => { setRejectOpen(null); setRejectReason(''); }}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">سيصل سبب الرفض كإشعار إلى المشتري، ويُفضّل الرد بأسلوب مهذب.</p>
                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="مثال: السيارة مبيوعة مؤخرًا، أو الموعد غير مناسب…"
                    maxLength={500} rows={4}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-red-500 resize-none" />
                  <p className="text-[11px] text-gray-400">{rejectReason.length}/500</p>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                  <button onClick={() => { setRejectOpen(null); setRejectReason(''); }}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                    إلغاء
                  </button>
                  <button onClick={handleConfirmReject} disabled={!rejectReason.trim() || actingId === rejectOpen}
                    className="px-5 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {actingId === rejectOpen ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    تأكيد الرفض
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Complete modal */}
      <AnimatePresence>
        {completeOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
              onClick={() => { setCompleteOpen(null); setFinalPrice(''); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">إكمال الصفقة</h3>
                  </div>
                  <button onClick={() => { setCompleteOpen(null); setFinalPrice(''); }}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">سيتم إغلاق الحجز وفتح إمكانية التقييم للمشتري.</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر النهائي النهائي للصفقة (د.أ) — اختياري</label>
                    <input type="number" min={0} inputMode="numeric" value={finalPrice}
                      onChange={(e) => setFinalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                  <button onClick={() => { setCompleteOpen(null); setFinalPrice(''); }}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                    إلغاء
                  </button>
                  <button onClick={handleConfirmComplete} disabled={actingId === completeOpen}
                    className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {actingId === completeOpen ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    تأكيد الإكمال
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----- sub-components -----

function CenterMessage({ icon, title, desc, cta, extra }: {
  icon: React.ReactNode; title: string; desc?: string;
  cta?: { href: string; label: string }; extra?: React.ReactNode;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card p-8 max-w-md text-center">
        <div className="flex justify-center mb-3">{icon}</div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h2>
        {desc && <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>}
        {extra}
        {cta && (
          <Link href={cta.href}
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: BookingStatus }) {
  const info = STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${info.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
      {info.label}
    </span>
  );
}

function Tag({ icon, label, color }: {
  icon: React.ReactNode; label: string; color: 'emerald' | 'blue' | 'amber';
}) {
  const cls = {
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    blue:    'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    amber:   'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }[color];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium ${cls}`}>
      {icon}{label}
    </span>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-gray-400 flex-shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}
