'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Car, User, Mail, Lock, Phone, Store, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDealer, setIsDealer] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'USER' as 'USER' | 'DEALER',
    dealerName: '',
  });

  const passwordRequirements = [
    { text: '8 أحرف على الأقل', met: form.password.length >= 8 },
    { text: 'حرف كبير (A-Z)', met: /[A-Z]/.test(form.password) },
    { text: 'حرف صغير (a-z)', met: /[a-z]/.test(form.password) },
    { text: 'رقم (0-9)', met: /\d/.test(form.password) },
    { text: 'رمز خاص (!@#$%^&*)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      const payload = { ...form, role: isDealer ? 'DEALER' : 'USER' };
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        login(data.data.user, data.data.token);
        toast.success('تم إنشاء الحساب بنجاح');
        router.push('/');
      } else {
        toast.error(data.error || 'فشل إنشاء الحساب');
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
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">إنشاء حساب جديد</h2>
            <p className="text-surface-500 text-sm">انضم إلى مجتمع السيارات الأذكى في الأردن</p>
          </div>

          {/* User Type Toggle */}
          <div className="flex bg-surface-100 dark:bg-surface-700 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setIsDealer(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isDealer
                  ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-soft'
                  : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            >
              مستخدم عادي
            </button>
            <button
              type="button"
              onClick={() => setIsDealer(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDealer
                  ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-soft'
                  : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            >
              تاجر / معرض
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">الاسم الكامل</label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="أدخل اسمك"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="input-field pr-12"
                />
              </div>
            </div>

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

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">رقم الهاتف</label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  placeholder="07XXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  autoComplete="tel"
                  inputMode="tel"
                  className="input-field pr-12"
                />
              </div>
            </div>

            {/* Dealer Name */}
            {isDealer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">اسم المعرض / التاجر</label>
                <div className="relative">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400">
                    <Store className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="أدخل اسم المعرض"
                    value={form.dealerName}
                    onChange={(e) => setForm({ ...form, dealerName: e.target.value })}
                    className="input-field pr-12"
                  />
                </div>
              </motion.div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">كلمة المرور</label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أنشئ كلمة مرور قوية"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
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

              {form.password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 space-y-1.5"
                >
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-success-500' : 'bg-surface-200 dark:bg-surface-600'}`}>
                        {req.met && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={req.met ? 'text-success-600 dark:text-success-400' : 'text-surface-500'}>{req.text}</span>
                    </div>
                  ))}
                </motion.div>
              )}
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
                  إنشاء حساب
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

          {/* Login */}
          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-all duration-200"
          >
            لديك حساب بالفعل؟ تسجيل الدخول
          </Link>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-surface-500 text-xs mt-8"
        >
          بالتسجيل، أنت توافق على{' '}
          <Link href="/terms" className="text-surface-600 dark:text-surface-400 hover:text-primary-600 transition-colors">شروط الاستخدام</Link>
          {' '}و{' '}
          <Link href="/privacy" className="text-surface-600 dark:text-surface-400 hover:text-primary-600 transition-colors">سياسة الخصوصية</Link>
        </motion.p>
      </div>
    </div>
  );
}
