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
  Star,
  MapPin,
  AlertTriangle,
  Flag,
  FileText,
  Store,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type AdminTab = 'all' | 'pending-verify' | 'banned' | 'paused';

interface AdminWorkshop {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  rating: number;
  reviewCount: number;
  viewCount: number;
  appointmentCount: number;
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
  brands: { id: string; brand: string }[];
  _count: { reviews: number; appointments: number };
}

export default function AdminWorkshopsPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [workshops, setWorkshops] = useState<AdminWorkshop[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [banModal, setBanModal] = useState<string | null>(null);
  const [banForm, setBanForm] = useState({ reason: '', duration: '' });
  const [pauseModal, setPauseModal] = useState<string | null>(null);
  const [pauseForm, setPauseForm] = useState({ reason: '', untilDate: '' });
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  const fetchWorkshops = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.set('search', search);
      if (activeTab === 'pending-verify') params.set('status', 'unverified');
      else if (activeTab === 'banned') params.set('status', 'banned');
      else if (activeTab === 'paused') params.set('status', 'paused');

      const res = await fetch(`/api/admin/workshops?${params}`);
      const data = await res.json();
      if (data.success) {
        setWorkshops(data.data.workshops);
        setPagination(data.data.pagination);
      }
    } catch {}
    setLoading(false);
  }, [search, activeTab]);

  useEffect(() => { fetchWorkshops(1); }, [fetchWorkshops]);

  const updateWorkshop = async (workshopId: string, updateData: Record<string, any>) => {
    setActionLoading(workshopId);
    try {
      const res = await fetch('/api/admin/workshops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workshopId, ...updateData }),
      });
      if (res.ok) fetchWorkshops(pagination.page);
    } catch {}
    setActionLoading(null);
    setBanModal(null);
    setPauseModal(null);
  };

  const deleteWorkshop = async (workshopId: string) => {
    setActionLoading(workshopId);
    try {
      const res = await fetch(`/api/admin/workshops?workshopId=${workshopId}`, { method: 'DELETE' });
      if (res.ok) {
        setWorkshops((prev) => prev.filter((w) => w.id !== workshopId));
        setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
      }
    } catch {}
    setActionLoading(null);
    setDeleteModal(null);
  };

  const filteredWorkshops = workshops;

  return (
    <div className="min-h-screen" style={{ background: '#1a1a2e' }}>
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-7 h-7 text-[#0084ff]" />
          <h1 className="text-2xl font-bold text-white">إدارة الورش</h1>
          <span className="text-sm text-gray-400">({pagination.total} ورشة)</span>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            { id: 'all' as AdminTab, label: 'كل الورش', icon: Store },
            { id: 'pending-verify' as AdminTab, label: 'بانتظار التوثيق', icon: Clock },
            { id: 'banned' as AdminTab, label: 'محظورة', icon: Ban },
            { id: 'paused' as AdminTab, label: 'موقفة', icon: Pause },
          ]).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(''); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
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

        {/* Search */}
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

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#0084ff]" />
          </div>
        ) : filteredWorkshops.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">لا توجد ورش</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filteredWorkshops.map((workshop) => (
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
                          <img src={workshop.logo} alt="" className="w-full h-full object-cover" />
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
                          <span>{workshop.services.length} خدمة</span>
                          {workshop.address && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {workshop.address}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm mt-1">
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-3.5 h-3.5 fill-yellow-400" />
                            <span>{workshop.rating.toFixed(1)}</span>
                            <span className="text-gray-500">({workshop._count.reviews})</span>
                          </div>
                          <span className="text-gray-500 text-xs">
                            منذ {new Date(workshop.createdAt).toLocaleDateString('ar-JO')}
                          </span>
                        </div>
                        {(workshop.banReason || workshop.pauseReason) && (
                          <div className="mt-2 text-xs">
                            {workshop.banReason && (
                              <p className="text-red-400">سبب الحظر: {workshop.banReason}
                                {workshop.banUntil && ` (حتى ${new Date(workshop.banUntil).toLocaleDateString('ar-JO')})`}
                              </p>
                            )}
                            {workshop.pauseReason && (
                              <p className="text-yellow-400">سبب الإيقاف: {workshop.pauseReason}
                                {workshop.pausedUntil && ` (حتى ${new Date(workshop.pausedUntil).toLocaleDateString('ar-JO')})`}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {actionLoading === workshop.id ? (
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
                              <CheckCircle className="w-5 h-5" />
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
                              onClick={() => setDeleteModal(workshop.id)}
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => fetchWorkshops(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-lg bg-[#16213e] text-gray-400 hover:text-white border border-gray-700 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-400">
                  صفحة {pagination.page} من {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchWorkshops(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-lg bg-[#16213e] text-gray-400 hover:text-white border border-gray-700 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ban Modal */}
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
                    <option value="">حظر دائم</option>
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
                      if (banForm.duration) {
                        const until = new Date();
                        until.setDate(until.getDate() + parseInt(banForm.duration));
                        banData.banUntil = until.toISOString();
                      }
                      updateWorkshop(banModal, banData);
                    }}
                    disabled={!banForm.reason.trim() || actionLoading === banModal}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === banModal ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    حظر الورشة
                  </button>
                  <button
                    onClick={() => setBanModal(null)}
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

      {/* Pause Modal */}
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
                    disabled={!pauseForm.reason.trim() || actionLoading === pauseModal}
                    className="flex-1 py-2.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === pauseModal ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    إيقاف الورشة
                  </button>
                  <button
                    onClick={() => setPauseModal(null)}
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

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setDeleteModal(null)}
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
                  onClick={() => deleteModal && deleteWorkshop(deleteModal)}
                  disabled={actionLoading === deleteModal}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === deleteModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  حذف الورشة
                </button>
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
