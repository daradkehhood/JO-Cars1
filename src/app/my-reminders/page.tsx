'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Trash2, Check, Clock, AlertTriangle, Car, Loader2, X, Calendar, Phone, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const reminderTypes = [
  { value: 'OIL_CHANGE', label: 'تغيير زيت', icon: '🛢️', color: 'amber' },
  { value: 'TIRE_CHANGE', label: 'تغيير إطارات', icon: '🛞', color: 'blue' },
  { value: 'INSPECTION', label: 'فحص فني', icon: '🔍', color: 'green' },
  { value: 'INSURANCE', label: 'تجديد تأمين', icon: '🛡️', color: 'purple' },
  { value: 'BRAKES', label: 'فحوصات فرامل', icon: '⚙️', color: 'red' },
  { value: 'BATTERY', label: 'بطارية', icon: '🔋', color: 'yellow' },
  { value: 'TRANSMISSION', label: 'ناقل الحركة', icon: '🔩', color: 'indigo' },
  { value: 'COOLANT', label: 'سائل التبريد', icon: '💧', color: 'cyan' },
  { value: 'OTHER', label: 'أخرى', icon: '📋', color: 'gray' },
];

const colorMap: Record<string, string> = {
  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800',
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-200 dark:border-purple-800',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 border-yellow-200 dark:border-yellow-800',
  indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800',
  cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 border-cyan-200 dark:border-cyan-800',
  gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 border-gray-200 dark:border-gray-800',
};

interface Reminder {
  id: string;
  type: string;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
  carBrand?: string;
  carModel?: string;
  carYear?: number;
  plateNumber?: string;
  phone: string;
  whatsapp?: string;
  car?: { id: string; brand?: { nameAr: string }; model?: { nameAr: string }; year?: number; coverImage?: string };
}

export default function MyRemindersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ type: 'OIL_CHANGE', title: '', description: '', dueDate: '', plateNumber: '', carBrand: '', carModel: '', carYear: '', phone: user?.phone || '', whatsapp: user?.whatsapp || '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadReminders();
  }, [user]);

  const loadReminders = async () => {
    setLoading(true);
    const res = await fetch('/api/car-reminders');
    const d = await res.json();
    if (d.success) setReminders(d.data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dueDate) { toast.error('العنوان والتاريخ مطلوبان'); return; }
    setSubmitting(true);
    const res = await fetch('/api/car-reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (d.success) { toast.success('تم إضافة التذكير'); setShowAdd(false); loadReminders(); setForm({ type: 'OIL_CHANGE', title: '', description: '', dueDate: '', plateNumber: '', carBrand: '', carModel: '', carYear: '', phone: user?.phone || '', whatsapp: user?.whatsapp || '' }); }
    else toast.error('فشل');
    setSubmitting(false);
  };

  const handleComplete = async (id: string) => {
    const res = await fetch(`/api/car-reminders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isCompleted: true }) });
    const d = await res.json();
    if (d.success) { toast.success('تم الإكمال'); loadReminders(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف التذكير؟')) return;
    const res = await fetch(`/api/car-reminders/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { toast.success('تم الحذف'); loadReminders(); }
  };

  const filtered = reminders.filter(r => {
    if (filter === 'upcoming') return !r.isCompleted && new Date(r.dueDate) >= new Date();
    if (filter === 'overdue') return !r.isCompleted && new Date(r.dueDate) < new Date();
    if (filter === 'completed') return r.isCompleted;
    return true;
  });

  const upcoming = reminders.filter(r => !r.isCompleted && new Date(r.dueDate) >= new Date());
  const overdue = reminders.filter(r => !r.isCompleted && new Date(r.dueDate) < new Date());

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold">تذكيرات صيانة السيارة</h1>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> إضافة تذكير
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{upcoming.length}</div>
            <div className="text-xs text-gray-500">قادم</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
            <div className="text-xs text-gray-500">متأخر</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{reminders.filter(r => r.isCompleted).length}</div>
            <div className="text-xs text-gray-500">مكتمل</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'الكل' },
              { key: 'upcoming', label: 'قادم' },
              { key: 'overdue', label: 'متأخر' },
              { key: 'completed', label: 'مكتمل' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reminders */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-gray-500">لا توجد تذكيرات</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map(r => {
                const typeInfo = reminderTypes.find(t => t.value === r.type) || reminderTypes[reminderTypes.length - 1];
                const isOverdue = !r.isCompleted && new Date(r.dueDate) < new Date();
                const daysUntil = Math.ceil((new Date(r.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className={`card p-4 ${r.isCompleted ? 'opacity-60' : isOverdue ? 'border-red-300 dark:border-red-800' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorMap[typeInfo.color]}`}>
                        {typeInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{r.title}</h3>
                          {isOverdue && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full">متأخر</span>}
                          {r.isCompleted && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 px-2 py-0.5 rounded-full">مكتمل</span>}
                        </div>
                        {(r.carBrand || r.plateNumber) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <Car className="w-3 h-3" />
                            <span>{[r.carBrand, r.carModel, r.carYear].filter(Boolean).join(' ')}</span>
                            {r.plateNumber && <span>• {r.plateNumber}</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(r.dueDate)}</span>
                          {!r.isCompleted && <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : daysUntil <= 7 ? 'text-amber-500' : ''}`}>
                            <Clock className="w-3 h-3" />
                            {isOverdue ? `متأخر ${Math.abs(daysUntil)} يوم` : daysUntil === 0 ? 'اليوم' : `بعد ${daysUntil} يوم`}
                          </span>}
                        </div>
                        {r.description && <p className="text-sm text-gray-500 mt-1">{r.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        {!r.isCompleted && (
                          <button onClick={() => handleComplete(r.id)} className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title="إكمال">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(r.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">إضافة تذكير</h2>
                  <button onClick={() => setShowAdd(false)}><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">نوع التذكير *</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500">
                      {reminderTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">العنوان *</label>
                    <input type="text" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="مثال: تغيير زيت السيارة" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">التاريخ *</label>
                      <input type="date" required value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">رقم اللوحة</label>
                      <input type="text" value={form.plateNumber} onChange={e => setForm(p => ({ ...p, plateNumber: e.target.value }))}
                        placeholder="اختياري" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">الماركة</label>
                      <input type="text" value={form.carBrand} onChange={e => setForm(p => ({ ...p, carBrand: e.target.value }))}
                        placeholder="اختياري" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">الموديل</label>
                      <input type="text" value={form.carModel} onChange={e => setForm(p => ({ ...p, carModel: e.target.value }))}
                        placeholder="اختياري" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">السنة</label>
                      <input type="number" value={form.carYear} onChange={e => setForm(p => ({ ...p, carYear: e.target.value }))}
                        placeholder="اختياري" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">الهاتف</label>
                      <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="079xxxxxxx" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">واتساب</label>
                      <input type="text" value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))}
                        placeholder="079xxxxxxx" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ملاحظات</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                      placeholder="تفاصيل إضافية..." className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full h-11 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'إضافة التذكير'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
