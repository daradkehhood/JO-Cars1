'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ClipboardList, Loader2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

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
};

const actionColors: Record<string, string> = {
  BAN_USER: 'text-red-600 bg-red-50 dark:bg-red-500/10',
  UNBAN_USER: 'text-green-600 bg-green-50 dark:bg-green-500/10',
  DELETE_USER: 'text-red-600 bg-red-50 dark:bg-red-500/10',
  UPDATE_USER_ROLE: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10',
  APPROVE_CAR: 'text-green-600 bg-green-50 dark:bg-green-500/10',
  REJECT_CAR: 'text-red-600 bg-red-50 dark:bg-red-500/10',
  FEATURE_CAR: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',
  UNFEATURE_CAR: 'text-gray-600 bg-gray-50 dark:bg-gray-500/10',
  UPDATE_CAR_PRICE: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
  UPDATE_CAR: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
  DELETE_CAR: 'text-red-600 bg-red-50 dark:bg-red-500/10',
  RESTORE_CAR: 'text-green-600 bg-green-50 dark:bg-green-500/10',
  TICKET_CLOSE: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10',
  TICKET_ASSIGN: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10',
  SYSTEM: 'text-gray-600 bg-gray-50 dark:bg-gray-500/10',
};

const entityTypeLabels: Record<string, string> = {
  USER: 'مستخدم',
  CAR: 'سيارة',
  TICKET: 'تذكرة',
  SYSTEM: 'نظام',
};

export default function AdminAuditLogsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    loadLogs();
  }, [isAuthenticated, user, router, page, filterAction, filterEntity]);

  const loadLogs = () => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (filterAction) params.set('action', filterAction);
    if (filterEntity) params.set('entityType', filterEntity);

    fetch(`/api/admin/audit-logs?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setLogs(data.data.logs);
          setTotalPages(data.data.pagination.totalPages);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('ar-JO') + ' ' + date.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">سجل النشاطات</h1>
          <p className="text-sm text-gray-500">تتبع جميع التغييرات والإجراءات في النظام</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); setLoading(true); }}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-rose-500">
          <option value="">كل الإجراءات</option>
          {Object.entries(actionLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={filterEntity} onChange={e => { setFilterEntity(e.target.value); setPage(1); setLoading(true); }}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-rose-500">
          <option value="">كل الأنواع</option>
          <option value="USER">مستخدم</option>
          <option value="CAR">سيارة</option>
          <option value="TICKET">تذكرة</option>
          <option value="SYSTEM">نظام</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16"><ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">لا توجد نشاطات</p></div>
      ) : (
        <>
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {log.actor.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${actionColors[log.action] || 'text-gray-600 bg-gray-50'}`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                      {log.entityType && (
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                          {entityTypeLabels[log.entityType] || log.entityType}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      <span className="font-medium">{log.actor.name}</span>
                      {log.description && <span> — {log.description}</span>}
                    </p>
                    {log.entityId && (
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {log.entityId}</p>
                    )}
                    {(log.oldValue || log.newValue) && (
                      <div className="flex items-center gap-2 mt-1.5 text-xs">
                        {log.oldValue && <span className="text-red-500 line-through">{log.oldValue}</span>}
                        {log.newValue && <span className="text-green-500">{log.newValue}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500">الصفحة {page} من {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
