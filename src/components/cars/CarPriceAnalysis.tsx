'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, TrendingUp, TrendingDown, Minus, DollarSign, BarChart3,
  CheckCircle, AlertTriangle, Calendar, Gauge, Shield, Fuel, Settings,
  Car, AlertCircle, Users, Palette, ChevronDown, ChevronUp, ExternalLink,
  Info, Zap, Target
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PriceFactor {
  name: string;
  impact: number;
  description: string;
  icon: string;
}

interface SimilarCar {
  id: string;
  title: string;
  price: number;
  year: number;
  kilometers: number;
  condition: string;
  city: string;
  image: string | null;
  similarity: number;
  source: string;
}

interface AnalysisData {
  valuation: {
    fairPrice: number;
    minPrice: number;
    maxPrice: number;
    confidence: number;
    sources: string[];
  };
  assessment: {
    position: 'below' | 'within' | 'above';
    label: string;
    color: string;
    icon: string;
    diffPercent: number;
    diffAmount: number;
    explanation: string;
  };
  factors: PriceFactor[];
  similarCars: SimilarCar[];
  summary: {
    headline: string;
    detail: string;
    recommendation: string;
  };
}

interface Props {
  brand: string;
  model: string;
  year: number;
  trim?: string;
  kilometers: number;
  condition: string;
  fuelType: string;
  transmission: string;
  bodyType?: string;
  engineCapacity?: string;
  cylinders?: string;
  drivetrain?: string;
  color?: string;
  ownerCount?: number;
  isDamaged?: boolean;
  isPaintOriginal?: boolean;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  currentPrice: number;
  onPriceSelect?: (price: number) => void;
  compact?: boolean;
}

const factorIcons: Record<string, React.ReactNode> = {
  calendar: <Calendar className="w-4 h-4" />,
  gauge: <Gauge className="w-4 h-4" />,
  shield: <Shield className="w-4 h-4" />,
  fuel: <Fuel className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
  car: <Car className="w-4 h-4" />,
  alert: <AlertCircle className="w-4 h-4" />,
  users: <Users className="w-4 h-4" />,
  check: <CheckCircle className="w-4 h-4" />,
  clipboard: <BarChart3 className="w-4 h-4" />,
  palette: <Palette className="w-4 h-4" />,
};

export function CarPriceAnalysis({
  brand, model, year, trim, kilometers, condition, fuelType, transmission,
  bodyType, engineCapacity, cylinders, drivetrain, color, ownerCount,
  isDamaged, isPaintOriginal, hasWarranty, hasServiceHistory,
  currentPrice, onPriceSelect, compact = false
}: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [expanded, setExpanded] = useState(!compact);
  const [showFactors, setShowFactors] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);

  const analyze = async () => {
    if (!brand) {
      toast.error('أدخل الماركة أولاً');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/price-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand, model, year, trim, kilometers, condition, fuelType,
          transmission, bodyType, engineCapacity, cylinders, drivetrain,
          color, ownerCount, isDamaged, isPaintOriginal, hasWarranty,
          hasServiceHistory, price: currentPrice,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        setExpanded(true);
      } else {
        toast.error(result.error || 'فشل التحليل');
      }
    } catch {
      toast.error('تعذر تحليل السعر');
    } finally {
      setLoading(false);
    }
  };

  const positionColors = {
    below: 'from-green-500 to-emerald-500',
    within: 'from-blue-500 to-indigo-500',
    above: 'from-red-500 to-orange-500',
  };

  const positionBg = {
    below: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-800',
    within: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800',
    above: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800',
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={analyze} disabled={loading || !brand}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Target className="w-5 h-5" />
        )}
        {loading ? 'جاري تحليل السعر بالذكاء الاصطناعي...' : 'تقييم السعر بالذكاء الاصطناعي'}
      </button>

      <AnimatePresence>
        {data && expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/80 shadow-xl overflow-hidden">

              {/* Header */}
              <div className={`bg-gradient-to-r ${positionColors[data.assessment.position]} p-5 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">تقرير تقييم السعر</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">
                      ثقة {data.valuation.confidence}%
                    </span>
                    <button onClick={() => setExpanded(false)} className="text-white/70 hover:text-white text-xs">إخفاء</button>
                  </div>
                </div>
                <p className="text-sm text-white/80">{brand} {model} {year}</p>
                {data.valuation.sources.length > 0 && (
                  <p className="text-xs text-white/60 mt-1">المصادر: {data.valuation.sources.join(' • ')}</p>
                )}
              </div>

              <div className="p-5 space-y-5">

                {/* Fair Price Display */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">القيمة السوقية العادلة</p>
                  <p className="text-4xl font-black text-gray-900 dark:text-white">
                    {data.valuation.fairPrice.toLocaleString()}
                    <span className="text-lg font-medium text-gray-500 mr-1">د.أ</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    نطاق: {data.valuation.minPrice.toLocaleString()} — {data.valuation.maxPrice.toLocaleString()} د.أ
                  </p>
                </div>

                {/* Price Range Visual */}
                <div className="relative">
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>رخيص</span>
                    <span>متوسط</span>
                    <span>غالي</span>
                  </div>
                  {/* Fair price marker */}
                  <div className="absolute top-0 h-3 w-0.5 bg-blue-600 rounded-full"
                    style={{ left: '50%', transform: 'translateX(-50%)' }} />
                  {/* User price marker */}
                  {currentPrice > 0 && data.valuation.maxPrice > data.valuation.minPrice && (
                    <div className="absolute top-0 h-3 w-1 bg-gray-900 dark:bg-white rounded-full"
                      style={{
                        left: `${Math.min(Math.max(
                          ((currentPrice - data.valuation.minPrice) / (data.valuation.maxPrice - data.valuation.minPrice)) * 100,
                          0
                        ), 100)}%`
                      }} />
                  )}
                </div>

                {/* Assessment Card */}
                <div className={`p-4 rounded-xl border ${positionBg[data.assessment.position]}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {data.assessment.position === 'below' ? <TrendingDown className="w-6 h-6 text-green-600" /> :
                       data.assessment.position === 'within' ? <CheckCircle className="w-6 h-6 text-blue-600" /> :
                       <TrendingUp className="w-6 h-6 text-red-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-bold ${data.assessment.color}`}>{data.assessment.label}</h4>
                        {currentPrice > 0 && (
                          <span className={`text-sm font-bold ${data.assessment.color}`}>
                            ({data.assessment.diffPercent > 0 ? '+' : ''}{data.assessment.diffPercent}%)
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {data.assessment.explanation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Price Comparison */}
                {currentPrice > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-500">سعرك المحدد</p>
                      <p className="font-bold text-gray-900 dark:text-white">{currentPrice.toLocaleString()} د.أ</p>
                    </div>
                    <div className="text-2xl text-gray-300">↔</div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">القيمة العادلة</p>
                      <p className="font-bold text-blue-600">{data.valuation.fairPrice.toLocaleString()} د.أ</p>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-center">
                    <DollarSign className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">الحد الأدنى</p>
                    <p className="text-sm font-bold text-blue-600">{data.valuation.minPrice.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-center">
                    <Target className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">السعر العادل</p>
                    <p className="text-sm font-bold text-purple-600">{data.valuation.fairPrice.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-center">
                    <BarChart3 className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">الحد الأعلى</p>
                    <p className="text-sm font-bold text-amber-600">{data.valuation.maxPrice.toLocaleString()}</p>
                  </div>
                </div>

                {/* Use Fair Price Button */}
                {onPriceSelect && currentPrice !== data.valuation.fairPrice && (
                  <button type="button" onClick={() => onPriceSelect(data.valuation.fairPrice)}
                    className="w-full py-2.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all">
                    استخدام السعر العادل ({data.valuation.fairPrice.toLocaleString()} د.أ)
                  </button>
                )}

                {/* Factors */}
                {data.factors.length > 0 && (
                  <div>
                    <button type="button" onClick={() => setShowFactors(!showFactors)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
                      <Zap className="w-4 h-4" />
                      العوامل المؤثرة على السعر ({data.factors.length})
                      {showFactors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {showFactors && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                          className="overflow-hidden mt-3">
                          <div className="space-y-2">
                            {data.factors.map((factor, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  factor.impact > 0 ? 'bg-green-100 text-green-600' :
                                  factor.impact < 0 ? 'bg-red-100 text-red-600' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {factorIcons[factor.icon] || <Info className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{factor.name}</span>
                                    <span className={`text-xs font-bold ${
                                      factor.impact > 0 ? 'text-green-600' :
                                      factor.impact < 0 ? 'text-red-600' : 'text-gray-500'
                                    }`}>
                                      {factor.impact > 0 ? '+' : ''}{Math.round(factor.impact * 100)}%
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">{factor.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Similar Cars */}
                {data.similarCars.length > 0 && (
                  <div>
                    <button type="button" onClick={() => setShowSimilar(!showSimilar)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
                      <Car className="w-4 h-4" />
                      سيارات مشابهة في السوق ({data.similarCars.length})
                      {showSimilar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {showSimilar && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                          className="overflow-hidden mt-3">
                          <div className="space-y-2 max-h-72 overflow-y-auto">
                            {data.similarCars.map((car) => (
                              <a key={car.id} href={`/cars/${car.id}`} target="_blank" rel="noopener"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800">
                                {car.image ? (
                                  <img src={car.image} alt={car.title} className="w-14 h-14 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Car className="w-6 h-6 text-gray-300" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{car.title}</p>
                                  <p className="text-xs text-gray-500">
                                    {car.kilometers.toLocaleString()} كم • {car.city}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                      car.similarity >= 80 ? 'bg-green-100 text-green-700' :
                                      car.similarity >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>
                                      {car.similarity}% تطابق
                                    </span>
                                    <span className="text-[10px] text-gray-400">{car.source}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">{car.price.toLocaleString()}</p>
                                  <p className="text-[10px] text-gray-400">د.أ</p>
                                  <ExternalLink className="w-3 h-3 text-gray-300 mt-1" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-4 text-white">
                  <h4 className="font-bold text-sm mb-2">الخلاصة</h4>
                  <p className="text-sm leading-relaxed">{data.summary.detail}</p>
                  <p className="text-sm font-medium mt-2 text-blue-100">{data.summary.recommendation}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
