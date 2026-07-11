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
}

export function CustomsCalculator({ year, engineCapacity, price }: Props) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = () => {
    setLoading(true);
    setTimeout(() => {
      const currentYear = new Date().getFullYear();
      const age = currentYear - year;
      const cc = engineCapacity || 2000;

      // Depreciation tier (CIF value estimation)
      let depreciationFactor: number;
      if (age <= 1) depreciationFactor = 0.95;
      else if (age <= 3) depreciationFactor = 0.90;
      else if (age <= 5) depreciationFactor = 0.80;
      else if (age <= 7) depreciationFactor = 0.70;
      else if (age <= 10) depreciationFactor = 0.55;
      else depreciationFactor = 0.40;

      const depreciatedValue = Math.round(price * depreciationFactor);

      // Customs duty rate by engine capacity
      let customsRate: number;
      if (cc <= 1500) customsRate = 0.36;
      else if (cc <= 2000) customsRate = 0.40;
      else if (cc <= 2500) customsRate = 0.55;
      else if (cc <= 3000) customsRate = 0.70;
      else customsRate = 0.85;

      const customsDuty = Math.round(depreciatedValue * customsRate);

      // One-time registration fee
      let registrationFee: number;
      if (cc <= 2000) registrationFee = 85;
      else if (cc <= 3000) registrationFee = 110;
      else registrationFee = 140;

      // Annual licensing fee
      let annualLicensing: number;
      if (cc <= 1500) annualLicensing = 35;
      else if (cc <= 2000) annualLicensing = 45;
      else if (cc <= 2500) annualLicensing = 60;
      else if (cc <= 3000) annualLicensing = 75;
      else annualLicensing = 100;

      // If diesel, add 20%
      // We don't know fuel type here so we keep as gasoline rates

      const totalFees = customsDuty + registrationFee + annualLicensing;
      const totalCarCost = price + totalFees;

      setResult({
        customsDuty, registrationFee, licensingFee: annualLicensing,
        totalFees, totalCarCost, annualLicensing, customsRate,
        depreciatedValue,
      });
      setLoading(false);
    }, 500);
  };

  const handleToggle = () => {
    if (!open) {
      setOpen(true);
      calculate();
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="card overflow-hidden">
      <button onClick={handleToggle}
        className="w-full p-4 flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-500/20 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900 dark:text-white">حاسبة الجمارك والتسجيل</p>
            <p className="text-sm text-gray-500">تقدير رسوم الجمارك والترخيص والفحص</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
            className="border-t border-gray-100 dark:border-gray-800">
            <div className="p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              ) : result ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs mb-1">
                        <Truck className="w-3.5 h-3.5" /> الجمارك ({Math.round(result.customsRate * 100)}%)
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{result.customsDuty.toLocaleString('ar-JO')} د.أ</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs mb-1">
                        <FileText className="w-3.5 h-3.5" /> التسجيل لمرة واحدة
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{result.registrationFee.toLocaleString('ar-JO')} د.أ</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10">
                      <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs mb-1">
                        <BadgeCheck className="w-3.5 h-3.5" /> الترخيص السنوي
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{result.annualLicensing.toLocaleString('ar-JO')} د.أ</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs mb-1">القيمة التقديرية (CIF)</div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{result.depreciatedValue.toLocaleString('ar-JO')} د.أ</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <p className="text-xs opacity-80 mb-1">المجموع الكامل (سعر السيارة + الرسوم)</p>
                    <p className="text-2xl font-bold">{result.totalCarCost.toLocaleString('ar-JO')} د.أ</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20 text-sm">
                      <span>سعر السيارة: {price.toLocaleString('ar-JO')} د.أ</span>
                      <span>الرسوم: +{result.totalFees.toLocaleString('ar-JO')} د.أ</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 leading-relaxed">
                    * الأسعار تقريبية وتعتمد على سعة المحرك وسنة الصنع. القيمة الجمركية (CIF) تحسب بنسبة {Math.round(result.customsRate * 100)}% من قيمة السيارة بعد الاستهلاك.
                    قد تختلف الرسوم الفعلية حسب التقييم الجمركي ونوع الوقود والتجهيزات.
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
