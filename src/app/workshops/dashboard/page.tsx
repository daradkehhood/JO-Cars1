'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Settings,
  Wrench,
  Car,
  DollarSign,
  Calendar,
  Star,
  BarChart3,
  MessageCircle,
  Megaphone,
  Users,
  Eye,
  Phone,
  Edit3,
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  Loader2,
  ChevronLeft,
  Upload,
  Save,
  XCircle,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';

type Tab = 'overview' | 'edit' | 'services' | 'brands' | 'prices' | 'appointments' | 'reviews' | 'create-ad' | 'ads' | 'stats';

interface WorkshopStats {
  views: number;
  messages: number;
  appointments: number;
  calls: number;
  carsFixed: number;
  rating: number;
  reviewCount: number;
}

interface WorkshopInfo {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  provinceId: string;
  cityId: string;
  workingHours: string;
  workingDays: string;
}

interface Service {
  id: string;
  nameAr: string;
}

interface Brand {
  id: string;
  nameAr: string;
  logo: string | null;
}

interface Price {
  id: string;
  serviceName: string;
  price: number;
  note: string;
}

interface Appointment {
  id: string;
  userName: string;
  userPhone: string;
  service: string;
  date: string;
  time: string;
  description: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

interface Review {
  id: string;
  userName: string;
  userAvatar: string | null;
  carBrand: string;
  carModel: string;
  repairType: string;
  rating: number;
  description: string;
  createdAt: string;
  workshopReply: string | null;
}

interface Ad {
  id: string;
  title: string;
  description: string;
  images: string[];
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  isActive: boolean;
}

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'edit', label: 'تعديل الورشة', icon: Settings },
  { id: 'services', label: 'الخدمات', icon: Wrench },
  { id: 'brands', label: 'الماركات', icon: Car },
  { id: 'prices', label: 'الأسعار', icon: DollarSign },
  { id: 'appointments', label: 'المواعيد', icon: Calendar },
  { id: 'reviews', label: 'التقييمات', icon: Star },
  { id: 'create-ad', label: 'إنشاء إعلان', icon: Megaphone },
  { id: 'ads', label: 'إعلاناتي', icon: FileText },
  { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'قيد الانتظار', color: 'text-yellow-400 bg-yellow-400/10' },
  CONFIRMED: { label: 'مؤكد', color: 'text-blue-400 bg-blue-400/10' },
  COMPLETED: { label: 'مكتمل', color: 'text-green-400 bg-green-400/10' },
  CANCELLED: { label: 'ملغي', color: 'text-red-400 bg-red-400/10' },
  APPROVED: { label: 'مقبول', color: 'text-green-400 bg-green-400/10' },
  REJECTED: { label: 'مرفوض', color: 'text-red-400 bg-red-400/10' },
  EXPIRED: { label: 'منتهي', color: 'text-gray-400 bg-gray-400/10' },
};

export default function WorkshopDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [workshopId, setWorkshopId] = useState('');

  const [stats, setStats] = useState<WorkshopStats>({ views: 0, messages: 0, appointments: 0, calls: 0, carsFixed: 0, rating: 0, reviewCount: 0 });
  const [workshopInfo, setWorkshopInfo] = useState<WorkshopInfo>({
    id: '', name: '', logo: null, coverImage: null, description: '', phone: '', whatsapp: '',
    email: '', website: '', address: '', provinceId: '', cityId: '', workingHours: '', workingDays: '',
  });
  const [services, setServices] = useState<Service[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newPrice, setNewPrice] = useState({ serviceName: '', price: '', note: '' });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [adForm, setAdForm] = useState({ title: '', description: '', startDate: '', endDate: '', images: [] as File[] });
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, infoRes, servicesRes, brandsRes, pricesRes, apptRes, reviewsRes, adsRes] = await Promise.all([
        fetch('/api/workshops/dashboard/stats').then(r => r.json()),
        fetch('/api/workshops/dashboard/info').then(r => r.json()),
        fetch('/api/workshops/dashboard/services').then(r => r.json()),
        fetch('/api/workshops/dashboard/brands').then(r => r.json()),
        fetch('/api/workshops/dashboard/prices').then(r => r.json()),
        fetch('/api/workshops/dashboard/appointments').then(r => r.json()),
        fetch('/api/workshops/dashboard/reviews').then(r => r.json()),
        fetch('/api/workshops/dashboard/ads').then(r => r.json()),
      ]);
      setStats(statsRes.data || stats);
      setWorkshopInfo(infoRes.data || workshopInfo);
      setWorkshopId(infoRes.data?.id || '');
      setServices(servicesRes.data || []);
      setBrands(brandsRes.data || []);
      setPrices(pricesRes.data || []);
      setAppointments(apptRes.data || []);
      setReviews(reviewsRes.data || []);
      setAds(adsRes.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const saveWorkshopInfo = async () => {
    setSaving(true);
    try {
      await fetch('/api/workshops/dashboard/info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workshopInfo),
      });
    } catch {}
    setSaving(false);
  };

  const addService = async () => {
    if (!newServiceName.trim()) return;
    try {
      await fetch('/api/workshops/dashboard/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameAr: newServiceName }),
      });
      setNewServiceName('');
      loadAll();
    } catch {}
  };

  const deleteService = async (id: string) => {
    try {
      await fetch(`/api/workshops/dashboard/services/${id}`, { method: 'DELETE' });
      loadAll();
    } catch {}
  };

  const addBrand = async () => {
    if (!newBrandName.trim()) return;
    try {
      await fetch('/api/workshops/dashboard/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameAr: newBrandName }),
      });
      setNewBrandName('');
      loadAll();
    } catch {}
  };

  const deleteBrand = async (id: string) => {
    try {
      await fetch(`/api/workshops/dashboard/brands/${id}`, { method: 'DELETE' });
      loadAll();
    } catch {}
  };

  const addPrice = async () => {
    if (!newPrice.serviceName.trim() || !newPrice.price) return;
    try {
      await fetch('/api/workshops/dashboard/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPrice, price: Number(newPrice.price) }),
      });
      setNewPrice({ serviceName: '', price: '', note: '' });
      loadAll();
    } catch {}
  };

  const deletePrice = async (id: string) => {
    try {
      await fetch(`/api/workshops/dashboard/prices/${id}`, { method: 'DELETE' });
      loadAll();
    } catch {}
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/workshops/dashboard/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      loadAll();
    } catch {}
  };

  const submitReply = async (reviewId: string) => {
    try {
      await fetch(`/api/workshops/dashboard/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      });
      setReplyingTo(null);
      setReplyText('');
      loadAll();
    } catch {}
  };

  const createAd = async () => {
    const formData = new FormData();
    formData.append('title', adForm.title);
    formData.append('description', adForm.description);
    formData.append('startDate', adForm.startDate);
    formData.append('endDate', adForm.endDate);
    adForm.images.forEach(f => formData.append('images', f));
    try {
      await fetch('/api/workshops/dashboard/ads', { method: 'POST', body: formData });
      setAdForm({ title: '', description: '', startDate: '', endDate: '', images: [] });
      setActiveTab('ads');
      loadAll();
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a2e' }}>
        <Loader2 className="w-10 h-10 animate-spin text-[#0084ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#1a1a2e' }}>
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <h1 className="text-2xl font-bold text-white mb-6">لوحة التحكم</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="rounded-xl border border-gray-700 bg-[#16213e] p-3 space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#0084ff] text-white'
                        : 'text-gray-400 hover:bg-[#0f3460] hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { label: 'المشاهدات', value: stats.views, icon: Eye, color: 'text-blue-400' },
                  { label: 'الرسائل', value: stats.messages, icon: MessageCircle, color: 'text-green-400' },
                  { label: 'المواعيد', value: stats.appointments, icon: Calendar, color: 'text-purple-400' },
                  { label: 'المكالمات', value: stats.calls, icon: Phone, color: 'text-yellow-400' },
                  { label: 'السيارات المصليحة', value: stats.carsFixed, icon: Car, color: 'text-cyan-400' },
                  { label: 'التقييم', value: stats.rating, icon: Star, color: 'text-yellow-400' },
                  { label: 'عدد التقييمات', value: stats.reviewCount, icon: Users, color: 'text-pink-400' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl border border-gray-700 bg-[#16213e] p-5"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-[#0f3460] flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">{item.value}</p>
                      <p className="text-gray-400 text-sm mt-1">{item.label}</p>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Edit Workshop */}
            {activeTab === 'edit' && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-6">تعديل معلومات الورشة</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">اسم الورشة</label>
                      <input type="text" value={workshopInfo.name} onChange={(e) => setWorkshopInfo({ ...workshopInfo, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">الهاتف</label>
                      <input type="text" value={workshopInfo.phone} onChange={(e) => setWorkshopInfo({ ...workshopInfo, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">واتساب</label>
                      <input type="text" value={workshopInfo.whatsapp} onChange={(e) => setWorkshopInfo({ ...workshopInfo, whatsapp: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">البريد الإلكتروني</label>
                      <input type="email" value={workshopInfo.email} onChange={(e) => setWorkshopInfo({ ...workshopInfo, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">الموقع الإلكتروني</label>
                      <input type="url" value={workshopInfo.website} onChange={(e) => setWorkshopInfo({ ...workshopInfo, website: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">العنوان</label>
                      <input type="text" value={workshopInfo.address} onChange={(e) => setWorkshopInfo({ ...workshopInfo, address: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">الوصف</label>
                    <textarea value={workshopInfo.description} onChange={(e) => setWorkshopInfo({ ...workshopInfo, description: e.target.value })} rows={4}
                      className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">ساعات العمل</label>
                      <input type="text" value={workshopInfo.workingHours} onChange={(e) => setWorkshopInfo({ ...workshopInfo, workingHours: e.target.value })}
                        placeholder="مثال: 8:00 ص - 6:00 م"
                        className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">أيام العمل</label>
                      <input type="text" value={workshopInfo.workingDays} onChange={(e) => setWorkshopInfo({ ...workshopInfo, workingDays: e.target.value })}
                        placeholder="مثال: السبت-الخميس"
                        className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">الشعار</label>
                      <label className="flex items-center justify-center gap-2 py-6 border border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-[#0084ff] transition-colors">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-400 text-sm">اختر شعاراً</span>
                        <input type="file" accept="image/*" className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append('file', file);
                            const res = await fetch('/api/upload', { method: 'POST', body: fd });
                            const data = await res.json();
                            if (data.url) setWorkshopInfo({ ...workshopInfo, logo: data.url });
                          }} />
                      </label>
                      {workshopInfo.logo && (
                        <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden">
                          <Image src={workshopInfo.logo} alt="Logo" fill className="object-cover" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">صورة الغلاف</label>
                      <label className="flex items-center justify-center gap-2 py-6 border border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-[#0084ff] transition-colors">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-400 text-sm">اختر صورة غلاف</span>
                        <input type="file" accept="image/*" className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append('file', file);
                            const res = await fetch('/api/upload', { method: 'POST', body: fd });
                            const data = await res.json();
                            if (data.url) setWorkshopInfo({ ...workshopInfo, coverImage: data.url });
                          }} />
                      </label>
                      {workshopInfo.coverImage && (
                        <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden">
                          <Image src={workshopInfo.coverImage} alt="Cover" fill className="object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={saveWorkshopInfo} disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#0084ff] text-white rounded-lg text-sm font-medium hover:bg-[#006cd9] disabled:opacity-50 transition-colors">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    حفظ التعديلات
                  </button>
                </div>
              </div>
            )}

            {/* Services */}
            {activeTab === 'services' && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-6">إدارة الخدمات</h2>
                <div className="flex gap-3 mb-6">
                  <input type="text" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="اسم الخدمة الجديدة"
                    className="flex-1 px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                    onKeyDown={(e) => e.key === 'Enter' && addService()} />
                  <button onClick={addService}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#0084ff] text-white rounded-lg text-sm hover:bg-[#006cd9] transition-colors">
                    <Plus className="w-4 h-4" /> إضافة
                  </button>
                </div>
                <div className="space-y-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between px-4 py-3 bg-[#0f3460] rounded-lg">
                      <span className="text-white text-sm">{service.nameAr}</span>
                      <button onClick={() => deleteService(service.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {services.length === 0 && <p className="text-gray-500 text-sm text-center py-4">لا توجد خدمات بعد</p>}
                </div>
              </div>
            )}

            {/* Brands */}
            {activeTab === 'brands' && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-6">إدارة الماركات</h2>
                <div className="flex gap-3 mb-6">
                  <input type="text" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="اسم الماركة الجديدة"
                    className="flex-1 px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                    onKeyDown={(e) => e.key === 'Enter' && addBrand()} />
                  <button onClick={addBrand}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#0084ff] text-white rounded-lg text-sm hover:bg-[#006cd9] transition-colors">
                    <Plus className="w-4 h-4" /> إضافة
                  </button>
                </div>
                <div className="space-y-2">
                  {brands.map((brand) => (
                    <div key={brand.id} className="flex items-center justify-between px-4 py-3 bg-[#0f3460] rounded-lg">
                      <div className="flex items-center gap-3">
                        {brand.logo ? (
                          <Image src={brand.logo} alt="" width={32} height={32} className="rounded object-contain" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-[#1a1a2e] flex items-center justify-center">
                            <span className="text-[#0084ff] text-xs font-bold">{brand.nameAr.charAt(0)}</span>
                          </div>
                        )}
                        <span className="text-white text-sm">{brand.nameAr}</span>
                      </div>
                      <button onClick={() => deleteBrand(brand.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {brands.length === 0 && <p className="text-gray-500 text-sm text-center py-4">لا توجد ماركات بعد</p>}
                </div>
              </div>
            )}

            {/* Prices */}
            {activeTab === 'prices' && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-6">إدارة الأسعار</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                  <input type="text" value={newPrice.serviceName} onChange={(e) => setNewPrice({ ...newPrice, serviceName: e.target.value })}
                    placeholder="اسم الخدمة" className="px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                  <input type="number" value={newPrice.price} onChange={(e) => setNewPrice({ ...newPrice, price: e.target.value })}
                    placeholder="السعر" className="px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                  <input type="text" value={newPrice.note} onChange={(e) => setNewPrice({ ...newPrice, note: e.target.value })}
                    placeholder="ملاحظة (اختياري)" className="px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                  <button onClick={addPrice}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0084ff] text-white rounded-lg text-sm hover:bg-[#006cd9] transition-colors">
                    <Plus className="w-4 h-4" /> إضافة
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">الخدمة</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">السعر</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">ملاحظة</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prices.map((price) => (
                        <tr key={price.id} className="border-b border-gray-700/50 hover:bg-[#0f3460]/50">
                          <td className="py-3 px-4 text-white">{price.serviceName}</td>
                          <td className="py-3 px-4 text-green-400">{price.price} د.أ</td>
                          <td className="py-3 px-4 text-gray-400">{price.note || '-'}</td>
                          <td className="py-3 px-4">
                            <button onClick={() => deletePrice(price.id)} className="text-red-400 hover:text-red-300">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {prices.length === 0 && <p className="text-gray-500 text-sm text-center py-4">لا توجد أسعار بعد</p>}
                </div>
              </div>
            )}

            {/* Appointments */}
            {activeTab === 'appointments' && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-6">المواعيد</h2>
                <div className="space-y-3">
                  {appointments.map((appt) => {
                    const statusInfo = STATUS_MAP[appt.status] || STATUS_MAP.PENDING;
                    return (
                      <div key={appt.id} className="px-4 py-4 bg-[#0f3460] rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-white font-medium">{appt.userName}</span>
                            <span className="text-gray-400 text-sm mr-3" dir="ltr">{appt.userPhone}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                          <span>{appt.service}</span>
                          <span>{appt.date} {appt.time}</span>
                        </div>
                        {appt.description && <p className="text-gray-300 text-sm">{appt.description}</p>}
                        {appt.status === 'PENDING' && (
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => updateAppointmentStatus(appt.id, 'CONFIRMED')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30 transition-colors">
                              <Check className="w-3 h-3" /> تأكيد
                            </button>
                            <button onClick={() => updateAppointmentStatus(appt.id, 'COMPLETED')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30 transition-colors">
                              <Check className="w-3 h-3" /> إكمال
                            </button>
                            <button onClick={() => updateAppointmentStatus(appt.id, 'CANCELLED')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-colors">
                              <X className="w-3 h-3" /> إلغاء
                            </button>
                          </div>
                        )}
                        {appt.status === 'CONFIRMED' && (
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => updateAppointmentStatus(appt.id, 'COMPLETED')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30 transition-colors">
                              <Check className="w-3 h-3" /> إكمال
                            </button>
                            <button onClick={() => updateAppointmentStatus(appt.id, 'CANCELLED')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-colors">
                              <X className="w-3 h-3" /> إلغاء
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {appointments.length === 0 && <p className="text-gray-500 text-sm text-center py-4">لا توجد مواعيد</p>}
                </div>
              </div>
            )}

            {/* Reviews */}
            {activeTab === 'reviews' && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-6">التقييمات</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="px-4 py-4 bg-[#0f3460] rounded-lg">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-[#1a1a2e] flex items-center justify-center shrink-0">
                          {review.userAvatar ? (
                            <Image src={review.userAvatar} alt="" width={40} height={40} className="rounded-full object-cover" />
                          ) : (
                            <span className="text-[#0084ff] font-bold text-sm">{review.userName.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium">{review.userName}</span>
                            <span className="text-gray-500 text-xs">{new Date(review.createdAt).toLocaleDateString('ar-JO')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>{review.carBrand} {review.carModel}</span>
                            <span>•</span>
                            <span>{review.repairType}</span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{review.description}</p>
                      {review.workshopReply && (
                        <div className="bg-[#1a1a2e] rounded-lg p-3 mr-6">
                          <p className="text-xs text-[#0084ff] mb-1 font-medium">ردك:</p>
                          <p className="text-gray-300 text-sm">{review.workshopReply}</p>
                        </div>
                      )}
                      {!review.workshopReply && (
                        <div className="mt-2">
                          {replyingTo === review.id ? (
                            <div className="flex gap-2">
                              <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                placeholder="اكتب ردك..."
                                className="flex-1 px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                              <button onClick={() => submitReply(review.id)} className="px-3 py-2 bg-[#0084ff] text-white rounded-lg text-xs">إرسال</button>
                              <button onClick={() => setReplyingTo(null)} className="px-3 py-2 border border-gray-700 text-gray-400 rounded-lg text-xs">إلغاء</button>
                            </div>
                          ) : (
                            <button onClick={() => { setReplyingTo(review.id); setReplyText(''); }}
                              className="text-[#0084ff] text-sm hover:underline">رد على التقييم</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {reviews.length === 0 && <p className="text-gray-500 text-sm text-center py-4">لا توجد تقييمات بعد</p>}
                </div>
              </div>
            )}

            {/* Create Ad */}
            {activeTab === 'create-ad' && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-6">إنشاء إعلان جديد</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">العنوان</label>
                    <input type="text" value={adForm.title} onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">الوصف</label>
                    <textarea value={adForm.description} onChange={(e) => setAdForm({ ...adForm, description: e.target.value })} rows={4}
                      className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">تاريخ البداية</label>
                      <input type="date" value={adForm.startDate} onChange={(e) => setAdForm({ ...adForm, startDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">تاريخ النهاية</label>
                      <input type="date" value={adForm.endDate} onChange={(e) => setAdForm({ ...adForm, endDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">الصور</label>
                    <label className="flex items-center justify-center gap-2 py-8 border border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-[#0084ff] transition-colors">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-gray-400 text-sm">اختر الصور</span>
                      <input type="file" multiple accept="image/*" className="hidden"
                        onChange={(e) => setAdForm({ ...adForm, images: Array.from(e.target.files || []) })} />
                    </label>
                    {adForm.images.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-3">
                        {adForm.images.map((file, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden">
                            <Image src={URL.createObjectURL(file)} alt="" fill className="object-cover" />
                            <button onClick={() => setAdForm({ ...adForm, images: adForm.images.filter((_, j) => j !== i) })}
                              className="absolute top-1 left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={createAd}
                    className="px-6 py-2.5 bg-[#0084ff] text-white rounded-lg text-sm font-medium hover:bg-[#006cd9] transition-colors">
                    نشر الإعلان
                  </button>
                </div>
              </div>
            )}

            {/* Ads List */}
            {activeTab === 'ads' && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-6">إعلاناتي</h2>
                <div className="space-y-3">
                  {ads.map((ad) => {
                    const statusInfo = STATUS_MAP[ad.status] || STATUS_MAP.PENDING;
                    return (
                      <div key={ad.id} className="flex items-start gap-4 px-4 py-4 bg-[#0f3460] rounded-lg">
                        {ad.images.length > 0 && (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                            <Image src={ad.images[0]} alt="" fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-white font-medium">{ad.title}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-2">{ad.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{new Date(ad.startDate).toLocaleDateString('ar-JO')} - {new Date(ad.endDate).toLocaleDateString('ar-JO')}</span>
                            {ad.isActive ? (
                              <span className="text-green-400">نشط</span>
                            ) : (
                              <span className="text-gray-500">غير نشط</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {ads.length === 0 && <p className="text-gray-500 text-sm text-center py-4">لا توجد إعلانات بعد</p>}
                </div>
              </div>
            )}

            {/* Stats */}
            {activeTab === 'stats' && (
              <div className="rounded-xl border border-gray-700 bg-[#16213e] p-6">
                <h2 className="text-lg font-semibold text-white mb-6">الإحصائيات</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'المشاهدات', value: stats.views, change: '+12%' },
                    { label: 'الرسائل', value: stats.messages, change: '+5%' },
                    { label: 'المواعيد', value: stats.appointments, change: '+8%' },
                    { label: 'المكالمات', value: stats.calls, change: '+3%' },
                    { label: 'السيارات المصليحة', value: stats.carsFixed, change: '+15%' },
                    { label: 'التقييم', value: stats.rating, change: '' },
                  ].map((item, i) => (
                    <div key={i} className="px-4 py-4 bg-[#0f3460] rounded-lg">
                      <p className="text-gray-400 text-sm mb-1">{item.label}</p>
                      <div className="flex items-end gap-2">
                        <p className="text-2xl font-bold text-white">{item.value}</p>
                        {item.change && <span className="text-green-400 text-xs mb-1">{item.change}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">ملخص النشاط</h3>
                  {[
                    { label: 'Views trend', data: [30, 45, 60, 55, 80, 70, 90, 85, 95, 100, 110, 120] },
                  ].map((chart, ci) => (
                    <div key={ci} className="flex items-end gap-1 h-32">
                      {chart.data.map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-[#0084ff] rounded-t transition-all hover:bg-[#006cd9]"
                            style={{ height: `${(val / 120) * 100}%` }}
                          />
                          <span className="text-[10px] text-gray-500">{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
