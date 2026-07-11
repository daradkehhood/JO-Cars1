'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileText, TrendingDown, Fuel, Wrench, AlertTriangle, Star,
  Shield, ThumbsUp, ThumbsDown, DollarSign, Calendar, MapPin,
  Loader2, ArrowRight, Package, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import Link from 'next/link';

interface ReportData {
  car: {
    id: string; slug: string; title: string; price: number; year: number;
    kilometers: number; condition: string; city: string;
    seller: { name: string; rating: number | null };
  };
  market: {
    averagePrice: number; similarListings: number; pricePosition: string;
  };
  depreciation: { currentAge: number; depreciationPercent: number; estimatedValue: number };
  fuel: { city: number; highway: number; unit: string };
  annualMaintenanceCost: number;
  monthlyFuelCost: number;
  commonFaults: Array<{ name: string; severity: string; cost: number; frequency: string }>;
  maintenanceSchedule: Array<{ interval: string; items: string[]; estimatedCost: number }>;
  spareParts: Array<{ name: string; priceRange: string; availability: string }>;
  ratings: { safety: number; reliability: number };
  pros: string[];
  cons: string[];
}

export default function CarReportPage() {
  const params = useParams();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    market: true, fuel: true, maintenance: true, faults: true, parts: true,
  });

  useEffect(() => {
    if (params.id) {
      fetch(`/api/cars/${params.id}/report`)
        .then(r => r.json())
        .then(d => { if (d.success) setData(d.data); else setError(d.error); })
        .catch(() => setError('فشل تحميل التقرير'))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const toggle = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">{error || 'السيارة غير موجودة'}</p>
        <Link href="/" className="text-blue-500 hover:underline mt-3 inline-block">العودة للرئيسية</Link>
      </div>
    </div>
  );

  const Section = ({ title, icon: Icon, sectionKey, children }: {
    title: string; icon: any; sectionKey: string; children: React.ReactNode;
  }) => (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/80 overflow-hidden">
      <button onClick={() => toggle(sectionKey)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {expandedSections[sectionKey] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {expandedSections[sectionKey] && <div className="p-5 pt-0">{children}</div>}
    </div>
  );

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Header */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">تقرير السيارة الشامل</h1>
                  <p className="text-sm text-gray-500">{data.car.title}</p>
                </div>
              </div>
              <Link href={`/cars/${data.car.slug || data.car.id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">
                <ArrowRight className="w-4 h-4" />
                عرض الإعلان
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                <p className="text-xs text-gray-500">السعر</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{data.car.price.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">دينار</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                <p className="text-xs text-gray-500">السنة</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{data.car.year}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                <p className="text-xs text-gray-500">الممشى</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{data.car.kilometers.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">كم</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                <p className="text-xs text-gray-500">المدينة</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{data.car.city}</p>
              </div>
            </div>
          </div>

          {/* Market Price */}
          <Section title="تقييم السوق" icon={DollarSign} sectionKey="market">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-center">
                <p className="text-sm text-gray-500 mb-1">متوسط سعر السوق</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.market.averagePrice.toLocaleString()}</p>
                <p className="text-xs text-gray-400">دينار أردني</p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-center">
                <p className="text-sm text-gray-500 mb-1">القيمة الحالية</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.depreciation.estimatedValue.toLocaleString()}</p>
                <p className="text-xs text-gray-400">دينار أردني</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-center">
                <p className="text-sm text-gray-500 mb-1">هبوط القيمة</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.depreciation.depreciationPercent}%</p>
                <p className="text-xs text-gray-400">منذ الشراء</p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">موقع سعرك في السوق:</span>
                <span className={`text-sm font-bold ${data.market.pricePosition.includes('أقل') ? 'text-green-600' : data.market.pricePosition.includes('أعلى') ? 'text-red-600' : 'text-blue-600'}`}>
                  {data.market.pricePosition}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">{data.market.similarListings} إعلان مشابه في السوق</div>
            </div>
          </Section>

          {/* Fuel */}
          <Section title="استهلاك الوقود" icon={Fuel} sectionKey="fuel">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 text-center">
                <p className="text-sm text-gray-500 mb-1">داخل المدينة</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.fuel.city}</p>
                <p className="text-xs text-gray-400">{data.fuel.unit}</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-center">
                <p className="text-sm text-gray-500 mb-1">على الطريق السريع</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.fuel.highway}</p>
                <p className="text-xs text-gray-400">{data.fuel.unit}</p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                تكلفة الوقود الشهرية المقدرة: <span className="font-bold">{data.monthlyFuelCost.toLocaleString()} دينار</span>
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">مبنية على 1,500 كم شهرياً بسعر 0.610 د.أ/لتر</p>
            </div>
          </Section>

          {/* Maintenance */}
          <Section title="جدول الصيانة" icon={Wrench} sectionKey="maintenance">
            <div className="space-y-3">
              {data.maintenanceSchedule.map((m, i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{m.interval}</span>
                    </div>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{m.estimatedCost} د.أ</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {m.items.map((item, j) => (
                      <span key={j} className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10">
              <p className="text-sm text-purple-700 dark:text-purple-400">
                التكلفة السنوية للصيانة: <span className="font-bold">{data.annualMaintenanceCost.toLocaleString()} دينار</span>
              </p>
            </div>
          </Section>

          {/* Common Faults */}
          <Section title="الأعطال الشائعة" icon={AlertTriangle} sectionKey="faults">
            <div className="space-y-3">
              {data.commonFaults.map((fault, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className={`w-3 h-3 rounded-full ${fault.severity === 'عالي' ? 'bg-red-500' : fault.severity === 'متوسط' ? 'bg-amber-500' : 'bg-green-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{fault.name}</p>
                    <p className="text-xs text-gray-500">{fault.frequency}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{fault.cost} د.أ</p>
                    <p className={`text-xs ${fault.severity === 'عالي' ? 'text-red-500' : fault.severity === 'متوسط' ? 'text-amber-500' : 'text-green-500'}`}>{fault.severity}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Spare Parts */}
          <Section title="قطع الغيار" icon={Package} sectionKey="parts">
            <div className="space-y-2">
              {data.spareParts.map((part, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{part.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{part.priceRange}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${part.availability === 'متوفر' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                      {part.availability}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Ratings & Pros/Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                التقييمات
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">الأمان</span>
                    <span className="font-medium text-gray-900 dark:text-white">{data.ratings.safety}/5</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(data.ratings.safety / 5) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">الموثوقية</span>
                    <span className="font-medium text-gray-900 dark:text-white">{data.ratings.reliability}/5</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${(data.ratings.reliability / 5) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">المميزات والعيوب</h3>
              <div className="space-y-2">
                {data.pros.map((pro, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{pro}</span>
                  </div>
                ))}
                {data.cons.map((con, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{con}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
