'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
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
  Eye,
  EyeOff,
  Star,
  MapPin,
  AlertTriangle,
  Flag,
  FileText,
  Store,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

type MainTab = 'ads' | 'workshops' | 'reports';
type AdStatusTab = 'all' | 'pending' | 'published' | 'rejected';
type WorkshopStatusTab = 'all' | 'verified' | 'unverified' | 'paused' | 'banned';
type ReportStatusTab = 'pending' | 'resolved' | 'dismissed' | 'all';

interface Ad {
  id: string;
  title: string;
  description: string;
  images: string;
  status: string;
  rejectReason: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  reviewedAt: string | null;
  workshop: { id: string; name: string };
  owner: { id: string; name: string };
}

interface Workshop {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  isVerified: boolean;
  isPaused: boolean;
  isBanned: boolean;
  banReason: string | null;
  banUntil: string | null;
  pauseReason: string | null;
  pausedUntil: string | null;
  commercialRegister: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  services: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  _count: { reviews: number; appointments: number };
}

interface WorkshopReport {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  workshop: { id: string; name: string };
  user: { id: string; name: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function WorkshopAdsAdminPage() {
  const { user, token, isAuthenticated, _hydrated } = useAuth();
  const router = useRouter();

  const [mainTab, setMainTab] = useState<MainTab>('ads');
  const [loading, setLoading] = useState(true);

  const [ads, setAds] = useState<Ad[]>([]);
  const [adStatusTab, setAdStatusTab] = useState<AdStatusTab>('pending');
  const [adsPagination, setAdsPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [adActionLoading, setAdActionLoading] = useState<string | null>(null);

  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [workshopStatusTab, setWorkshopStatusTab] = useState<WorkshopStatusTab>('all');
  const [workshopsPagination, setWorkshopsPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [workshopSearch, setWorkshopSearch] = useState('');
  const [workshopActionLoading, setWorkshopActionLoading] = useState<string | null>(null);

  const [reports, setReports] = useState<WorkshopReport[]>([]);
  const [reportStatusTab, setReportStatusTab] = useState<ReportStatusTab>('pending');
  const [reportsPagination, setReportsPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [reportActionLoading, setReportActionLoading] = useState<string | null>(null);

  const [adRejectModal, setAdRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [adDeleteModal, setAdDeleteModal] = useState<string | null>(null);
  const [banModal, setBanModal] = useState<string | null>(null);
  const [banForm, setBanForm] = useState({ reason: '', duration: 'permanent' });
  const [pauseModal, setPauseModal] = useState<string | null>(null);
  const [pauseForm, setPauseForm] = useState({ reason: '', untilDate: '' });
  const [workshopDeleteModal, setWorkshopDeleteModal] = useState<string | null>(null);
  const [expandedImages, setExpandedImages] = useState<string[] | null>(null);

  useEffect(() => {
    if (_hydrated && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.replace('/login');
    }
  }, [_hydrated, isAuthenticated, user, router]);

  const fetchAds = useCallback(async (status: AdStatusTab, page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/workshops/ads?status=${status}&page=${page}&limit=20`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setAds(data.data.ads);
        setAdsPagination(data.data.pagination);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  const fetchWorkshops = useCallback(async (status: WorkshopStatusTab, page = 1, search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status !== 'all') params.set('status', status);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/workshops?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setWorkshops(data.data.workshops);
        setWorkshopsPagination(data.data.pagination);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  const fetchReports = useCallback(async (status: ReportStatusTab, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status !== 'all') params.set('status', status);
      const res = await fetch(`/api/admin/workshops/reports?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setReports(data.data.reports);
        setReportsPagination(data.data.pagination);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!_hydrated || !isAuthenticated || user?.role !== 'ADMIN') return;
    if (mainTab === 'ads') fetchAds(adStatusTab);
    else if (mainTab === 'workshops') fetchWorkshops(workshopStatusTab);
    else fetchReports(reportStatusTab);
  }, [_hydrated, isAuthenticated, user, mainTab, adStatusTab, workshopStatusTab, reportStatusTab, fetchAds, fetchWorkshops, fetchReports]);

  const updateAdStatus = async (adId: string, status: 'published' | 'rejected', rejectReason?: string) => {
    setAdActionLoading(adId);
    try {
      const res = await fetch('/api/admin/workshops/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ adId, status, ...(rejectReason ? { rejectReason } : {}) }),
      });
      const data = await res.json();
      if (data.success) {
        setAds((prev) => prev.filter((a) => a.id !== adId));
        setAdsPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
      }
    } catch {}
    setAdActionLoading(null);
    setAdRejectModal(null);
    setRejectReason('');
  };

  const deleteAd = async (adId: string) => {
    setAdActionLoading(adId);
    try {
      const res = await fetch(`/api/admin/workshops/ads?adId=${adId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setAds((prev) => prev.filter((a) => a.id !== adId));
        setAdsPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
      }
    } catch {}
    setAdActionLoading(null);
    setAdDeleteModal(null);
  };

  const updateWorkshop = async (workshopId: string, updateData: Record<string, any>) => {
    setWorkshopActionLoading(workshopId);
    try {
      const res = await fetch('/api/admin/workshops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ workshopId, ...updateData }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkshops((prev) => prev.map((w) => w.id === workshopId ? { ...w, ...data.data } : w));
      }
    } catch {}
    setWorkshopActionLoading(null);
    setBanModal(null);
    setBanForm({ reason: '', duration: 'permanent' });
    setPauseModal(null);
    setPauseForm({ reason: '', untilDate: '' });
  };

  const deleteWorkshop = async (workshopId: string) => {
    setWorkshopActionLoading(workshopId);
    try {
      const res = await fetch(`/api/admin/workshops?workshopId=${workshopId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setWorkshops((prev) => prev.filter((w) => w.id !== workshopId));
        setWorkshopsPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
      }
    } catch {}
    setWorkshopActionLoading(null);
    setWorkshopDeleteModal(null);
  };

  const updateReport = async (reportId: string, status: string) => {
    setReportActionLoading(reportId);
    try {
      const res = await fetch('/api/admin/workshops/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ reportId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status } : r));
      }
    } catch {}
    setReportActionLoading(null);
  };

  const parseImages = (imagesStr: string): string[] => {
    try {
      const parsed = JSON.parse(imagesStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ar-JO', { year: 'numeric', month: 'short', day: 'numeric' });

  if (!_hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a2e' }}>
        <Loader2 className="w-10 h-10 animate-spin text-[#0084ff]" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen" style={{ background: '#1a1a2e' }}>
      <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-7 h-7 text-[#0084ff]" />
          <h1 className="text-2xl font-bold text-white">إدارة إعلانات الورش</h1>
        </div>

        {/* Main Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            { id: 'ads' as MainTab, label: 'إعلانات الورش', icon: FileText },
            { id: 'workshops' as MainTab, label: 'إدارة الورش', icon: Store },
            { id: 'reports' as MainTab, label: 'بلاغات الورش', icon: Flag },
          ]).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mainTab === tab.id
                    ? 'bg-[#0084ff] text-white'
                    : 'bg-[#16213e] text-gray-400 hover:text-white border border-gray-700 hover:border-[#0084ff]/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ============ ADS TAB ============ */}
        {mainTab === 'ads' && (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {([
                { id: 'all' as AdStatusTab, label: 'الكل', icon: FileText },
                { id: 'pending' as AdStatusTab, label: 'قيد المراجعة', icon: Clock },
                { id: 'published' as AdStatusTab, label: 'منشورة', icon: Eye },
                { id: 'rejected' as AdStatusTab, label: 'مرفوضة', icon: XCircle },
              ]).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAdStatusTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      adStatusTab === tab.id
                        ? 'bg-[#0084ff] text-white'
                        : 'bg-[#16213e] text-gray-400 hover:text-white border border-gray-700 hover:border-[#0084ff]/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === 'pending' && (
                      <span className={`px-1.5 py-0.5 text-xs rounded-full ${adStatusTab === tab.id ? 'bg-white/20' : 'bg-gray-700 text-gray-300'}`}>
                        {adsPagination.total}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => fetchAds(adStatusTab)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white bg-[#16213e] border border-gray-700 hover:border-[#0084ff]/50 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                تحديث
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#0084ff]" />
              </div>
            ) : ads.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">لا توجد إعلانات</p>
                <p className="text-gray-500 text-sm mt-1">
                  {adStatusTab === 'pending' ? 'لا توجد إعلانات بانتظار المراجعة' : adStatusTab === 'published' ? 'لا توجد إعلانات منشورة' : 'لا توجد إعلانات مرفوضة'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ads.map((ad) => {
                  const images = parseImages(ad.images);
                  return (
                    <motion.div
                      key={ad.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-gray-700 bg-[#16213e] overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {images.length > 0 && (
                            <div
                              className="relative w-28 h-28 rounded-xl overflow-hidden shrink-0 cursor-pointer group"
                              onClick={() => setExpandedImages(images)}
                            >
                              <Image src={images[0]} alt="" fill className="object-cover transition-transform group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              {images.length > 1 && (
                                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full">
                                  +{images.length}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h3 className="text-white font-semibold text-lg truncate">{ad.title}</h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                                ad.status === 'pending' ? 'text-yellow-400 bg-yellow-400/10'
                                  : ad.status === 'published' ? 'text-green-400 bg-green-400/10'
                                    : 'text-red-400 bg-red-400/10'
                              }`}>
                                {ad.status === 'pending' ? 'قيد المراجعة' : ad.status === 'published' ? 'منشور' : 'مرفوض'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-1">
                              <Store className="w-3.5 h-3.5 inline ml-1" />
                              {ad.workshop.name}
                            </p>
                            <p className="text-gray-300 text-sm mb-2 line-clamp-2">{ad.description}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(ad.createdAt)}
                              </span>
                              {ad.startDate && ad.endDate && (
                                <span>
                                  من {formatDate(ad.startDate)} إلى {formatDate(ad.endDate)}
                                </span>
                              )}
                              {ad.owner && (
                                <span className="text-gray-500">بواسطة: {ad.owner.name}</span>
                              )}
                            </div>
                            {ad.rejectReason && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-2">
                                <p className="text-red-400 text-xs">
                                  <AlertTriangle className="w-3.5 h-3.5 inline ml-1" />
                                  سبب الرفض: {ad.rejectReason}
                                </p>
                              </div>
                            )}
                            {ad.status === 'pending' && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => updateAdStatus(ad.id, 'published')}
                                  disabled={adActionLoading === ad.id}
                                  className="flex items-center gap-1.5 px-5 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                >
                                  {adActionLoading === ad.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                  قبول
                                </button>
                                <button
                                  onClick={() => setAdRejectModal(ad.id)}
                                  disabled={adActionLoading === ad.id}
                                  className="flex items-center gap-1.5 px-5 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                  رفض
                                </button>
                                <button
                                  onClick={() => setAdDeleteModal(ad.id)}
                                  disabled={adActionLoading === ad.id}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 text-red-500 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50"
                                  title="حذف الإعلان"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            {ad.status !== 'pending' && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => setAdDeleteModal(ad.id)}
                                  disabled={adActionLoading === ad.id}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 text-red-500 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50"
                                  title="حذف الإعلان"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  حذف
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {adsPagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-6">
                <button
                  onClick={() => fetchAds(adStatusTab, adsPagination.page - 1)}
                  disabled={adsPagination.page <= 1}
                  className="p-2 rounded-lg bg-[#16213e] border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="text-gray-400 text-sm">
                  صفحة {adsPagination.page} من {adsPagination.totalPages}
                </span>
                <button
                  onClick={() => fetchAds(adStatusTab, adsPagination.page + 1)}
                  disabled={adsPagination.page >= adsPagination.totalPages}
                  className="p-2 rounded-lg bg-[#16213e] border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ============ WORKSHOPS TAB ============ */}
        {mainTab === 'workshops' && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {([
                { id: 'all' as WorkshopStatusTab, label: 'الكل' },
                { id: 'verified' as WorkshopStatusTab, label: 'موثقة' },
                { id: 'unverified' as WorkshopStatusTab, label: 'غير موثقة' },
                { id: 'paused' as WorkshopStatusTab, label: 'موقفة' },
                { id: 'banned' as WorkshopStatusTab, label: 'محظورة' },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setWorkshopStatusTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    workshopStatusTab === tab.id
                      ? 'bg-[#0084ff] text-white'
                      : 'bg-[#16213e] text-gray-400 hover:text-white border border-gray-700 hover:border-[#0084ff]/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <div className="relative max-w-md">
                <input
                  type="text"
                  value={workshopSearch}
                  onChange={(e) => setWorkshopSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchWorkshops(workshopStatusTab, 1, workshopSearch)}
                  placeholder="ابحث عن ورشة..."
                  className="w-full rounded-xl border border-gray-700 bg-[#16213e] text-white px-4 py-3 pr-12 text-sm outline-none focus:border-[#0084ff] transition-colors"
                />
                <button
                  onClick={() => fetchWorkshops(workshopStatusTab, 1, workshopSearch)}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                >
                  <Search className="w-5 h-5 text-gray-400 hover:text-[#0084ff] transition-colors" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#0084ff]" />
              </div>
            ) : workshops.length === 0 ? (
              <div className="text-center py-20">
                <Store className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">لا توجد ورش</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workshops.map((workshop) => (
                  <motion.div
                    key={workshop.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-gray-700 bg-[#16213e] overflow-hidden"
                  >
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0f3460] shrink-0 flex items-center justify-center">
                          {workshop.logo ? (
                            <Image src={workshop.logo} alt="" width={56} height={56} className="object-cover" />
                          ) : (
                            <Store className="w-6 h-6 text-[#0084ff]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold truncate">{workshop.name}</h3>
                            {workshop.isVerified && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#0084ff]/20 text-[#0084ff] text-xs rounded-full">
                                <CheckCircle className="w-3 h-3" /> موثّق
                              </span>
                            )}
                            {workshop.isBanned && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                                <Ban className="w-3 h-3" /> محظور
                              </span>
                            )}
                            {workshop.isPaused && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                <Pause className="w-3 h-3" /> موقوف
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span>{workshop.user.name}</span>
                            <span>•</span>
                            <span>{workshop.user.email}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>{workshop._count.reviews} تقييم</span>
                            <span>•</span>
                            <span>{workshop._count.appointments} موعد</span>
                            <span>•</span>
                            <span>{formatDate(workshop.createdAt)}</span>
                          </div>
                          {(workshop.banReason || workshop.pauseReason) && (
                            <div className="mt-2 text-xs">
                              {workshop.banReason && (
                                <p className="text-red-400">
                                  سبب الحظر: {workshop.banReason}
                                  {workshop.banUntil && ` (حتى ${formatDate(workshop.banUntil)})`}
                                </p>
                              )}
                              {workshop.pauseReason && (
                                <p className="text-yellow-400">
                                  سبب الإيقاف: {workshop.pauseReason}
                                  {workshop.pausedUntil && ` (حتى ${formatDate(workshop.pausedUntil)})`}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {workshopActionLoading === workshop.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-[#0084ff]" />
                          ) : (
                            <>
                              <button
                                onClick={() => updateWorkshop(workshop.id, { isVerified: !workshop.isVerified })}
                                className={`p-2 rounded-lg text-sm transition-colors ${
                                  workshop.isVerified
                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                }`}
                                title={workshop.isVerified ? 'إلغاء التوثيق' : 'توثيق'}
                              >
                                {workshop.isVerified ? <CheckCircle className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                              </button>
                              {workshop.isBanned ? (
                                <button
                                  onClick={() => updateWorkshop(workshop.id, { isBanned: false, banReason: null, banUntil: null })}
                                  className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm transition-colors"
                                  title="إلغاء الحظر"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setBanModal(workshop.id)}
                                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm transition-colors"
                                  title="حظر"
                                >
                                  <Ban className="w-5 h-5" />
                                </button>
                              )}
                              {workshop.isPaused ? (
                                <button
                                  onClick={() => updateWorkshop(workshop.id, { isPaused: false, pauseReason: null, pausedUntil: null })}
                                  className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm transition-colors"
                                  title="إلغاء الإيقاف"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setPauseModal(workshop.id)}
                                  className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 text-sm transition-colors"
                                  title="إيقاف"
                                >
                                  <Pause className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                onClick={() => setWorkshopDeleteModal(workshop.id)}
                                className="p-2 rounded-lg bg-red-600/20 text-red-500 hover:bg-red-600/30 text-sm transition-colors"
                                title="حذف الورشة"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {workshopsPagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-6">
                <button
                  onClick={() => fetchWorkshops(workshopStatusTab, workshopsPagination.page - 1, workshopSearch)}
                  disabled={workshopsPagination.page <= 1}
                  className="p-2 rounded-lg bg-[#16213e] border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="text-gray-400 text-sm">
                  صفحة {workshopsPagination.page} من {workshopsPagination.totalPages}
                </span>
                <button
                  onClick={() => fetchWorkshops(workshopStatusTab, workshopsPagination.page + 1, workshopSearch)}
                  disabled={workshopsPagination.page >= workshopsPagination.totalPages}
                  className="p-2 rounded-lg bg-[#16213e] border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ============ REPORTS TAB ============ */}
        {mainTab === 'reports' && (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {([
                { id: 'pending' as ReportStatusTab, label: 'قيد المراجعة', icon: Clock },
                { id: 'resolved' as ReportStatusTab, label: 'تم الحل', icon: CheckCircle },
                { id: 'dismissed' as ReportStatusTab, label: 'تم التجاهل', icon: XCircle },
                { id: 'all' as ReportStatusTab, label: 'الكل', icon: Flag },
              ]).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setReportStatusTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      reportStatusTab === tab.id
                        ? 'bg-[#0084ff] text-white'
                        : 'bg-[#16213e] text-gray-400 hover:text-white border border-gray-700 hover:border-[#0084ff]/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#0084ff]" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-20">
                <Flag className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">لا توجد بلاغات</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-gray-700 bg-[#16213e] p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold">{report.workshop.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            report.status === 'pending' ? 'text-yellow-400 bg-yellow-400/10'
                              : report.status === 'resolved' ? 'text-green-400 bg-green-400/10'
                                : 'text-gray-400 bg-gray-400/10'
                          }`}>
                            {report.status === 'pending' ? 'قيد المراجعة' : report.status === 'resolved' ? 'تم الحل' : 'تم التجاهل'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">المبلّغ: {report.user.name}</p>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(report.createdAt)}</span>
                    </div>
                    <div className="bg-[#0f3460] rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-400 mb-1">
                        السبب: <span className="text-white">{report.reason}</span>
                      </p>
                      {report.description && <p className="text-gray-300 text-sm mt-1">{report.description}</p>}
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex gap-2">
                        {reportActionLoading === report.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-[#0084ff]" />
                        ) : (
                          <>
                            <button
                              onClick={() => updateReport(report.id, 'resolved')}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              حل المشكلة
                            </button>
                            <button
                              onClick={() => updateReport(report.id, 'dismissed')}
                              className="flex items-center gap-1.5 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-500/30 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              تجاهل
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {report.reviewedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        تمت المراجعة في {formatDate(report.reviewedAt)}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {reportsPagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-6">
                <button
                  onClick={() => fetchReports(reportStatusTab, reportsPagination.page - 1)}
                  disabled={reportsPagination.page <= 1}
                  className="p-2 rounded-lg bg-[#16213e] border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="text-gray-400 text-sm">
                  صفحة {reportsPagination.page} من {reportsPagination.totalPages}
                </span>
                <button
                  onClick={() => fetchReports(reportStatusTab, reportsPagination.page + 1)}
                  disabled={reportsPagination.page >= reportsPagination.totalPages}
                  className="p-2 rounded-lg bg-[#16213e] border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ============ AD REJECT MODAL ============ */}
      <AnimatePresence>
        {adRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setAdRejectModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-gray-700 bg-[#16213e] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">رفض الإعلان</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">سبب الرفض</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none"
                    placeholder="أدخل سبب رفض الإعلان..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => adRejectModal && rejectReason.trim() && updateAdStatus(adRejectModal, 'rejected', rejectReason)}
                    disabled={!rejectReason.trim() || adActionLoading === adRejectModal}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {adActionLoading === adRejectModal ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    رفض
                  </button>
                  <button
                    onClick={() => { setAdRejectModal(null); setRejectReason(''); }}
                    className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ AD DELETE MODAL ============ */}
      <AnimatePresence>
        {adDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setAdDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-gray-700 bg-[#16213e] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">حذف الإعلان</h3>
              </div>
              <p className="text-gray-400 text-sm mb-6">هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => adDeleteModal && deleteAd(adDeleteModal)}
                  disabled={adActionLoading === adDeleteModal}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {adActionLoading === adDeleteModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  حذف
                </button>
                <button
                  onClick={() => setAdDeleteModal(null)}
                  className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ BAN MODAL ============ */}
      <AnimatePresence>
        {banModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setBanModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-gray-700 bg-[#16213e] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">حظر الورشة</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">سبب الحظر</label>
                  <textarea
                    value={banForm.reason}
                    onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none"
                    placeholder="أدخل سبب الحظر..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">مدة الحظر</label>
                  <select
                    value={banForm.duration}
                    onChange={(e) => setBanForm({ ...banForm, duration: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                  >
                    <option value="permanent">دائم</option>
                    <option value="7">7 أيام</option>
                    <option value="30">30 يوم</option>
                    <option value="90">90 يوم</option>
                    <option value="365">سنة</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!banModal || !banForm.reason.trim()) return;
                      const banData: Record<string, any> = { isBanned: true, banReason: banForm.reason };
                      if (banForm.duration !== 'permanent') {
                        const days = parseInt(banForm.duration);
                        const until = new Date();
                        until.setDate(until.getDate() + days);
                        banData.banUntil = until.toISOString();
                      }
                      updateWorkshop(banModal, banData);
                    }}
                    disabled={!banForm.reason.trim() || workshopActionLoading === banModal}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {workshopActionLoading === banModal ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    حظر الورشة
                  </button>
                  <button
                    onClick={() => { setBanModal(null); setBanForm({ reason: '', duration: 'permanent' }); }}
                    className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ PAUSE MODAL ============ */}
      <AnimatePresence>
        {pauseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setPauseModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-gray-700 bg-[#16213e] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">إيقاف الورشة مؤقتاً</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">سبب الإيقاف</label>
                  <textarea
                    value={pauseForm.reason}
                    onChange={(e) => setPauseForm({ ...pauseForm, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none"
                    placeholder="أدخل سبب الإيقاف..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">إلى تاريخ</label>
                  <input
                    type="date"
                    value={pauseForm.untilDate}
                    onChange={(e) => setPauseForm({ ...pauseForm, untilDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!pauseModal || !pauseForm.reason.trim()) return;
                      const pauseData: Record<string, any> = { isPaused: true, pauseReason: pauseForm.reason };
                      if (pauseForm.untilDate) pauseData.pausedUntil = new Date(pauseForm.untilDate).toISOString();
                      updateWorkshop(pauseModal, pauseData);
                    }}
                    disabled={!pauseForm.reason.trim() || workshopActionLoading === pauseModal}
                    className="flex-1 py-2.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {workshopActionLoading === pauseModal ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    إيقاف الورشة
                  </button>
                  <button
                    onClick={() => { setPauseModal(null); setPauseForm({ reason: '', untilDate: '' }); }}
                    className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ WORKSHOP DELETE MODAL ============ */}
      <AnimatePresence>
        {workshopDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setWorkshopDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-gray-700 bg-[#16213e] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">حذف الورشة</h3>
              </div>
              <p className="text-gray-400 text-sm mb-6">هل أنت متأكد من حذف هذه الورشة؟ سيتم حذف جميع الخدمات والتقييمات والإعلانات المرتبطة بها. لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => workshopDeleteModal && deleteWorkshop(workshopDeleteModal)}
                  disabled={workshopActionLoading === workshopDeleteModal}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {workshopActionLoading === workshopDeleteModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  حذف الورشة
                </button>
                <button
                  onClick={() => setWorkshopDeleteModal(null)}
                  className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ IMAGE GALLERY MODAL ============ */}
      <AnimatePresence>
        {expandedImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setExpandedImages(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-3xl rounded-xl bg-[#16213e] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-2">
                <button onClick={() => setExpandedImages(null)} className="text-gray-400 hover:text-white p-1">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
                {expandedImages.map((img, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden bg-[#0f3460] aspect-video">
                    <Image src={img} alt="" fill className="object-contain" />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
