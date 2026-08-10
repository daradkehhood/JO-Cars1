'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, X, ChevronDown, Loader2, Truck, FileText, BadgeCheck } from 'lucide-react';

interface Props {
  year: number;
  engineCapacity: number | null;
  price: number;
}

interface CalculationResult {
  customsDuty: number;
  registrationFee: number;
  licensingFee: number;
  totalFees: number;
  totalCarCost: number;
  annualLicensing: number;
  customsRate: number;
  depreciatedValue: number;
  breakdown?: {
    cifValue: number;
    customsBase: number;
    specialTax: number;
    vat: number;
    note: string;
  };
}

export function CustomsCalculator({ year, engineCapacity, price }: Props) {
  const [open, setOpen] = useState(false);
  const [isFreeZone, setIsFreeZone] = useState(false); // المنطقة الحرة vs مجمركة جاهزة
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/customs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, engineCapacity, price, isFreeZone }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
      }
    } catch {
      // Silent fail
    }
    setLoading(false);
  };

  const handleToggle = () => {
    if (!open) {
      setOpen(true);
      if (!result) calculate();
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="card overflow-hidden">
      <button onClick={handleToggle}
        className="w-full p-4 flex items-center justify-between group hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 dark:text-white">حاسبة الجمارك والترخيص الأردنية 🇯🇴</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">تحديث 2026</span>
            </div>
            <p className="text-xs text-gray-500">حساب الرسوم الجمركية والترخيص والتأمين وفقاً للتعريفة الرسمية</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
            className="border-t border-gray-100 dark:border-gray-800">
            <div className="p-5 space-y-4">

              {/* Status Toggle (Customs Paid vs Free Zone) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">حالة السيارة والتخليص:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsFreeZone(false); calculate(); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      !isFreeZone
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    مجمركة ومترخصة جاهزة ✅
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsFreeZone(true); calculate(); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isFreeZone
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    المنطقة الحرة الزرقاء (حرة) 🏙️
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              ) : result ? (
                <>
                  {!isFreeZone ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 shrink-0 text-emerald-600" />
                      <span>السعر المعلن <strong>({price.toLocaleString('ar-JO')} د.أ)</strong> يشمل التخليص والجمارك الجاهزة. الترخيص والتأمين السنوي التقديري: <strong>{result.annualLicensing.toLocaleString('ar-JO')} د.أ</strong></span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <Truck className="w-5 h-5 shrink-0 text-amber-600" />
                      <span>السيارة في المنطقة الحرة (غير مجمركة). اجمالي تكلفة التخليص والجمارك والترخيص التقديرية: <strong>+{result.totalFees.toLocaleString('ar-JO')} د.أ</strong></span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs mb-1">
                        <Truck className="w-3.5 h-3.5" /> الجمارك ({Math.round(result.customsRate * 100)}%)
                      </div>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{result.customsDuty.toLocaleString('ar-JO')} د.أ</p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs mb-1">
                        <FileText className="w-3.5 h-3.5" /> رسوم التسجيل والأرقام
                      </div>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{result.registrationFee.toLocaleString('ar-JO')} د.أ</p>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20">
                      <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs mb-1">
                        <BadgeCheck className="w-3.5 h-3.5" /> الترخيص السنوي
                      </div>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{result.annualLicensing.toLocaleString('ar-JO')} د.أ</p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs mb-1">تخمين الجمارك (CIF)</div>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{result.depreciatedValue.toLocaleString('ar-JO')} د.أ</p>
                    </div>
                  </div>

                  {result.breakdown && (
                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-1.5 text-xs border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between">
                        <span className="text-gray-500">ضريبة المبيعات العامة (16%)</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{result.breakdown.vat.toLocaleString('ar-JO')} د.أ</span>
                      </div>
                      {result.breakdown.specialTax > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">الضريبة الخاصة حسب السعة/القدرة</span>
                          <span className="font-semibold text-amber-500">{result.breakdown.specialTax.toLocaleString('ar-JO')} د.أ</span>
                        </div>
                      )}
                      {result.breakdown.note && (
                        <p className="text-[11px] text-slate-400 pt-1 border-t border-gray-200 dark:border-gray-700">{result.breakdown.note}</p>
                      )}
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-900/20">
                    <p className="text-xs opacity-90 mb-1">المجموع الكلي التقديري لامتلاك وترخيص السيارة</p>
                    <p className="text-3xl font-black">{result.totalCarCost.toLocaleString('ar-JO')} د.أ</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20 text-xs opacity-90">
                      <span>سعر المعلن: {price.toLocaleString('ar-JO')} د.أ</span>
                      <span>إجمالي الجمارك والتسجيل: {result.totalFees.toLocaleString('ar-JO')} د.أ</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-400 leading-relaxed">
                    * الحسابات دقيقة وتستند إلى تعريفات دائرة الجمارك الأردنية 2026 وقوانين استيراد المنطقة الحرة بالزرقاء. التقييم النهائي يرتبط بمعاينة التخمين الجمركي عند المعاينة الفتية.
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
