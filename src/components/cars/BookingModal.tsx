'use client';

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock, ClipboardCheck, Coins, User,
  Check, CheckCircle2, X, Loader2, ShoppingBag, Search as SearchIcon,
  KeyRound, Users, Car as CarIcon, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface BookingModalProps {
  carId: string;
  carTitle: string;
  askingPrice: number;
  isOpen: boolean;
  onClose: () => void;
  /** Optional owner-profile suggestion for city/contact; we fall back to profile state. */
  dealerName?: string;
}

const STEPS = ['نوع الطلب', 'موعد الزيارة', 'السعر والملاحظات', 'معلومات التواصل'] as const;

type ContactPref = 'whatsapp' | 'phone' | 'email';

export function BookingModal({
  carId, carTitle, askingPrice, isOpen, onClose, dealerName,
}: BookingModalProps) {
  const { user: currentUser } = useAuth();

  // Step index
  const [step, setStep] = useState(0);

  // Step 1 — request type
  const [wantsPurchase, setWantsPurchase] = useState(false);
  const [wantsInspection, setWantsInspection] = useState(false);
  const [wantsTestDrive, setWantsTestDrive] = useState(false);

  // Step 2 — visit
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [headcount, setHeadcount] = useState(1);

  // Step 3 — price + notes
  const [proposedPrice, setProposedPrice] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Step 4 — contact (prefill from logged-in profile where possible)
  const [buyerName, setBuyerName] = useState(currentUser?.name ?? '');
  const [buyerPhone, setBuyerPhone] = useState(currentUser?.phone ?? currentUser?.whatsapp ?? '');
  const [buyerEmail, setBuyerEmail] = useState(currentUser?.email ?? '');
  const [buyerCity, setBuyerCity] = useState('');
  const [buyerContactPref, setBuyerContactPref] = useState<ContactPref>('whatsapp');

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Reset state whenever modal is (re)opened
  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setWantsPurchase(false); setWantsInspection(false); setWantsTestDrive(false);
    setVisitDate(''); setVisitTime(''); setHeadcount(1);
    setProposedPrice(''); setNotes('');
    setBuyerName(currentUser?.name ?? '');
    setBuyerPhone(currentUser?.phone ?? currentUser?.whatsapp ?? '');
    setBuyerEmail(currentUser?.email ?? '');
    setBuyerCity(''); setBuyerContactPref('whatsapp');
    setSubmitting(false); setDone(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Step validation
  const step1Valid = wantsPurchase || wantsInspection || wantsTestDrive;
  const step2Valid = !!visitDate && !!visitTime && headcount >= 1;
  const step3Valid = true; // price/notes optional but step is always valid
  const step4Valid = !!buyerName.trim() && !!buyerPhone.trim();

  const canAdvance = useMemo(() => {
    if (step === 0) return step1Valid;
    if (step === 1) return step2Valid;
    if (step === 2) return step3Valid;
    return true;
  }, [step, step1Valid, step2Valid, step3Valid]);

  const next = () => {
    if (!canAdvance) {
      toast.error('الرجاء إكمال الحقول المطلوبة');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!step4Valid) {
      toast.error('الاسم ورقم الهاتف مطلوبان');
      return;
    }
    if (!currentUser) {
      toast.error('الرجاء تسجيل الدخول أولاً');
      return;
    }
    setSubmitting(true);
    try {
      // Build the negative ask from optional fields only when provided
      const payload: Record<string, unknown> = {
        carId,
        wantsPurchase,
        wantsInspection,
        wantsTestDrive,
        visitDate: new Date(`${visitDate}T${visitTime}:00`).toISOString(),
        visitTime,
        headcount: Number(headcount),
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerContactPref,
      };
      if (proposedPrice !== '' && !Number.isNaN(Number(proposedPrice))) {
        payload.proposedPrice = Number(proposedPrice);
      }
      if (notes.trim()) payload.notes = notes.trim().slice(0, 1000);
      if (buyerEmail.trim()) payload.buyerEmail = buyerEmail.trim();
      if (buyerCity.trim()) payload.buyerCity = buyerCity.trim();

      const res = await fetch('/api/cars/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        toast.success('تم إرسال طلب الحجز — سيتواصل معك التاجر قريبًا');
      } else {
        toast.error(data.error || 'فشل إرسال طلب الحجز');
      }
    } catch {
      toast.error('حدث خطأ اتصال — حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  const CloseButton = () => (
    <button
      onClick={() => { if (!submitting) onClose(); }}
      disabled={submitting}
      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
    >
      <X className="w-5 h-5 text-gray-500" />
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => { if (!submitting) onClose(); }} />
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 16 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">
                      إنشاء حجز شراء سيارة
                    </h3>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400">{carTitle}</p>
                  </div>
                </div>
                <CloseButton />
              </div>

              {!currentUser ? (
                <div className="p-8 text-center">
                  <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-300 mb-3">الرجاء تسجيل الدخول لإنشاء حجز</p>
                  <a href="/auth/login" className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
                    تسجيل الدخول
                  </a>
                </div>
              ) : done ? (
                <div className="p-8 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                  </motion.div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">تم إرسال طلب الحجز بنجاح</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    وصل طلبك إلى {dealerName || 'التاجر'} وسيظهر في لوحة تحكمه.
                  </p>
                  <p className="text-xs text-gray-400 mb-5">سيتم إشعارك عند قبول الطلب أو رفضه.</p>
                  <button onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
                    تم
                  </button>
                </div>
              ) : (
                <>
                  {/* Progress bar */}
                  <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      {STEPS.map((label, i) => (
                        <div key={label} className="flex-1 flex items-center">
                          <div className="flex flex-col items-center flex-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${
                              i < step
                                ? 'bg-emerald-500 text-white'
                                : i === step
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                            }`}>
                              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                            </div>
                            <span className="text-[10px] mt-1 text-gray-500 dark:text-gray-400 text-center">{label}</span>
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className={`h-0.5 w-6 -mt-3 rounded-full transition-all ${i < step ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="p-5 space-y-4 min-h-[260px]">
                    {/* Step 1 — request type */}
                    {step === 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">ما نوع الطلب؟ <span className="text-gray-400">(اختر واحدًا أو أكثر)</span></p>
                        <RequestOption
                          icon={<ShoppingBag className="w-5 h-5" />} title="شراء مباشر"
                          desc="أرغب بشراء السيارة مباشرة"
                          checked={wantsPurchase} onToggle={() => setWantsPurchase(v => !v)} color="emerald"
                        />
                        <RequestOption
                          icon={<SearchIcon className="w-5 h-5" />} title="معاينة"
                          desc="أرغب بمعاينة السيارة قبل البتّ"
                          checked={wantsInspection} onToggle={() => setWantsInspection(v => !v)} color="blue"
                        />
                        <RequestOption
                          icon={<KeyRound className="w-5 h-5" />} title="اختبار قيادة"
                          desc="أرغب بقيادة السيارة قبل البتّ"
                          checked={wantsTestDrive} onToggle={() => setWantsTestDrive(v => !v)} color="amber"
                        />
                      </div>
                    )}

                    {/* Step 2 — visit */}
                    {step === 1 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="تاريخ الزيارة" required>
                            <input type="date" value={visitDate} min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setVisitDate(e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500" />
                          </Field>
                          <Field label="وقت الزيارة" required>
                            <input type="time" value={visitTime}
                              onChange={(e) => setVisitTime(e.target.value)}
                              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500" />
                          </Field>
                        </div>
                        <Field label="عدد الأشخاص القادمين">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setHeadcount(h => Math.max(1, h - 1))} type="button"
                              className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">−</button>
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 min-w-[80px] justify-center">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{headcount}</span>
                            </div>
                            <button onClick={() => setHeadcount(h => Math.min(20, h + 1))} type="button"
                              className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">+</button>
                          </div>
                        </Field>
                      </div>
                    )}

                    {/* Step 3 — price + notes */}
                    {step === 2 && (
                      <div className="space-y-4">
                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">السعر المطلوب من التاجر</span>
                          </div>
                          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {askingPrice.toLocaleString('en-US')} د.أ
                          </span>
                        </div>
                        <Field label="سعرك المقترح (د.أ)" hint="اختياري — اكتب سعرك أو اتركه فارغًا لقبول سعر التاجر">
                          <input type="number" min={0} inputMode="numeric" value={proposedPrice}
                            onChange={(e) => setProposedPrice(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder={String(askingPrice)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-emerald-500" />
                        </Field>
                        <Field label="ملاحظات إضافية" hint="أي تفاصيل أو أسئلة للتاجر">
                          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={4}
                            placeholder="مثال: لدي توافقات في التمويل، أرغب بمشاهدتها قبل الظهر، …"
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-emerald-500 resize-none" />
                          <p className="text-[11px] text-gray-400 mt-1">{notes.length}/1000</p>
                        </Field>
                      </div>
                    )}

                    {/* Step 4 — contact */}
                    {step === 3 && (
                      <div className="space-y-3">
                        <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-3 flex items-center gap-2 text-blue-700 dark:text-blue-300 text-xs">
                          <ClipboardCheck className="w-4 h-4 flex-shrink-0" />
                          <span>سيتمكن التاجر من رؤية معلومات التواصل وكافة تفاصيل الحجز.</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="الاسم الكامل" required>
                            <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} maxLength={80}
                              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500" />
                          </Field>
                          <Field label="رقم الهاتف / واتساب" required>
                            <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} maxLength={20} inputMode="tel"
                              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500" />
                          </Field>
                          <Field label="البريد الإلكتروني (اختياري)">
                            <input value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} type="email" maxLength={120}
                              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500" />
                          </Field>
                          <Field label="المدينة">
                            <input value={buyerCity} onChange={(e) => setBuyerCity(e.target.value)} maxLength={60}
                              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500" />
                          </Field>
                        </div>
                        <Field label="طريقة التواصل المفضّلة">
                          <div className="grid grid-cols-3 gap-2">
                            {([
                              { value: 'whatsapp', label: 'واتساب' },
                              { value: 'phone', label: 'اتصال' },
                              { value: 'email', label: 'بريد' },
                            ] as const).map((opt) => (
                              <button key={opt.value} type="button" onClick={() => setBuyerContactPref(opt.value)}
                                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                                  buyerContactPref === opt.value
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                }`}>{opt.label}</button>
                            ))}
                          </div>
                        </Field>
                        {/* Summary */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 mt-1">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">ملخص الطلب</p>
                          <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <li className="flex items-center gap-1"><CarIcon className="w-3.5 h-3.5" /> {carTitle}</li>
                            <li className="flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> {visitDate || '—'} {visitTime && `الساعة ${visitTime}`}</li>
                            <li className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {headcount} شخص</li>
                            <li className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" /> {[
                              wantsPurchase && 'شراء', wantsInspection && 'معاينة', wantsTestDrive && 'اختبار قيادة',
                            ].filter(Boolean).join(' / ') || '—'}</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer — navigation buttons */}
                  <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-5 py-3 flex items-center gap-3">
                    {step > 0 && (
                      <button onClick={back} type="button" disabled={submitting}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4 rotate-180" /> السابق
                      </button>
                    )}
                    {step < STEPS.length - 1 ? (
                      <button onClick={next} type="button" disabled={!canAdvance}
                        className="mr-auto px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                        التالي <ArrowLeft className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={handleSubmit} type="button" disabled={!step4Valid || submitting}
                        className="mr-auto px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {submitting ? 'جاري الإرسال...' : 'تأكيد وإرسال الطلب'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- helpers ----------

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function RequestOption({
  icon, title, desc, checked, onToggle, color,
}: {
  icon: ReactNode; title: string; desc: string;
  checked: boolean; onToggle: () => void;
  color: 'emerald' | 'blue' | 'amber';
}) {
  const colors = {
    emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    amber: 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };
  return (
    <button type="button" onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-start transition-all ${
        checked ? colors[color] : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-gray-300'
      }`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        checked ? 'bg-white/60 dark:bg-white/10' : 'bg-gray-100 dark:bg-gray-800'
      }`}>{icon}</div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
        checked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 dark:border-gray-600'
      }`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
    </button>
  );
}
