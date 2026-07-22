'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CarGrid } from '@/components/cars/CarGrid';
import { User, Mail, Phone, Store, MapPin, Save, Camera, LogOut, Trash2, Edit, Bell, MessageCircle, Eye, Star, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Car } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myCars, setMyCars] = useState<Car[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'cars'>('profile');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    bio: user?.bio || '',
    dealerName: user?.dealerName || '',
    dealerDescription: user?.dealerDescription || '',
    dealerAddress: user?.dealerAddress || '',
    whatsappNotifications: user?.whatsappNotifications || false,
  });

  useEffect(() => {
    fetch('/api/cars/my')
      .then(r => r.json())
      .then(data => { if (data.success) setMyCars(data.data || []); })
      .catch(() => {});
  }, []);

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('الحجم الأقصى 5 ميجا'); return; }

    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && data.data?.url) {
        const updateRes = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: data.data.url }),
        });
        const updateData = await updateRes.json();
        if (updateData.success) {
          updateUser(updateData.data);
          toast.success('تم تحديث الصورة');
        }
      } else {
        toast.error('فشل رفع الصورة');
      }
    } catch {
      toast.error('حدث خطأ');
    }
    setUploadingImage(false);
  };

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
              <div className="text-center relative">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="absolute w-0 h-0 opacity-0 overflow-hidden" />
                <div className="relative group w-24 h-24 mx-auto mb-4">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden">
                    {user?.image ? (
                      <img src={user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
                    className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingImage ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </button>
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
                <div className="mt-3 flex items-center justify-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${(user?.rating || 0) >= i + 1 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                  <span className="text-sm text-gray-500 mr-1">({user?.ratingCount || 0})</span>
                </div>
              </div>

              <div className="mt-6 space-y-1">
                <button onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <User className="w-4 h-4" /> الملف الشخصي
                </button>
                <button onClick={() => setActiveTab('cars')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'cars' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <Edit className="w-4 h-4" /> سياراتي
                </button>
                <a href={`/profile/${user?.id}`} target="_blank"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  <Eye className="w-4 h-4" /> عرض الملف العام
                </a>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => { logout(); router.push('/'); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                  <LogOut className="w-4 h-4" /> تسجيل خروج
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="card p-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">تعديل الملف الشخصي</h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                    <div>
                      <h3 className="text-sm font-bold text-gray-500 mb-3">المعلومات الشخصية</h3>
                      <div className="space-y-4">
                        <Input label="الاسم" value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          icon={<User className="w-4 h-4" />} />
                        <Input label="رقم الهاتف" value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          icon={<Phone className="w-4 h-4" />} />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نبذة عني</label>
                          <textarea value={form.bio} rows={3}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                            placeholder="اكتب نبذة مختصرة عنك..."
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-500 mb-3">الواتساب والإشعارات</h3>
                      <div className="space-y-4">
                        <Input label="رقم الواتساب" value={form.whatsapp}
                          onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                          icon={<MessageCircle className="w-4 h-4" />}
                          placeholder="مثال: 96279xxxxxxx" />
                        <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">إشعارات واتساب</p>
                              <p className="text-xs text-gray-500">استلم إشعارات الرسائل على الواتساب</p>
                            </div>
                          </div>
                          <button type="button"
                            onClick={() => setForm({ ...form, whatsappNotifications: !form.whatsappNotifications })}
                            className={`relative w-12 h-6 rounded-full transition-all ${form.whatsappNotifications ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${form.whatsappNotifications ? 'left-0.5' : 'right-0.5'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {(user?.role === 'DEALER' || form.dealerName) && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-500 mb-3">معلومات المعرض</h3>
                        <div className="space-y-4">
                          <Input label="اسم المعرض" value={form.dealerName}
                            onChange={(e) => setForm({ ...form, dealerName: e.target.value })}
                            icon={<Store className="w-4 h-4" />} />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وصف المعرض</label>
                            <textarea value={form.dealerDescription} rows={3}
                              onChange={(e) => setForm({ ...form, dealerDescription: e.target.value })}
                              placeholder="اكتب وصفاً للمعرض..."
                              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none" />
                          </div>
                          <Input label="عنوان المعرض" value={form.dealerAddress}
                            onChange={(e) => setForm({ ...form, dealerAddress: e.target.value })}
                            icon={<MapPin className="w-4 h-4" />} />
                        </div>
                      </div>
                    )}

                    <Button type="submit" loading={loading} icon={<Save className="w-4 h-4" />}>
                      حفظ التغييرات
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'cars' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">سياراتي ({myCars.length})</h2>
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
