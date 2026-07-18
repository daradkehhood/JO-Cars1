'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
  MessageCircle,
  Star,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flag,
  FileText,
  Settings,
  BarChart3,
  Users,
  Store,
  Send,
} from 'lucide-react';

type AdminTab = 'all' | 'pending-verify' | 'banned' | 'paused' | 'ads' | 'reports';

interface AdminWorkshop {
  id: string;
  name: string;
  logo: string | null;
  ownerName: string;
  ownerPhone: string;
  province: { nameAr: string } | null;
  city: { nameAr: string } | null;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isBanned: boolean;
  isPaused: boolean;
  banReason: string | null;
  banExpiresAt: string | null;
  pauseReason: string | null;
  pauseExpiresAt: string | null;
  createdAt: string;
}

interface PendingAd {
  id: string;
  workshopName: string;
  workshopId: string;
  title: string;
  description: string;
  images: string[];
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

interface WorkshopReport {
  id: string;
  workshopName: string;
  workshopId: string;
  reporterName: string;
  reason: string;
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

const ADMIN_TABS: { id: AdminTab; label: string; icon: any }[] = [
  { id: 'all', label: 'كل الورش', icon: Store },
  { id: 'pending-verify', label: 'بانتظار التوثيق', icon: Clock },
  { id: 'banned', label: 'محظورة', icon: Ban },
  { id: 'paused', label: 'موقفة', icon: Pause },
  { id: 'ads', label: 'إعلانات معلقة', icon: FileText },
  { id: 'reports', label: ' البلاغات', icon: Flag },
];

export default function AdminWorkshopsPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [workshops, setWorkshops] = useState<AdminWorkshop[]>([]);
  const [pendingAds, setPendingAds] = useState<PendingAd[]>([]);
  const [reports, setReports] = useState<WorkshopReport[]>([]);

  const [expandedWorkshop, setExpandedWorkshop] = useState<string | null>(null);
  const [banModal, setBanModal] = useState<string | null>(null);
  const [banForm, setBanForm] = useState({ reason: '', duration: '' });
  const [pauseModal, setPauseModal] = useState<string | null>(null);
  const [pauseForm, setPauseForm] = useState({ reason: '', resumeDate: '' });
  const [adRejectModal, setAdRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reportModal, setReportModal] = useState<string | null>(null);
  const [reportAction, setReportAction] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [workshopsRes, adsRes, reportsRes] = await Promise.all([
        fetch('/api/admin/workshops').then(r => r.json()),
        fetch('/api/admin/workshops/ads/pending').then(r => r.json()),
        fetch('/api/admin/workshops/reports').then(r => r.json()),
      ]);
      setWorkshops(workshopsRes.data || []);
      setPendingAds(adsRes.data || []);
      setReports(reportsRes.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleVerify = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/admin/workshops/${id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !current }),
      });
      fetchAll();
    } catch {}
  };

  const banWorkshop = async (id: string) => {
    try {
      await fetch(`/api/admin/workshops/${id}/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banForm),
      });
      setBanModal(null);
      setBanForm({ reason: '', duration: '' });
      fetchAll();
    } catch {}
  };

  const unbanWorkshop = async (id: string) => {
    try {
      await fetch(`/api/admin/workshops/${id}/unban`, { method: 'PUT' });
      fetchAll();
    } catch {}
  };

  const pauseWorkshop = async (id: string) => {
    try {
      await fetch(`/api/admin/workshops/${id}/pause`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pauseForm),
      });
      setPauseModal(null);
      setPauseForm({ reason: '', resumeDate: '' });
      fetchAll();
    } catch {}
  };

  const unpauseWorkshop = async (id: string) => {
    try {
      await fetch(`/api/admin/workshops/${id}/unpause`, { method: 'PUT' });
      fetchAll();
    } catch {}
  };

  const approveAd = async (id: string) => {
    try {
      await fetch(`/api/admin/workshops/ads/${id}/approve`, { method: 'PUT' });
      fetchAll();
    } catch {}
  };

  const rejectAd = async (id: string) => {
    try {
      await fetch(`/api/admin/workshops/ads/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      setAdRejectModal(null);
      setRejectReason('');
      fetchAll();
    } catch {}
  };

  const handleReport = async (id: string) => {
    try {
      await fetch(`/api/admin/workshops/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: reportAction }),
      });
      setReportModal(null);
      fetchAll();
    } catch {}
  };

  const filteredWorkshops = workshops.filter((w) => {
    if (search && !w.name.includes(search) && !w.ownerName.includes(search)) return false;
    if (activeTab === 'pending-verify' && w.isVerified) return false;
    if (activeTab === 'banned' && !w.isBanned) return false;
    if (activeTab === 'paused' && !w.isPaused) return false;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: '#1a1a2e' }}>
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-7 h-7 text-[#0084ff]" />
          <h1 className="text-2xl font-bold text-white">إدارة الورش</h1>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.id === 'all' ? workshops.length
              : tab.id === 'pending-verify' ? workshops.filter(w => !w.isVerified).length
              : tab.id === 'banned' ? workshops.filter(w => w.isBanned).length
              : tab.id === 'paused' ? workshops.filter(w => w.isPaused).length
              : tab.id === 'ads' ? pendingAds.length
              : reports.filter(r => r.status === 'PENDING').length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#0084ff] text-white'
                    : 'bg-[#16213e] text-gray-400 hover:text-white border border-gray-700 hover:border-[#0084ff]/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
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

        {/* Search */}
        {(activeTab === 'all' || activeTab === 'pending-verify' || activeTab === 'banned' || activeTab === 'paused') && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن ورشة..."
                className="w-full rounded-xl border border-gray-700 bg-[#16213e] text-white px-4 py-3 pr-12 text-sm outline-none focus:border-[#0084ff] transition-colors"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#0084ff]" />
          </div>
        ) : (
          <>
            {/* Workshop Tabs Content */}
            {(activeTab === 'all' || activeTab === 'pending-verify' || activeTab === 'banned' || activeTab === 'paused') && (
              <div className="space-y-3">
                {filteredWorkshops.length === 0 ? (
                  <div className="text-center py-20">
                    <Store className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">لا توجد ورش</p>
                  </div>
                ) : (
                  filteredWorkshops.map((workshop) => (
                    <motion.div
                      key={workshop.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
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
                              <span>{workshop.ownerName}</span>
                              <span>•</span>
                              <span dir="ltr">{workshop.ownerPhone}</span>
                              {workshop.province && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {workshop.city?.nameAr || ''} {workshop.province.nameAr}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm mt-1">
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                                <span>{workshop.rating.toFixed(1)}</span>
                                <span className="text-gray-500">({workshop.reviewCount})</span>
                              </div>
                              <span className="text-gray-500 text-xs">
                                منذ {new Date(workshop.createdAt).toLocaleDateString('ar-JO')}
                              </span>
                            </div>
                            {(workshop.banReason || workshop.pauseReason) && (
                              <div className="mt-2 text-xs">
                                {workshop.banReason && (
                                  <p className="text-red-400">سبب الحظر: {workshop.banReason}
                                    {workshop.banExpiresAt && ` (حتى ${new Date(workshop.banExpiresAt).toLocaleDateString('ar-JO')})`}
                                  </p>
                                )}
                                {workshop.pauseReason && (
                                  <p className="text-yellow-400">سبب الإيقاف: {workshop.pauseReason}
                                    {workshop.pauseExpiresAt && ` (حتى ${new Date(workshop.pauseExpiresAt).toLocaleDateString('ar-JO')})`}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Verify Toggle */}
                            <button
                              onClick={() => toggleVerify(workshop.id, workshop.isVerified)}
                              className={`p-2 rounded-lg text-sm transition-colors ${
                                workshop.isVerified
                                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                              }`}
                              title={workshop.isVerified ? 'إلغاء التوثيق' : 'توثيق'}
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            {/* Ban/Unban */}
                            {workshop.isBanned ? (
                              <button
                                onClick={() => unbanWorkshop(workshop.id)}
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
                            {/* Pause/Unpause */}
                            {workshop.isPaused ? (
                              <button
                                onClick={() => unpauseWorkshop(workshop.id)}
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
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Pending Ads Tab */}
            {activeTab === 'ads' && (
              <div className="space-y-3">
                {pendingAds.length === 0 ? (
                  <div className="text-center py-20">
                    <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">لا توجد إعلانات معلقة</p>
                  </div>
                ) : (
                  pendingAds.map((ad) => (
                    <div key={ad.id} className="rounded-xl border border-gray-700 bg-[#16213e] p-5">
                      <div className="flex items-start gap-4">
                        {ad.images.length > 0 && (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                            <Image src={ad.images[0]} alt="" fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-white font-semibold">{ad.title}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-yellow-400 bg-yellow-400/10">
                              قيد المراجعة
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-1">الورشة: {ad.workshopName}</p>
                          <p className="text-gray-300 text-sm mb-2">{ad.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                            <span>{new Date(ad.startDate).toLocaleDateString('ar-JO')} - {new Date(ad.endDate).toLocaleDateString('ar-JO')}</span>
                          </div>
                          {ad.images.length > 1 && (
                            <div className="flex gap-2 mb-3">
                              {ad.images.slice(1, 5).map((img, i) => (
                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                                  <Image src={img} alt="" fill className="object-cover" />
                                </div>
                              ))}
                              {ad.images.length > 5 && (
                                <div className="w-16 h-16 rounded-lg bg-[#0f3460] flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">+{ad.images.length - 5}</span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveAd(ad.id)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              قبول
                            </button>
                            <button
                              onClick={() => setAdRejectModal(ad.id)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              رفض
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <div className="text-center py-20">
                    <Flag className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">لا توجد بلاغات</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="rounded-xl border border-gray-700 bg-[#16213e] p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold">{report.workshopName}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              report.status === 'PENDING' ? 'text-yellow-400 bg-yellow-400/10'
                              : report.status === 'RESOLVED' ? 'text-green-400 bg-green-400/10'
                              : 'text-gray-400 bg-gray-400/10'
                            }`}>
                              {report.status === 'PENDING' ? 'قيد المراجعة' : report.status === 'RESOLVED' ? 'تم الحل' : 'تم الرفض'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">المبلّغ: {report.reporterName}</p>
                        </div>
                        <span className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString('ar-JO')}</span>
                      </div>
                      <div className="bg-[#0f3460] rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-400 mb-1">السبب: <span className="text-white">{report.reason}</span></p>
                        {report.description && <p className="text-gray-300 text-sm">{report.description}</p>}
                      </div>
                      {report.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setReportModal(report.id); setReportAction('RESOLVED'); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            حل المشكلة
                          </button>
                          <button
                            onClick={() => { setReportModal(report.id); setReportAction('DISMISSED'); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg text-sm hover:bg-gray-500/30 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            تجاهل
                          </button>
                        </div>
                      )}
                      {report.resolvedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          تم الحل في {new Date(report.resolvedAt).toLocaleDateString('ar-JO')} بواسطة {report.resolvedBy}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setBanModal(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-xl border border-gray-700 bg-[#16213e] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">حظر الورشة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">سبب الحظر</label>
                <textarea value={banForm.reason} onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })} rows={3}
                  className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none"
                  placeholder="أدخل سبب الحظر..." />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">مدة الحظ (بالأيام،留=fardo=إ leaving=farq)</label>
                <select value={banForm.duration} onChange={(e) => setBanForm({ ...banForm, duration: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]">
                  <option value="">حظر دائم</option>
                  <option value="7">7 أيام</option>
                  <option value="30">30 يوم</option>
                  <option value="90">90 يوم</option>
                  <option value="365">سنة</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => banWorkshop(banModal)}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                  حظر الورشة
                </button>
                <button onClick={() => setBanModal(null)}
                  className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors">
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Pause Modal */}
      {pauseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPauseModal(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-xl border border-gray-700 bg-[#16213e] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">إيقاف الورشة مؤقتاً</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">سبب الإيقاف</label>
                <textarea value={pauseForm.reason} onChange={(e) => setPauseForm({ ...pauseForm, reason: e.target.value })} rows={3}
                  className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none"
                  placeholder="أدخل سبب الإيقاف..." />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">تاريخ استئناف العمل</label>
                <input type="date" value={pauseForm.resumeDate} onChange={(e) => setPauseForm({ ...pauseForm, resumeDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff]" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => pauseWorkshop(pauseModal)}
                  className="flex-1 py-2.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors">
                  إيقاف الورشة
                </button>
                <button onClick={() => setPauseModal(null)}
                  className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors">
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Ad Reject Modal */}
      {adRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setAdRejectModal(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-xl border border-gray-700 bg-[#16213e] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">رفض الإعلان</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">سبب الرفض</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                  className="w-full px-4 py-2.5 bg-[#0f3460] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#0084ff] resize-none"
                  placeholder="أدخل سبب الرفض..." />
              </div>
              <div className="flex gap-2">
                <button onClick={() => rejectAd(adRejectModal)}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                  رفض الإعلان
                </button>
                <button onClick={() => setAdRejectModal(null)}
                  className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors">
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Report Handle Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setReportModal(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-xl border border-gray-700 bg-[#16213e] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              {reportAction === 'RESOLVED' ? 'حل البلاغ' : 'تجاهل البلاغ'}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {reportAction === 'RESOLVED'
                ? 'هل تريد تعليم هذا البلاغ كمحلول؟'
                : 'هل تريد تجاهل هذا البلاغ؟'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleReport(reportModal)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${
                  reportAction === 'RESOLVED' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}>
                تأكيد
              </button>
              <button onClick={() => setReportModal(null)}
                className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors">
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
