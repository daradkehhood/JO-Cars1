'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowLeft,
  Car,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Waves,
  Zap,
} from 'lucide-react';

const quickActions = [
  { label: 'المميزة', href: '/cars?featured=true', icon: Star },
  { label: 'الأحدث', href: '/cars?sortBy=createdAt&sortOrder=desc', icon: Clock3 },
  { label: 'الورش', href: '/workshops', icon: ShieldCheck },
];

const trustPoints = [
  'بحث سريع ومفلتر',
  'تواصل مباشر عبر واتساب',
  'ثقة أعلى في السعر والحالة',
];

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0.2]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        const input = document.getElementById('hero-search');
        input?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cars?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden pt-6 sm:pt-10 lg:pt-14 pb-12 sm:pb-20 lg:pb-24">
      <motion.div style={{ y, opacity }} className="container-custom relative z-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/50 dark:border-surface-700/70 bg-white/75 dark:bg-surface-900/75 backdrop-blur-2xl shadow-soft-xl">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-primary-50/80 dark:from-surface-900 dark:via-surface-900 dark:to-surface-800" />
            <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-warning-500/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.35] dark:opacity-[0.18] hero-grid" />
          </div>

          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] px-5 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-14">
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="inline-flex items-center gap-2 rounded-full border border-primary-200/80 dark:border-primary-500/20 bg-primary-50/90 dark:bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300"
              >
                <Sparkles className="w-4 h-4" />
                منصة سيارات أردنية بشكل أرقى وأوضح
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.6 }}
                className="mt-6 text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.04] text-surface-950 dark:text-white"
              >
                سوق سيارات
                <br />
                <span className="gradient-text">أفخم، أسرع، وأوضح</span>
                <br />
                للمستخدم الأردني
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.55 }}
                className="mt-5 max-w-2xl text-base sm:text-lg leading-8 text-surface-600 dark:text-surface-300"
              >
                ابحث عن السيارة المناسبة، قارن الأسعار، تواصل مباشرة مع البائع، واستفد من
                أدوات الثقة مثل التقييم، التاريخ، والتنبيهات. التجربة مصممة لتكون مريحة على
                الهاتف وسريعة في التصفح.
              </motion.p>

              <motion.form
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.55 }}
                onSubmit={handleSearch}
                className="mt-8 max-w-3xl"
              >
                <div className="rounded-[1.7rem] border border-surface-200/80 dark:border-surface-700/80 bg-white/90 dark:bg-surface-800/90 shadow-soft-lg p-2 sm:p-3">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                      <MapPin className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                      <input
                        id="hero-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="مثال: تويوتا 2021، SUV، عمان"
                        className="w-full rounded-[1.15rem] border border-surface-200/70 dark:border-surface-700/70 bg-surface-50/80 dark:bg-surface-900/70 py-4 pr-12 pl-4 text-base text-surface-900 dark:text-surface-100 placeholder-surface-400 outline-none transition-all duration-200 focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => router.push('/cars')}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-[1.15rem] border border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-900 px-4 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300 transition-all duration-200 hover:bg-surface-50 dark:hover:bg-surface-800"
                      >
                        <Waves className="w-4 h-4" />
                        تصفح
                      </button>
                      <button
                        type="submit"
                        className="inline-flex flex-[1.2] items-center justify-center gap-2 rounded-[1.15rem] bg-primary-600 px-5 py-4 text-sm font-semibold text-white shadow-primary transition-all duration-200 hover:bg-primary-700 active:scale-[0.99]"
                      >
                        <Search className="w-4 h-4" />
                        بحث
                      </button>
                    </div>
                  </div>
                </div>
              </motion.form>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.5 }}
                className="mt-6 flex flex-wrap items-center gap-2"
              >
                {quickActions.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className="inline-flex items-center gap-2 rounded-full border border-surface-200/80 dark:border-surface-700/80 bg-white/80 dark:bg-surface-800/80 px-4 py-2.5 text-sm font-medium text-surface-700 dark:text-surface-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-600 hover:shadow-soft"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-8 grid gap-3 sm:grid-cols-3"
              >
                {[
                  { value: '1,500+', label: 'إعلان وسيارة', icon: Car },
                  { value: 'ثقة أعلى', label: 'تنبيهات وتاريخ وسعر عادل', icon: ShieldCheck },
                  { value: '24/7', label: 'تجربة متوافقة مع الهاتف', icon: Zap },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="panel-sheen rounded-[1.4rem] border border-surface-200/80 dark:border-surface-700/80 bg-white/80 dark:bg-surface-800/80 p-4 shadow-soft backdrop-blur"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-lg font-black text-surface-900 dark:text-white">{item.value}</div>
                          <div className="mt-0.5 text-sm leading-6 text-surface-500 dark:text-surface-400">{item.label}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.48, duration: 0.5 }}
                className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-surface-500 dark:text-surface-400"
              >
                {trustPoints.map((point) => (
                  <div key={point} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary-500" />
                    {point}
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="relative z-10"
            >
              <div className="relative mx-auto max-w-xl">
                <div className="absolute -top-4 right-8 h-20 w-20 rounded-full bg-primary-500/15 blur-2xl" />
                <div className="absolute bottom-4 left-0 h-28 w-28 rounded-full bg-warning-500/15 blur-2xl" />

                <div className="panel-sheen overflow-hidden rounded-[2rem] border border-surface-200/80 dark:border-surface-700/80 bg-white/85 dark:bg-surface-900/85 shadow-soft-xl">
                  <div className="relative aspect-[4/5] sm:aspect-[16/18] lg:aspect-auto lg:min-h-[36rem]">
                    <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800" />
                    <div className="absolute inset-0 opacity-25 hero-grid" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(92,124,250,0.3),_transparent_42%),radial-gradient(circle_at_bottom,_rgba(247,144,9,0.22),_transparent_36%)]" />

                    <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-5 text-white/90">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">
                        <Sparkles className="w-3.5 h-3.5 text-warning-300" />
                        تجربة العرض الذكي
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">
                        <TrendingUp className="w-3.5 h-3.5 text-success-300" />
                        سوق نشط
                      </div>
                    </div>

                    <div className="absolute inset-x-5 top-20 rounded-[1.8rem] bg-white/10 p-4 backdrop-blur-xl border border-white/10">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-white/70 text-xs">السيارة المميزة الآن</div>
                          <div className="mt-1 text-xl font-bold text-white">Toyota Land Cruiser 2023</div>
                        </div>
                        <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                          <div className="text-[11px] text-white/70">السعر</div>
                          <div className="text-base font-black text-white">38,500 JOD</div>
                        </div>
                      </div>

                      <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-white/10 bg-surface-950/60">
                        <img
                          src="/images/placeholder-car.svg"
                          alt="سيارة مميزة"
                          className="h-52 w-full object-cover opacity-95"
                        />
                      </div>
                    </div>

                    <div className="absolute bottom-5 inset-x-5 grid grid-cols-2 gap-3">
                      <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 text-white backdrop-blur-xl">
                        <div className="flex items-center gap-2 text-xs text-white/65">
                          <MapPin className="w-3.5 h-3.5" />
                          عمان - الأردن
                        </div>
                        <div className="mt-2 text-lg font-bold">+120 سيارة جديدة</div>
                        <div className="mt-1 text-sm text-white/65">تحديثات يومية أسرع</div>
                      </div>
                      <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 text-white backdrop-blur-xl">
                        <div className="flex items-center gap-2 text-xs text-white/65">
                          <Clock3 className="w-3.5 h-3.5" />
                          على الهاتف
                        </div>
                        <div className="mt-2 text-lg font-bold">تصفح مريح</div>
                        <div className="mt-1 text-sm text-white/65">واجهة أسرع بإيماءات واضحة</div>
                      </div>
                    </div>

                    <div className="absolute inset-x-5 bottom-[7.5rem] flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-white/10 px-4 py-3 text-white/90 backdrop-blur-xl">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                          <Star className="w-5 h-5 text-warning-300 fill-warning-300" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">تقييم الثقة</div>
                          <div className="text-xs text-white/65">مؤشر بصري لمساعدة القرار</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-success-300">92%</div>
                        <div className="text-xs text-white/65">جودة العرض</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="relative border-t border-surface-200/70 dark:border-surface-700/70 bg-white/50 dark:bg-surface-900/40 px-5 sm:px-8 lg:px-12 py-4 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                استخدم `Ctrl + K` للبحث السريع من أي مكان داخل الصفحة.
              </p>
              <button
                type="button"
                onClick={() => router.push('/cars')}
                className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-primary-200 dark:border-primary-500/20 bg-primary-50 dark:bg-primary-500/10 px-4 py-2 text-sm font-semibold text-primary-700 dark:text-primary-300 transition-all duration-200 hover:bg-primary-100 dark:hover:bg-primary-500/20"
              >
                شاهد كل السيارات
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
