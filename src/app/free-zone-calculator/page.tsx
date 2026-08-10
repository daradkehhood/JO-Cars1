'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import {
  Ship, Calculator, DollarSign, ArrowRightLeft, Sparkles, CheckCircle2,
  FileCheck, ShieldCheck, MapPin, Truck, AlertCircle, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function FreeZoneCalculatorPage() {
  const [originCountry, setOriginCountry] = useState<'KOREA' | 'CHINA' | 'USA' | 'GERMANY'>('KOREA');
  const [carValueUsd, setCarValueUsd] = useState<number>(15000);
  const [fuelCategory, setFuelCategory] = useState<'EV' | 'HYBRID' | 'PETROL'>('EV');
  const [clearanceService, setClearanceService] = useState<boolean>(true);

  // Freight Cost Estimator (دلار أمريكي)
  const freightRates: Record<string, number> = {
    KOREA: 1800,   // شحن بحري من كوريا إلى العقبة
    CHINA: 2200,   // شحن بحري من الصين إلى العقبة
    USA: 2500,     // شحن بحري من أمريكا إلى العقبة
    GERMANY: 2100, // شحن بري/بحري من ألمانيا إلى العقبة
  };

  const freightUsd = freightRates[originCountry] || 2000;
  const freightJod = Math.round(freightUsd * 0.71);
  const carValueJod = Math.round(carValueUsd * 0.71);

  // Customs Rate
  let customsPercentage = 0.10;
  if (fuelCategory === 'HYBRID') customsPercentage = 0.55;
  if (fuelCategory === 'PETROL') customsPercentage = 0.85;

  const estimatedCustomsJod = Math.round(carValueJod * customsPercentage);
  const zarqaFreeZoneFeeJod = 250; // رسوم ساحات وخدمات المنطقة الحرة
  const clearanceBrokerFeeJod = clearanceService ? 200 : 0; // عمولة المخلص الجمركي
  const platesFeeJod = 120; // رسوم إصدار اللوحات والرخصة

  const totalCostJod = carValueJod + freightJod + estimatedCustomsJod + zarqaFreeZoneFeeJod + clearanceBrokerFeeJod + platesFeeJod;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between text-gray-900 dark:text-gray-100">
      <Header />

      <main className="container-custom max-w-5xl mx-auto px-4 py-8 flex-1">
        {/* Banner */}
        <div className="card p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white mb-8 border border-blue-500/30 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 inline-flex items-center gap-1.5 mb-3">
              <Ship className="w-4 h-4" /> الشحن والتخليص بالأردن 🇯🇴
            </span>
            <h1 className="text-2xl sm:text-4xl font-black mb-2">حاسبة الشحن والتخليص من المنطقة الحرة والعقبة</h1>
            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              احسب التكلفة الإجمالية لاستيراد وشحن السيارة من الخارج عبر ميناء العقبة والتخليص عليها بالمنطقة الحرة الزرقاء واصلة مجمركة ومترخصة جاهزة للاستخدام.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Inputs */}
          <div className="card p-6 space-y-5 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white">بيانات السيارة والشحن</h2>
                <p className="text-xs text-gray-500">حدد بلد المصدر وفئة وقود السيارة</p>
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">بلد الشحن والاستيراد</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOriginCountry('KOREA')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-right ${
                    originCountry === 'KOREA' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  🇰🇷 كوريا الجنوبية
                </button>
                <button
                  onClick={() => setOriginCountry('CHINA')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-right ${
                    originCountry === 'CHINA' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  🇨🇳 الصين الشعبية
                </button>
                <button
                  onClick={() => setOriginCountry('USA')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-right ${
                    originCountry === 'USA' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  🇺🇸 الولايات المتحدة
                </button>
                <button
                  onClick={() => setOriginCountry('GERMANY')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-right ${
                    originCountry === 'GERMANY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  🇩🇪 ألمانيا / أوروبا
                </button>
              </div>
            </div>

            {/* Fuel Category */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">فئة وقود السيارة</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFuelCategory('EV')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    fuelCategory === 'EV' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  ⚡ كهرباء (10%)
                </button>
                <button
                  onClick={() => setFuelCategory('HYBRID')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    fuelCategory === 'HYBRID' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  🔋 هايبرد (55%)
                </button>
                <button
                  onClick={() => setFuelCategory('PETROL')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    fuelCategory === 'PETROL' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  ⛽ بنزين (85%)
                </button>
              </div>
            </div>

            {/* Price USD */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                سعر السيارة بالمزاد/المصدر (USD): <span className="text-blue-600 dark:text-blue-400 font-extrabold">${carValueUsd.toLocaleString()} USD</span>
              </label>
              <input
                type="number"
                value={carValueUsd}
                onChange={(e) => setCarValueUsd(parseInt(e.target.value || '0', 10))}
                className="input text-sm"
                placeholder="مثال: 15000"
              />
            </div>
          </div>

          {/* Detailed Invoice Breakdown */}
          <div className="card p-6 space-y-4 border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <h3 className="text-base font-black text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
              تفاصيل فاتورة الاستيراد والتخليص الشاملة
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>سعر السيارة الأساسي (${carValueUsd}):</span>
                <span className="font-bold text-gray-900 dark:text-white">{carValueJod.toLocaleString('ar-JO')} د.أ</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>أجور الشحن البحري لميناء العقبة:</span>
                <span className="font-bold text-gray-900 dark:text-white">{freightJod.toLocaleString('ar-JO')} د.أ (${freightUsd})</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>الجمارك التقديرية (المنطقة الحرة 2026):</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{estimatedCustomsJod.toLocaleString('ar-JO')} د.أ</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>رسوم ساحات ومستودعات المنطقة الحرة بالزرقاء:</span>
                <span className="font-bold text-gray-900 dark:text-white">{zarqaFreeZoneFeeJod} د.أ</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>عمولة مكتب التخليص الجمركي:</span>
                <span className="font-bold text-gray-900 dark:text-white">{clearanceBrokerFeeJod} د.أ</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>رسوم إصدار اللوحات والرخصة والأرقام:</span>
                <span className="font-bold text-gray-900 dark:text-white">{platesFeeJod} د.أ</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-xl space-y-1 mt-4">
              <span className="text-[11px] opacity-80">التكلفة الإجمالية للسيارة واصلة مجمركة ومترخصة:</span>
              <p className="text-2xl font-black">{totalCostJod.toLocaleString('ar-JO')} دينار أردني</p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
