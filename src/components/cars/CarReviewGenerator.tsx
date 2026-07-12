'use client';

import { useState } from 'react';
import { Mic, Sparkles, Star, Loader2, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewResult {
  structured: {
    title: string;
    pros: string[];
    cons: string[];
    verdict: string;
    summary: string;
  };
  ratings: {
    overall: number;
    engine: number;
    comfort: number;
    value: number;
    design: number;
    reliability: number;
  };
  confidence: number;
  wordCount: number;
}

interface Props {
  carId?: string;
  brand?: string;
  model?: string;
  year?: number;
  onReviewGenerated?: (review: ReviewResult) => void;
}

const ratingLabels: Record<string, string> = {
  engine: 'المحرك',
  comfort: 'الراحة',
  value: 'القيمة',
  design: 'التصميم',
  reliability: 'الموثوقية',
  overall: 'التقييم العام',
};

export function CarReviewGenerator({ brand, model, year, onReviewGenerated }: Props) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const handleGenerate = async () => {
    if (text.trim().length < 10) {
      toast.error('اكتب 10 أحرف على الأقل');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/car-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, brand, model, year }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        onReviewGenerated?.(data);
      } else {
        toast.error(data.error || 'خطأ');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    }
    setLoading(false);
  };

  const renderStars = (count: number, size = 'w-4 h-4') => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${size} ${i < count ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'}`} />
      ))}
    </div>
  );

  const confidenceColor = result.confidence >= 0.7 ? 'text-green-600' : result.confidence >= 0.4 ? 'text-yellow-600' : 'text-red-500';
  const confidenceLabel = result.confidence >= 0.7 ? 'مفصلة وواضحة' : result.confidence >= 0.4 ? 'متوسطة التفاصيل' : 'مختصرة';

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-5">
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <h3 className="font-bold text-gray-900 dark:text-white">مطابقة الصوت</h3>
            <p className="text-xs text-gray-500">تكلم عن تجربتك والذكاء الاصطناعي يحولها لمقال منظم</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* Input area */}
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب عن تجربتك مع السيارة... مثلاً: المحرك قوي يسحب تمام على الطريق السريع، الراحة ممتازة خاصة على الطرق الطويلة، السعر مناسب مقارنة بالفئات الثانية..."
              className="w-full h-32 p-4 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-sm resize-none outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800"
              maxLength={2000}
            />
            <div className="absolute bottom-3 left-3 text-xs text-gray-400">
              {text.length}/2000
            </div>
          </div>

          {/* Tips */}
          <div className="flex flex-wrap gap-2 text-xs">
            {['المحرك', 'الراحة', 'السعر', 'الشكل', 'الموثوقية'].map((tip) => (
              <span key={tip} className="px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                {tip}
              </span>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || text.trim().length < 10}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري تحليل التجربة...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>حلّل وحولّها لمقال منظم</span>
              </>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Title + Confidence */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white">{result.structured.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{result.wordCount} كلمة</p>
                </div>
                <div className="text-left">
                  <div className={`flex items-center gap-1.5 ${confidenceColor}`}>
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm font-bold">{Math.round(result.confidence * 100)}%</span>
                  </div>
                  <p className="text-xs text-gray-500">{confidenceLabel}</p>
                </div>
              </div>

              {/* Summary */}
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                {result.structured.summary}
              </p>

              {/* Ratings */}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                <h5 className="font-bold text-sm mb-3 text-gray-900 dark:text-white">التقييمات</h5>
                <div className="space-y-2">
                  {Object.entries(result.ratings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400 w-20">{ratingLabels[key]}</span>
                      <div className="flex items-center gap-2">
                        {renderStars(value, 'w-3.5 h-3.5')}
                        <span className="text-xs font-bold text-gray-900 dark:text-white w-6 text-center">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="w-4 h-4 text-green-600" />
                    <h5 className="font-bold text-sm text-green-700 dark:text-green-400">المميزات</h5>
                  </div>
                  <ul className="space-y-1">
                    {result.structured.pros.map((pro, i) => (
                      <li key={i} className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                    {result.structured.pros.length === 0 && (
                      <li className="text-xs text-gray-400">لم يتم رصد مميزات واضحة</li>
                    )}
                  </ul>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsDown className="w-4 h-4 text-red-600" />
                    <h5 className="font-bold text-sm text-red-700 dark:text-red-400">العيوب</h5>
                  </div>
                  <ul className="space-y-1">
                    {result.structured.cons.map((con, i) => (
                      <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Verdict */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-4 text-white">
                <h5 className="font-bold text-sm mb-1">الخلاصة</h5>
                <p className="text-sm">{result.structured.verdict}</p>
              </div>

              {/* Show more details toggle */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل الكاملة'}
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showDetails && (
                <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 space-y-1">
                  <p>عدد الكلمات: {result.wordCount}</p>
                  <p>نسبة الثقة: {Math.round(result.confidence * 100)}% — تعتمد على تفصيل النص وجودة الوصف</p>
                  <p>التقييم العام: {result.ratings.overall}/5 — متوسط التقييمات الفرعية</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
