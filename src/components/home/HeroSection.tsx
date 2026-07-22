'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, MapPin, SlidersHorizontal, TrendingUp, Shield, Zap, ChevronDown } from 'lucide-react';

const typedWords = ['قارن', 'اختر', 'اعرض', 'ابحث'];

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [word, setWord] = useState(typedWords[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.25]);

  useEffect(() => {
    const current = typedWords[wordIndex];
    const speed = isDeleting ? 55 : 95;

    const timer = setTimeout(() => {
      if (!isDeleting && word.length < current.length) {
        setWord(current.slice(0, word.length + 1));
        return;
      }

      if (!isDeleting && word.length === current.length) {
        setTimeout(() => setIsDeleting(true), 1000);
        return;
      }

      if (isDeleting && word.length > 0) {
        setWord(current.slice(0, word.length - 1));
        return;
      }

      if (isDeleting && word.length === 0) {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % typedWords.length);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [isDeleting, word, wordIndex]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cars?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section ref={sectionRef} className="relative min-h-[86vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-50 via-white to-white dark:from-surface-950 dark:via-surface-900 dark:to-surface-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-primary-500/[0.03] blur-[100px]" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <motion.div style={{ y: bgY, opacity }} className="container-custom relative z-10 pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-4 py-2 dark:border-primary-500/20 dark:bg-primary-500/10"
          >
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-500" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              منصة السيارات الأولى في الأردن
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.55 }}
            className="text-4xl font-extrabold leading-[1.15] text-surface-900 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            ابحث، <span className="typewriter text-primary-600 dark:text-primary-300">{word}</span>
            <br />
            <span className="gradient-text">وتملك سيارتك</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.5 }}
            className="mx-auto mb-9 mt-6 max-w-xl text-base leading-relaxed text-surface-500 dark:text-surface-400 sm:text-lg"
          >
            منصة ذكية تساعدك على البحث والمقارنة والعثور على السيارة المناسبة بأفضل سعر، مع تجربة نظيفة ومريحة على الهاتف.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.5 }}
            onSubmit={handleSearch}
            className="mx-auto mb-10 max-w-2xl px-4"
          >
            <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-soft-lg transition-shadow duration-300 focus-within:border-primary-300 focus-within:shadow-primary-lg dark:border-surface-700 dark:bg-surface-800 dark:focus-within:border-primary-600">
              <div className="flex items-center gap-2">
                <div className="hidden items-center pr-4 sm:flex">
                  <MapPin className="h-5 w-5 text-surface-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن سيارة... مثال: SUV تويوتا 2024"
                  className="h-14 flex-1 bg-transparent text-sm text-surface-900 outline-none placeholder-surface-400 dark:text-surface-100 dark:placeholder-surface-500 sm:h-16 sm:text-base"
                />
                <div className="flex items-center gap-2 px-2 sm:pr-0">
                  <button
                    type="button"
                    onClick={() => router.push('/cars')}
                    className="hidden rounded-xl p-2.5 text-surface-400 transition-colors hover:bg-surface-100 dark:hover:bg-surface-700 sm:flex"
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                  </button>
                  <button
                    type="submit"
                    className="flex h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white shadow-primary transition-all duration-200 hover:bg-primary-700 active:scale-[0.98] sm:h-12 sm:px-7"
                  >
                    <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">بحث</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.45 }}
            className="grid gap-3 sm:grid-cols-3 sm:gap-4"
          >
            {[
              { icon: TrendingUp, value: '1,500+', label: 'سيارة مسجلة' },
              { icon: Shield, value: '100%', label: 'شراء آمن' },
              { icon: Zap, value: '24/7', label: 'دعم متواصل' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-white/80 px-4 py-4 text-right shadow-soft backdrop-blur dark:border-surface-700 dark:bg-surface-800/80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-700">
                  <stat.icon className="h-5 w-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-surface-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        >
          <span className="text-xs text-surface-400">اكتشف</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
            <ChevronDown className="h-4 w-4 text-surface-400" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
