'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Car, Plus, Loader2, DollarSign, Calendar, Wrench, Fuel, Shield, CircleDot, Trash2, ArrowRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface CarExpense {
  id: string; type: string; title: string; description?: string;
  cost: number; odometer?: number; date: string; shopName?: string;
}

interface CarData {
  id: string; carBrand: string; carModel: string; carYear: number;
  plateNumber?: string; color?: string; fuelType?: string; transmission?: string;
  currentKm?: number; purchasePrice?: number; notes?: string;
  totalSpent: number; expenseCount: number;
  expenses: CarExpense[];
  breakdown: { type: string; total: number; count: number }[];
  monthly: { month: string; total: number; count: number }[];
}

const EXPENSE_TYPES = [
  { value: 'OIL_CHANGE', label: 'تغيير زيت', icon: Wrench },
  { value: 'REPAIR', label: 'إصلاح', icon: Wrench },
  { value: 'FUEL', label: 'وقود', icon: Fuel },
  { value: 'INSURANCE', label: 'تأمين', icon: Shield },
  { value: 'TIRES', label: 'إطارات', icon: CircleDot },
  { value: 'MAINTENANCE', label: 'صيانة', icon: Wrench },
  { value: 'PARTS', label: 'قطع غيار', icon: Wrench },
  { value: 'LABOR', label: 'عمالة', icon: Wrench },
  { value: 'WASH', label: 'غسيل', icon: Wrench },
  { value: 'OTHER', label: 'أخرى', icon: Wrench },
];

export default function CarExpensesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [car, setCar] = useState<CarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState({ type: 'MAINTENANCE', title: '', description: '', cost: '', odometer: '', date: new Date().toISOString().split('T')[0], shopName: '' });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    fetchCar();
  }, [isAuthenticated, router, id]);

  const fetchCar = async () => {
    try {
      const res = await fetch(`/api/garage/${id}`);
      const data = await res.json();
      if (data.success) setCar(data.data);
      else { toast.error('السيارة غير موجودة'); router.push('/my-garage'); }
    } catch { toast.error('فشل التحميل'); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.title || !form.cost) { toast.error('أدخل العنوان والتكلفة'); return; }
    setAddLoading(true);
    try {
      const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, carId: id, cost: parseFloat(form.cost), odometer: form.odometer ? parseInt(form.odometer) : undefined }) });
      const data = await res.json();
      if (data.success) { toast.success('تمت إضافة المصروف'); setShowAdd(false); setForm({ type: 'MAINTENANCE', title: '', description: '', cost: '', odometer: '', date: new Date().toISOString().split('T')[0], shopName: '' }); fetchCar(); }
      else toast.error(data.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
    finally { setAddLoading(false); }
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      const res = await fetch(`/api/expenses?id=${expenseId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('تم الحذف'); fetchCar(); }
    } catch { toast.error('فشل الحذف'); }
  };

  const filteredExpenses = car?.expenses?.filter(e => !typeFilter || e.type === typeFilter) || [];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!car) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/my-garage')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowRight className="w-5 h-5" /></button>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center"><Car className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{car.carBrand} {car.carModel} {car.carYear}</h1>
              <p className="text-gray-500 text-sm">سجل المصروفات</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 text-center"><DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-900 dark:text-white">{car.totalSpent.toLocaleString()}</p><p className="text-sm text-gray-500">إجمالي (دينار)</p></div>
            <div className="card p-5 text-center"><Receipt className="w-8 h-8 text-blue-500 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-900 dark:text-white">{car.expenseCount}</p><p className="text-sm text-gray-500">عدد المصروفات</p></div>
            <div className="card p-5 text-center"><Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-900 dark:text-white">{car.expenseCount > 0 ? Math.round(car.totalSpent / Math.max(1, new Date().getMonth() + 1)).toLocaleString() : 0}</p><p className="text-sm text-gray-500">متوسط شهري (دينار)</p></div>
          </div>

          {car.breakdown && car.breakdown.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">تصنيف المصروفات</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {car.breakdown.map(b => (
                  <div key={b.type} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                    <p className="text-xs text-gray-500">{EXPENSE_TYPES.find(t => t.value === b.type)?.label || b.type}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{b.total.toLocaleString()} <span className="text-xs">د.أ</span></p>
                    <p className="text-[10px] text-gray-400">{b.count} مصروف</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {car.monthly && car.monthly.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">المصروفات الشهرية</h3>
              <div className="space-y-2">
                {car.monthly.map(m => (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-20">{m.month}</span>
                    <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${Math.min(100, (m.total / Math.max(...car.monthly.map(mm => mm.total))) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-24 text-left">{m.total.toLocaleString()} د.أ</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">سجل المصروفات</h3>
              <div className="flex gap-2">
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-3 py-1.5">
                  <option value="">الكل</option>
                  {EXPENSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>مصروف جديد</Button>
              </div>
            </div>
            {filteredExpenses.length === 0 ? (
              <p className="text-center text-gray-400 py-8">لا توجد مصروفات</p>
            ) : (
              <div className="space-y-2">
                {filteredExpenses.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">{EXPENSE_TYPES.find(t => t.value === exp.type)?.label || exp.type}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{exp.title}</span>
                      </div>
                      {exp.description && <p className="text-xs text-gray-500 mt-1">{exp.description}</p>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{new Date(exp.date).toLocaleDateString('ar-JO')}</span>
                        {exp.odometer && <span>{exp.odometer.toLocaleString()} كم</span>}
                        {exp.shopName && <span>{exp.shopName}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{exp.cost.toLocaleString()} د.أ</p>
                      <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <AnimatePresence>
            {showAdd && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAdd(false)}>
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-gray-900 dark:text-white">مصروف جديد</h2><button onClick={() => setShowAdd(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><span className="text-gray-400">✕</span></button></div>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع المصروف *</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm">{EXPENSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: تغيير زيت، إصلاح فرامل..." className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التكلفة (دينار) *</label><input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الكيلومترات</label><input type="number" value={form.odometer} onChange={e => setForm({ ...form, odometer: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الورشة</label><input value={form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm resize-none" /></div>
                    <div className="flex gap-3 pt-2"><Button variant="ghost" onClick={() => setShowAdd(false)}>إلغاء</Button><Button onClick={handleAdd} loading={addLoading}>إضافة</Button></div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function Receipt({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M10 8h.01"/><path d="M8 12h.01"/><path d="M16 12h.01"/><path d="M12 12h.01"/></svg>;
}
