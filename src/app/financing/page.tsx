'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Banknote, Calendar, Percent, Download, ChevronDown, ChevronUp, Building2 } from 'lucide-react';

interface BankResult {
  bankId: string; bankName: string; bankIcon: string;
  rate: number; monthlyPayment: number; totalPayment: number;
  totalInterest: number; isSelected: boolean;
}

interface ScheduleRow {
  month: number; payment: number; principal: number;
  interest: number; balance: number;
}

export default function FinancingPage() {
  const [price, setPrice] = useState('15000');
  const [downPayment, setDownPayment] = useState('3000');
  const [term, setTerm] = useState('60');
  const [bankId, setBankId] = useState('');
  const [results, setResults] = useState<BankResult[] | null>(null);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calcDownPercent = () => {
    const p = parseInt(price) || 1;
    const d = parseInt(downPayment) || 0;
    return Math.round((d / p) * 100);
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/financing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, downPayment, termMonths: term, bankId }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.data.results);
        setSchedule(data.data.schedule);
      } else {
        setError(data.error || 'حدث خطأ');
      }
    } catch {
      setError('فشل الاتصال بالخادم');
    }
    setLoading(false);
  };

  useEffect(() => { handleCalculate(); }, []);

  const bestResult = results?.reduce((best, r) =>
    r.monthlyPayment < best.monthlyPayment ? r : best
  , results?.[0]);

  const formatNum = (n: number) => n.toLocaleString();

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">حاسبة التمويل والتقسيط</h1>
            <p className="text-gray-500 text-sm">احسب قسطك الشهري مع جميع البنوك الأردنية</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-5">معلومات التمويل</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">سعر السيارة</label>
                  <div className="relative">
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 transition-colors"
                      placeholder="مثلاً: 15000" />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">د.أ</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الدفعة الأولى</label>
                  <div className="relative">
                    <input type="number" value={downPayment} onChange={e => setDownPayment(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 transition-colors"
                      placeholder="مثلاً: 3000" />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">د.أ</span>
                  </div>
                  {parseInt(price) > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>نسبة الدفعة الأولى: {calcDownPercent()}%</span>
                        <span>التمويل: {(parseInt(price) - parseInt(downPayment || '0')).toLocaleString()} د.أ</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div className="h-full bg-gradient-to-l from-emerald-500 to-green-500 rounded-full transition-all"
                          style={{ width: `${Math.min(calcDownPercent(), 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">مدة التقسيط (شهر)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[36, 48, 60, 72, 84, 96].map(m => (
                      <button key={m} onClick={() => setTerm(m.toString())}
                        className={`p-2.5 rounded-xl text-sm font-medium transition-all ${
                          term === m.toString()
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}>
                        {m}
                        <span className="block text-[10px] opacity-70">{m === 36 ? '3 سنوات' : m === 48 ? '4 سنوات' : m === 60 ? '5 سنوات' : m === 72 ? '6 سنوات' : m === 84 ? '7 سنوات' : '8 سنوات'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اختر بنك (اختياري)</label>
                  <select value={bankId} onChange={e => setBankId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 transition-colors">
                    <option value="">جميع البنوك</option>
                    <option value="safwa">بنك صفوة الإسلامي</option>
                    <option value="jib">البنك الإسلامي الأردني</option>
                    <option value="jkb">البنك الأردني الكويتي</option>
                    <option value="iskanc">بنك الإسكان</option>
                    <option value="capital">بنك رأس المال</option>
                    <option value="arab">البنك العربي</option>
                    <option value="cairo">بنك القاهرة عمان</option>
                    <option value="ahli">البنك الأهلي الأردني</option>
                    <option value="ettihad">بنك الاتحاد</option>
                    <option value="societe">سوسيتيه جنرال</option>
                  </select>
                </div>

                <button onClick={handleCalculate} disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <Calculator className="w-4 h-4" />
                  {loading ? 'جاري الحساب...' : 'احسب القسط'}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {bestResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="card p-6 bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-emerald-100 text-sm">أفضل قسط شهري</p>
                    <p className="text-4xl font-bold mt-1">{formatNum(bestResult.monthlyPayment)} <span className="text-lg text-emerald-100">د.أ</span></p>
                  </div>
                  <div className="text-left">
                    <p className="text-emerald-100 text-sm">إجمالي التمويل</p>
                    <p className="text-2xl font-bold mt-1">{formatNum(parseInt(price) - parseInt(downPayment || '0'))} <span className="text-sm text-emerald-100">د.أ</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-emerald-100 text-xs">مدة التقسيط</p>
                    <p className="font-bold text-lg">{term} شهر</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-emerald-100 text-xs">الدفعة الأولى</p>
                    <p className="font-bold text-lg">{formatNum(parseInt(downPayment || '0'))} د.أ</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-emerald-100 text-xs">نسبة الفائدة</p>
                    <p className="font-bold text-lg">{bestResult.rate}%</p>
                  </div>
                </div>
              </motion.div>
            )}

            {results && (
              <div className="card">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    مقارنة البنوك
                  </h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {results.sort((a, b) => a.monthlyPayment - b.monthlyPayment).map((bank, i) => (
                    <div key={bank.bankId}
                      className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${i === 0 ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{bank.bankIcon}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{bank.bankName}</p>
                          <p className="text-xs text-gray-500">نسبة {bank.rate}%</p>
                        </div>
                        {i === 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">الأفضل</span>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900 dark:text-white">{formatNum(bank.monthlyPayment)} <span className="text-xs text-gray-500">د.أ/شهر</span></p>
                        <p className="text-xs text-gray-500">إجمالي: {formatNum(bank.totalPayment)} د.أ</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {schedule.length > 0 && (
              <div className="card">
                <button onClick={() => setShowSchedule(!showSchedule)}
                  className="w-full p-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    جدول السداد (أول 12 شهر)
                  </h2>
                  {showSchedule ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showSchedule && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                          <th className="p-3 text-right text-gray-500 font-medium">الشهر</th>
                          <th className="p-3 text-right text-gray-500 font-medium">القسط</th>
                          <th className="p-3 text-right text-gray-500 font-medium">أصل الدين</th>
                          <th className="p-3 text-right text-gray-500 font-medium">الفائدة</th>
                          <th className="p-3 text-right text-gray-500 font-medium">المتبقي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {schedule.map(row => (
                          <tr key={row.month} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="p-3 text-gray-900 dark:text-white">{row.month}</td>
                            <td className="p-3 text-gray-900 dark:text-white">{formatNum(row.payment)}</td>
                            <td className="p-3 text-gray-900 dark:text-white">{formatNum(row.principal)}</td>
                            <td className="p-3 text-gray-500">{formatNum(row.interest)}</td>
                            <td className="p-3 text-gray-500">{formatNum(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
