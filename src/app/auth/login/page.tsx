'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Car, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col pt-28 pb-32 px-4 sm:pt-12 sm:pb-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute bottom-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <div className="flex-1 flex items-start sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-black/5 border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                <Car className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">تسجيل الدخول</h1>
              <p className="text-gray-500 mt-2 text-sm sm:text-base">مرحباً بعودتك! سجل دخولك للمتابعة</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="البريد الإلكتروني"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                icon={<Mail className="w-5 h-5" />}
                autoComplete="email"
                inputMode="email"
                required
              />
              <div className="relative">
                <Input
                  label="كلمة المرور"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  icon={<Lock className="w-5 h-5" />}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-[42px] p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">تذكرني</span>
                </label>
                <Link href="/auth/forgot-password" className="text-blue-500 hover:text-blue-600 font-medium min-h-[44px] flex items-center">
                  نسيت كلمة المرور؟
                </Link>
              </div>

              <Button type="submit" loading={loading} className="w-full h-14 sm:h-12 text-base sm:text-sm font-semibold rounded-xl">
                تسجيل الدخول
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">أو</span>
              </div>
            </div>

            <Link
              href="/auth/register"
              className="flex items-center justify-center gap-2 w-full h-14 sm:h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-base sm:text-sm"
            >
              إنشاء حساب جديد
            </Link>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                ليس لديك حساب؟{' '}
                <Link href="/auth/register" className="text-blue-500 hover:text-blue-600 font-medium">
                  سجّل الآن
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
