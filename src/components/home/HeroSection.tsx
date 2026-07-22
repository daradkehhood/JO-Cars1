'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, MapPin, SlidersHorizontal, TrendingUp, Shield, Zap, ChevronDown } from 'lucide-react';

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cars?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section ref={sectionRef} className="relative min-h-[88vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-50 via-white to-white dark:from-surface-950 dark:via-surface-900 dark:to-surface-900" />
        {/* Subtle radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary-500/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Content */}
      <motion.div style={{ y: bgY, opacity }} className="container-custom relative z-10 pt-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
              منصة السيارات الأولى في الأردن
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-surface-900 dark:text-white leading-[1.15] mb-6"
          >
            ابحث، قارن،
            <br />
            <span className="gradient-text">وتملك سيارتك</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-base sm:text-lg text-surface-500 dark:text-surface-400 max-w-xl mx-auto mb-10 leading-relaxed"
          >
            منصة ذكية تستخدم تقنيات متقدمة لمساعدتك في العثور على السيارة المثالية بأفضل سعر
          </motion.p>

          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto mb-12 px-4"
          >
            <div className="relative">
              <div className="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-soft-lg overflow-hidden transition-shadow duration-300 focus-within:shadow-primary-lg focus-within:border-primary-300 dark:focus-within:border-primary-600">
                <div className="flex items-center gap-2 pr-4">
                  <MapPin className="w-5 h-5 text-surface-400 hidden sm:block" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن سيارة... مثال: SUV تويوتا 2024"
                  className="flex-1 h-14 sm:h-16 bg-transparent text-sm sm:text-base text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 outline-none"
                />
                <div className="flex items-center gap-2 pl-2 pr-2 sm:pr-0">
                  <button
                    type="button"
                    onClick={() => router.push('/cars')}
                    className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 transition-colors hidden sm:flex"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    className="h-11 sm:h-12 px-5 sm:px-7 rounded-xl bg-primary-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-primary-700 transition-all duration-200 shadow-primary active:scale-[0.98]"
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">بحث</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.form>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center justify-center gap-8 sm:gap-12"
          >
            {[
              { icon: TrendingUp, value: '1,500+', label: 'سيارة مسجلة' },
              { icon: Shield, value: '100%', label: 'شراء آمن' },
              { icon: Zap, value: '24/7', label: 'دعم متواصل' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary-500" />
                </div>
                <div className="text-right">
                  <p className="text-sm sm:text-base font-bold text-surface-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        >
          <span className="text-xs text-surface-400">اكتشف</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-4 h-4 text-surface-400" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
