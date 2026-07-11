'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { DollarSign, TrendingDown, Loader2, ArrowDown, ArrowUp, Info, CheckCircle } from 'lucide-react';

interface ValuationResult {
  valuation: {
    currentPrice: number;
    year1: { value: number; loss: number; lossPercent: number };
    year3: { value: number; loss: number; lossPercent: number };
    year5: { value: number; loss: number; lossPercent: number };
  };
  market: { averagePrice: number; similarListings: number; trend: string };
  factors: { brandReputation: string; fuelType: string; bodyType: string; age: number; kilometers: number };
  tips: string[];
}

const brands = ['تويوتا', 'هيونداي', 'كيا', 'نيسان', 'هوندا', 'فورد', 'شيفروليه', 'مرسيدس', 'بي إم دبليو', 'أودي', 'مازدا', 'لكزس', 'ميتسوبيشي', 'سوزوكي', 'فولكس فاجن', 'بورش', 'جيب', 'لاند روفر', 'أخرى'];

export default function ResaleValuePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [form, setForm] = useState({ brand: '', model: '', year: new Date().getFullYear().toString(), price: '', kilometers: '', fuelType: 'PETROL', bodyType: 'SEDAN', condition: 'GOOD' });

  const handleCalculate = async () => {
    if (!form.brand || !form.price) { return; }
    setLoading(true);
    try {
      const res = await fetch('/api/resale-value', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) setResult(data.data);
    } catch {}
    finally { setLoading(false); }
  };

  const formatValue = (v: number) => v.toLocaleString();

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">حساب قيمة إعادة البيع</h1>
            <p className="text-gray-500">اكتشف كم ستساوي سيارتك بعد سنة و3 و5 سنوات</p>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">أدخل بيانات سيارتك</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الشركة *</label>
                <select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm">
                  <option value="">اختر الشركة</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الموديل</label>
                <input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="مثال: كامري، توسان..." className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السنة *</label>
                <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm">
                  {[...Array(20)].map((_, i) => { const y = new Date().getFullYear() - i; return <option key={y} value={y}>{y}</option>; })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر الحالي (دينار) *</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="السعر بالدينار الأردني" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الكيلومترات</label>
                <input type="number" value={form.kilometers} onChange={e => setForm({ ...form, kilometers: e.target.value })} placeholder="0" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الوقود</label>
                <select value={form.fuelType} onChange={e => setForm({ ...form, fuelType: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm">
                  <option value="PETROL">بنزين</option>
                  <option value="DIESEL">ديزل</option>
                  <option value="HYBRID">هايبرد</option>
                  <option value="ELECTRIC">كهرباء</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الهيكل</label>
                <select value={form.bodyType} onChange={e => setForm({ ...form, bodyType: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm">
                  <option value="SEDAN">سيدان</option>
                  <option value="SUV">SUV</option>
                  <option value="HATCHBACK">هاتشباك</option>
                  <option value="CROSSOVER">كروس أوفر</option>
                  <option value="PICKUP">بيك أب</option>
                  <option value="MINIVAN">ميني فان</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحالة</label>
                <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm">
                  <option value="EXCELLENT">ممتازة</option>
                  <option value="GOOD">جيدة</option>
                  <option value="FAIR">مقبولة</option>
                  <option value="POOR">سيئة</option>
                </select>
              </div>
            </div>
            <div className="mt-6">
              <Button onClick={handleCalculate} loading={loading} className="w-full" size="lg" icon={<DollarSign className="w-5 h-5" />}>احسب قيمة إعادة البيع</Button>
            </div>
          </div>

          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">تقدير قيمة إعادة البيع</h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                    <p className="text-xs text-gray-500 mb-1">القيمة الحالية</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatValue(result.valuation.currentPrice)} <span className="text-sm">د.أ</span></p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-center">
                    <p className="text-xs text-gray-500 mb-1">بعد سنة</p>
                    <p className="text-xl font-bold text-blue-600">{formatValue(result.valuation.year1.value)} <span className="text-sm">د.أ</span></p>
                    <p className="text-xs text-red-500 flex items-center justify-center gap-1"><ArrowDown className="w-3 h-3" />-{result.valuation.year1.lossPercent}% ({formatValue(result.valuation.year1.loss)} د.أ)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-center">
                    <p className="text-xs text-gray-500 mb-1">بعد 3 سنوات</p>
                    <p className="text-xl font-bold text-purple-600">{formatValue(result.valuation.year3.value)} <span className="text-sm">د.أ</span></p>
                    <p className="text-xs text-red-500 flex items-center justify-center gap-1"><ArrowDown className="w-3 h-3" />-{result.valuation.year3.lossPercent}% ({formatValue(result.valuation.year3.loss)} د.أ)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 text-center">
                    <p className="text-xs text-gray-500 mb-1">بعد 5 سنوات</p>
                    <p className="text-xl font-bold text-green-600">{formatValue(result.valuation.year5.value)} <span className="text-sm">د.أ</span></p>
                    <p className="text-xs text-red-500 flex items-center justify-center gap-1"><ArrowDown className="w-3 h-3" />-{result.valuation.year5.lossPercent}% ({formatValue(result.valuation.year5.loss)} د.أ)</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">مقارنة مع السوق</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-lg font-bold text-gray-900 dark:text-white">{formatValue(result.market.averagePrice)} د.أ</p><p className="text-xs text-gray-500">متوسط السوق</p></div>
                  <div><p className="text-lg font-bold text-gray-900 dark:text-white">{result.market.similarListings}</p><p className="text-xs text-gray-500">إعلان مشابه</p></div>
                  <div><p className={`text-lg font-bold ${result.market.trend === 'above' ? 'text-green-600' : result.market.trend === 'below' ? 'text-red-600' : 'text-blue-600'}`}>{result.market.trend === 'above' ? 'فوق السوق' : result.market.trend === 'below' ? 'تحت السوق' : 'سعر عادل'}</p><p className="text-xs text-gray-500"> موقع سعرك</p></div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">العوامل المؤثرة</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><p className="text-xs text-gray-500">الشركة</p><p className="text-sm font-bold text-gray-900 dark:text-white">{result.factors.brandReputation}</p></div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><p className="text-xs text-gray-500">الوقود</p><p className="text-sm font-bold text-gray-900 dark:text-white">{result.factors.fuelType === 'HYBRID' ? 'هايبرد' : result.factors.fuelType === 'ELECTRIC' ? 'كهرباء' : result.factors.fuelType === 'DIESEL' ? 'ديزل' : 'بنزين'}</p></div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><p className="text-xs text-gray-500">الهيكل</p><p className="text-sm font-bold text-gray-900 dark:text-white">{result.factors.bodyType}</p></div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><p className="text-xs text-gray-500">العمر</p><p className="text-sm font-bold text-gray-900 dark:text-white">{result.factors.age} سنة</p></div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><p className="text-xs text-gray-500">الكيلومترات</p><p className="text-sm font-bold text-gray-900 dark:text-white">{result.factors.kilometers.toLocaleString()} كم</p></div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><Info className="w-4 h-4" /> نصائح لزيادة قيمة إعادة البيع</h3>
                <div className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /><p className="text-sm text-gray-600 dark:text-gray-400">{tip}</p></div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
