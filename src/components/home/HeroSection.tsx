'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Sparkles, MapPin, SlidersHorizontal, Car, TrendingUp, Shield, Smartphone } from 'lucide-react';

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cars?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const stats = [
    { icon: Car, label: 'سيارة معروضة', value: '+5,000' },
    { icon: TrendingUp, label: 'مستخدم نشط', value: '+50,000' },
    { icon: Shield, label: 'عملية ناجحة', value: '+10,000' },
    { icon: Smartphone, label: 'مشاهدات يومية', value: '+100,000' },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-blue-950/20 dark:via-black dark:to-black" />
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute top-1/3 left-1/4 w-3 h-3 rounded-full bg-blue-400/30" />
        <div className="absolute top-1/4 right-1/3 w-2 h-2 rounded-full bg-blue-500/20" />
        <div className="absolute bottom-1/3 right-1/4 w-4 h-4 rounded-full bg-blue-400/20" />
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              منصة السيارات الأذكى في الأردن
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6"
          >
            <span className="gradient-text">ابحث، قارن،</span>
            <br />
            <span>وتملك سيارتك</span>
            <br />
            <span className="text-blue-500">بذكاء</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            أول منصة أردنية تستخدم الذكاء الاصطناعي لتقدير الأسعار، اكتشاف العيوب، 
            وإنشاء نماذج ثلاثية الأبعاد للسيارات
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative group">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 opacity-20 group-hover:opacity-30 blur-xl transition-opacity" />
              <div className="relative flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-black/20 overflow-hidden">
                <div className="flex items-center gap-2 pr-4">
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باللغة الطبيعية: SUV أقل من 15 ألف دينار..."
                  className="flex-1 h-16 bg-transparent text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                />
                <div className="flex items-center gap-2 pl-2">
                  <button
                    type="button"
                    onClick={() => router.push('/cars')}
                    className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    className="h-12 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold flex items-center gap-2 hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/25 ml-2"
                  >
                    <Search className="w-5 h-5" />
                    بحث
                  </button>
                </div>
              </div>
            </div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center p-3 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800">
                  <Icon className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
