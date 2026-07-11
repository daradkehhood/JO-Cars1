'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, BarChart3, CheckCircle, AlertTriangle, Image, Eye, Heart, User, Calendar, Shield, Wrench, Gauge, Car, DollarSign, TrendingUp, TrendingDown, Minus, MapPin, Star, Settings, ChevronLeft, ChevronRight, Sparkles, Clock, Home, Factory, Zap, Wind, Building2, RotateCcw, Award, AlertCircle, Palette } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface AiAnalysisProps {
  carId: string;
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
  };
  condition: {
    score: number;
    label: string;
    confidence: number;
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
  damages: string[];
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
        if (data.success) {
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
          <span className="mr-3 text-gray-500">جاري تحليل السيارة بالذكاء الاصطناعي...</span>
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

  const getPricePositionLabel = (pos: string) => {
    if (pos === 'above') return 'أعلى من السوق';
    if (pos === 'below') return 'أقل من السوق';
    return 'متوافق مع السوق';
  };

  const getPricePositionColor = (pos: string) => {
    if (pos === 'above') return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200';
    if (pos === 'below') return 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200';
    return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200';
  };

  const getTransmissionLabel = (t: string) => {
    const map: Record<string, string> = { MANUAL: 'يدوي', AUTOMATIC: 'أوتوماتيك', CVT: 'CVT', DCT: 'DCT' };
    return map[t] || t;
  };

  const getFuelTypeLabel = (f: string) => {
    const map: Record<string, string> = { PETROL: 'بنزين', DIESEL: 'ديزل', HYBRID: 'هايبرد', ELECTRIC: 'كهرباء', PLUGIN_HYBRID: 'هايبرد بلج إن' };
    return map[f] || f;
  };

  const getDrivetrainLabel = (d: string) => {
    const map: Record<string, string> = { FWD: 'دفع أمامي', RWD: 'دفع خلفي', AWD: 'دفع رباعي', FOUR_WD: '4WD' };
    return map[d] || d;
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card p-6 mt-2">
      <div className="space-y-6">
        {/* Price Analysis Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-100 dark:border-blue-500/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">تحليل السعر</h3>
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
              <p className="font-bold text-lg text-gray-900 dark:text-white">{formatPrice(price.avgPrice)} د.أ</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPricePositionColor(price.position)}`}>
              {getPricePositionIcon(price.position)}
              {getPricePositionLabel(price.position)}
              {price.diffPercent > 0 && (
                <span className="ml-1">({price.diffPercent}%)</span>
              )}
            </span>
            <span className="px-3 py-1 rounded-full text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-200">
              <BarChart3 className="w-3 h-3 inline mr-1" />
              {price.similarCount} سيارة مشابهة
            </span>
            {price.estimate && (
              <span className="px-3 py-1 rounded-full text-xs text-purple-600 bg-purple-50 dark:bg-purple-500/10 border border-purple-200">
                <Sparkles className="w-3 h-3 inline mr-1" />
                تقدير ذكي
              </span>
            )}
          </div>
        </div>

        {/* Condition Analysis */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10 border border-emerald-100 dark:border-emerald-500/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">تقييم الحالة</h3>
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
              <p className="text-xs text-gray-500 mt-1">بناءً على اكتمال البيانات</p>
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

          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {condition.hasServiceHistory && (
              <span className="px-3 py-1 rounded-full text-xs text-green-600 bg-green-50 dark:bg-green-500/10 border border-green-200 flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                سجل صيانة
              </span>
            )}
            {condition.hasWarranty && (
              <span className="px-3 py-1 rounded-full text-xs text-blue-600 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                ضمان
              </span>
            )}
            {condition.isOriginalPaint && (
              <span className="px-3 py-1 rounded-full text-xs text-purple-600 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 flex items-center gap-1">
                <Palette className="w-3 h-3" />
                دهان أصلي
              </span>
            )}
            {condition.isDamaged && (
              <span className="px-3 py-1 rounded-full text-xs text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                مصدومة سابقاً
              </span>
            )}
          </div>
        </div>

        {/* Image Analysis */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-100 dark:border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
              <Image className="w-4 h-4 text-white" />
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
              عدد الصور أقل من 5 - إضافة المزيد يحسن دقة التحليل
            </div>
          )}
        </div>

        {/* Damages & Issues */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-500/10 dark:to-orange-500/10 border border-red-100 dark:border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">العيوب والمشاكل</h3>
          </div>

          <div className="space-y-2">
            {damages.map((damage, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-red-100 dark:border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-gray-900 dark:text-white">{damage}</span>
              </div>
            ))}
            {damages.length === 1 && damages[0] === 'لا توجد عيوب مذكورة' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">لا توجد عيوب مذكورة في الإعلان</span>
              </div>
            )}
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <p className="font-bold text-sm text-gray-900 dark:text-white">{getTransmissionLabel(overview.transmission)}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">نوع الوقود</p>
              <p className="font-bold text-sm text-gray-900 dark:text-white">{getFuelTypeLabel(overview.fuelType)}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">الدفع</p>
              <p className="font-bold text-sm text-gray-900 dark:text-white">{getDrivetrainLabel(overview.drivetrain)}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">تقييم البائع</p>
              <p className="font-bold text-lg text-gray-900 dark:text-white flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-amber-500" />
                {overview.sellerRating.toFixed(1)} ({overview.sellerRatingCount})
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">نوع البائع</p>
              <p className="font-bold text-sm text-gray-900 dark:text-white">
                {overview.sellerIsDealer ? (
                  <span className="text-blue-600 flex items-center justify-center gap-1">
                    <Building2 className="w-3 h-3" />
                    تاجر
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center justify-center gap-1">
                    <User className="w-3 h-3" />
                    فرد
                  </span>
                )}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800/50 text-center">
              <p className="text-xs text-gray-500">عضو منذ</p>
              <p className="font-bold text-sm text-gray-900 dark:text-white">
                {new Date(overview.sellerMemberSince).getFullYear()}
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
            <li>• مقارنة مع {price.similarCount} سيارة مشابهة في قاعدة البيانات</li>
            <li>• تحليل {images.count} صور مرفقة</li>
            <li>• بيانات السيارة: {car?.trim ? 'مكتملة' : 'ناقصة'} | الحالة: {car?.condition} | الكيلومترات: {car?.kilometers?.toLocaleString()} كم</li>
            <li>• تقدير السعر العادل: {car?.fairPriceEstimate ? formatPrice(car.fairPriceEstimate) + ' د.أ' : 'غير متاح'}</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}