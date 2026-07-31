'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, TrendingUp, Shield, Zap, ChevronDown } from 'lucide-react';

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

  const quickSearches = ['تويوتا', 'هيونداي', 'SUV', 'ميرسيدس', 'اقتصادية', 'عائلية'];

  return (
    <section className="relative min-h-[85vh] sm:min-h-[92vh] lg:min-h-[94vh] flex items-center justify-center overflow-hidden pt-20 pb-10 lg:pt-24">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-porsche.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Dark overlay - minimal to keep car visible */}
        <div className="absolute inset-0 bg-[#0c0f0f]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f0f] via-transparent to-[#0c0f0f]/40" />
      </div>

      {/* Content */}
      <div className="container-custom relative z-10 overflow-hidden">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div style={loaded ? {
            opacity: 1, transform: 'translateY(0)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
          } : { opacity: 0, transform: 'translateY(20px)' }}
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-gold-300/20 bg-gold-900/20 px-5 py-2.5 backdrop-blur-md"
          >
            <div className="pulse-dot" />
            <span className="text-sm font-semibold text-gold-200">
              منصة السيارات الأولى في الأردن
            </span>
          </div>

          {/* Heading */}
          <h1 style={{
            ...(loaded
              ? { opacity: 1, transform: 'translateY(0)', transition: 'opacity 0.7s ease-out 0.1s, transform 0.7s ease-out 0.1s' }
              : { opacity: 0, transform: 'translateY(24px)' }),
            fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', system-ui, sans-serif"
          }}
            className="text-4xl font-bold leading-[1.15] text-white sm:text-5xl md:text-6xl lg:text-7xl tracking-tight"
          >
            ابحث،{' '}
            <span className="typewriter text-gold-100">{word}</span>
            <br />
            <span className="gradient-text">وتملك سيارتك</span>
          </h1>

          {/* Subtitle */}
          <p style={loaded ? {
            opacity: 1, transform: 'translateY(0)',
            transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s'
          } : { opacity: 0, transform: 'translateY(20px)' }}
            className="mx-auto mb-9 mt-6 max-w-2xl text-base leading-relaxed text-surface-400 sm:text-lg"
          >
            منصة ذكية تساعدك على البحث والمقارنة والعثور على السيارة المناسبة بأفضل سعر،
            مع تجربة نظيفة ومريحة على الهاتف.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={loaded ? {
            opacity: 1, transform: 'translateY(0)',
            transition: 'opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s'
          } : { opacity: 0, transform: 'translateY(20px)' }}
            className="mx-auto mb-6 max-w-2xl px-2 sm:px-4"
          >
            <div className="group relative overflow-hidden rounded-xl border border-surface-600/50 bg-surface-800/60 shadow-lg transition-all duration-300 focus-within:border-accent-400/60 focus-within:shadow-primary-lg backdrop-blur-xl">
              <div className="relative flex items-center gap-2">
                <div className="hidden items-center pr-4 sm:flex">
                  <Search className="h-5 w-5 text-surface-500 group-focus-within:text-accent-400 transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن سيارة... مثال: SUV تويوتا 2024"
                  className="h-14 flex-1 bg-transparent text-base text-surface-200 outline-none placeholder-surface-500 sm:h-16"
                />
                <div className="flex items-center gap-2 px-2 sm:pr-0">
                  <button
                    type="button"
                    onClick={() => router.push('/cars')}
                    className="hidden rounded-lg p-2.5 text-surface-500 transition-colors hover:bg-surface-700 sm:flex"
                    aria-label="فلاتر متقدمة"
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                  </button>
                  <button
                    type="submit"
                    className="flex h-12 shrink-0 items-center gap-2 rounded-lg bg-accent-500 px-5 text-sm font-bold text-white shadow-primary transition-all duration-200 hover:bg-accent-600 hover:shadow-primary-lg active:scale-[0.97] sm:h-12 sm:px-7"
                  >
                    <Search className="h-5 w-5" strokeWidth={2.5} />
                    <span className="hidden sm:inline">بحث</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Quick search chips */}
          <div style={loaded ? {
            opacity: 1, transform: 'translateY(0)',
            transition: 'opacity 0.6s ease-out 0.35s, transform 0.6s ease-out 0.35s'
          } : { opacity: 0, transform: 'translateY(20px)' }}
            className="mb-10 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto"
          >
            <span className="text-xs text-surface-500 ml-1">بحث سريع:</span>
            {quickSearches.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => router.push(`/cars?search=${encodeURIComponent(q)}`)}
                className="rounded-full border border-surface-600/50 bg-surface-800/50 px-3.5 py-1.5 text-xs font-medium text-surface-300 backdrop-blur-sm transition-all duration-200 hover:border-accent-500/50 hover:bg-accent-500/10 hover:text-accent-300 active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Stats — glassmorphism cards */}
          <div style={loaded ? {
            opacity: 1, transform: 'translateY(0)',
            transition: 'opacity 0.6s ease-out 0.4s, transform 0.6s ease-out 0.4s'
          } : { opacity: 0, transform: 'translateY(20px)' }}
            className="grid gap-3 grid-cols-3 sm:gap-4 w-full max-w-2xl mx-auto"
          >
            {[
              { icon: TrendingUp, value: '1,500+', label: 'سيارة مسجلة', color: 'text-accent-300', bg: 'bg-accent-500/15' },
              { icon: Shield, value: '100%', label: 'شراء آمن', color: 'text-success-400', bg: 'bg-success-500/15' },
              { icon: Zap, value: '24/7', label: 'دعم متواصل', color: 'text-gold-200', bg: 'bg-gold-100/10' },
            ].map((stat) => (
              <div key={stat.label}
                className="glass-card shine-hover group flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 rounded-xl px-3 py-4 sm:px-5 sm:py-4 text-center transition-all duration-300 hover:shadow-soft-md hover:-translate-y-0.5"
              >
                <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg ${stat.bg} transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-bold text-surface-200">{stat.value}</p>
                  <p className="text-[11px] sm:text-xs text-surface-500">{stat.label}</p>
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
          className="hidden lg:flex absolute bottom-4 left-1/2 -translate-x-1/2 flex-col items-center gap-2"
        >
          <span className="text-xs text-surface-500 tracking-wider">اكتشف</span>
          <div className="animate-bounce">
            <ChevronDown className="h-5 w-5 text-surface-500" />
          </div>
        </div>
      </div>
    </section>
  );
}
