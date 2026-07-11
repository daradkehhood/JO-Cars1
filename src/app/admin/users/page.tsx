'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck, Ban, Check, X, Loader2, MessageSquare, Clock, AlertTriangle, UserX, Edit3, Trash2, Globe, LogIn, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '@/types';

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [banModal, setBanModal] = useState<{ user: User; open: boolean }>({ user: null as any, open: false });
  const [banType, setBanType] = useState<'TEMPORARY' | 'PERMANENT'>('PERMANENT');
  const [banReason, setBanReason] = useState('');
  const [banDays, setBanDays] = useState('7');
  const [submitting, setSubmitting] = useState(false);
  const [editModal, setEditModal] = useState<{ user: User; open: boolean }>({ user: null as any, open: false });
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDealerName, setEditDealerName] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [badgeModal, setBadgeModal] = useState<{ user: User; open: boolean }>({ user: null as any, open: false });
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [availableBadges, setAvailableBadges] = useState<{ id: string; nameAr: string; icon: string }[]>([]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    loadUsers();
    fetch('/api/admin/badges')
      .then(r => r.json())
      .then(data => setAvailableBadges(data.data || []))
      .catch(() => {});
  }, [isAuthenticated, user, router, search]);

  const loadUsers = () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    fetch(`/api/admin/users${params}`)
      .then(r => r.json())
      .then(data => {
        const list = (data.data || []).map((u: any) => ({ ...u, badges: typeof u.badges === 'string' ? JSON.parse(u.badges || '[]') : (u.badges || []) }));
        setUsers(list); setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const updateUser = async (userId: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const d = await res.json();
    if (d.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, ...d.data, badges: typeof d.data.badges === 'string' ? JSON.parse(d.data.badges || '[]') : (d.data.badges || u.badges) } : u));
      return true;
    }
    toast.error(d.error || 'فشل التحديث');
    return false;
  };

  const toggleActive = async (u: User) => {
    if (await updateUser(u.id, { isActive: !u.isActive })) {
      toast.success(u.isActive ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب');
    }
  };

  const toggleCanPost = async (u: User) => {
    if (await updateUser(u.id, { canPost: !u.canPost })) {
      toast.success(u.canPost ? 'تم إيقاف النشر' : 'تم تفعيل النشر');
    }
  };

  const openBanModal = (u: User) => {
    setBanType('PERMANENT'); setBanReason(''); setBanDays('7');
    setBanModal({ user: u, open: true });
  };

  const handleBan = async () => {
    if (!banReason.trim()) { toast.error('الرجاء كتابة سبب الحظر'); return; }
    setSubmitting(true);
    const data: Record<string, unknown> = { banStatus: banType, banReason, isActive: false };
    if (banType === 'TEMPORARY') {
      const days = parseInt(banDays);
      if (isNaN(days) || days < 1) { toast.error('عدد الأيام غير صالح'); setSubmitting(false); return; }
      data.banUntil = new Date(Date.now() + days * 86400000).toISOString();
    }
    if (await updateUser(banModal.user.id, data)) {
      toast.success('تم حظر المستخدم');
      setBanModal({ user: null as any, open: false });
    }
    setSubmitting(false);
  };

  const unbanUser = async (u: User) => {
    if (await updateUser(u.id, { banStatus: null, banReason: null, banUntil: null, isActive: true })) {
      toast.success('تم إلغاء الحظر');
    }
  };

  const openEditModal = (u: User) => {
    setEditName(u.name); setEditEmail(u.email); setEditPhone(u.phone || '');
    setEditDealerName(u.dealerName || ''); setEditRole(u.role);
    setEditModal({ user: u, open: true });
  };

  const handleEdit = async () => {
    if (!editName.trim() || !editEmail.trim()) { toast.error('الاسم والبريد مطلوبان'); return; }
    setSubmitting(true);
    const data: Record<string, unknown> = { name: editName, email: editEmail, role: editRole };
    if (editPhone) data.phone = editPhone;
    data.dealerName = editDealerName || null;
    if (await updateUser(editModal.user.id, data)) {
      toast.success('تم تحديث البيانات');
      setEditModal({ ...editModal, open: false });
    }
    setSubmitting(false);
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${u.name}" نهائياً؟\nسيتم حذف جميع بياناته وسياراته.`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) {
      toast.success('تم حذف المستخدم');
      setUsers(users.filter(x => x.id !== u.id));
    } else {
      toast.error(d.error || 'فشل الحذف');
    }
  };

  const openBadgeModal = (u: User) => {
    setSelectedBadges([...(u.badges || [])]);
    setBadgeModal({ user: u, open: true });
  };

  const toggleBadge = (badgeId: string) => {
    setSelectedBadges(prev => prev.includes(badgeId) ? prev.filter(b => b !== badgeId) : [...prev, badgeId]);
  };

  const saveBadges = async () => {
    setSubmitting(true);
    if (await updateUser(badgeModal.user.id, { badges: JSON.stringify(selectedBadges) })) {
      toast.success('تم تحديث الشارات');
      setBadgeModal({ ...badgeModal, open: false });
    }
    setSubmitting(false);
  };

  const getStatusBadge = (u: User) => {
    if (u.banStatus === 'PERMANENT') return { label: 'محظور دائم', color: 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400' };
    if (u.banStatus === 'TEMPORARY') return { label: 'محظور مؤقت', color: 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' };
    if (!u.isActive) return { label: 'موقوف', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' };
    if (!u.canPost) return { label: 'النشر متوقف', color: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' };
    return { label: 'نشط', color: 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' };
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة المستخدمين</h1>
            <p className="text-sm text-gray-500">إدارة المستخدمين والتجار والصلاحيات والشارات</p>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <input value={search} onChange={e => { setSearch(e.target.value); setLoading(true); }}
          placeholder="بحث بالاسم أو البريد الإلكتروني أو رقم الهاتف..."
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 pr-10 pl-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16"><UserX className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">لا يوجد مستخدمين</p></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">المستخدم</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">الدور</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">الشارات</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">الحالة</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">آخر دخول</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">IP</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">السيارات</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map(u => {
                  const badge = getStatusBadge(u);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {u.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                            <p className="text-xs text-gray-400 dir-ltr">{u.email}</p>
                            {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'ADMIN' ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400' :
                          u.role === 'DEALER' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                          'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                        }`}>
                          {u.role === 'ADMIN' ? 'مدير' : u.role === 'DEALER' ? 'تاجر' : 'مستخدم'}
                        </span>
                        {u.dealerName && <p className="text-xs text-gray-400 mt-0.5">{u.dealerName}</p>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 flex-wrap max-w-[140px]">
                          {(u.badges || []).map((b: string) => {
                            const badgeDef = availableBadges.find(bb => bb.id === b);
                            return badgeDef ? (
                              <span key={b} className="text-sm" title={badgeDef.nameAr}>{badgeDef.icon}</span>
                            ) : null;
                          })}
                          {(!u.badges || u.badges.length === 0) && <span className="text-xs text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                          {u.banStatus === 'PERMANENT' ? <Ban className="w-3 h-3" /> :
                           u.banStatus === 'TEMPORARY' ? <Clock className="w-3 h-3" /> :
                           !u.isActive ? <X className="w-3 h-3" /> :
                           !u.canPost ? <MessageSquare className="w-3 h-3" /> :
                           <Check className="w-3 h-3" />}
                          {badge.label}
                        </span>
                        {u.banReason && <p className="text-xs text-gray-400 mt-0.5 max-w-[150px] truncate" title={u.banReason}>{u.banReason}</p>}
                        {u.banUntil && <p className="text-xs text-gray-400 mt-0.5">حتى {new Date(u.banUntil).toLocaleDateString('ar-JO')}</p>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <LogIn className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('ar-JO') + ' ' + new Date(u.lastLoginAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : 'لم يسجل'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dir-ltr">{u.lastLoginIp || '—'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 text-sm">{u._count?.cars || 0}</td>
                      <td className="p-4 text-left">
                        <div className="flex items-center gap-1 justify-end">
                          {u.banStatus ? (
                            <button onClick={() => unbanUser(u)}
                              className="px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors">
                              إلغاء الحظر
                            </button>
                          ) : (
                            <>
                              <button onClick={() => openBadgeModal(u)}
                                className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-500 transition-colors" title="الشارات">
                                <Award className="w-4 h-4" />
                              </button>
                              <button onClick={() => openBanModal(u)}
                                className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 text-orange-500 transition-colors" title="حظر">
                                <Ban className="w-4 h-4" />
                              </button>
                              <button onClick={() => toggleCanPost(u)}
                                className={`p-2 rounded-lg transition-colors ${!u.canPost ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' : 'hover:bg-amber-50 dark:hover:bg-amber-500/10 text-gray-400 hover:text-amber-500'}`}
                                title={u.canPost ? 'إيقاف النشر' : 'تفعيل النشر'}>
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button onClick={() => toggleActive(u)}
                                className={`p-2 rounded-lg transition-colors ${!u.isActive ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                title={u.isActive ? 'تعطيل' : 'تفعيل'}>
                                {u.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button onClick={() => openEditModal(u)}
                                className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500 transition-colors" title="تعديل">
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button onClick={() => handleDelete(u)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 transition-colors" title="حذف">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModal.open && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setBanModal({ ...banModal, open: false })} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" /><h3 className="font-semibold text-gray-900 dark:text-white">حظر المستخدم</h3></div>
                <button onClick={() => setBanModal({ ...banModal, open: false })} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500">حظر المستخدم: <span className="font-medium text-gray-700 dark:text-gray-300">{banModal.user?.name}</span></p>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع الحظر</p>
                  <div className="flex gap-2">
                    <button onClick={() => setBanType('PERMANENT')}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${banType === 'PERMANENT' ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>دائم</button>
                    <button onClick={() => setBanType('TEMPORARY')}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${banType === 'TEMPORARY' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>مؤقت</button>
                  </div>
                </div>
                {banType === 'TEMPORARY' && (
                  <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">المدة (أيام)</p>
                    <input type="number" value={banDays} onChange={e => setBanDays(e.target.value)} min="1"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
                )}
                <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">سبب الحظر</p>
                  <textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="اكتب سبب الحظر..." maxLength={500} rows={3}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none" /></div>
                <button onClick={handleBan} disabled={submitting || !banReason.trim()}
                  className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  {submitting ? 'جاري الحظر...' : 'تأكيد الحظر'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editModal.open && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setEditModal({ ...editModal, open: false })} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2"><Edit3 className="w-5 h-5 text-blue-500" /><h3 className="font-semibold text-gray-900 dark:text-white">تعديل المستخدم</h3></div>
                <button onClick={() => setEditModal({ ...editModal, open: false })} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500">تعديل: <span className="font-medium text-gray-700 dark:text-gray-300">{editModal.user?.name}</span></p>
                <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الاسم</p>
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
                <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">البريد الإلكتروني</p>
                  <input value={editEmail} onChange={e => setEditEmail(e.target.value)} dir="ltr"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
                <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">رقم الهاتف</p>
                  <input value={editPhone} onChange={e => setEditPhone(e.target.value)} dir="ltr"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
                <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اسم التاجر (اختياري)</p>
                  <input value={editDealerName} onChange={e => setEditDealerName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
                <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">نوع الحساب</p>
                  <div className="flex gap-2">
                    {['USER', 'DEALER', 'ADMIN'].map(r => (
                      <button key={r} onClick={() => setEditRole(r)}
                        className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${editRole === r
                          ? r === 'ADMIN' ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-600'
                          : r === 'DEALER' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                          : 'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-600'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                        {r === 'ADMIN' ? 'مدير' : r === 'DEALER' ? 'تاجر' : 'مستخدم'}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleEdit} disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                  {submitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Badge Modal */}
      {badgeModal.open && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setBadgeModal({ ...badgeModal, open: false })} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /><h3 className="font-semibold text-gray-900 dark:text-white">الشارات</h3></div>
                <button onClick={() => setBadgeModal({ ...badgeModal, open: false })} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500">إدارة شارات المستخدم: <span className="font-medium text-gray-700 dark:text-gray-300">{badgeModal.user?.name}</span></p>
                <div className="space-y-3">
                  {availableBadges.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">لا توجد شارات متاحة. أضف شارات من <a href="/admin/badges" className="text-amber-500 underline">صفحة الشارات</a></p>
                  ) : (
                    availableBadges.map(b => (
                      <label key={b.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <input type="checkbox" checked={selectedBadges.includes(b.id)} onChange={() => toggleBadge(b.id)}
                          className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
                        <span className="text-xl">{b.icon}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{b.nameAr}</span>
                      </label>
                    ))
                  )}
                </div>
                <button onClick={saveBadges} disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                  {submitting ? 'جاري الحفظ...' : 'حفظ الشارات'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
