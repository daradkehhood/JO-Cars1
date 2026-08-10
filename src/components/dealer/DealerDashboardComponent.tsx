'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import {
  Store, Car, DollarSign, Eye, Heart, TrendingUp, Plus, Edit, Trash2, CheckCircle2,
  AlertTriangle, Phone, MessageCircle, ShieldCheck, MapPin, Share2, Tag, ArrowUpRight,
  BadgeCheck, Sparkles, RefreshCw, BarChart3, Settings, Upload, Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';

interface DealerCar {
  id: string;
  slug: string;
  price: number;
  year: number;
  status: string;
  views: number;
  saves: number;
  featured: boolean;
  brand: { nameAr: string };
  model: { nameAr: string };
  city: { nameAr: string };
  images: { url: string }[];
}

export function DealerDashboardComponent() {
  const { user, isAuthenticated, _hydrated } = useAuth();
  const authLoading = !_hydrated;
  const [cars, setCars] = useState<DealerCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [dealerName, setDealerName] = useState('');
  const [dealerAddress, setDealerAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'APPROVED' | 'SOLD'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Set initial dealer details
    setDealerName(user.dealerName || user.name || '');
    setDealerAddress(user.dealerAddress || 'الأردن');

    // Fetch dealer's cars
    fetch('/api/cars/my-cars')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setCars(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdatePrice = async (carId: string, currentPrice: number) => {
    const newPriceStr = prompt('أدخل السعر الجديد بالدينار الأردني:', currentPrice.toString());
    if (!newPriceStr) return;
    const newPrice = parseInt(newPriceStr, 10);
    if (isNaN(newPrice) || newPrice <= 0) return;

    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice }),
      });
      const data = await res.json();
      if (data.success) {
        setCars(prev => prev.map(c => c.id === carId ? { ...c, price: newPrice } : c));
        showToast('تم تحديث السعر بنجاح! 💵');
      }
    } catch {
      showToast('حدث خطأ أثناء تحديث السعر');
    }
  };

  const handleToggleSold = async (carId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'SOLD' ? 'APPROVED' : 'SOLD';
    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCars(prev => prev.map(c => c.id === carId ? { ...c, status: nextStatus } : c));
        showToast(nextStatus === 'SOLD' ? 'تم تمييز السيارة كمباعة! 🎉' : 'تم تفعيل السيارة بالعرض!');
      }
    } catch {
      showToast('حدث خطأ أثناء تغيير الحالة');
    }
  };

  const handleSaveDealerProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealerName,
          dealerAddress,
          dealerBannerImage: bannerUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم حفظ بيانات غلاف وتفاصيل المعرض بنجاح! ✨');
        setEditingBanner(false);
      }
    } catch {
      showToast('فشل حفظ البيانات');
    }
    setSavingProfile(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate metrics
  const totalCars = cars.length;
  const activeCars = cars.filter(c => c.status === 'APPROVED').length;
  const soldCars = cars.filter(c => c.status === 'SOLD').length;
  const totalStockWorth = cars.reduce((acc, c) => acc + (c.price || 0), 0);
  const totalViews = cars.reduce((acc, c) => acc + (c.views || 0), 0);
  const totalSaves = cars.reduce((acc, c) => acc + (c.saves || 0), 0);

  const filteredCars = cars.filter(c => {
    if (selectedFilter === 'APPROVED') return c.status === 'APPROVED';
    if (selectedFilter === 'SOLD') return c.status === 'SOLD';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between">
      <Header />
      <main className="container-custom max-w-6xl mx-auto px-4 py-8 flex-1">

        {/* Toast Notification */}
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-xl text-sm font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {toastMessage}
          </motion.div>
        )}

        {/* Dealer Showroom Hero Header */}
        <div className="card overflow-hidden mb-8 border border-emerald-500/20 shadow-xl">
          <div className="relative h-44 sm:h-56 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 overflow-hidden">
            {bannerUrl ? (
              <img src={bannerUrl} alt="غلاف المعرض" className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Store className="w-40 h-40 text-emerald-300" />
              </div>
            )}
            <div className="absolute top-4 left-4">
              <button
                onClick={() => setEditingBanner(!editingBanner)}
                className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                تخصيص المعرض والغلاف
              </button>
            </div>
          </div>

          <div className="p-6 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 shadow-2xl flex items-center justify-center text-3xl font-black text-emerald-600 dark:text-emerald-400 overflow-hidden">
                  {user?.dealerLogo ? (
                    <img src={user.dealerLogo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{dealerName.charAt(0) || 'D'}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">{dealerName || 'معرض السيارات'}</h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> تاجر معتمد 🇯🇴
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {dealerAddress}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/cars/new"
                  className="btn btn-emerald px-5 py-2.5 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" /> إضافة سيارة للمعرض
                </Link>
                <Link
                  href={`/profile/${user?.id}`}
                  className="btn btn-outline px-4 py-2.5 text-xs font-bold"
                >
                  معاينة المعرض العام
                </Link>
              </div>
            </div>

            {/* Editing Panel Drawer */}
            {editingBanner && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3"
              >
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-500" /> إعدادات غلاف المعرض والتفاصيل
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">اسم المعرض التجاري</label>
                    <input
                      type="text"
                      value={dealerName}
                      onChange={(e) => setDealerName(e.target.value)}
                      className="input text-sm mt-1"
                      placeholder="مثال: معرض الفخامة للسيارات"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">عنوان المعرض (المدينة والشارع)</label>
                    <input
                      type="text"
                      value={dealerAddress}
                      onChange={(e) => setDealerAddress(e.target.value)}
                      className="input text-sm mt-1"
                      placeholder="مثال: المنطقة الحرة - الزرقاء / شارع مكة"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">رابط صورة الغلاف (Banner Image URL)</label>
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="input text-sm mt-1"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingBanner(false)}
                    className="px-4 py-2 rounded-xl text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveDealerProfile}
                    disabled={savingProfile}
                    className="btn btn-emerald px-5 py-2 text-xs font-bold"
                  >
                    {savingProfile ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Dashboard Analytics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          
          <div className="card p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-500/20">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="text-xs font-bold">قيمة المخزون الكلي</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{totalStockWorth.toLocaleString('ar-JO')} د.أ</p>
            <span className="text-[11px] text-gray-500">إجمالي أسعار سيارات المعرض</span>
          </div>

          <div className="card p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-500/20">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
              <span className="text-xs font-bold">المشاهدات المباشرة</span>
              <Eye className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{totalViews.toLocaleString('ar-JO')}</p>
            <span className="text-[11px] text-gray-500">مشاهدات الزوار للإعلانات</span>
          </div>

          <div className="card p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-500/20">
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
              <span className="text-xs font-bold">إعلانات نشطة</span>
              <Car className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{activeCars} / {totalCars}</p>
            <span className="text-[11px] text-gray-500">سيارات متاحة للبيع الآن</span>
          </div>

          <div className="card p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-500/20">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
              <span className="text-xs font-bold">حالة المبيعات</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{soldCars} مباعة</p>
            <span className="text-[11px] text-gray-500">سيارات تم بيعها مؤخراً</span>
          </div>

        </div>

        {/* Cars Inventory Section */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">إدارة مخزون المعرض</h2>
              <p className="text-xs text-gray-500">تحكم بأسعار وسيارات المعرض وحالة البيع مباشرة</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === 'ALL'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                الكل ({totalCars})
              </button>
              <button
                onClick={() => setSelectedFilter('APPROVED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === 'APPROVED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                المتاحة ({activeCars})
              </button>
              <button
                onClick={() => setSelectedFilter('SOLD')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === 'SOLD'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                المباعة ({soldCars})
              </button>
            </div>
          </div>

          {filteredCars.length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">لا توجد سيارات في هذا القسم حالياً</p>
              <Link href="/cars/new" className="btn btn-emerald px-5 py-2 text-xs mt-3 inline-block font-bold">
                إضافة أول سيارة للمعرض
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCars.map(car => (
                <div
                  key={car.id}
                  className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 hover:border-emerald-500/30 transition-all gap-4"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0">
                      <img
                        src={car.images[0]?.url || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {car.brand?.nameAr} {car.model?.nameAr} {car.year}
                        </h3>
                        {car.status === 'SOLD' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                            مباعة 🎉
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>📍 {car.city?.nameAr || 'الأردن'}</span>
                        <span>👁️ {car.views} مشاهدة</span>
                        <span>❤️ {car.saves} حفظ</span>
                      </div>
                      <p className="font-black text-emerald-600 dark:text-emerald-400 text-base mt-1">
                        {car.price.toLocaleString('ar-JO')} د.أ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200 dark:border-gray-800">
                    <button
                      onClick={() => handleUpdatePrice(car.id, car.price)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 transition-all flex items-center gap-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> تعديل السعر
                    </button>
                    <button
                      onClick={() => handleToggleSold(car.id, car.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        car.status === 'SOLD'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200'
                          : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-200'
                      }`}
                    >
                      {car.status === 'SOLD' ? 'إعادة للعرض' : 'تمييز كمباعة'}
                    </button>
                    <Link
                      href={`/cars/${car.slug}`}
                      className="p-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-all"
                      title="معاينة الإعلان"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
      <Footer />
    </div>
  );
}
