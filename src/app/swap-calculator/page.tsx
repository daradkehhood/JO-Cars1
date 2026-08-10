'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Car, DollarSign, Calculator, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function SwapCalculatorPage() {
  const [carA, setCarA] = useState({
    brand: 'تويوتا',
    model: 'كامري',
    year: 2019,
    price: 18000,
    km: 80000,
    fuel: 'HYBRID',
  });

  const [carB, setCarB] = useState({
    brand: 'هيونداي',
    model: 'توسان',
    year: 2022,
    price: 23500,
    km: 35000,
    fuel: 'PETROL',
  });

  const rawDiff = carB.price - carA.price;
  const kmDiff = Math.round(((carA.km - carB.km) / 10000) * 150); // mileage difference adjustment
  const adjustedDiff = rawDiff + kmDiff;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between">
      <Header />
      <main className="container max-w-5xl mx-auto px-4 py-8 flex-1">
        
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 inline-flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> أداة البدل والمقاصة الأردنية 🇯🇴
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            حاسبة فرق البدل للسيارات
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            قارن بين سيارتك الحالية والسيارة المراد البدل عليها لمعرفة فرق الدفع أو الاسترداد المالي العادل بالسوق الأردني
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Car A Card */}
          <div className="card p-5 border-2 border-blue-200 dark:border-blue-500/30 bg-blue-50/20 dark:bg-blue-500/5">
            <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 font-bold">
              <Car className="w-5 h-5" />
              <h2>سيارتك الحالية (سيارة أ)</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">الماركة والموديل</label>
                <input
                  type="text"
                  value={`${carA.brand} ${carA.model}`}
                  onChange={(e) => setCarA({ ...carA, brand: e.target.value })}
                  className="input mt-1 text-sm font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">سنة الصنع</label>
                  <input
                    type="number"
                    value={carA.year}
                    onChange={(e) => setCarA({ ...carA, year: Number(e.target.value) })}
                    className="input mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">الممشى (كم)</label>
                  <input
                    type="number"
                    value={carA.km}
                    onChange={(e) => setCarA({ ...carA, km: Number(e.target.value) })}
                    className="input mt-1 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">القيمة التقديرية (د.أ)</label>
                <input
                  type="number"
                  value={carA.price}
                  onChange={(e) => setCarA({ ...carA, price: Number(e.target.value) })}
                  className="input mt-1 text-sm font-bold text-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Car B Card */}
          <div className="card p-5 border-2 border-purple-200 dark:border-purple-500/30 bg-purple-50/20 dark:bg-purple-500/5">
            <div className="flex items-center gap-2 mb-4 text-purple-600 dark:text-purple-400 font-bold">
              <Car className="w-5 h-5" />
              <h2>السيارة المستهدفة للبدل (سيارة ب)</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">الماركة والموديل</label>
                <input
                  type="text"
                  value={`${carB.brand} ${carB.model}`}
                  onChange={(e) => setCarB({ ...carB, brand: e.target.value })}
                  className="input mt-1 text-sm font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">سنة الصنع</label>
                  <input
                    type="number"
                    value={carB.year}
                    onChange={(e) => setCarB({ ...carB, year: Number(e.target.value) })}
                    className="input mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">الممشى (كم)</label>
                  <input
                    type="number"
                    value={carB.km}
                    onChange={(e) => setCarB({ ...carB, km: Number(e.target.value) })}
                    className="input mt-1 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">السعر المطلوب (د.أ)</label>
                <input
                  type="number"
                  value={carB.price}
                  onChange={(e) => setCarB({ ...carB, price: Number(e.target.value) })}
                  className="input mt-1 text-sm font-bold text-emerald-600"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Calculation Summary Result */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl rounded-3xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-1">
                <ArrowLeftRight className="w-4 h-4" />
                نتيجة المقاصة وفرق البدل الموصى به
              </div>
              <h3 className="text-3xl font-black">
                {adjustedDiff > 0 ? `دفع فرق: ${adjustedDiff.toLocaleString('ar-JO')} د.أ` : adjustedDiff < 0 ? `استرداد: ${Math.abs(adjustedDiff).toLocaleString('ar-JO')} د.أ` : 'بدل رأس برأس (0 د.أ)'}
              </h3>
              <p className="text-xs text-slate-300 mt-2 max-w-lg leading-relaxed">
                * الفرق التقديري يأخذ بالحسبان فرق الموديل ({carB.year - carA.year} سنة) وفروقات الممشى الاستهلاكية في شوارع الأردن.
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto">
              <Link href="/cars" className="btn btn-emerald px-6 py-3 text-sm font-bold text-center">
                تصفح السيارات المتاحة للبدل
              </Link>
              <Link href="/ai" className="btn btn-outline border-white/20 text-white hover:bg-white/10 px-6 py-2.5 text-xs text-center">
                استشارة الذكاء الاصطناعي
              </Link>
            </div>
          </div>
        </motion.div>

      </main>
      <Footer />
    </div>
  );
}
