'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, BarChart3, CheckCircle, AlertTriangle, Image as ImageIcon, Eye, Heart,
  User, Calendar, Shield, Wrench, Gauge, Car, DollarSign, TrendingUp, TrendingDown,
  Minus, MapPin, Star, Settings, ChevronLeft, ChevronRight, Sparkles, Clock,
  Home, Factory, Zap, Wind, Building2, RotateCcw, Award, AlertCircle, Palette,
  ExternalLink, Fuel, Cog, ListChecks,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface AiAnalysisProps {
  carId: string;
}

interface SimilarListing {
  site: string;
  url: string;
  price: number;
  year: number;
  km: number;
  notes?: string;
}

interface ConditionFactor {
  name: string;
  score: number;
  description: string;
}

interface DamageItem {
  part: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
}

interface AnalysisData {
  car: {
    id: string;
    slug: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    kilometers: number;
    condition: string;
    city: string;
    fuelType: string;
    transmission: string;
    engineCapacity: number | null;
    drivetrain: string;
    color: string;
    trim: string | null;
    ownerCount: number;
    isDamaged: boolean;
    isPaintOriginal: boolean;
    hasServiceHistory: boolean;
    hasWarranty: boolean;
    isNegotiable: boolean;
    fairPriceEstimate: number | null;
    description: string;
    aiDescription: string | null;
  };
  price: {
    estimate: number;
    range: { min: number; max: number };
    avgPrice: number;
    position: 'above' | 'below' | 'match';
    diffPercent: number;
    similarCount: number;
    similarCars: any[];
    confidence?: number;
    reasoning?: string;
    marketFactors?: string[];
    similarListings?: SimilarListing[];
    sources?: string[];
    isRealWebSearch?: boolean;
  };
  condition: {
    score: number;
    label: string;
    confidence: number;
    factors?: ConditionFactor[];
    damages?: DamageItem[];
    summary?: string;
    isRealVision?: boolean;
    exteriorScore?: number;
    interiorScore?: number;
    engineBayScore?: number;
    ownerCount: number;
    hasServiceHistory: boolean;
    hasWarranty: boolean;
    isOriginalPaint: boolean;
    isDamaged: boolean;
  };
  images: {
    count: number;
    analyzed: number;
  };
  damages: string[] | DamageItem[];
  overview: {
    views: number;
    saves: number;
    age: number;
    transmission: string;
    fuelType: string;
    drivetrain: string;
    sellerRating: number;
    sellerRatingCount: number;
    sellerIsDealer: boolean;
    sellerMemberSince: string;
  };
}

export function AiAnalysisContent({ carId }: AiAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ai/analysis/${carId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setAnalysis(data.data);
        } else {
          setError(data.error || 'فشل تحميل التحليل');
        }
      } catch {
        setError('حدث خطأ في الاتصال');
      }
      setLoading(false);
    };
    fetchAnalysis();
  }, [carId]);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card p-6 mt-2">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="mr-3 text-gray-500">جاري تحليل السيارة بالذكاء الاصطناعي…</span>
        </div>
      </motion.div>
    );
  }

  if (error || !analysis) {
    return (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card p-6 mt-2">
        <div className="text-center py-8 text-red-500">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2" />
          <p>{error || 'تعذر تحميل التحليل'}</p>
        </div>
      </motion.div>
    );
  }

  const { car, price, condition, images, damages, overview } = analysis;

  const getConditionColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };
  const getConditionBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 dark:bg-green-500/10';
    if (score >= 60) return 'bg-blue-50 dark:bg-blue-500/10';
    if (score >= 40) return 'bg-amber-50 dark:bg-amber-500/10';
    return 'bg-red-50 dark:bg-red-500/10';
  };
  const getPricePositionIcon = (pos: string) => {
    if (pos === 'above') return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (pos === 'below') return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-blue-500" />;
  };
  const getPricePositionLabel = (pos: string) =>
    pos === 'above' ? 'أعلى من السوق' : pos === 'below' ? 'أقل من السوق' : 'متوافق مع السوق';
  const getPricePositionColor = (pos: string) =>
    pos === 'above'
      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200'
      : pos === 'below'
        ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200'
        : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200';

  const subtitleMap: Record<string, string> = { MANUAL: 'يدوي', AUTOMATIC: 'أوتوماتيك', CVT: 'CVT', DCT: 'DCT', SEMI_AUTOMATIC: 'نصف أوتوماتيك' };
  const fuelMap: Record<string, string> = { PETROL: 'بنزين', DIESEL: 'ديزل', HYBRID: 'هايبرد', ELECTRIC: 'كهرباء', PLUGIN_HYBRID: 'هايبرد بلج إن' };
  const driveMap: Record<string, string> = { FWD: 'دفع أمامي', RWD: 'دفع خلفي', AWD: 'دفع رباعي دائم', FOUR_WD: '4WD' };

  // Normalize damages: server may return either string[] (legacy) or DamageItem[]
  const damageItems: DamageItem[] = (Array.isArray(damages) ? damages : [])
    .map((d) => {
      if (typeof d === 'string') {
        return { part: d, severity: 'minor' as const, description: d };
      }
      return d as DamageItem;
    })
    .filter(Boolean);

  const subScore = (label: string, score: number | undefined, icon: React.ReactNode) => {
    if (score === undefined) return null;
    const color = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-blue-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';
    return (
      <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
        <div className="flex items-center justify-center mb-1 text-gray-500">{icon}</div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`font-bold text-2xl ${color}`}>{score}/100</p>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card p-6 mt-2">
      <div className="space-y-6">

        {/* Hero: AI badge + confidence + sources */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5" />
            تحليل ذكاء اصطناعي محلي
          </span>
          {price.confidence !== undefined && (
            <span className="px-3 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200">
              ثقة {price.confidence}%
            </span>
          )}
          {!price.isRealWebSearch && (
            <span className="px-3 py-1 rounded-full text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              تحليل على المواصفات (لا يوجد scraping مفعّل)
            </span>
          )}
          {(price.sources || []).map((src, i) => (
            <span key={i} className="px-3 py-1 rounded-full text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200">
              {src}
            </span>
          ))}
        </div>

        {/* Price Analysis Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-100 dark:border-blue-500/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">تحليل السعر الذكي</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50">
              <p className="text-xs text-gray-500">السعر العادل المقدر</p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">{formatPrice(price.estimate)} د.أ</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50">
              <p className="text-xs text-gray-500">نطاق السوق</p>
              <p className="font-bold text-gray-900 dark:text-white">{formatPrice(price.range.min)} - {formatPrice(price.range.max)} د.أ</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50">
              <p className="text-xs text-gray-500">سعر الإعلان</p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">{formatPrice(car.price)} د.أ</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getPricePositionColor(price.position)}`}>
              {getPricePositionIcon(price.position)}
              {getPricePositionLabel(price.position)}
              {price.diffPercent > 0 && <span className="ml-1">({price.diffPercent}%)</span>}
            </span>
            <span className="px-3 py-1 rounded-full text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-200">
              <BarChart3 className="w-3 h-3 inline mr-1" /> {price.similarCount} سيارة مشابهة
            </span>
          </div>

          {price.reasoning && (
            <div className="mt-3 p-3 rounded-lg bg-white/70 dark:bg-gray-900/40 border border-blue-100 dark:border-blue-500/20 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
              <div className="flex items-start gap-2">
                <ListChecks className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                <p>{price.reasoning}</p>
              </div>
            </div>
          )}

          {price.marketFactors && price.marketFactors.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">العوامل المؤثرة في التقييم:</p>
              <div className="flex flex-wrap gap-2">
                {price.marketFactors.slice(0, 12).map((f, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-gray-800/60 border border-blue-100 dark:border-blue-500/30 text-gray-700 dark:text-gray-200">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Similar Live Listings — OpenSooq + JO Cars */}
        {price.similarListings && price.similarListings.length > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">إعلانات مماثلة من السوق</h3>
            </div>
            <div className="space-y-2">
              {price.similarListings.slice(0, 8).map((l, i) => {
                const isOpenSooq = l.site.includes('السوق') || l.url.includes('opensooq');
                return (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-emerald-100 dark:border-emerald-500/20 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isOpenSooq ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'}`}>
                          {l.site}
                        </span>
                        {l.year > 0 && <span className="text-xs text-gray-500">{l.year}</span>}
                        {l.km > 0 && <span className="text-xs text-gray-500"><Gauge className="w-3 h-3 inline mr-1" />{l.km.toLocaleString()} كم</span>}
                      </div>
                      {l.notes && <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{l.notes}</p>}
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="font-bold text-gray-900 dark:text-white">{formatPrice(l.price)} د.أ</p>
                      <p className="text-xs text-blue-500 flex items-center gap-1">عرض <ExternalLink className="w-3 h-3" /></p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Condition Analysis */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10 border border-emerald-100 dark:border-emerald-500/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">تقييم الحالة الذكي</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className={`p-4 rounded-xl ${getConditionBg(condition.score)} text-center`}>
              <p className="text-xs text-gray-500">نقاط الحالة</p>
              <p className={`font-bold text-3xl ${getConditionColor(condition.score)}`}>{condition.score}/100</p>
              <p className="text-xs text-gray-500 mt-1">{condition.label}</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">نسبة الثقة</p>
              <p className="font-bold text-3xl text-blue-500">{condition.confidence}%</p>
              <p className="text-xs text-gray-500 mt-1">بناءً على المواصفات</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">عدد المالكين</p>
              <p className="font-bold text-3xl text-gray-900 dark:text-white">{condition.ownerCount}</p>
              <p className="text-xs text-gray-500 mt-1">{condition.ownerCount === 1 ? 'مالك واحد' : 'ملاك متعددون'}</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">عمر السيارة</p>
              <p className="font-bold text-3xl text-gray-900 dark:text-white">{overview.age} سنة</p>
              <p className="text-xs text-gray-500 mt-1">موديل {new Date().getFullYear() - overview.age}</p>
            </div>
          </div>

          {/* Sub-scores (AI heuristic exterior / interior / engineBay) */}
          {(condition.exteriorScore !== undefined || condition.interiorScore !== undefined || condition.engineBayScore !== undefined) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {subScore('الحالة الخارجية', condition.exteriorScore, <Car className="w-4 h-4" />)}
              {subScore('الداخل والمقاعد', condition.interiorScore, <Home className="w-4 h-4" />)}
              {subScore('غرفة المحرك', condition.engineBayScore, <Cog className="w-4 h-4" />)}
            </div>
          )}

          {/* Spec-based factors from the heuristic engine */}
          {condition.factors && condition.factors.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">عوامل الحالة المستخرجة:</p>
              <div className="space-y-2">
                {condition.factors.map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white dark:bg-gray-800/50 border border-emerald-100 dark:border-emerald-500/20">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{f.name}</p>
                      <p className="text-xs text-gray-500">{f.description}</p>
                    </div>
                    <div className={`text-sm font-bold ${getConditionColor(f.score)}`}>{f.score}/100</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seller-declared feature pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {condition.hasServiceHistory && (
              <span className="px-3 py-1 rounded-full text-xs text-green-600 bg-green-50 dark:bg-green-500/10 border border-green-200 flex items-center gap-1">
                <Wrench className="w-3 h-3" /> سجل صيانة
              </span>
            )}
            {condition.hasWarranty && (
              <span className="px-3 py-1 rounded-full text-xs text-blue-600 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 flex items-center gap-1">
                <Shield className="w-3 h-3" /> ضمان
              </span>
            )}
            {condition.isOriginalPaint && (
              <span className="px-3 py-1 rounded-full text-xs text-purple-600 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 flex items-center gap-1">
                <Palette className="w-3 h-3" /> دهان أصلي
              </span>
            )}
            {condition.isDamaged && (
              <span className="px-3 py-1 rounded-full text-xs text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> مصدومة سابقاً
              </span>
            )}
          </div>

          {condition.summary && (
            <div className="mt-3 p-3 rounded-lg bg-white/70 dark:bg-gray-900/40 border border-emerald-100 dark:border-emerald-500/20 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
              {condition.summary}
            </div>
          )}
        </div>

        {/* Image Analysis */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-100 dark:border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">تحليل الصور</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">عدد الصور المرفقة</p>
              <p className="font-bold text-2xl text-gray-900 dark:text-white">{images.count}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">تم تحليلها</p>
              <p className="font-bold text-2xl text-purple-500">{images.analyzed}</p>
            </div>
          </div>
          {images.count < 5 && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 text-amber-700 dark:text-amber-400 text-sm">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              عدد الصور أقل من 5 — إضافة المزيد يحسّن دقة التحليل
            </div>
          )}
        </div>

        {/* Damages & Issues */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-500/10 dark:to-orange-500/10 border border-red-100 dark:border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">العيوب والملاحظات</h3>
          </div>
          <div className="space-y-2">
            {damageItems.length === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">لا توجد عيوب مذكورة في الإعلان</span>
              </div>
            )}
            {damageItems.map((d, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-red-100 dark:border-red-500/20">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${d.severity === 'severe' ? 'text-red-600' : d.severity === 'moderate' ? 'text-orange-500' : 'text-amber-500'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{d.part}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{d.description}</p>
                  {d.severity !== 'minor' && d.severity !== 'moderate' && d.severity !== 'severe' && (
                    <span className="text-xs text-gray-500">{d.severity}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Overview */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-500/10 dark:to-slate-500/10 border border-gray-100 dark:border-gray-500/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">نظرة عامة على السوق</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">المشاهدات</p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">{overview.views.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">الحفظ</p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">{overview.saves}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">ناقل الحركة</p>
              <p className="font-bold text-sm text-gray-900 dark:text-white">{subtitleMap[overview.transmission] || overview.transmission}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">نوع الوقود</p>
              <p className="font-bold text-sm text-gray-900 dark:text-white">{fuelMap[overview.fuelType] || overview.fuelType}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">الدفع</p>
              <p className="font-bold text-sm text-gray-900 dark:text-white">{driveMap[overview.drivetrain] || overview.drivetrain || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">تقييم البائع</p>
              <p className="font-bold text-lg text-gray-900 dark:text-white flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-amber-500" />
                {overview.sellerRating?.toFixed?.(1) ?? '0.0'} ({overview.sellerRatingCount})
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">نوع البائع</p>
              <p className="font-bold text-sm text-gray-900 dark:text-white">
                {overview.sellerIsDealer ? (
                  <span className="text-blue-600 flex items-center justify-center gap-1">
                    <Building2 className="w-3 h-3" /> تاجر
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center justify-center gap-1">
                    <User className="w-3 h-3" /> فرد
                  </span>
                )}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">عضو منذ</p>
              <p className="font-bold text-sm text-gray-900 dark:text-white">
                {overview.sellerMemberSince ? new Date(overview.sellerMemberSince).getFullYear() : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-xs text-blue-700 dark:text-blue-400">
          <div className="flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3" />
            <span className="font-medium">مصادر البيانات:</span>
          </div>
          <ul className="space-y-1 text-right">
            <li>• {price.similarCount + (price.similarListings?.length || 0)} سيارة مشابهة (JO Cars DB + السوق المفتوح)</li>
            <li>• {price.sources?.length || 0} مصدر بيانات: {(price.sources || []).join('، ')}</li>
            <li>• {price.marketFactors?.length || 0} عامل محلي + {condition.factors?.length || 0} عامل حالة</li>
            <li>• {images.count} صور مرفقة — {images.analyzed} مرئية للخوارزمية</li>
            <li>• السعر العادل المقترح من صفحة الإعلان: {car.fairPriceEstimate ? formatPrice(car.fairPriceEstimate) + ' د.أ' : 'غير متاح'}</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
