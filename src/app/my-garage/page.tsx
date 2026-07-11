'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Car, Plus, Loader2, DollarSign, Trash2, ChevronDown, ChevronUp, Receipt, Wrench, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface GarageCar {
  id: string; carBrand: string; carModel: string; carYear: number;
  plateNumber?: string; color?: string; fuelType?: string; transmission?: string;
  currentKm?: number; purchasePrice?: number; notes?: string;
  totalSpent: number; expenseCount: number;
  expenses: Array<{ id: string; type: string; title: string; cost: number; date: string }>;
}

interface GarageStats { totalSpent: number; totalExpenses: number; thisYearSpent: number; }

export default function MyGaragePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [cars, setCars] = useState<GarageCar[]>([]);
  const [stats, setStats] = useState<GarageStats>({ totalSpent: 0, totalExpenses: 0, thisYearSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [expandedCar, setExpandedCar] = useState<string | null>(null);
  const [form, setForm] = useState({ carBrand: '', carModel: '', carYear: new Date().getFullYear().toString(), plateNumber: '', color: '', fuelType: '', transmission: '', currentKm: '', purchasePrice: '', notes: '' });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    fetchGarage();
  }, [isAuthenticated, router]);

  const fetchGarage = async () => {
    try {
      const res = await fetch('/api/garage');
      const data = await res.json();
      if (data.success) { setCars(data.data.cars); setStats(data.data); }
    } catch { toast.error('فشل تحميل المرآب'); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.carBrand || !form.carModel) { toast.error('أدخل الماركة والموديل'); return; }
    setAddLoading(true);
    try {
      const res = await fetch('/api/garage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast.success('تمت إضافة السيارة'); setShowAdd(false); setForm({ carBrand: '', carModel: '', carYear: new Date().getFullYear().toString(), plateNumber: '', color: '', fuelType: '', transmission: '', currentKm: '', purchasePrice: '', notes: '' }); fetchGarage(); }
      else toast.error(data.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
    finally { setAddLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      const res = await fetch(`/api/garage/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('تم الحذف'); fetchGarage(); }
    } catch { toast.error('فشل الحذف'); }
  };

  const brands = ['تويوتا', 'هيونداي', 'كيا', 'نيسان', 'هوندا', 'فورد', 'مرسيدس', 'بي إم دبليو', 'أودي', 'مازدا', 'شيفروليه', 'لكزس', 'ميتسوبيشي', 'سوزوكي', 'فولكس فاجن', 'بورش', 'أخرى'];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center"><Car className="w-6 h-6 text-white" /></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">مرآبي</h1>
                <p className="text-gray-500 text-sm">أدر سياراتك ومصاريفك</p>
              </div>
            </div>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>إضافة سيارة</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 text-center"><Car className="w-8 h-8 text-blue-500 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-900 dark:text-white">{cars.length}</p><p className="text-sm text-gray-500">سيارة</p></div>
            <div className="card p-5 text-center"><DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.thisYearSpent.toLocaleString()}</p><p className="text-sm text-gray-500">مصاريف العام (دينار)</p></div>
            <div className="card p-5 text-center"><Receipt className="w-8 h-8 text-purple-500 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalExpenses}</p><p className="text-sm text-gray-500">إجمالي المصروفات</p></div>
          </div>

          {cars.length === 0 ? (
            <div className="card p-12 text-center">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">مرآبك فارغ</h3>
              <p className="text-gray-500 mb-4">أضف سيارتك لتتبع مصاريفها وصيانتها</p>
              <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>إضافة أول سيارة</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cars.map(car => (
                <motion.div key={car.id} layout className="card overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">{car.carYear.toString().slice(-2)}</div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{car.carBrand} {car.carModel} {car.carYear}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            {car.plateNumber && <span>{car.plateNumber}</span>}
                            {car.currentKm && <span>{car.currentKm.toLocaleString()} كم</span>}
                            {car.color && <span>{car.color}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDelete(car.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                        <button onClick={() => setExpandedCar(expandedCar === car.id ? null : car.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                          {expandedCar === car.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="p-3 rounded-xl bg-green-50 dark:bg-green-500/10 text-center"><p className="text-xs text-gray-500">إجمالي</p><p className="text-lg font-bold text-green-600">{car.totalSpent.toLocaleString()}</p><p className="text-[10px] text-gray-400">دينار</p></div>
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-center"><p className="text-xs text-gray-500">المصروفات</p><p className="text-lg font-bold text-blue-600">{car.expenseCount}</p></div>
                      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-center"><p className="text-xs text-gray-500">متوسط شهري</p><p className="text-lg font-bold text-purple-600">{car.expenseCount > 0 ? Math.round(car.totalSpent / 12).toLocaleString() : 0}</p><p className="text-[10px] text-gray-400">دينار</p></div>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedCar === car.id && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="border-t border-gray-100 dark:border-gray-800 p-5 space-y-4">
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">آخر المصروفات</h4>
                          {car.expenses.length === 0 ? <p className="text-sm text-gray-400">لا توجد مصروفات بعد</p> : (
                            <div className="space-y-2">
                              {car.expenses.map(exp => (
                                <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">{exp.title}</p><p className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString('ar-JO')} • {exp.type}</p></div>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">{exp.cost.toLocaleString()} د.أ</p>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" icon={<Receipt className="w-4 h-4" />} onClick={() => router.push(`/my-garage/${car.id}/expenses`)}>سجل المصروفات</Button>
                            <Button variant="outline" size="sm" icon={<Wrench className="w-4 h-4" />} onClick={() => router.push('/my-reminders')}>التذكيرات</Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {showAdd && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAdd(false)}>
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-gray-900 dark:text-white">إضافة سيارة للمرآب</h2><button onClick={() => setShowAdd(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><span className="text-gray-400">✕</span></button></div>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الشركة *</label><select value={form.carBrand} onChange={e => setForm({ ...form, carBrand: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm"><option value="">اختر الشركة</option>{brands.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الموديل *</label><input value={form.carModel} onChange={e => setForm({ ...form, carModel: e.target.value })} placeholder="مثال: كامري، توسان..." className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السنة *</label><input type="number" value={form.carYear} onChange={e => setForm({ ...form, carYear: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم اللوحة</label><input value={form.plateNumber} onChange={e => setForm({ ...form, plateNumber: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اللون</label><input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الكيلومترات</label><input type="number" value={form.currentKm} onChange={e => setForm({ ...form, currentKm: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوقود</label><select value={form.fuelType} onChange={e => setForm({ ...form, fuelType: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm"><option value="">اختر</option><option value="PETROL">بنزين</option><option value="DIESEL">ديزل</option><option value="HYBRID">هايبرد</option><option value="ELECTRIC">كهرباء</option></select></div>
                      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ناقل الحركة</label><select value={form.transmission} onChange={e => setForm({ ...form, transmission: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm"><option value="">اختر</option><option value="MANUAL">يدوي</option><option value="AUTOMATIC">أوتوماتيك</option></select></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سعر الشراء (دينار)</label><input type="number" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm resize-none" /></div>
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
