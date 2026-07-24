'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, TrendingUp, Shield, Zap, ChevronDown, ArrowLeft, Star, Car } from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';

const typedWords = ['قارن', 'اختر', 'اعرض', 'ابحث'];

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [word, setWord] = useState(typedWords[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  useEffect(() => {
    const current = typedWords[wordIndex];
    const speed = isDeleting ? 55 : 95;

    const timer = setTimeout(() => {
      if (!isDeleting && word.length < current.length) {
        setWord(current.slice(0, word.length + 1));
        return;
      }
      if (!isDeleting && word.length === current.length) {
        setTimeout(() => setIsDeleting(true), 1200);
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
    <section className="relative min-h-[90vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Background orbs */}
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Content */}
      <div className="container-custom relative z-10 pt-20">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div style={loaded ? {
            opacity: 1, transform: 'translateY(0)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
          } : { opacity: 0, transform: 'translateY(20px)' }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-primary-200/60 bg-primary-50/80 px-5 py-2.5 backdrop-blur-sm dark:border-primary-500/20 dark:bg-primary-500/10"
          >
            <div className="pulse-dot" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              منصة السيارات الأولى في الأردن
            </span>
          </div>

          {/* Heading */}
          <h1 style={loaded ? {
            opacity: 1, transform: 'translateY(0)',
            transition: 'opacity 0.7s ease-out 0.1s, transform 0.7s ease-out 0.1s'
          } : { opacity: 0, transform: 'translateY(24px)' }}
            className="text-4xl font-extrabold leading-[1.1] text-surface-900 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            ابحث،{' '}
            <span className="typewriter text-primary-600 dark:text-primary-300">{word}</span>
            <br />
            <span className="gradient-text">وتملك سيارتك</span>
          </h1>

          {/* Subtitle */}
          <p style={loaded ? {
            opacity: 1, transform: 'translateY(0)',
            transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s'
          } : { opacity: 0, transform: 'translateY(20px)' }}
            className="mx-auto mb-10 mt-7 max-w-xl text-base leading-relaxed text-surface-500 dark:text-surface-400 sm:text-lg"
          >
            منصة ذكية تساعدك على البحث والمقارنة والعثور على السيارة المناسبة بأفضل سعر، مع تجربة نظيفة ومريحة على الهاتف.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={loaded ? {
            opacity: 1, transform: 'translateY(0)',
            transition: 'opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s'
          } : { opacity: 0, transform: 'translateY(20px)' }}
            className="mx-auto mb-12 max-w-2xl px-4"
          >
            <div className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-soft-lg transition-all duration-300 focus-within:border-primary-300 focus-within:shadow-primary-lg dark:border-surface-700 dark:bg-surface-800 dark:focus-within:border-primary-600">
              {/* Shine effect on focus */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 opacity-0 transition-opacity duration-500 group-focus-within:opacity-100" />
              <div className="relative flex items-center gap-2">
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
                    className="flex h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white shadow-primary transition-all duration-200 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.97] sm:h-12 sm:px-7"
                  >
                    <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">بحث</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Stats */}
          <div style={loaded ? {
            opacity: 1, transform: 'translateY(0)',
            transition: 'opacity 0.6s ease-out 0.4s, transform 0.6s ease-out 0.4s'
          } : { opacity: 0, transform: 'translateY(20px)' }}
            className="grid gap-3 sm:grid-cols-3 sm:gap-4"
          >
            {[
              { icon: TrendingUp, value: '1,500+', label: 'سيارة مسجلة', color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10' },
              { icon: Shield, value: '100%', label: 'شراء آمن', color: 'text-success-500', bg: 'bg-success-50 dark:bg-success-500/10' },
              { icon: Zap, value: '24/7', label: 'دعم متواصل', color: 'text-warning-500', bg: 'bg-warning-50 dark:bg-warning-500/10' },
            ].map((stat, i) => (
              <div key={stat.label}
                className="glass-premium shine-hover group flex items-center gap-4 rounded-2xl px-5 py-4 text-right transition-all duration-300 hover:shadow-soft-md hover:-translate-y-0.5"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-surface-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={loaded ? {
          opacity: 1,
          transition: 'opacity 0.6s ease-out 0.8s'
        } : { opacity: 0 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-surface-400 tracking-wider">اكتشف</span>
          <div className="animate-bounce">
            <ChevronDown className="h-5 w-5 text-surface-400" />
          </div>
        </div>
      </div>
    </section>
  );
}
