'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  CreditCard, Loader2, Search, ChevronLeft, ChevronRight, Power, Trash2,
  Clock, CheckCircle, Ban, AlertTriangle, X, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SubscriptionEntry {
  id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  price: number;
  userId: string;
  user: { id: string; name: string; email: string; image: string | null } | null;
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  CANCELLED: 'ملغي',
  SUSPENDED: 'معلق',
  EXPIRED: 'منتهي',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'text-green-600 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20',
  CANCELLED: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  SUSPENDED: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  EXPIRED: 'text-gray-500 bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20',
};

const statusIcons: Record<string, typeof CheckCircle> = {
  ACTIVE: CheckCircle,
  CANCELLED: Ban,
  SUSPENDED: AlertTriangle,
  EXPIRED: Clock,
};

export default function AdminSubscriptionsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<SubscriptionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); }
  }, [isAuthenticated, user, router]);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (searchQuery) params.set('search', searchQuery);
      if (filterStatus) params.set('status', filterStatus);
      if (filterPlan) params.set('plan', filterPlan);

      const res = await fetch(`/api/admin/subscriptions?${params}`);
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.data.subscriptions);
        setTotalPages(data.data.pagination.totalPages);
        setTotal(data.data.pagination.total);
      }
    } catch {}
    setLoading(false);
  }, [page, searchQuery, filterStatus, filterPlan]);

  useEffect(() => { loadSubscriptions(); }, [loadSubscriptions]);

  const handleSearch = () => { setPage(1); setSearchQuery(searchInput); };

  const handleToggleStatus = async (sub: SubscriptionEntry) => {
    const newStatus = sub.status === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE';
    const label = newStatus === 'CANCELLED' ? 'تعطيل' : 'تفعيل';
    if (!confirm(`هل أنت متأكد من ${label} اشتراك هذا المستخدم؟`)) return;

    try {
      const res = await fetch(`/api/admin/subscriptions/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`تم ${label} الاشتراك بنجاح`);
        loadSubscriptions();
      } else {
        toast.error(`فشل ${label} الاشتراك`);
      }
    } catch { toast.error('حدث خطأ'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاشتراك نهائياً؟')) return;
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('تم حذف الاشتراك'); loadSubscriptions(); }
      else { toast.error('فشل الحذف'); }
    } catch { toast.error('حدث خطأ'); }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('ar-JO', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDaysRemaining = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return `منتهي منذ ${Math.abs(days)} يوم`;
    if (days === 0) return 'ينتهي اليوم';
    return `${days} يوم متبقي`;
  };

  const hasActiveFilters = searchQuery || filterStatus || filterPlan;

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الاشتراكات</h1>
              <p className="text-sm text-gray-500">{total.toLocaleString('ar-JO')} اشتراك مسجل</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors"
            >
              بحث
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-rose-500"
            >
              <option value="">كل الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="CANCELLED">ملغي</option>
              <option value="SUSPENDED">معلق</option>
              <option value="EXPIRED">منتهي</option>
            </select>

            <select
              value={filterPlan}
              onChange={e => { setFilterPlan(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-rose-500"
            >
              <option value="">كل الباقات</option>
              <option value="BASIC">الأساسية</option>
              <option value="SILVER">الفضية</option>
              <option value="GOLD">الذهبية</option>
              <option value="PLATINUM">البلاتينية</option>
              <option value="VIP">VIP</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={() => { setSearchInput(''); setSearchQuery(''); setFilterStatus(''); setFilterPlan(''); setPage(1); }}
                className="flex items-center gap-1 px-3 py-2 text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <X className="w-3 h-3" />
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg mb-1">لا توجد اشتراكات حالياً</p>
            <p className="text-sm text-gray-400">سيظهر هنا كل الاشتراكات المسجلة من المستخدمين</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {subscriptions.map(sub => {
                const StatusIcon = statusIcons[sub.status] || Clock;
                const isExpired = new Date(sub.endDate) < new Date();
                const displayStatus = isExpired && sub.status === 'ACTIVE' ? 'EXPIRED' : sub.status;
                const colorClass = statusColors[displayStatus] || statusColors.EXPIRED;

                return (
                  <div key={sub.id} className={`card p-4 hover:shadow-md transition-shadow ${sub.status === 'CANCELLED' ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-4">
                      {/* User Avatar */}
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {sub.user?.image ? (
                          <img src={sub.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          sub.user?.name?.charAt(0) || '?'
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">
                            {sub.user?.name || 'مستخدم محذوف'}
                          </span>
                          <span className="text-xs text-gray-400">{sub.user?.email}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusLabels[displayStatus] || displayStatus}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                            {sub.plan}
                          </span>
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                            {sub.price.toLocaleString('ar-JO')} د.أ
                          </span>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="hidden sm:block text-center px-4">
                        <p className="text-[10px] text-gray-400 mb-0.5">من</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{formatDate(sub.startDate)}</p>
                        <p className="text-[10px] text-gray-400 mt-1 mb-0.5">إلى</p>
                        <p className={`text-xs ${isExpired ? 'text-red-500 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                          {formatDate(sub.endDate)}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${isExpired ? 'text-red-400' : 'text-gray-400'}`}>
                          {getDaysRemaining(sub.endDate)}
                        </p>
                      </div>

                      {/* Auto Renew */}
                      <div className="hidden md:block text-center px-3">
                        <p className="text-[10px] text-gray-400 mb-1">تجديد تلقائي</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          sub.autoRenew ? 'bg-green-50 dark:bg-green-500/10 text-green-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}>
                          {sub.autoRenew ? 'مفعّل' : 'معطّل'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleStatus(sub)}
                          className={`p-2 rounded-xl transition-colors ${
                            sub.status === 'ACTIVE'
                              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                              : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10'
                          }`}
                          title={sub.status === 'ACTIVE' ? 'تعطيل' : 'تفعيل'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                    const p = start + i;
                    if (p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          p === page
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
