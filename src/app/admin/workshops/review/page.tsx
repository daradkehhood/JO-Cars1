'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  XCircle,
  Ban,
  Pause,
  Clock,
  Loader2,
  Search,
  Store,
  MapPin,
  Star,
  FileText,
  Flag,
  AlertTriangle,
  X,
  Phone,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type Tab = 'pending' | 'all' | 'ads' | 'reports';
type StatusFilter = 'all' | 'verified' | 'banned' | 'paused';

interface Workshop {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  phone: string;
  address: string | null;
  isVerified: boolean;
  isBanned: boolean;
  isPaused: boolean;
  banReason: string | null;
  banUntil: string | null;
  pauseReason: string | null;
  pausedUntil: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  services: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  _count: { reviews: number; appointments: number };
  province?: { nameAr: string } | null;
  city?: { nameAr: string } | null;
}

interface WorkshopAd {
  id: string;
  title: string;
  description: string;
  images: string[];
  status: string;
  rejectReason: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  workshop: { id: string; name: string };
  owner: { id: string; name: string };
}

interface WorkshopReport {
  id: string;
  type: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  workshop: { id: string; name: string };
  user: { id: string; name: string };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'pending', label: 'ورش بانتظار المراجعة', icon: Clock },
  { id: 'all', label: 'كل الورش', icon: Store },
  { id: 'ads', label: 'إعلانات الورش', icon: FileText },
  { id: 'reports', label: 'البلاغات', icon: Flag },
];

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'verified', label: 'موثقة' },
  { id: 'banned', label: 'محظورة' },
  { id: 'paused', label: 'موقفة' },
];

const BAN_DURATIONS = [
  { value: '1', label: 'يوم واحد' },
  { value: '3', label: '3 أيام' },
  { value: '7', label: 'أسبوع' },
  { value: '30', label: 'شهر' },
  { value: 'permanent', label: 'دائم' },
];

export default function WorkshopReviewPage() {
  const router = useRouter();
  const { user, token, _hydrated } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [pendingWorkshops, setPendingWorkshops] = useState<Workshop[]>([]);
  const [ads, setAds] = useState<WorkshopAd[]>([]);
  const [reports, setReports] = useState<WorkshopReport[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [verifyModal, setVerifyModal] = useState<Workshop | null>(null);
  const [rejectModal, setRejectModal] = useState<Workshop | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [banModal, setBanModal] = useState<Workshop | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('permanent');
  const [adRejectModal, setAdRejectModal] = useState<WorkshopAd | null>(null);
  const [adRejectReason, setAdRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (_hydrated && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, _hydrated, router]);

  const fetchWorkshops = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/workshops?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWorkshops(data.data.workshops || []);
        setPendingWorkshops((data.data.workshops || []).filter((w: Workshop) => !w.isVerified));
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotal(data.data.pagination?.total || 0);
      }
    } catch { }
    setLoading(false);
  }, [token, page, search, statusFilter]);

  const fetchAds = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', status: 'pending' });
      const res = await fetch(`/api/admin/workshops/ads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAds(data.data.ads || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotal(data.data.pagination?.total || 0);
      }
    } catch { }
    setLoading(false);
  }, [token, page]);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', status: 'pending' });
      const res = await fetch(`/api/admin/workshops/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setReports(data.data.reports || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotal(data.data.pagination?.total || 0);
      }
    } catch { }
    setLoading(false);
  }, [token, page]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, statusFilter, search]);

  useEffect(() => {
    if (!_hydrated || !user || user.role !== 'ADMIN') return;
    if (activeTab === 'pending' || activeTab === 'all') fetchWorkshops();
    else if (activeTab === 'ads') fetchAds();
    else if (activeTab === 'reports') fetchReports();
  }, [activeTab, fetchWorkshops, fetchAds, fetchReports, _hydrated, user]);

  const verifyWorkshop = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/workshops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workshopId: id, isVerified: true }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم توثيق الورشة بنجاح');
        setVerifyModal(null);
        fetchWorkshops();
      } else {
        showToast(data.error || 'فشل التوثيق', 'error');
      }
    } catch {
      showToast('حدث خطأ أثناء التوثيق', 'error');
    }
    setActionLoading(null);
  };

  const rejectWorkshop = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/workshops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workshopId: id, isBanned: true, banReason: rejectReason || 'تم رفض الورشة' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم رفض الورشة');
        setRejectModal(null);
        setRejectReason('');
        fetchWorkshops();
      } else {
        showToast(data.error || 'فشل الرفض', 'error');
      }
    } catch {
      showToast('حدث خطأ أثناء الرفض', 'error');
    }
    setActionLoading(null);
  };

  const banWorkshop = async (id: string) => {
    setActionLoading(id);
    try {
      const body: any = { workshopId: id, isBanned: true, banReason };
      if (banDuration !== 'permanent') {
        const days = parseInt(banDuration);
        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + days);
        body.banUntil = banUntil.toISOString();
      }
      const res = await fetch('/api/admin/workshops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم حظر الورشة بنجاح');
        setBanModal(null);
        setBanReason('');
        setBanDuration('permanent');
        fetchWorkshops();
      } else {
        showToast(data.error || 'فشل الحظر', 'error');
      }
    } catch {
      showToast('حدث خطأ أثناء الحظر', 'error');
    }
    setActionLoading(null);
  };

  const handleAdAction = async (adId: string, status: 'published' | 'rejected', reason?: string) => {
    setActionLoading(adId);
    try {
      const body: any = { adId, status };
      if (status === 'rejected' && reason) body.rejectReason = reason;

      const res = await fetch('/api/admin/workshops/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showToast(status === 'published' ? 'تم نشر الإعلان' : 'تم رفض الإعلان');
        setAdRejectModal(null);
        setAdRejectReason('');
        fetchAds();
      } else {
        showToast(data.error || 'فشل التحديث', 'error');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
    setActionLoading(null);
  };

  const handleReportAction = async (reportId: string, status: string) => {
    setActionLoading(reportId);
    try {
      const res = await fetch('/api/admin/workshops/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reportId, status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(status === 'resolved' ? 'تم حل البلاغ' : 'تم تجاهل البلاغ');
        fetchReports();
      } else {
        showToast(data.error || 'فشل التحديث', 'error');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
    setActionLoading(null);
  };

  const filteredWorkshops = activeTab === 'all' ? workshops : workshops;

  if (!_hydrated || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a2e' }}>
        <Loader2 className="w-10 h-10 animate-spin text-[#0084ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#1a1a2e' }}>
      <div className="container mx-auto px-4 max-w-7xl py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-7 h-7 text-[#0084ff]" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">مراجعة الورش</h1>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.id === 'pending' ? pendingWorkshops.length :
              tab.id === 'ads' ? ads.length :
              tab.id === 'reports' ? reports.length :
              filteredWorkshops.length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#0084ff] text-white'
                    : 'bg-[#16213e] text-gray-400 hover:text-white border border-gray-700 hover:border-[#0084ff]/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.id === 'pending' ? 'قيد المراجعة' : tab.id === 'all' ? 'الكل' : tab.id === 'ads' ? 'إعلانات' : 'بلاغات'}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        {(activeTab === 'pending' || activeTab === 'all') && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن ورشة..."
                className="w-full rounded-xl border border-gray-700 bg-[#16213e] text-white px-4 py-3 pr-12 text-sm outline-none focus:border-[#0084ff] transition-colors"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {activeTab === 'all' && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      statusFilter === f.id
                        ? 'bg-[#0084ff] text-white'
                        : 'bg-[#16213e] text-gray-400 border border-gray-700 hover:border-[#0084ff]/50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#0084ff]" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pending / All Workshops */}
            {(activeTab === 'pending' || activeTab === 'all') && (
              <>
                {filteredWorkshops.length === 0 ? (
                  <div className="text-center py-20">
                    <Store className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">
                      {activeTab === 'pending' ? 'لا توجد ورش بانتظار المراجعة' : 'لا توجد ورش'}
                    </p>
                  </div>
                ) : (
                  filteredWorkshops.map((workshop) => (
                    <motion.div
                      key={workshop.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-gray-700 bg-[#16213e] overflow-hidden"
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0f3460] shrink-0 flex items-center justify-center">
                            {workshop.logo ? (
                              <Image src={workshop.logo} alt="" width={56} height={56} className="object-cover" />
                            ) : (
                              <Store className="w-6 h-6 text-[#0084ff]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="text-white font-semibold text-base">{workshop.name}</h3>
                              {workshop.isVerified && (
                                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-[#0084ff]/20 text-[#0084ff] text-xs rounded-full">
                                  <CheckCircle className="w-3 h-3" /> موثّق
                                </span>
                              )}
                              {workshop.isBanned && (
                                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                                  <Ban className="w-3 h-3" /> محظور
                                </span>
                              )}
                              {workshop.isPaused && (
                                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                  <Pause className="w-3 h-3" /> موقوف
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-2">
                              <span className="flex items-center gap-1">
                                <span className="text-gray-500">المالك:</span> {workshop.user.name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span dir="ltr">{workshop.phone}</span>
                              </span>
                              {(workshop.province || workshop.city) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {workshop.city?.nameAr || ''} {workshop.province?.nameAr || ''}
                                </span>
                              )}
                            </div>

                            {workshop.services.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {workshop.services.map((s) => (
                                  <span key={s.id} className="flex items-center gap-1 px-2 py-0.5 bg-[#0f3460] text-gray-300 text-xs rounded-full">
                                    <Wrench className="w-3 h-3" />
                                    {s.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400" />
                                {workshop._count.reviews} تقييم
                              </span>
                              <span>{workshop._count.appointments} موعد</span>
                              <span>منذ {new Date(workshop.createdAt).toLocaleDateString('ar-JO')}</span>
                            </div>

                            {(workshop.banReason || workshop.pauseReason) && (
                              <div className="mt-2 text-xs">
                                {workshop.banReason && (
                                  <p className="text-red-400">
                                    سبب الحظر: {workshop.banReason}
                                    {workshop.banUntil && ` (حتى ${new Date(workshop.banUntil).toLocaleDateString('ar-JO')})`}
                                  </p>
                                )}
                                {workshop.pauseReason && (
                                  <p className="text-yellow-400">
                                    سبب الإيقاف: {workshop.pauseReason}
                                    {workshop.pausedUntil && ` (حتى ${new Date(workshop.pausedUntil).toLocaleDateString('ar-JO')})`}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            {!workshop.isVerified && (
                              <>
                                <button
                                  onClick={() => setVerifyModal(workshop)}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  توثيق
                                </button>
                                <button
                                  onClick={() => setRejectModal(workshop)}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  رفض
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setBanModal(workshop)}
                              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
                              title="حظر الورشة"
                            >
                              <Ban className="w-4 h-4" />
                              حظر
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </>
            )}

            {/* Ads Tab */}
            {activeTab === 'ads' && (
              <>
                {ads.length === 0 ? (
                  <div className="text-center py-20">
                    <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">لا توجد إعلانات بانتظار المراجعة</p>
                  </div>
                ) : (
                  ads.map((ad) => (
                    <motion.div
                      key={ad.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-gray-700 bg-[#16213e] p-4 sm:p-5"
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        {ad.images.length > 0 && (
                          <div className="relative w-full sm:w-28 h-48 sm:h-28 rounded-lg overflow-hidden shrink-0">
                            <Image src={ad.images[0]} alt="" fill className="object-cover" />
                            {ad.images.length > 1 && (
                              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white flex items-center gap-0.5">
                                <ImageIcon className="w-2.5 h-2.5" />
                                {ad.images.length}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-white font-semibold">{ad.title}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-yellow-400 bg-yellow-400/10">
                              قيد المراجعة
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-1">الورشة: {ad.workshop.name}</p>
                          <p className="text-gray-300 text-sm mb-2 line-clamp-2">{ad.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                            <span>
                              {new Date(ad.startDate).toLocaleDateString('ar-JO')} - {new Date(ad.endDate).toLocaleDateString('ar-JO')}
                            </span>
                          </div>
                          {ad.images.length > 1 && (
                            <div className="flex gap-2 mb-3 overflow-x-auto">
                              {ad.images.slice(1, 6).map((img, i) => (
                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                                  <Image src={img} alt="" fill className="object-cover" />
                                </div>
                              ))}
                              {ad.images.length > 6 && (
                                <div className="w-16 h-16 rounded-lg bg-[#0f3460] flex items-center justify-center shrink-0">
                                  <span className="text-gray-400 text-xs">+{ad.images.length - 6}</span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAdAction(ad.id, 'published')}
                              disabled={actionLoading === ad.id}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === ad.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              نشر
                            </button>
                            <button
                              onClick={() => setAdRejectModal(ad)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              رفض
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <>
                {reports.length === 0 ? (
                  <div className="text-center py-20">
                    <Flag className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">لا توجد بلاغات</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-gray-700 bg-[#16213e] p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold">{report.workshop.name}</h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium text-yellow-400 bg-yellow-400/10">
                              قيد المراجعة
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
                            <span>المبلّغ: {report.user.name}</span>
                            <span className="text-gray-500">النوع: {report.type}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">
                          {new Date(report.createdAt).toLocaleDateString('ar-JO')}
                        </span>
                      </div>
                      <div className="bg-[#0f3460] rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-400 mb-1">
                          السبب: <span className="text-white">{report.reason}</span>
                        </p>
                        {report.description && (
                          <p className="text-gray-300 text-sm">{report.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReportAction(report.id, 'resolved')}
                          disabled={actionLoading === report.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          حل المشكلة
                        </button>
                        <button
                          onClick={() => handleReportAction(report.id, 'dismissed')}
                          disabled={actionLoading === report.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg text-sm hover:bg-gray-500/30 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          تجاهل
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-[#16213e] text-gray-400 hover:text-white border border-gray-700 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400 px-3">
              صفحة {page} من {totalPages} ({total} نتيجة)
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-[#16213e] text-gray-400 hover:text-white border border-gray-700 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Verify Modal */}
      <AnimatePresence>
        {verifyModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setVerifyModal(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-gray-700 bg-[#16213e] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  توثيق الورشة
                </h3>
                <button onClick={() => setVerifyModal(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-400 text-sm mb-2">
                هل أنت متأكد من توثيق الورشة <span className="text-white font-medium">{verifyModal.name}</span>؟
              </p>
              <p className="text-gray-500 text-xs mb-6">
                سيتم توثيق الورشة وعرضها للمستخدمين كورشة موثوقة.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => verifyWorkshop(verifyModal.id)}
                  disabled={actionLoading === verifyModal.id}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === verifyModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  تأكيد التوثيق
                </button>
                <button
                  onClick={() => setVerifyModal(null)}
                  className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-gray-700 bg-[#16213e] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  رفض الورشة
                </h3>
                <button onClick={() => setRejectModal(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                رفض ورشة <span className="text-white font-medium">{rejectModal.name}</span>
              </p>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">سبب الرفض</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none"
                  placeholder="أدخل سبب الرفض..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => rejectWorkshop(rejectModal.id)}
                  disabled={actionLoading === rejectModal.id}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === rejectModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  تأكيد الرفض
                </button>
                <button
                  onClick={() => { setRejectModal(null); setRejectReason(''); }}
                  className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ban Modal */}
      <AnimatePresence>
        {banModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setBanModal(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-gray-700 bg-[#16213e] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Ban className="w-5 h-5 text-red-400" />
                  حظر الورشة
                </h3>
                <button onClick={() => setBanModal(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                حظر ورشة <span className="text-white font-medium">{banModal.name}</span>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">سبب الحظر</label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none"
                    placeholder="أدخل سبب الحظر..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">مدة الحظر</label>
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                  >
                    {BAN_DURATIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => banWorkshop(banModal.id)}
                  disabled={actionLoading === banModal.id}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === banModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  حظر الورشة
                </button>
                <button
                  onClick={() => { setBanModal(null); setBanReason(''); setBanDuration('permanent'); }}
                  className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ad Reject Modal */}
      <AnimatePresence>
        {adRejectModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setAdRejectModal(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-gray-700 bg-[#16213e] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  رفض الإعلان
                </h3>
                <button onClick={() => setAdRejectModal(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                رفض إعلان <span className="text-white font-medium">{adRejectModal.title}</span> من ورشة <span className="text-white font-medium">{adRejectModal.workshop.name}</span>
              </p>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">سبب الرفض</label>
                <textarea
                  value={adRejectReason}
                  onChange={(e) => setAdRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none"
                  placeholder="أدخل سبب الرفض..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAdAction(adRejectModal.id, 'rejected', adRejectReason)}
                  disabled={actionLoading === adRejectModal.id || !adRejectReason.trim()}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === adRejectModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  تأكيد الرفض
                </button>
                <button
                  onClick={() => { setAdRejectModal(null); setAdRejectReason(''); }}
                  className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
