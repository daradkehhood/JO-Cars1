'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Car, User, Mail, Lock, Phone, Store, Eye, EyeOff } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -right-40 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute bottom-1/4 -left-40 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-4"
      >
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <Car className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إنشاء حساب جديد</h1>
            <p className="text-gray-500 mt-1">انضم إلى مجتمع السيارات الأذكى في الأردن</p>
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => setIsDealer(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isDealer
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              مستخدم عادي
            </button>
            <button
              onClick={() => setIsDealer(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isDealer
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              تاجر / معرض
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="الاسم الكامل"
              placeholder="أدخل اسمك"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              icon={<User className="w-4 h-4" />}
              required
            />
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="رقم الهاتف"
              type="tel"
              placeholder="07XXXXXXXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              icon={<Phone className="w-4 h-4" />}
            />
            {isDealer && (
              <Input
                label="اسم المعرض / التاجر"
                placeholder="أدخل اسم المعرض"
                value={form.dealerName}
                onChange={(e) => setForm({ ...form, dealerName: e.target.value })}
                icon={<Store className="w-4 h-4" />}
              />
            )}
            <div className="relative">
              <Input
                label="كلمة المرور"
                type={showPassword ? 'text' : 'password'}
                placeholder="أقل من 8 أحرف"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                icon={<Lock className="w-4 h-4" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-[38px] text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" loading={loading} className="w-full h-12">
              إنشاء حساب
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              لديك حساب بالفعل؟{' '}
              <Link href="/auth/login" className="text-blue-500 hover:text-blue-600 font-medium">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
