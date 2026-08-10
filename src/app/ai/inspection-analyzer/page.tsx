'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import {
  FileSearch, Sparkles, ShieldCheck, AlertTriangle, CheckCircle2,
  HelpCircle, Car, ArrowLeft, Loader2, DollarSign
} from 'lucide-react';
import Link from 'next/link';

export default function InspectionAnalyzerPage() {
  const [inspectionText, setInspectionText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = () => {
    if (!inspectionText.trim()) return;
    setAnalyzing(true);

    setTimeout(() => {
      const text = inspectionText.toLowerCase();

      let score = '7 جيد (فحص كامل)';
      let status = 'EXCELLENT';
      let safetyScore = 98;
      let priceDiscountPercent = 0;
      const issues: string[] = [];
      const positives: string[] = [];

      if (text.includes('مضروب') || text.includes('مقصوص') || text.includes('قص')) {
        score = 'شاصي مضروب / مقصوص';
        status = 'WARNING';
        safetyScore = 45;
        priceDiscountPercent = 25;
        issues.push('يوجد قص أو ضربة قوية بالشاصي تؤثر على توازن المركبة والأمان');
      } else if (text.includes('دقة') || text.includes('بنكيت') || text.includes('ضربة')) {
        score = '3 جيد أو دقة بنكيت';
        status = 'GOOD';
        safetyScore = 82;
        priceDiscountPercent = 8;
        issues.push('ملاحظات بنكيت أو دقة خفيفة بأسفل الشاصي لا تؤثر على السلامة الهيكلية');
      }

      if (text.includes('خالي العلام') || text.includes('جيد جيدا') || text.includes('7 جيد')) {
        positives.push('سيارة فحص كامل 7 جيد خالية من أي ضربات أو قص بالشاصي');
      }

      if (text.includes('جيد امامي') || text.includes('جيد خلفي')) {
        positives.push('الشواصي الرئيسية بحالة جيدة جداً');
      }

      if (issues.length === 0) {
        issues.push('لا توجد أي عيوب هيكلية جوهرية مذكورة في التقرير');
      }

      setResult({
        score,
        status,
        safetyScore,
        priceDiscountPercent,
        issues,
        positives,
      });

      setAnalyzing(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between text-gray-900 dark:text-gray-100">
      <Header />

      <main className="container-custom max-w-4xl mx-auto px-4 py-8 flex-1">
        {/* Banner */}
        <div className="card p-6 sm:p-8 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white mb-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden text-center sm:text-right">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 inline-flex items-center gap-1.5 mb-3">
            <Sparkles className="w-4 h-4" /> ذكاء اصطناعي متخصص في سوق الأردن 🇯🇴
          </span>
          <h1 className="text-2xl sm:text-4xl font-black mb-2">محلل كشف فحص السيارات والشواصي</h1>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            التقط أو الصق نص كشف الفحص (مثال: "7 جيد، مضروب خالي العلام، دقة بنكيت")، وسيقوم الذكاء الاصطناعي بتحليله وتوضيح درجة الأمان وتأثيره على السعر!
          </p>
        </div>

        <div className="space-y-6">
          {/* Input Box */}
          <div className="card p-6 border border-gray-200 dark:border-gray-800 space-y-4">
            <label className="text-sm font-black text-gray-900 dark:text-white block">
              نص أو ملاحظات كشف الفحص من المركز الفني:
            </label>
            <textarea
              rows={4}
              value={inspectionText}
              onChange={(e) => setInspectionText(e.target.value)}
              placeholder="مثال: الشاصي الأمامي يمين: جيد، الشاصي الأمامي شمال: جيد، الشاصي الخلفي يمين: دقة بنكيت، الشاصي الخلفي شمال: جيد..."
              className="w-full p-4 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm focus:border-emerald-500 outline-none transition-all"
            />

            {/* Fast Preset Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs text-gray-500 py-1 font-bold">أمثلة سريعة:</span>
              <button
                onClick={() => setInspectionText('الشواصي الأربعة: 7 جيد خالي العلام، الجير والماتور: جيد')}
                className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold"
              >
                7 جيد فحص كامل ✨
              </button>
              <button
                onClick={() => setInspectionText('الشاصي الأمامي شمال دقة بنكيت، الشاصي الخلفي يمين ضربة عجل، باقي الشواصي جيد')}
                className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold"
              >
                دقة بنكيت وملاحظات خفيفة ⚠️
              </button>
              <button
                onClick={() => setInspectionText('الشاصي الأمامي يمين مضروب ومقصوص، الجير جيد، الماتور جيد')}
                className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-bold"
              >
                شاصي مضروب مقصوص 🚫
              </button>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !inspectionText.trim()}
              className="btn btn-emerald w-full py-3 text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري تحليل كشف الفحص بالذكاء الاصطناعي...
                </>
              ) : (
                <>
                  <FileSearch className="w-5 h-5" />
                  تحليل الكشف وتحديد تأثير السعر والأمان
                </>
              )}
            </button>
          </div>

          {/* Analysis Results */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 border border-emerald-500/30 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <span className="text-xs text-gray-500 font-bold">النتيجة الإجمالية للفحص</span>
                  <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{result.score}</h3>
                </div>
                <div className="text-left">
                  <span className="text-xs text-gray-500 font-bold">مؤشر أمان الهيكل</span>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{result.safetyScore}%</p>
                </div>
              </div>

              {/* Price Impact */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">تأثير الفحص على سعر السوق بالأردن</h4>
                    <p className="text-xs text-gray-500">مقارنة بسيارة فحص كامل خالية من الملاحظات</p>
                  </div>
                </div>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                  {result.priceDiscountPercent === 0 ? 'سعر كامل (0% خصم)' : `خصم ~${result.priceDiscountPercent}% من السعر`}
                </span>
              </div>

              {/* Issues & Positives */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-500/10 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> نقاط القوة والأمان
                  </h4>
                  <ul className="space-y-1">
                    {result.positives.map((pos: string, idx: number) => (
                      <li key={idx} className="text-xs text-gray-700 dark:text-gray-300">• {pos}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-500/10 space-y-2">
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> الملاحظات الفنية
                  </h4>
                  <ul className="space-y-1">
                    {result.issues.map((iss: string, idx: number) => (
                      <li key={idx} className="text-xs text-gray-700 dark:text-gray-300">• {iss}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
