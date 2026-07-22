'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Car, Mail, Lock, Eye, EyeOff, ArrowLeft, Shield, Zap, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-primary-500/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 shadow-primary-lg mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">JO Cars</h1>
          <p className="text-surface-500 text-sm mt-1">سوق السيارات الأردنية</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-8 shadow-soft-lg"
        >
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">مرحباً بعودتك</h2>
            <p className="text-surface-500 text-sm">سجل دخولك للمتابعة</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400">
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
                  className="input-field pr-12"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">كلمة المرور</label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  required
                  className="input-field pr-12 pl-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors touch-target flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer touch-target">
                <input type="checkbox" className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-surface-600 dark:text-surface-400">تذكرني</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors touch-target flex items-center">
                نسيت كلمة المرور؟
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  تسجيل الدخول
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200 dark:border-surface-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-surface-800 text-surface-500">أو</span>
            </div>
          </div>

          {/* Register */}
          <Link
            href="/auth/register"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-all duration-200"
          >
            إنشاء حساب جديد
          </Link>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          {[
            { icon: Shield, text: 'آمن' },
            { icon: Zap, text: 'سريع' },
            { icon: Users, text: 'مجاني' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 text-surface-500">
              <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">{item.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-surface-500 text-xs mt-8"
        >
          بالدخول إلى حسابك، أنت توافق على{' '}
          <Link href="/terms" className="text-surface-600 dark:text-surface-400 hover:text-primary-600 transition-colors">شروط الاستخدام</Link>
          {' '}و{' '}
          <Link href="/privacy" className="text-surface-600 dark:text-surface-400 hover:text-primary-600 transition-colors">سياسة الخصوصية</Link>
        </motion.p>
      </div>
    </div>
  );
}
