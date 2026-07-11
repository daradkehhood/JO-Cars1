'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Loader2, BarChart3, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PriceData {
  query: { brand: string; model: string; year: number; kilometers: number; condition: string };
  stats: {
    totalListings: number;
    priceRange: { min: number; max: number; avg: number; median: number };
    estimatedPrice: number;
    pricePosition: { label: string; color: string };
    conditionAdjustment: number;
  };
  trend: { direction: string; percent: number; emoji: string };
  similarCars: Array<{
    id: string; slug: string; title: string; price: number; year: number;
    kilometers: number; condition: string; image: string | null; city: string;
  }>;
}

interface Props {
  brandId: string;
  modelId: string;
  year: number;
  kilometers: number;
  condition: string;
  cityId: string;
  currentPrice: number;
  onPriceSelect: (price: number) => void;
}

export function PriceEvaluation({ brandId, modelId, year, kilometers, condition, cityId, currentPrice, onPriceSelect }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PriceData | null>(null);
  const [expanded, setExpanded] = useState(false);

  const evaluate = async () => {
    if (!brandId || !year) {
      toast.error('أدخل الماركة وسنة الصنع أولاً');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/market-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: brandId, model: modelId, year, kilometers, condition }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        setExpanded(true);
      } else {
        toast.error(result.error || 'فشل تحليل السوق');
      }
    } catch {
      toast.error('تعذر تحليل السوق');
    } finally {
      setLoading(false);
    }
  };

  const getPriceDiff = () => {
    if (!data || !currentPrice) return null;
    const avg = data.stats.priceRange.avg;
    const diff = ((currentPrice - avg) / avg) * 100;
    return diff;
  };

  const diff = getPriceDiff();

  return (
    <div className="space-y-4">
      <button type="button" onClick={evaluate} disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium text-sm hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
        {loading ? 'جاري تحليل السوق...' : 'تقييم السعر بالذكاء الاصطناعي'}
      </button>

      <AnimatePresence>
        {data && expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/80 shadow-xl overflow-hidden">

              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">تقرير تقييم السعر</h3>
                  <button onClick={() => setExpanded(false)} className="text-white/70 hover:text-white text-xs">إخفاء</button>
                </div>
                <p className="text-sm text-white/80">
                  {data.query.brand} {data.query.model} {data.query.year} — {data.query.kilometers.toLocaleString()} كم
                </p>
              </div>

              {/* Price Range Bar */}
              <div className="p-5">
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>{data.stats.priceRange.min.toLocaleString()} د.أ</span>
                    <span>{data.stats.priceRange.max.toLocaleString()} د.أ</span>
                  </div>
                  <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full" />
                    {currentPrice > 0 && (
                      <div className="absolute top-0 h-full w-1 bg-gray-900 dark:bg-white rounded-full"
                        style={{ left: `${Math.min(Math.max(((currentPrice - data.stats.priceRange.min) / (data.stats.priceRange.max - data.stats.priceRange.min)) * 100, 0), 100)}%` }} />
                    )}
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-green-600 font-medium">رخيص</span>
                    <span className="text-yellow-600 font-medium">متوسط</span>
                    <span className="text-red-600 font-medium">غالي</span>
                  </div>
                </div>

                {/* Price Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-center">
                    <DollarSign className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">متوسط السوق</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{data.stats.priceRange.avg.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">دينار</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-center">
                    <BarChart3 className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">الوسيط</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{data.stats.priceRange.median.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">دينار</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-center">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">السعر العادل</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{data.stats.estimatedPrice.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">دينار</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                    <AlertTriangle className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">إعلانات مشابهة</p>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{data.stats.totalListings}</p>
                    <p className="text-[10px] text-gray-400">إعلان</p>
                  </div>
                </div>

                {/* Current Price Comparison */}
                {currentPrice > 0 && diff !== null && (
                  <div className={`p-4 rounded-xl mb-5 ${diff < -5 ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20' : diff < 10 ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20' : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">سعرك: {currentPrice.toLocaleString()} د.أ</p>
                        <p className="text-xs text-gray-500 mt-1">مقارنة بمتوسط السوق {data.stats.priceRange.avg.toLocaleString()} د.أ</p>
                      </div>
                      <div className="text-center">
                        {diff < -5 ? <TrendingDown className="w-8 h-8 text-green-500 mx-auto" /> : diff < 10 ? <Minus className="w-8 h-8 text-blue-500 mx-auto" /> : <TrendingUp className="w-8 h-8 text-red-500 mx-auto" />}
                        <p className={`text-lg font-bold ${diff < -5 ? 'text-green-600' : diff < 10 ? 'text-blue-600' : 'text-red-600'}`}>
                          {diff > 0 ? '+' : ''}{Math.round(diff)}%
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-medium mt-2 ${diff < -5 ? 'text-green-700' : diff < 10 ? 'text-blue-700' : 'text-red-700'}`}>
                      {diff < -5 ? '🎉 سعرك أقل من السوق — جذاب للمشترين!' : diff < 10 ? '✅ سعرك في نطاق السوق — مناسب' : '⚠️ سعرك أعلى من السوق — قد يصعب البيع'}
                    </p>
                    <button type="button" onClick={() => onPriceSelect(data.stats.estimatedPrice)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline">
                      استخدام السعر العادل ({data.stats.estimatedPrice.toLocaleString()} د.أ)
                    </button>
                  </div>
                )}

                {/* Trend */}
                {data.trend.direction !== 'غير كافٍ للتحليل' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 mb-5">
                    <span className="text-2xl">{data.trend.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        اتجاه السوق: {data.trend.direction}
                      </p>
                      <p className="text-xs text-gray-500">تغير بنسبة {data.trend.percent}% في آخر 6 أشهر</p>
                    </div>
                  </div>
                )}

                {/* Similar Cars */}
                {data.similarCars.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">إعلانات مشابهة ({data.similarCars.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {data.similarCars.map(car => (
                        <a key={car.id} href={`/cars/${car.slug || car.id}`} target="_blank" rel="noopener"
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          {car.image ? (
                            <img src={car.image} alt={car.title} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">صورة</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{car.title}</p>
                            <p className="text-xs text-gray-500">{car.kilometers.toLocaleString()} كم • {car.city}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{car.price.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400">دينار</p>
                          </div>
                        </a>
                      ))}
                    </div>
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
