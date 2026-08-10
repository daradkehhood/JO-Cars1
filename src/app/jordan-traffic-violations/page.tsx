'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import {
  ShieldAlert, Calculator, Car, FileText, CheckCircle2, AlertTriangle,
  Sparkles, DollarSign, Award, Clock, MapPin, Zap, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function JordanTrafficViolationsPage() {
  // License renewal state
  const [engineCc, setEngineCc] = useState<number>(2000);
  const [fuelType, setFuelType] = useState<'PETROL' | 'HYBRID' | 'EV'>('PETROL');
  const [carAge, setCarAge] = useState<number>(5);

  // Violation calculator state
  const [speedViolation, setSpeedViolation] = useState<number>(0); // 0: none, 1: 10-30km/h, 2: >30km/h
  const [phoneViolation, setPhoneViolation] = useState<boolean>(false);
  const [seatbeltViolation, setSeatbeltViolation] = useState<boolean>(false);
  const [redLightViolation, setRedLightViolation] = useState<boolean>(false);

  // 1. Calculate License Renewal Fee (تقدير رسوم الترخيص والفحص الفني بالأردن)
  const calculateLicenseFee = () => {
    let baseFee = 50;
    if (fuelType === 'EV') {
      baseFee = 35;
    } else if (fuelType === 'HYBRID') {
      if (engineCc <= 1600) baseFee = 60;
      else if (engineCc <= 2000) baseFee = 90;
      else baseFee = 130;
    } else {
      // Petrol
      if (engineCc <= 1600) baseFee = 75;
      else if (engineCc <= 2000) baseFee = 120;
      else if (engineCc <= 3000) baseFee = 240;
      else baseFee = 400;
    }

    const inspectionFee = 15; // فحص فني إدارة السير
    const mandatoryInsurance = fuelType === 'EV' ? 85 : engineCc <= 2000 ? 95 : 120; // التأمين الإجباري ضد الغير

    return {
      licenseFee: baseFee,
      inspectionFee,
      insuranceFee: mandatoryInsurance,
      total: baseFee + inspectionFee + mandatoryInsurance,
    };
  };

  // 2. Calculate Traffic Fines (قانون السير المعدل بالأردن)
  const calculateFines = () => {
    let totalFines = 0;
    const list: { title: string; amount: number }[] = [];

    if (speedViolation === 1) {
      list.push({ title: 'مخالفة تجاوز السرعة المقررة (10 - 30 كم/س)', amount: 30 });
      totalFines += 30;
    } else if (speedViolation === 2) {
      list.push({ title: 'مخالفة تجاوز السرعة بأكثر من 30 كم/س (كاميرا)', amount: 100 });
      totalFines += 100;
    }

    if (phoneViolation) {
      list.push({ title: 'مخالفة استخدام الهاتف أثناء القيادة', amount: 50 });
      totalFines += 50;
    }

    if (seatbeltViolation) {
      list.push({ title: 'مخالفة عدم استخدام حزام الأمان', amount: 20 });
      totalFines += 20;
    }

    if (redLightViolation) {
      list.push({ title: 'مخالفة تجاوز الإشارة الضوئية الحمراء', amount: 200 });
      totalFines += 200;
    }

    return { totalFines, list };
  };

  const licenseResult = calculateLicenseFee();
  const finesResult = calculateFines();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between text-gray-900 dark:text-gray-100">
      <Header />

      <main className="container-custom max-w-5xl mx-auto px-4 py-8 flex-1">
        {/* Page Hero */}
        <div className="card p-6 sm:p-8 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white mb-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-50" />
          <div className="relative z-10">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 inline-flex items-center gap-1.5 mb-3">
              <ShieldAlert className="w-4 h-4" /> قانون السير والتراخيص الأردني 2026 🇯🇴
            </span>
            <h1 className="text-2xl sm:text-4xl font-black mb-2">حاسبة ترخيص المركبات والمخالفات المرورية</h1>
            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              احسب تكاليف تجديد ترخيص سيارتك والفحص الفني والتأمين الإجباري بالأردن، بالإضافة لتقدير قيمة المخالفات المرورية حسب التعرفة الرسمية.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section 1: Vehicle License Renewal Calculator */}
          <div className="card p-6 space-y-5 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white">حاسبة رسوم الترخيص والتأمين</h2>
                <p className="text-xs text-gray-500">تقدير التكلفة السنوية لإعادة الترخيص بالأردن</p>
              </div>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">نوع وقود المحرك</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFuelType('EV')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    fuelType === 'EV'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  ⚡ كهرباء (EV)
                </button>
                <button
                  onClick={() => setFuelType('HYBRID')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    fuelType === 'HYBRID'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  🔋 هايبرد (Hybrid)
                </button>
                <button
                  onClick={() => setFuelType('PETROL')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    fuelType === 'PETROL'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  ⛽ بنزين (Petrol)
                </button>
              </div>
            </div>

            {/* Engine CC */}
            {fuelType !== 'EV' && (
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  سعة المحرك (CC): <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{engineCc} CC</span>
                </label>
                <input
                  type="range"
                  min="1000"
                  max="4500"
                  step="100"
                  value={engineCc}
                  onChange={(e) => setEngineCc(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>1000 CC</span>
                  <span>2000 CC</span>
                  <span>3000 CC</span>
                  <span>4500+ CC</span>
                </div>
              </div>
            )}

            {/* Result Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 space-y-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>رسوم رخصة المركبة:</span>
                <span className="font-bold text-gray-900 dark:text-white">{licenseResult.licenseFee} د.أ</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>رسوم الفحص الفني (إدارة السير):</span>
                <span className="font-bold text-gray-900 dark:text-white">{licenseResult.inspectionFee} د.أ</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>التأمين الإجباري ضد الغير:</span>
                <span className="font-bold text-gray-900 dark:text-white">{licenseResult.insuranceFee} د.أ</span>
              </div>
              <div className="pt-2 border-t border-emerald-500/20 flex justify-between items-center text-sm font-black text-emerald-700 dark:text-emerald-400">
                <span>المجموع الكلي للتجديد:</span>
                <span className="text-xl">{licenseResult.total} د.أ</span>
              </div>
            </div>
          </div>

          {/* Section 2: Traffic Violation Fine Calculator */}
          <div className="card p-6 space-y-5 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white">حاسبة المخالفات المرورية</h2>
                <p className="text-xs text-gray-500">حساب قيمة المخالفات وفق قانون السير الأردني</p>
              </div>
            </div>

            {/* Speed Options */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">مخالفات السرعة والكاميرات</label>
              <select
                value={speedViolation}
                onChange={(e) => setSpeedViolation(parseInt(e.target.value, 10))}
                className="input text-xs"
              >
                <option value={0}>لا يوجد مخالفة سرعة</option>
                <option value={1}>تجاوز السرعة 10 - 30 كم/س (30 د.أ)</option>
                <option value={2}>تجاوز السرعة بأكثر من 30 كم/س (100 د.أ)</option>
              </select>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={phoneViolation}
                  onChange={(e) => setPhoneViolation(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>استخدام الهاتف المحمول أثناء القيادة (50 د.أ)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seatbeltViolation}
                  onChange={(e) => setSeatbeltViolation(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>عدم ارتداء حزام الأمان (20 د.أ)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={redLightViolation}
                  onChange={(e) => setRedLightViolation(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>تجاوز الإشارة الضوئية الحمراء (200 د.أ)</span>
              </label>
            </div>

            {/* Fines Result Box */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 space-y-2">
              {finesResult.list.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-2">لم يتم تحديد أي مخالفات</p>
              ) : (
                finesResult.list.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                    <span>{item.title}</span>
                    <span className="font-bold text-amber-600">{item.amount} د.أ</span>
                  </div>
                ))
              )}
              <div className="pt-2 border-t border-amber-500/20 flex justify-between items-center text-sm font-black text-amber-700 dark:text-amber-400">
                <span>إجمالي قيمة المخالفات المقدرة:</span>
                <span className="text-xl">{finesResult.totalFines} د.أ</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
