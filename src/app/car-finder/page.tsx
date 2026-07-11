'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Car, Users, DollarSign, Zap, Fuel, ArrowRight, ArrowLeft, Loader2, MapPin, Gauge, Heart } from 'lucide-react';
import Link from 'next/link';

interface Recommendation {
  id: string; brand: string; model: string; year: number; price: number;
  fuelType: string; bodyType: string; kilometers?: number;
  city: string; score: number; reasons: string[]; image?: string; transmission: string;
}

const steps = [
  { title: 'كم تمشي يوميًا؟', subtitle: 'المسافة اليومية تحدد نوع الوقود المناسب', icon: MapPin },
  { title: 'كم شخص معك عادةً؟', subtitle: 'عدد الركاب يحدد حجم السيارة', icon: Users },
  { title: 'ما ميزانيتك؟', subtitle: 'حدد الميزانية المتاحة لشراء السيارة', icon: DollarSign },
  { title: 'تحب القوة أم الاقتصاد؟', subtitle: 'الأولوية تحدد المواصفات المناسبة', icon: Zap },
  { title: 'نوع الوقود المفضل', subtitle: 'اختر نوع الوقود الذي تفضله', icon: Fuel },
];

const distanceOptions = [
  { value: '10', label: 'أقل من 10 كم', desc: 'تنقلات داخل المدينة فقط' },
  { value: '30', label: '10 - 30 كم', desc: 'تنقلات يومية عادية' },
  { value: '60', label: '30 - 60 كم', desc: 'تنقلات بين المدن' },
  { value: '100', label: 'أكثر من 60 كم', desc: 'تنقلات طويلة يومياً' },
];

const passengerOptions = [
  { value: '1', label: '1-2 أشخاص', desc: 'أنت وشريكك فقط' },
  { value: '3', label: '3-4 أشخاص', desc: 'عائلة صغيرة' },
  { value: '5', label: '5-6 أشخاص', desc: 'عائلة متوسطة' },
  { value: '7', label: '7+ أشخاص', desc: 'عائلة كبيرة' },
];

const budgetOptions = [
  { value: '8000', label: 'أقل من 8,000 د.أ', desc: 'ميزانية محدودة' },
  { value: '15000', label: '8,000 - 15,000 د.أ', desc: 'ميزانية متوسطة' },
  { value: '25000', label: '15,000 - 25,000 د.أ', desc: 'ميزانية جيدة' },
  { value: '40000', label: '25,000 - 40,000 د.أ', desc: 'ميزانية مرتفعة' },
  { value: '60000', label: 'أكثر من 40,000 د.أ', desc: 'ميزانية مفتوحة' },
];

const preferenceOptions = [
  { value: 'POWER', label: 'القوة والأداء', desc: 'أحب السرعة والمحرك القوي', icon: Zap },
  { value: 'ECONOMY', label: 'الاقتصاد والكفاءة', desc: 'أفضل توفير الوقود والصيانة', icon: Fuel },
  { value: 'BALANCED', label: 'متوازنة', desc: 'أريد التوازن بين القوة والاقتصاد', icon: Car },
];

const fuelOptions = [
  { value: '', label: 'أي نوع', desc: 'لا يهم نوع الوقود' },
  { value: 'PETROL', label: 'بنزين', desc: 'الأكثر شيوعاً' },
  { value: 'DIESEL', label: 'ديزل', desc: 'موفر للسفر الطويل' },
  { value: 'HYBRID', label: 'هايبرد', desc: 'بنزين + كهرباء' },
  { value: 'ELECTRIC', label: 'كهرباء', desc: 'صديق للبيئة' },
];

export default function CarFinderPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ dailyDistance: '30', passengers: '3', budget: '15000', preference: 'BALANCED', fuelPreference: '', bodyType: '' });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const handleFind = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/car-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.data.recommendations);
        setSummary(data.data.summary);
        setStep(steps.length);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: 'مثالية', color: 'text-green-600 bg-green-50 dark:bg-green-500/10' };
    if (score >= 60) return { label: 'مناسبة جداً', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' };
    if (score >= 40) return { label: 'مناسبة', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10' };
    return { label: 'مقبولة', color: 'text-gray-600 bg-gray-50 dark:bg-gray-500/10' };
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">هل هذه السيارة تناسبني؟</h1>
            <p className="text-gray-500">اختبر شخصيتك وسنقترح لك أفضل سيارة تناسب احتياجاتك</p>
          </div>

          {step < steps.length && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-gray-500">الخطوة {step + 1} من {steps.length}</span>
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div key={i} className={`w-8 h-2 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="text-center mb-6">
                    {(() => { const Icon = steps[step].icon; return <Icon className="w-10 h-10 text-blue-500 mx-auto mb-3" />; })()}
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{steps[step].title}</h2>
                    <p className="text-sm text-gray-500 mt-1">{steps[step].subtitle}</p>
                  </div>

                  {step === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {distanceOptions.map(opt => (
                        <button key={opt.value} onClick={() => setAnswers({ ...answers, dailyDistance: opt.value })} className={`p-4 rounded-xl border-2 text-right transition-all ${answers.dailyDistance === opt.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                          <p className="font-bold text-gray-900 dark:text-white">{opt.label}</p>
                          <p className="text-sm text-gray-500">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {step === 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {passengerOptions.map(opt => (
                        <button key={opt.value} onClick={() => setAnswers({ ...answers, passengers: opt.value })} className={`p-4 rounded-xl border-2 text-right transition-all ${answers.passengers === opt.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                          <p className="font-bold text-gray-900 dark:text-white">{opt.label}</p>
                          <p className="text-sm text-gray-500">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {budgetOptions.map(opt => (
                        <button key={opt.value} onClick={() => setAnswers({ ...answers, budget: opt.value })} className={`p-4 rounded-xl border-2 text-right transition-all ${answers.budget === opt.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                          <p className="font-bold text-gray-900 dark:text-white">{opt.label}</p>
                          <p className="text-sm text-gray-500">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="grid grid-cols-1 gap-3">
                      {preferenceOptions.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <button key={opt.value} onClick={() => setAnswers({ ...answers, preference: opt.value })} className={`p-5 rounded-xl border-2 text-right transition-all flex items-center gap-4 ${answers.preference === opt.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center"><Icon className="w-6 h-6 text-blue-600" /></div>
                            <div><p className="font-bold text-gray-900 dark:text-white">{opt.label}</p><p className="text-sm text-gray-500">{opt.desc}</p></div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {step === 4 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {fuelOptions.map(opt => (
                        <button key={opt.value} onClick={() => setAnswers({ ...answers, fuelPreference: opt.value })} className={`p-4 rounded-xl border-2 text-right transition-all ${answers.fuelPreference === opt.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                          <p className="font-bold text-gray-900 dark:text-white">{opt.label}</p>
                          <p className="text-sm text-gray-500">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} icon={<ArrowRight className="w-4 h-4" />}>السابق</Button>
                {step < steps.length - 1 ? (
                  <Button onClick={() => setStep(step + 1)} icon={<ArrowLeft className="w-4 h-4" />}>التالي</Button>
                ) : (
                  <Button onClick={handleFind} loading={loading} icon={<Car className="w-4 h-4" />}>ابحث عن سيارتي</Button>
                )}
              </div>
            </div>
          )}

          {step === steps.length && results && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {summary && (
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">ملخص البحث</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-2xl font-bold text-blue-600">{summary.totalCars}</p><p className="text-xs text-gray-500">سيارة متاحة</p></div>
                    <div><p className="text-2xl font-bold text-green-600">{summary.averagePrice.toLocaleString()}</p><p className="text-xs text-gray-500">متوسط السعر (د.أ)</p></div>
                    <div><p className="text-2xl font-bold text-purple-600">{results.length}</p><p className="text-xs text-gray-500">اقتراح مناسب</p></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">السيارات المقترحة لك</h2>
                <Button variant="ghost" size="sm" onClick={() => { setStep(0); setResults(null); }}>إعادة الاختبار</Button>
              </div>

              {results.length === 0 ? (
                <div className="card p-12 text-center">
                  <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">لا توجد نتائج مطابقة</h3>
                  <p className="text-gray-500">جرّب تغيير المعايير للحصول على نتائج أفضل</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((car, i) => {
                    const scoreInfo = getScoreLabel(car.score);
                    return (
                      <motion.div key={car.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Link href={`/cars/${car.id}`}>
                          <div className="card p-5 hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-start gap-4">
                              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {car.image ? <img src={car.image} alt={car.brand} className="w-full h-full object-cover" /> : <Car className="w-8 h-8 text-gray-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{car.brand} {car.model} {car.year}</h3>
                                    <p className="text-sm text-gray-500">{car.city} • {car.transmission === 'AUTOMATIC' ? 'أوتوماتيك' : 'يدوي'}</p>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-lg font-bold text-blue-600">{car.price.toLocaleString()} <span className="text-sm">د.أ</span></p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${scoreInfo.color}`}>{scoreInfo.label}</span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {car.reasons.map((reason, j) => (
                                    <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400">{reason}</span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                  {car.fuelType && <span>{car.fuelType === 'HYBRID' ? 'هايبرد' : car.fuelType === 'ELECTRIC' ? 'كهرباء' : car.fuelType === 'DIESEL' ? 'ديزل' : 'بنزين'}</span>}
                                  {car.kilometers && <span>{car.kilometers.toLocaleString()} كم</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
