'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  ClipboardList, Loader2, Search, Filter, ChevronLeft, ChevronRight,
  Calendar, X, User, Car, MessageSquare, LogIn, LogOut, Shield,
  Star, Trash2, Edit3, Bell, Eye, Ban, CheckCircle, Clock
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  description: string | null;
  entityType: string | null;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  ip: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string; role: string; image: string | null };
}

const actionLabels: Record<string, string> = {
  BAN_USER: 'حظر مستخدم',
  UNBAN_USER: 'إلغاء حظر مستخدم',
  DELETE_USER: 'حذف مستخدم',
  UPDATE_USER_ROLE: 'تغيير صلاحية',
  APPROVE_CAR: 'قبول سيارة',
  REJECT_CAR: 'رفض سيارة',
  FEATURE_CAR: 'تمييز سيارة',
  UNFEATURE_CAR: 'إلغاء تمييز',
  UPDATE_CAR_PRICE: 'تعديل سعر',
  UPDATE_CAR: 'تعديل سيارة',
  DELETE_CAR: 'حذف سيارة',
  RESTORE_CAR: 'استعادة سيارة',
  TICKET_CLOSE: 'إغلاق تذكرة',
  TICKET_ASSIGN: 'تعيين تذكرة',
  SYSTEM: 'نظام',
  LOGIN: 'تسجيل دخول',
  LOGOUT: 'تسجيل خروج',
  REGISTER: 'تسجيل حساب جديد',
  PUBLISH_CAR: 'نشر سيارة',
  ADD_COMMENT: 'إضافة تعليق',
  EDIT_COMMENT: 'تعديل تعليق',
  DELETE_COMMENT: 'حذف تعليق',
  LIKE_COMMENT: 'إعجاب بتعليق',
  REPORT: 'إبلاغ',
  UPDATE_PROFILE: 'تعديل الملف الشخصي',
  CHANGE_PASSWORD: 'تغيير كلمة المرور',
  FAVORITE_CAR: 'إضافة للمفضلة',
  UNFAVORITE_CAR: 'إزالة من المفضلة',
  VIEW_CAR: 'عرض سيارة',
  SEARCH: 'بحث',
  SOUND_RECORD: 'تسجيل صوت',
  SOUND_REPORT: 'إبلاغ صوت',
  SOUND_BAN: 'حظر صوتي',
};

const actionIcons: Record<string, typeof LogIn> = {
  LOGIN: LogIn, LOGOUT: LogOut, REGISTER: User, BAN_USER: Ban, UNBAN_USER: CheckCircle,
  DELETE_USER: Trash2, UPDATE_USER_ROLE: Shield, APPROVE_CAR: CheckCircle,
  REJECT_CAR: Ban, FEATURE_CAR: Star, UNFEATURE_CAR: Star,
  UPDATE_CAR_PRICE: Edit3, UPDATE_CAR: Edit3, DELETE_CAR: Trash2, RESTORE_CAR: CheckCircle,
  TICKET_CLOSE: CheckCircle, TICKET_ASSIGN: Bell, SYSTEM: Shield,
  PUBLISH_CAR: Car, ADD_COMMENT: MessageSquare, EDIT_COMMENT: MessageSquare,
  DELETE_COMMENT: Trash2, LIKE_COMMENT: Star, REPORT: Bell,
  UPDATE_PROFILE: Edit3, CHANGE_PASSWORD: Shield, FAVORITE_CAR: Star,
  UNFAVORITE_CAR: Star, VIEW_CAR: Eye, SEARCH: Search,
  SOUND_RECORD: Bell, SOUND_REPORT: Bell, SOUND_BAN: Ban,
};

const actionColors: Record<string, string> = {
  BAN_USER: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  UNBAN_USER: 'text-green-600 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20',
  DELETE_USER: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  UPDATE_USER_ROLE: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
  APPROVE_CAR: 'text-green-600 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20',
  REJECT_CAR: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  FEATURE_CAR: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  UNFEATURE_CAR: 'text-gray-600 bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20',
  UPDATE_CAR_PRICE: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  UPDATE_CAR: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  DELETE_CAR: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  RESTORE_CAR: 'text-green-600 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20',
  TICKET_CLOSE: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20',
  TICKET_ASSIGN: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20',
  SYSTEM: 'text-gray-600 bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20',
  LOGIN: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  LOGOUT: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
  REGISTER: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  PUBLISH_CAR: 'text-teal-600 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20',
  ADD_COMMENT: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20',
  EDIT_COMMENT: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20',
  DELETE_COMMENT: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  LIKE_COMMENT: 'text-pink-600 bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20',
  REPORT: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  UPDATE_PROFILE: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20',
  CHANGE_PASSWORD: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  FAVORITE_CAR: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
  UNFAVORITE_CAR: 'text-gray-600 bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20',
  VIEW_CAR: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20',
  SEARCH: 'text-gray-600 bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20',
  SOUND_RECORD: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  SOUND_REPORT: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  SOUND_BAN: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
};

const entityTypeLabels: Record<string, string> = {
  USER: 'مستخدم',
  CAR: 'سيارة',
  TICKET: 'تذكرة',
  SYSTEM: 'نظام',
  COMMENT: 'تعليق',
  SOUND: 'صوت',
};

const activityCategories = [
  { label: 'الكل', value: '', icon: ClipboardList },
  { label: 'المستخدمون', value: 'user', icon: User },
  { label: 'السيارات', value: 'car', icon: Car },
  { label: 'التعليقات', value: 'comment', icon: MessageSquare },
  { label: 'الدخول والخروج', value: 'auth', icon: LogIn },
];

const userActions = ['LOGIN', 'LOGOUT', 'REGISTER', 'UPDATE_PROFILE', 'CHANGE_PASSWORD', 'BAN_USER', 'UNBAN_USER', 'DELETE_USER', 'UPDATE_USER_ROLE'];
const carActions = ['PUBLISH_CAR', 'APPROVE_CAR', 'REJECT_CAR', 'FEATURE_CAR', 'UNFEATURE_CAR', 'UPDATE_CAR_PRICE', 'UPDATE_CAR', 'DELETE_CAR', 'RESTORE_CAR', 'VIEW_CAR', 'FAVORITE_CAR', 'UNFAVORITE_CAR'];
const commentActions = ['ADD_COMMENT', 'EDIT_COMMENT', 'DELETE_COMMENT', 'LIKE_COMMENT'];
const authActions = ['LOGIN', 'LOGOUT', 'REGISTER'];

export default function AdminAuditLogsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
  }, [isAuthenticated, user, router]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (filterAction) params.set('action', filterAction);
      if (filterEntity) params.set('entityType', filterEntity);
      if (searchQuery) params.set('q', searchQuery);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        setTotalPages(data.data.pagination.totalPages);
        setTotal(data.data.pagination.total);
      }
    } catch {}
    setLoading(false);
  }, [page, filterAction, filterEntity, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(searchInput);
  };

  const handleCategoryChange = (cat: string) => {
    setFilterCategory(cat);
    setFilterAction('');
    setFilterEntity('');
    setPage(1);
  };

  useEffect(() => {
    if (filterCategory === 'user') { setFilterEntity('USER'); }
    else if (filterCategory === 'car') { setFilterEntity('CAR'); }
    else if (filterCategory === 'comment') { setFilterEntity('COMMENT'); }
    else if (filterCategory === 'auth') { setFilterAction(''); setFilterEntity(''); setFilterAction(''); }
    else { setFilterEntity(''); }
  }, [filterCategory]);

  const clearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setFilterAction('');
    setFilterEntity('');
    setFilterCategory('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    const timeStr = date.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });

    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;

    return date.toLocaleDateString('ar-JO') + ' ' + timeStr;
  };

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || Bell;
    return Icon;
  };

  const hasActiveFilters = searchQuery || filterAction || filterEntity || dateFrom || dateTo;

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">سجل النشاطات</h1>
            <p className="text-sm text-gray-500">{total.toLocaleString('ar-JO')} نشاط مسجل</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Filter className="w-4 h-4" />
          تصفية
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
              {[searchQuery, filterAction, filterEntity, dateTo, dateTo].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {activityCategories.map(cat => {
          const CatIcon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filterCategory === cat.value
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-500/50'
              }`}
            >
              <CatIcon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">البحث والتصفية</span>
          </div>

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
              value={filterAction}
              onChange={e => { setFilterAction(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-rose-500"
            >
              <option value="">كل الإجراءات</option>
              {Object.entries(actionLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={filterEntity}
              onChange={e => { setFilterEntity(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-rose-500"
            >
              <option value="">كل الأنواع</option>
              <option value="USER">مستخدم</option>
              <option value="CAR">سيارة</option>
              <option value="COMMENT">تعليق</option>
              <option value="TICKET">تذكرة</option>
              <option value="SOUND">صوت</option>
              <option value="SYSTEM">نظام</option>
            </select>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-rose-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-rose-500"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <X className="w-3 h-3" />
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>
      )}

      {/* Logs List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد نشاطات مطابقة</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-2 text-rose-500 text-sm hover:underline">
              مسح الفلاتر
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map(log => {
              const Icon = getActionIcon(log.action);
              const isExpanded = expandedLog === log.id;
              const colorClass = actionColors[log.action] || 'text-gray-600 bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20';

              return (
                <div
                  key={log.id}
                  className="card overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
                              {actionLabels[log.action] || log.action}
                            </span>
                            {log.entityType && (
                              <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                {entityTypeLabels[log.entityType] || log.entityType}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400" title={new Date(log.createdAt).toLocaleString('ar-JO')}>
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {log.actor.image ? (
                              <img src={log.actor.image} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              log.actor.name?.charAt(0) || '?'
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                              <span className="font-semibold">{log.actor.name}</span>
                              {log.description && (
                                <span className="text-gray-500"> — {log.description}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {(log.oldValue || log.newValue) && !isExpanded && (
                          <div className="flex items-center gap-2 mt-1.5 text-xs">
                            {log.oldValue && (
                              <span className="text-red-500 line-through truncate max-w-[200px]">{log.oldValue}</span>
                            )}
                            {log.oldValue && log.newValue && <span className="text-gray-400">→</span>}
                            {log.newValue && (
                              <span className="text-green-500 truncate max-w-[200px]">{log.newValue}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <ChevronLeft className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <p className="text-[10px] text-gray-400 mb-0.5">المستخدم</p>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{log.actor.name}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <p className="text-[10px] text-gray-400 mb-0.5">البريد الإلكتروني</p>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{log.actor.email}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <p className="text-[10px] text-gray-400 mb-0.5">الصلاحية</p>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{log.actor.role}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <p className="text-[10px] text-gray-400 mb-0.5">معرّف IP</p>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-mono">{log.ip || 'غير معروف'}</p>
                        </div>
                      </div>

                      {log.entityId && (
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <p className="text-[10px] text-gray-400 mb-0.5">معرّف الكيان</p>
                          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{log.entityId}</p>
                        </div>
                      )}

                      {(log.oldValue || log.newValue) && (
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <p className="text-[10px] text-gray-400 mb-2">تفاصيل التغيير</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {log.oldValue && (
                              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                                <p className="text-[10px] text-red-400 mb-1">القيمة القديمة</p>
                                <p className="text-xs text-red-600 dark:text-red-400 break-all">{log.oldValue}</p>
                              </div>
                            )}
                            {log.newValue && (
                              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20">
                                <p className="text-[10px] text-green-400 mb-1">القيمة الجديدة</p>
                                <p className="text-xs text-green-600 dark:text-green-400 break-all">{log.newValue}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-mono">{log.id}</span>
                        <span>{new Date(log.createdAt).toLocaleString('ar-JO')}</span>
                      </div>
                    </div>
                  )}
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
  );
}
