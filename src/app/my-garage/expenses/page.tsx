'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { DollarSign, Calendar, Loader2, Receipt, Wrench, Fuel, Shield, CircleDot, ArrowRight, Filter } from 'lucide-react';

interface Expense {
  id: string; type: string; title: string; cost: number; date: string;
  odometer?: number; shopName?: string;
  car: { id: string; carBrand: string; carModel: string; carYear: number };
}

interface ExpensesData {
  expenses: Expense[];
  total: number;
  byType: { type: string; total: number; count: number }[];
  byMonth: { month: string; total: number; count: number }[];
}

const EXPENSE_TYPES: Record<string, string> = {
  OIL_CHANGE: 'تغيير زيت', REPAIR: 'إصلاح', FUEL: 'وقود', INSURANCE: 'تأمين',
  TIRES: 'إطارات', MAINTENANCE: 'صيانة', PARTS: 'قطع غيار', LABOR: 'عمالة',
  WASH: 'غسيل', OTHER: 'أخرى',
};

export default function AllExpensesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<ExpensesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    fetchExpenses();
  }, [isAuthenticated, router, year, typeFilter]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (year) params.set('year', year);
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`/api/expenses?${params}`);
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/my-garage')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowRight className="w-5 h-5" /></button>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center"><Receipt className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">جميع المصروفات</h1>
              <p className="text-gray-500 text-sm">ملخص شامل لمصاريف جميع سياراتك</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <select value={year} onChange={e => setYear(e.target.value)} className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-3 py-2">
              {[...Array(5)].map((_, i) => { const y = new Date().getFullYear() - i; return <option key={y} value={y}>{y}</option>; })}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-3 py-2">
              <option value="">جميع الأنواع</option>
              {Object.entries(EXPENSE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {data && (
            <>
              <div className="card p-5 text-center">
                <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.total.toLocaleString()} <span className="text-lg">د.أ</span></p>
                <p className="text-sm text-gray-500">إجمالي مصاريف {year}</p>
              </div>

              {data.byType.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">التصنيف حسب النوع</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.byType.map(b => (
                      <div key={b.type} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                        <p className="text-xs text-gray-500">{EXPENSE_TYPES[b.type] || b.type}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{b.total.toLocaleString()} د.أ</p>
                        <p className="text-[10px] text-gray-400">{b.count} مصروف</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.byMonth.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">المصروفات الشهرية</h3>
                  <div className="space-y-2">
                    {data.byMonth.map(m => (
                      <div key={m.month} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-20">{m.month}</span>
                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: `${Math.min(100, (m.total / Math.max(...data.byMonth.map(mm => mm.total))) * 100)}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white w-24 text-left">{m.total.toLocaleString()} د.أ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card p-5">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">جميع المصروفات ({data.expenses.length})</h3>
                {data.expenses.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">لا توجد مصروفات في هذه الفترة</p>
                ) : (
                  <div className="space-y-2">
                    {data.expenses.map(exp => (
                      <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => router.push(`/my-garage/${exp.car.id}/expenses`)}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">{EXPENSE_TYPES[exp.type] || exp.type}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{exp.title}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span>{exp.car.carBrand} {exp.car.carModel} {exp.car.carYear}</span>
                            <span>{new Date(exp.date).toLocaleDateString('ar-JO')}</span>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{exp.cost.toLocaleString()} د.أ</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
