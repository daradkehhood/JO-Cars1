'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, TrendingUp, TrendingDown, Minus, DollarSign, BarChart3,
  CheckCircle, AlertTriangle, ChevronDown, ChevronUp, ExternalLink,
  Zap, Target, Car, Gauge, Shield, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface EstimateData {
  fairPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: number;
  reasoning: string;
  marketFactors: string[];
  similarListings: { site: string; url: string; price: number; year: number; km: number; notes: string }[];
  sources: string[];
  isRealWebSearch: boolean;
}

interface Props {
  brandId: string;
  modelId: string;
  year: number;
  trim?: string;
  kilometers: number;
  condition: string;
  cityId: string;
  fuelType?: string;
  transmission?: string;
  engineCapacity?: string;
  bodyType?: string;
  color?: string;
  ownerCount?: number;
  isDamaged?: boolean;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  isPaintOriginal?: boolean;
  currentPrice: number;
  onPriceSelect?: (price: number) => void;
}

export function AIPriceEstimator({
  brandId, modelId, year, trim, kilometers, condition, cityId,
  fuelType, transmission, engineCapacity, bodyType, color,
  ownerCount, isDamaged, hasWarranty, hasServiceHistory, isPaintOriginal,
  currentPrice, onPriceSelect
}: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EstimateData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const canEstimate = brandId && modelId;

  const estimate = async () => {
    if (!canEstimate) {
      toast.error('اختر الماركة والموديل أولاً');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/price-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId, modelId, year, trim, kilometers, condition, cityId,
          fuelType, transmission, engineCapacity, bodyType, color,
          ownerCount, isDamaged, hasWarranty, hasServiceHistory, isPaintOriginal,
        }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
        toast.success(`السعر المقترح: ${result.data.fairPrice?.toLocaleString()} د.أ`);
      } else {
        toast.error(result.error || 'فشل التقدير');
      }
    } catch {
      toast.error('تعذر تقدير السعر');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (c: number) => {
    if (c >= 80) return 'text-green-600 bg-green-50 dark:bg-green-500/10 border-green-200';
    if (c >= 60) return 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200';
    return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200';
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={estimate} disabled={loading || !canEstimate}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-sm hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
        {loading ? 'جاري تقدير السعر بالذكاء الاصطناعي...' : 'تقدير سعر السيارة بالذكاء الاصطناعي'}
      </button>

      <AnimatePresence>
        {data && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/80 shadow-xl overflow-hidden">

              {/* Header with confidence */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">تقدير السعر بالذكاء الاصطناعي</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold border ${getConfidenceColor(data.confidence)}`}>
                    ثقة {data.confidence}%
                  </span>
                </div>
                {data.sources.length > 0 && (
                  <p className="text-xs text-white/70">المصادر: {data.sources.join(' • ')}</p>
                )}
              </div>

              <div className="p-5 space-y-4">

                {/* Fair Price */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">السعر المقترح للبيع</p>
                  <p className="text-4xl font-black text-gray-900 dark:text-white">
                    {data.fairPrice.toLocaleString()}
                    <span className="text-lg font-medium text-gray-500 mr-1">د.أ</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    نطاق معقول: {data.minPrice.toLocaleString()} — {data.maxPrice.toLocaleString()} د.أ
                  </p>
                </div>

                {/* Price Range Bar */}
                <div className="relative">
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>{data.minPrice.toLocaleString()}</span>
                    <span>{data.fairPrice.toLocaleString()}</span>
                    <span>{data.maxPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Comparison with user price */}
                {currentPrice > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-500">سعرك المحدد</p>
                      <p className="font-bold text-gray-900 dark:text-white">{currentPrice.toLocaleString()} د.أ</p>
                    </div>
                    <div className="text-center">
                      {currentPrice > data.fairPrice * 1.1 ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs font-bold">مرتفع {Math.round(((currentPrice - data.fairPrice) / data.fairPrice) * 100)}%</span>
                        </div>
                      ) : currentPrice < data.fairPrice * 0.9 ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingDown className="w-4 h-4" />
                          <span className="text-xs font-bold">منخفض {Math.round(((data.fairPrice - currentPrice) / data.fairPrice) * 100)}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-blue-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-bold">مناسب</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">السعر المقترح</p>
                      <p className="font-bold text-emerald-600">{data.fairPrice.toLocaleString()} د.أ</p>
                    </div>
                  </div>
                )}

                {/* Use Suggested Price Button */}
                {onPriceSelect && currentPrice !== data.fairPrice && (
                  <button type="button" onClick={() => onPriceSelect(data.fairPrice)}
                    className="w-full py-2.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all">
                    استخدام السعر المقترح ({data.fairPrice.toLocaleString()} د.أ)
                  </button>
                )}

                {/* Market Factors */}
                {data.marketFactors.length > 0 && (
                  <div>
                    <button type="button" onClick={() => setShowDetails(!showDetails)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors">
                      <Zap className="w-4 h-4" />
                      العوامل المؤثرة ({data.marketFactors.length})
                      {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {showDetails && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                          className="overflow-hidden mt-3">
                          <div className="flex flex-wrap gap-2">
                            {data.marketFactors.map((f, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                                {f}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Reasoning */}
                {data.reasoning && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {data.reasoning}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
