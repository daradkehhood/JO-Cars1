'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Car, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Zap, Users, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        login(data.data.user, data.data.token);
        toast.success('تم تسجيل الدخول بنجاح');
        router.push('/');
      } else {
        toast.error(data.error || 'فشل تسجيل الدخول');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#080a0a]">
      {/* ═══ Left Panel — Car Visual (hidden on mobile) ═══ */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-porsche.jpg')" }}
        />
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080a0a]/95 via-[#080a0a]/70 to-[#080a0a]/40" />
        {/* Bottom gradient for depth */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#080a0a] to-transparent" />

        {/* Content on left panel */}
        <div className="relative z-10 px-16 max-w-xl">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Gold accent line */}
            <div className="w-16 h-1 bg-gradient-to-r from-[#ffc640] to-[#ffc640]/40 rounded-full mb-8" />

            <h1 className="text-5xl font-bold text-white leading-tight mb-6" style={{ fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif" }}>
              سوق السيارات<br />
              <span className="text-[#ffc640]">الأردني</span> الأرقى
            </h1>
            <p className="text-lg text-[#909096] leading-relaxed max-w-md">
              منصة ذكية تجمع بين البائعين والمشترين بأمان وشفافية. اكتشف آلاف السيارات بأسعار منافسة.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 grid grid-cols-3 gap-6"
          >
            {[
              { number: '+15K', label: 'سيارة معروضة' },
              { number: '+8K', label: 'بائع موثوق' },
              { number: '+50K', label: 'مستخدم نشط' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-[#ffc640]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {stat.number}
                </div>
                <div className="text-xs text-[#909096] mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Decorative floating car badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-16 right-16 z-10"
        >
          <div className="w-20 h-20 rounded-2xl bg-[#ffc640]/10 border border-[#ffc640]/20 flex items-center justify-center backdrop-blur-sm">
            <Car className="w-10 h-10 text-[#ffc640]" />
          </div>
        </motion.div>
      </div>

      {/* ═══ Right Panel — Login Form ═══ */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-8 relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#ffc640]/[0.03] rounded-full blur-[150px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ffc640] to-[#e3aa00] shadow-lg shadow-[#ffc640]/20 mb-4">
              <Car className="w-7 h-7 text-[#080a0a]" />
            </div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif" }}>
              JO Cars
            </h1>
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif" }}>
              مرحباً بعودتك
            </h2>
            <p className="text-[#909096] text-sm">
              سجل دخولك للوصول إلى حسابك وتصفح السيارات
            </p>
          </motion.div>

          {/* Login Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Glass card */}
            <div className="bg-[#141616]/80 backdrop-blur-2xl rounded-3xl border border-[#282a2b]/60 p-8 shadow-2xl shadow-black/30">
              {/* Gold accent line at top of card */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-[#ffc640]/60 to-transparent rounded-full" />

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">
                    البريد الإلكتروني
                  </label>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909096] group-focus-within:text-[#ffc640] transition-colors duration-300">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      placeholder="example@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      autoComplete="email"
                      inputMode="email"
                      required
                      className="w-full h-13 pr-12 pl-4 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-sm transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 focus:bg-[#1a1c1c] outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#c6c6cc] uppercase tracking-wider">
                    كلمة المرور
                  </label>
                  <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909096] group-focus-within:text-[#ffc640] transition-colors duration-300">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      autoComplete="current-password"
                      required
                      className="w-full h-13 pr-12 pl-12 bg-[#1a1c1c]/80 border border-[#333535]/60 rounded-xl text-white placeholder-[#909096] text-sm transition-all duration-300 focus:border-[#ffc640]/50 focus:ring-2 focus:ring-[#ffc640]/10 focus:bg-[#1a1c1c] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#909096] hover:text-[#ffc640] transition-colors duration-200 flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-[#333535] bg-[#1a1c1c] text-[#ffc640] focus:ring-[#ffc640]/20 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-[#909096] group-hover:text-[#c6c6cc] transition-colors">
                      تذكرني
                    </span>
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-[#ffc640]/80 hover:text-[#ffc640] transition-colors duration-200"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01, boxShadow: '0 0 30px rgba(255, 198, 64, 0.2)' }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full h-13 bg-gradient-to-r from-[#ffc640] to-[#e3aa00] hover:from-[#ffd060] hover:to-[#ffc640] text-[#080a0a] font-bold rounded-xl shadow-lg shadow-[#ffc640]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm"
                  style={{ fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif" }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-[#080a0a]/20 border-t-[#080a0a] rounded-full animate-spin" />
                  ) : (
                    <>
                      تسجيل الدخول
                      <ArrowRight className="w-5 h-5 rotate-180" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#333535]/40" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-[#141616]/80 text-[#909096] text-xs uppercase tracking-wider">
                    أو
                  </span>
                </div>
              </div>

              {/* Register Link */}
              <Link
                href="/auth/register"
                className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-[#333535]/60 text-[#c6c6cc] font-medium hover:bg-[#1a1c1c] hover:border-[#ffc640]/30 transition-all duration-300 text-sm"
              >
                إنشاء حساب جديد
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 grid grid-cols-3 gap-4"
          >
            {[
              { icon: Shield, text: 'آمن', sub: 'تشفير كامل' },
              { icon: Zap, text: 'سريع', sub: 'بحث ذكي' },
              { icon: Users, text: 'مجاني', sub: 'بدون رسوم' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#1a1c1c]/80 border border-[#333535]/40 flex items-center justify-center group-hover:border-[#ffc640]/30 group-hover:bg-[#ffc640]/5 transition-all duration-300">
                  <item.icon className="w-5 h-5 text-[#909096] group-hover:text-[#ffc640] transition-colors duration-300" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold text-[#c6c6cc] block">{item.text}</span>
                  <span className="text-[10px] text-[#909096]">{item.sub}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-center text-[#909096] text-xs mt-8 leading-relaxed"
          >
            بالدخول إلى حسابك، أنت توافق على{' '}
            <Link href="/terms" className="text-[#c6c6cc] hover:text-[#ffc640] transition-colors underline underline-offset-2">
              شروط الاستخدام
            </Link>
            {' '}و{' '}
            <Link href="/privacy" className="text-[#c6c6cc] hover:text-[#ffc640] transition-colors underline underline-offset-2">
              سياسة الخصوصية
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
}
