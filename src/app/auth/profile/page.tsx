'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CarGrid } from '@/components/cars/CarGrid';
import { User, Mail, Phone, Store, MapPin, Save, Camera, LogOut, Trash2, Edit, Bell, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Car } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myCars, setMyCars] = useState<Car[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'cars'>('profile');
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    dealerName: user?.dealerName || '',
    whatsappNotifications: user?.whatsappNotifications || false,
  });

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        updateUser(data.data);
        toast.success('تم تحديث الملف الشخصي');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user?.name}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
                {user?.role === 'ADMIN' && (
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">
                    مدير الموقع
                  </span>
                )}
                {user?.role === 'DEALER' && (
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    تاجر / معرض
                  </span>
                )}
              </div>

              <div className="mt-6 space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <User className="w-4 h-4" />
                  الملف الشخصي
                </button>
                <button
                  onClick={() => setActiveTab('cars')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'cars'
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  سياراتي
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => { logout(); router.push('/'); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل خروج
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="card p-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">تعديل الملف الشخصي</h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                    <Input
                      label="الاسم"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      icon={<User className="w-4 h-4" />}
                    />
                    <Input
                      label="رقم الهاتف"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      icon={<Phone className="w-4 h-4" />}
                    />
                    <Input
                      label="رقم الواتساب (للإشعارات)"
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                      icon={<MessageCircle className="w-4 h-4" />}
                      placeholder="مثال: 96279xxxxxxx"
                    />
                    <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">إشعارات واتساب</p>
                          <p className="text-xs text-gray-500">استلم إشعارات الرسائل والردود على الواتساب</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, whatsappNotifications: !form.whatsappNotifications })}
                        className={`relative w-12 h-6 rounded-full transition-all ${
                          form.whatsappNotifications ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
                          form.whatsappNotifications ? 'left-0.5' : 'right-0.5'
                        }`} />
                      </button>
                    </div>
                    {user?.role === 'DEALER' && (
                      <Input
                        label="اسم المعرض"
                        value={form.dealerName}
                        onChange={(e) => setForm({ ...form, dealerName: e.target.value })}
                        icon={<Store className="w-4 h-4" />}
                      />
                    )}
                    <Button type="submit" loading={loading} icon={<Save className="w-4 h-4" />}>
                      حفظ التغييرات
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'cars' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">سياراتي</h2>
                  <Button onClick={() => router.push('/cars/add')} icon={<Edit className="w-4 h-4" />}>
                    إضافة سيارة
                  </Button>
                </div>
                <CarGrid cars={myCars} columns={2} emptyMessage="لم تقم بإضافة أي سيارات بعد" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
