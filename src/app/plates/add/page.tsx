'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Loader2, ChevronLeft, BadgePercent } from 'lucide-react';
import toast from 'react-hot-toast';

const plateTypes = [
  { value: 'STANDARD', label: 'عادي' },
  { value: 'THREE_DIGIT', label: '3 أرقام' },
  { value: 'FOUR_DIGIT', label: '4 أرقام' },
  { value: 'FIVE_DIGIT', label: '5 أرقام' },
  { value: 'SIX_DIGIT', label: '6 أرقام' },
  { value: 'CUSTOM', label: 'مميز' },
];

export default function AddPlatePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    plateNumber: '', type: 'STANDARD', price: '', description: '',
    phone: '', whatsapp: '', isNegotiable: false,
  });

  if (!isAuthenticated) { router.push('/auth/login'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plateNumber.trim()) { toast.error('رقم اللوحة مطلوب'); return; }
    if (!form.price || parseFloat(form.price) <= 0) { toast.error('السعر مطلوب'); return; }
    if (!form.phone.trim()) { toast.error('رقم الهاتف مطلوب'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/plates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { toast.success('تم إضافة اللوحة'); router.push(`/plates/${data.data.id}`); }
      else toast.error(data.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="container-custom py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <BadgePercent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إضافة لوحة أرقام</h1>
              <p className="text-sm text-gray-500">بيع لوحة مميزة أو عادية</p>
            </div>
          </div>

          <div className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم اللوحة *</label>
                  <input value={form.plateNumber} onChange={e => setForm({ ...form, plateNumber: e.target.value })}
                    placeholder="12345"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-amber-500 text-center text-2xl font-bold tracking-widest font-mono" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">النوع *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-amber-500">
                    {plateTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">السعر (دينار) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="0" min="0"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-amber-500" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم الهاتف *</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="07XXXXXXXX"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-amber-500" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم واتساب</label>
                  <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="07XXXXXXXX"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-amber-500" />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isNegotiable} onChange={e => setForm({ ...form, isNegotiable: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">قابل للتفاوض</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">وصف (اختياري)</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="اكتب وصفاً للوحة..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-amber-500 min-h-[100px] resize-y" />
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="ghost" onClick={() => router.push('/plates')}>
                  <ChevronLeft className="w-4 h-4" /> رجوع
                </Button>
                <Button type="submit" loading={loading} icon={<Plus className="w-4 h-4" />}>
                  إضافة اللوحة
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
