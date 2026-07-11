'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Car, HelpCircle, Search, TrendingUp, MessageCircle, ShoppingBag, Fuel, Shield, DollarSign, BarChart3, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CarSuggestion {
  id: string; slug: string; refCode?: string | null;
  title: string; price: number; year: number; kilometers: number;
  fuelType: string; transmission: string; condition: string;
  image: string | null; city: string; createdAt?: string;
}

interface MarketPriceResult {
  query: { brand: string; model: string; year: number; kilometers: number; condition: string };
  stats: {
    totalListings: number;
    priceRange: { min: number; max: number; avg: number; median: number };
    estimatedPrice: number;
    pricePosition: { label: string; color: string };
    conditionAdjustment: number;
  };
  trend: { direction: string; percent: number; emoji: string };
  similarCars: CarSuggestion[];
}

interface Message {
  id: string; type: 'user' | 'bot'; content: string;
  cars?: CarSuggestion[]; marketPriceResult?: MarketPriceResult; timestamp: Date;
}

type MpStep = 'brand' | 'model' | 'year' | 'kilometers' | 'condition';
type MpStepOrNull = MpStep | null;

const quickActions = [
  { label: 'مساعد شراء', icon: ShoppingBag, action: 'عندي 9000 دينار وأريد سيارة عائلية اقتصادية' },
  { label: 'اقترح سيارة', icon: Car, action: 'أقترح علي سيارة مناسبة لميزانية 15000 دينار' },
  { label: 'تسعير السوق', icon: BarChart3, action: '__market_price__' },
  { label: 'SUV للعائلة', icon: Shield, action: 'أفضل سيارات SUV عائلية في الأردن' },
  { label: 'مقارنة', icon: Search, action: 'كيف أقارن بين سيارتين في الموقع؟' },
  { label: 'اقتصادية', icon: Fuel, action: 'أفضل السيارات الاقتصادية في استهلاك البنزين؟' },
  { label: 'مستعملة', icon: TrendingUp, action: 'نصائح عند شراء سيارة مستعملة' },
  { label: 'تمويل', icon: DollarSign, action: 'خيارات التمويل والتقسيط المتاحة؟' },
];

const mpQuestions: Record<MpStep, string> = {
  brand: 'ما هي **الماركة** التي تريد معرفة سعرها؟ (مثال: تويوتا، بي ام دبليو، مرسيدس)',
  model: 'ما هو **الموديل**؟ (مثال: كامري، X5، C200) — إذا ما تتذكر اتركه فارغاً',
  year: 'ما هي **سنة الصنع**؟ (مثال: 2020)',
  kilometers: 'كم **ممشى السيارة** بالكيلومتر؟ (مثال: 90000)',
  condition: 'ما هي **حالة السيارة**؟\n\nممتازة | جيدة جداً | جيدة | مقبولة',
};

export function AIAssistant() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome', type: 'bot',
      content: 'مرحباً! 🤖 أنا المساعد الذكي JO Cars. أخبرني بميزانيتك واحتياجاتك عشان ألاقي لك السيارة المناسبة من قاعدة بياناتنا!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mpStep, setMpStep] = useState<MpStepOrNull>(null);
  const [mpData, setMpData] = useState({ brand: '', model: '', year: '', kilometers: '', condition: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const botReply = (content: string, options?: { cars?: CarSuggestion[]; marketPriceResult?: MarketPriceResult }) => {
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(), type: 'bot', content,
      cars: options?.cars, marketPriceResult: options?.marketPriceResult, timestamp: new Date(),
    }]);
  };

  const advanceMp = (step: MpStep, value: string) => {
    const updated = { ...mpData };
    if (step === 'brand') updated.brand = value;
    else if (step === 'model') updated.model = value;
    else if (step === 'year') updated.year = value;
    else if (step === 'kilometers') updated.kilometers = value;
    else if (step === 'condition') updated.condition = value;

    setMpData(updated);

    const steps: MpStep[] = ['brand', 'model', 'year', 'kilometers', 'condition'];
    const currentIdx = steps.indexOf(step);
    const nextStep = steps[currentIdx + 1] || null;

    if (nextStep) {
      setMpStep(nextStep);
      botReply(mpQuestions[nextStep]);
    } else {
      setMpStep(null);
      fetchMarketPrice(updated);
    }
  };

  const fetchMarketPrice = async (data: typeof mpData) => {
    setIsTyping(true);
    try {
      const res = await fetch('/api/ai/market-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: data.brand,
          model: data.model,
          year: parseInt(data.year) || 0,
          kilometers: parseInt(data.kilometers) || 0,
          condition: data.condition,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const price = d.stats.estimatedPrice;
        const range = d.stats.priceRange;
        const trend = d.trend;

        let msg = `📊 **تحليل سعر ${d.query.brand} ${d.query.model} ${d.query.year}**\n\n`;
        msg += `💰 **السعر التقديري:** ${price.toLocaleString()} د.أ\n`;
        msg += `📈 ${d.stats.pricePosition.label}\n\n`;
        msg += `📉 **نطاق السوق:** ${range.min.toLocaleString()} - ${range.max.toLocaleString()} د.أ\n`;
        msg += `📊 **متوسط السوق:** ${range.avg.toLocaleString()} د.أ\n`;
        msg += `📋 **عدد الإعلانات المشابهة:** ${d.stats.totalListings}\n\n`;

        if (d.query.kilometers > 0) {
          msg += `🛣️ **الممشى:** ${d.query.kilometers.toLocaleString()} كم\n`;
        }
        if (d.query.condition) {
          msg += `⭐ **الحالة:** ${d.query.condition}\n`;
          msg += `🔧 **تعديل السعر حسب الحالة:** ${d.stats.conditionAdjustment > 0 ? '+' : ''}${d.stats.conditionAdjustment}%\n\n`;
        }

        msg += `${trend.emoji} **اتجاه السوق:** ${trend.direction}`;
        if (trend.percent > 0) msg += ` (${trend.percent}%)`;

        msg += '\n\n';
        if (d.similarCars.length > 0) {
          msg += '🔄 **سيارات مشابهة في السوق:**';
        }

        botReply(msg, { marketPriceResult: d, cars: d.similarCars });
      } else {
        botReply('عذراً، ما لقيت بيانات كافية لتحليل السوق لهذه السيارة. جرب ماركة أو سنة ثانية.');
      }
    } catch {
      botReply('حدث خطأ أثناء تحليل السوق. حاول مرة أخرى.');
    }
    setIsTyping(false);
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(), type: 'user', content: content.trim(), timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (content === '__market_price__') {
      setMpStep('brand');
      setMpData({ brand: '', model: '', year: '', kilometers: '', condition: '' });
      setIsTyping(true);
      setTimeout(() => {
        botReply(mpQuestions.brand);
        setIsTyping(false);
      }, 400);
      return;
    }

    if (mpStep) {
      advanceMp(mpStep, content.trim());
      return;
    }

    setIsTyping(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: content.trim() }] }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), type: 'bot',
          content: data.data.message,
          cars: data.data.cars?.length > 0 ? data.data.cars : undefined,
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), type: 'bot',
        content: 'عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const goToCar = (slug: string) => {
    router.push(`/cars/${slug}`);
    setIsOpen(false);
  };

  const resetMp = () => {
    setMpStep(null);
    setMpData({ brand: '', model: '', year: '', kilometers: '', condition: '' });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-36 lg:bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-48px)]"
          >
            <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl shadow-black/10">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-blue-500">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">المساعد الذكي</p>
                    <p className="text-[10px] text-white/70">JO Cars AI</p>
                  </div>
                </div>
                <button onClick={() => { setIsOpen(false); resetMp(); }} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="h-[450px] overflow-y-auto p-4 space-y-3 scrollbar-hide">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    <div className={`flex ${msg.type === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.type === 'user'
                          ? 'bg-blue-50 dark:bg-blue-500/10 text-gray-900 dark:text-white rounded-tr-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-tl-sm'
                      }`}>
                        {msg.type === 'bot' && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] text-blue-500 font-medium">JO Cars AI</span>
                          </div>
                        )}
                        {msg.content}
                      </div>
                    </div>

                    {msg.marketPriceResult && (
                      <div className="mt-2 mx-1 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800/30">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">تقييم السعر:</p>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">تقديري:</span>
                            <span className="font-bold text-gray-900 dark:text-white">{msg.marketPriceResult.stats.estimatedPrice.toLocaleString()} د.أ</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">نطاق السوق:</span>
                            <span className="text-gray-900 dark:text-white">{msg.marketPriceResult.stats.priceRange.min.toLocaleString()} - {msg.marketPriceResult.stats.priceRange.max.toLocaleString()} د.أ</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">متوسط:</span>
                            <span className="text-gray-900 dark:text-white">{msg.marketPriceResult.stats.priceRange.avg.toLocaleString()} د.أ</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">اتجاه السوق:</span>
                            <span className="text-gray-900 dark:text-white">{msg.marketPriceResult.trend.emoji} {msg.marketPriceResult.trend.direction}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">عدد الإعلانات:</span>
                            <span className="text-gray-900 dark:text-white">{msg.marketPriceResult.stats.totalListings}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {msg.cars && msg.cars.length > 0 && (
                      <div className="mt-2 space-y-2 pr-4">
                        {msg.cars.map((car) => (
                          <button key={car.id} onClick={() => goToCar(car.slug)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all text-right">
                            <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden relative flex items-center justify-center">
                              {car.image ? (
                                <img src={car.image} alt="" className="w-full h-full object-cover" loading="lazy"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : null}
                              <Car className="w-5 h-5 text-gray-400 absolute" />
                              {car.refCode && (
                                <span className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded bg-black/60 text-white text-[8px] font-mono font-bold">{car.refCode}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{car.title}</p>
                              <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                                <span>{car.price?.toLocaleString()} د.أ</span>
                                <span>{car.year}</span>
                                {car.kilometers > 0 && <span>{car.kilometers?.toLocaleString()} كم</span>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-end">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {messages.length === 1 && !mpStep && (
                  <div className="mt-4">
                    <p className="text-[11px] text-gray-400 mb-2 text-center">اقتراحات سريعة:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button key={action.label} onClick={() => handleSend(action.action)}
                            className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-500/5 hover:border-blue-200 dark:hover:border-blue-500/20 transition-all text-right">
                            <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="text-[11px] text-gray-600 dark:text-gray-400">{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {mpStep && (
                  <div className="mt-3 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30">
                    <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium text-center">
                      تسعير السوق — الخطوة {['brand', 'model', 'year', 'kilometers', 'condition'].indexOf(mpStep) + 1} من 5
                    </p>
                    <div className="flex justify-center gap-1 mt-2">
                      {['brand', 'model', 'year', 'kilometers', 'condition'].map((s, i) => {
                        const filled = ['brand', 'model', 'year', 'kilometers', 'condition'].indexOf(mpStep) >= i ||
                          (['brand', 'model', 'year', 'kilometers', 'condition'].indexOf(mpStep) > i);
                        const current = ['brand', 'model', 'year', 'kilometers', 'condition'].indexOf(mpStep) === i;
                        return (
                          <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${current ? 'w-6 bg-purple-500' : filled ? 'w-3 bg-purple-300' : 'w-3 bg-gray-200 dark:bg-gray-700'}`} />
                        );
                      })}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                  className="flex items-center gap-2">
                  <input ref={inputRef} type="text" value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isTyping}
                    placeholder={mpStep ? 'أكتب إجابتك...' : 'اكتب سؤالك...'}
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-blue-500 transition-colors disabled:opacity-50" />
                  <button type="submit" disabled={!input.trim() || isTyping}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-blue-500/25">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button onClick={() => setIsOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </>
  );
}
