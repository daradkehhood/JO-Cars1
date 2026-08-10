'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Landmark, Sparkles, Percent, Calendar, DollarSign, ArrowRightLeft, ShieldCheck, CheckCircle } from 'lucide-react';

interface BankOption {
  id: string;
  nameAr: string;
  nameEn: string;
  logo: string;
  interestRate: number; // annual percentage
  maxYears: number;
  minDownPaymentPercent: number;
  type: 'ISLAMIC' | 'CONVENTIONAL';
}

const JORDANIAN_BANKS: BankOption[] = [
  {
    id: 'islamic-jordan',
    nameAr: 'البنك الإسلامي الأردني',
    nameEn: 'Jordan Islamic Bank',
    logo: '🕌',
    interestRate: 5.25,
    maxYears: 7,
    minDownPaymentPercent: 15,
    type: 'ISLAMIC',
  },
  {
    id: 'arabi-bank',
    nameAr: 'البنك العربي',
    nameEn: 'Arab Bank',
    logo: '🏦',
    interestRate: 6.5,
    maxYears: 6,
    minDownPaymentPercent: 20,
    type: 'CONVENTIONAL',
  },
  {
    id: 'etihad-bank',
    nameAr: 'بنك الاتحاد',
    nameEn: 'Bank al Etihad',
    logo: '✨',
    interestRate: 6.25,
    maxYears: 7,
    minDownPaymentPercent: 15,
    type: 'CONVENTIONAL',
  },
  {
    id: 'jordan-bank',
    nameAr: 'بنك الأردن',
    nameEn: 'Bank of Jordan',
    logo: '🏛️',
    interestRate: 6.75,
    maxYears: 6,
    minDownPaymentPercent: 20,
    type: 'CONVENTIONAL',
  },
  {
    id: 'safwa-bank',
    nameAr: 'بنك صفوة الإسلامي',
    nameEn: 'Safwa Islamic Bank',
    logo: '🌙',
    interestRate: 5.5,
    maxYears: 7,
    minDownPaymentPercent: 15,
    type: 'ISLAMIC',
  },
];

export default function FinanceCalculatorPage() {
  const [carPrice, setCarPrice] = useState<number>(25000);
  const [downPayment, setDownPayment] = useState<number>(5000);
  const [years, setYears] = useState<number>(5);
  const [selectedBank, setSelectedBank] = useState<BankOption>(JORDANIAN_BANKS[0]);

  // Calculate financing installment
  const loanAmount = Math.max(0, carPrice - downPayment);
  const totalMonths = years * 12;
  const annualRate = selectedBank.interestRate / 100;
  
  // Calculate total interest / profit margin
  const totalInterest = Math.round(loanAmount * annualRate * years);
  const totalPayable = loanAmount + totalInterest;
  const monthlyInstallment = totalMonths > 0 ? Math.round(totalPayable / totalMonths) : 0;
  const downPaymentPercent = carPrice > 0 ? Math.round((downPayment / carPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans dir-rtl">
      <Header />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
            <Landmark className="w-4 h-4" />
            حاسبة أقساط البنوك الأردنية 🇯🇴
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            حاسبة تمويل السيارات والتمويل الإسلامي
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            احسب القسط الشهري والدفعة الأولى ونسبة المرابحة/الفائدة لسيارتك عبر أفضل البنوك وشركات التمويل الأردنية.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Bank Selection & Calculator Inputs */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-blue-400" />
              اختر البنك أو المؤسسة الموردة
            </h2>

            {/* Bank Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {JORDANIAN_BANKS.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setSelectedBank(bank)}
                  className={`p-4 rounded-2xl border text-right transition-all flex items-center gap-3 ${
                    selectedBank.id === bank.id
                      ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="text-2xl">{bank.logo}</span>
                  <div>
                    <span className="font-bold block text-sm">{bank.nameAr}</span>
                    <span className="text-xs text-blue-400 font-semibold">
                      {bank.type === 'ISLAMIC' ? 'مرابحة إسلامية' : 'تمويل تقليدي'} ({bank.interestRate}%)
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="space-y-6">
              {/* Car Price */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-300">سعر السيارة الإجمالي (JOD)</label>
                  <span className="text-blue-400 font-bold text-lg">{carPrice.toLocaleString()} د.أ</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="1000"
                  value={carPrice}
                  onChange={(e) => {
                    const price = Number(e.target.value);
                    setCarPrice(price);
                    if (downPayment > price) setDownPayment(Math.round(price * 0.2));
                  }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Down Payment */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-300">الدفعة الأولى ({downPaymentPercent}%)</label>
                  <span className="text-emerald-400 font-bold text-lg">{downPayment.toLocaleString()} د.أ</span>
                </div>
                <input
                  type="range"
                  min={Math.round(carPrice * (selectedBank.minDownPaymentPercent / 100))}
                  max={Math.round(carPrice * 0.8)}
                  step="500"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-xs text-slate-400 block mt-1">الحد الأدنى للدفعة الأولى لدى {selectedBank.nameAr} هو {selectedBank.minDownPaymentPercent}%</span>
              </div>

              {/* Duration Years */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-300">مدة التمويل (سنوات)</label>
                  <span className="text-amber-400 font-bold text-lg">{years} سنوات ({totalMonths} شهر)</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((y) => (
                    <button
                      key={y}
                      type="button"
                      disabled={y > selectedBank.maxYears}
                      onClick={() => setYears(y)}
                      className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                        years === y
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                          : y > selectedBank.maxYears
                          ? 'bg-slate-800/20 border-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {y} س
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                <span className="text-3xl">{selectedBank.logo}</span>
                <div>
                  <h3 className="font-bold text-white text-lg">{selectedBank.nameAr}</h3>
                  <span className="text-xs text-slate-400">{selectedBank.type === 'ISLAMIC' ? 'مرابحة إسلامية معتمدة' : 'تمويل سيارات مباشر'}</span>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">مبلغ التمويل المطلوبة</span>
                  <span className="font-semibold text-white">{loanAmount.toLocaleString()} د.أ</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">نسبة الفائدة / المرابحة السنوية</span>
                  <span className="font-semibold text-blue-400">{selectedBank.interestRate}%</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">إجمالي الفائدة / أرباح التمويل</span>
                  <span className="font-semibold text-amber-400">{totalInterest.toLocaleString()} د.أ</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">إجمالي المبلغ المسدد بالكامل</span>
                  <span className="font-semibold text-white">{totalPayable.toLocaleString()} د.أ</span>
                </div>
              </div>
            </div>

            {/* Monthly Installment Highlight */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white text-center shadow-xl shadow-blue-900/30">
                <span className="text-xs uppercase tracking-wider font-semibold opacity-90 block mb-1">القسط الشهري التقديري</span>
                <span className="text-4xl font-black">{monthlyInstallment.toLocaleString()} د.أ / شهرياً</span>
                <p className="text-xs opacity-80 mt-2">على مدار {totalMonths} قسطاً شهرياً</p>
              </div>

              <a
                href="https://wa.me/962770000000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%2C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AA%D9%85%D9%88%D9%8A%D9%84%20%D8%B3%D9%8A%D8%A7%D8%B1%D8%A9"
                target="_blank"
                rel="noreferrer"
                className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 text-sm"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                اطلب تمويل سيارتك الآن عبر الواتساب
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
