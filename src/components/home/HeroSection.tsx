'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, TrendingUp, Shield, Zap, ChevronDown, Sparkles } from 'lucide-react';

const typedWords = ['قارن', 'اختر', 'اعرض', 'ابحث'];

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [word, setWord] = useState(typedWords[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [focused, setFocused] = useState(false);

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

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cars?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, router]);

  const quickSearches = ['تويوتا', 'هيونداي', 'SUV', 'ميرسيدس', 'اقتصادية', 'عائلية'];

  const anim = (delay: number) => loaded
    ? { opacity: 1, transform: 'translateY(0)', transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s` }
    : { opacity: 0, transform: 'translateY(28px)' };

  return (
    <section className="relative min-h-[90vh] sm:min-h-[95vh] lg:min-h-screen flex items-center justify-center overflow-hidden">
      {/* ═══ Background ═══ */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-porsche.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          style={{ filter: 'brightness(0.65) contrast(1.1)' }}
        />
        {/* Multi-layer overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080a0a]/70 via-[#080a0a]/20 to-[#080a0a]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080a0a]/50 via-transparent to-[#080a0a]/50" />
        {/* Subtle blue tint for premium feel */}
        <div className="absolute inset-0 bg-[#1d4ed8]/[0.03]" />
        {/* Bottom fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#080a0a] to-transparent" />
      </div>

      {/* ═══ Ambient Light Effects ═══ */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[400px] bg-[#ffc640]/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[350px] bg-[#1d4ed8]/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* ═══ Content ═══ */}
      <div className="container-custom relative z-10 pt-20 pb-16 lg:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          {/* ─── Badge ─── */}
          <div style={anim(0)} className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#ffc640]/15 bg-[#ffc640]/[0.06] px-5 py-2.5 backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-[#ffc640]" />
            <span className="text-sm font-semibold text-[#ffc640]/90" style={{ fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif" }}>
              منصة السيارات الأولى في الأردن
            </span>
          </div>

          {/* ─── Heading ─── */}
          <h1
            style={{ ...anim(0.1), fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', system-ui, sans-serif" }}
            className="text-4xl font-bold leading-[1.1] text-white sm:text-5xl md:text-6xl lg:text-[4.5rem] tracking-tight mb-6"
          >
            ابحث،{' '}
            <span className="relative inline-block">
              <span className="typewriter text-[#ffc640]">{word}</span>
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-[#ffc640] via-[#ffc640]/60 to-transparent rounded-full" />
            </span>
            <br />
            <span className="bg-gradient-to-l from-white via-white to-[#c6c6cc] bg-clip-text text-transparent">
              وتملك سيارتك
            </span>
          </h1>

          {/* ─── Subtitle ─── */}
          <p style={anim(0.2)} className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-[#909096] sm:text-lg lg:text-xl">
            منصة ذكية تساعدك على البحث والمقارنة والعثور على السيارة المناسبة بأفضل سعر،
            مع تجربة نظيفة ومريحة على الهاتف.
          </p>

          {/* ─── Search Bar ─── */}
          <form
            onSubmit={handleSearch}
            style={anim(0.3)}
            className="mx-auto mb-8 max-w-3xl px-2 sm:px-4"
          >
            <div
              className={`group relative rounded-2xl transition-all duration-500 ${
                focused
                  ? 'shadow-[0_0_40px_rgba(255,198,64,0.12),0_0_80px_rgba(29,78,216,0.06)]'
                  : 'shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
              }`}
            >
              {/* Glass background */}
              <div className={`absolute inset-0 rounded-2xl bg-[#141616]/70 backdrop-blur-2xl border transition-all duration-500 ${
                focused ? 'border-[#ffc640]/30' : 'border-[#333535]/40'
              }`} />

              <div className="relative flex items-center gap-2 p-2">
                {/* Search icon */}
                <div className="hidden items-center pr-4 sm:flex">
                  <Search className={`h-5 w-5 transition-colors duration-300 ${focused ? 'text-[#ffc640]' : 'text-[#909096]'}`} />
                </div>

                {/* Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="ابحث عن سيارة... مثال: SUV تويوتا 2024"
                  className="h-14 flex-1 bg-transparent text-base text-white outline-none placeholder-[#909096] sm:h-16"
                />

                {/* Actions */}
                <div className="flex items-center gap-2 px-2 sm:pr-0">
                  <button
                    type="button"
                    onClick={() => router.push('/cars')}
                    className="hidden rounded-xl p-2.5 text-[#909096] transition-all duration-200 hover:bg-[#282a2b]/60 hover:text-[#c6c6cc] sm:flex"
                    aria-label="فلاتر متقدمة"
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                  </button>

                  <button
                    type="submit"
                    className="flex h-12 shrink-0 items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] px-6 text-sm font-bold text-white shadow-[0_4px_20px_rgba(29,78,216,0.3)] transition-all duration-300 hover:from-[#2563eb] hover:to-[#3b82f6] hover:shadow-[0_6px_28px_rgba(29,78,216,0.4)] active:scale-[0.97] sm:h-12 sm:px-8"
                  >
                    <Search className="h-5 w-5" strokeWidth={2.5} />
                    <span className="hidden sm:inline">بحث</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* ─── Quick Tags ─── */}
          <div style={anim(0.4)} className="mb-12 flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto px-2">
            <span className="text-xs text-[#909096] ml-1 font-medium">بحث سريع:</span>
            {quickSearches.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => router.push(`/cars?search=${encodeURIComponent(q)}`)}
                className="rounded-full border border-[#333535]/50 bg-[#1a1c1c]/50 px-4 py-2 text-xs font-medium text-[#c6c6cc] backdrop-blur-sm transition-all duration-300 hover:border-[#ffc640]/40 hover:bg-[#ffc640]/[0.06] hover:text-[#ffc640] active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>

          {/* ─── Stats Cards ─── */}
          <div style={anim(0.5)} className="grid gap-3 grid-cols-3 sm:gap-4 w-full max-w-3xl mx-auto px-2">
            {[
              { icon: TrendingUp, value: '1,500+', label: 'سيارة مستخدمة', color: 'text-[#3b82f6]', bg: 'bg-[#1d4ed8]/15', border: 'border-[#1d4ed8]/20' },
              { icon: Shield, value: '100%', label: 'شراء آمن', color: 'text-[#12b76a]', bg: 'bg-[#12b76a]/15', border: 'border-[#12b76a]/20' },
              { icon: Zap, value: '24/7', label: 'دعم متواصل', color: 'text-[#ffc640]', bg: 'bg-[#ffc640]/10', border: 'border-[#ffc640]/20' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-[#333535]/30 bg-[#141616]/60 backdrop-blur-xl p-4 sm:p-5 transition-all duration-500 hover:border-[#444]/50 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5"
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
                  <div className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl ${stat.bg} border ${stat.border} transition-transform duration-300 group-hover:scale-110`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} strokeWidth={2} />
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-lg sm:text-xl font-bold text-white" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{stat.value}</p>
                    <p className="text-[11px] sm:text-xs text-[#909096]">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Scroll Indicator ─── */}
        <div style={loaded ? { opacity: 1, transition: 'opacity 0.6s ease-out 1s' } : { opacity: 0 }}
          className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2"
        >
          <span className="text-xs text-[#909096] tracking-widest uppercase font-medium">اكتشف</span>
          <div className="w-6 h-10 rounded-full border-2 border-[#333535]/50 flex items-start justify-center pt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ffc640] animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
