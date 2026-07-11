'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Cpu, Loader2, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PartItem {
  id: string;
  title: string;
  partType: string;
  condition: string;
  price: number;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  brand?: { nameAr: string } | null;
}

const PART_TYPES: Record<string, string> = {
  engine: 'محرك', transmission: 'جير', body: 'هيكل', electrical: 'كهرباء',
  suspension: 'تعليق', brake: 'فرامل', cooling: 'تبريد', exhaust: 'عادم',
  interior: 'داخلي', wheel: 'جنط', turbo: 'توربو', ac: 'مكيف', other: 'أخرى',
};

export default function AdminPartsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [parts, setParts] = useState<PartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/login'); return; }
    loadParts();
  }, [isAuthenticated, user, router, filter]);

  const loadParts = () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    fetch(`/api/admin/parts${params}`)
      .then(r => r.json())
      .then(data => { setParts(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/parts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const d = await res.json();
    if (d.success) { toast.success('تم التحديث'); loadParts(); }
    else toast.error('فشل');
  };

  const deletePart = async (id: string) => {
    if (!confirm('حذف القطعة نهائياً؟')) return;
    const res = await fetch(`/api/admin/parts/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { toast.success('تم الحذف'); loadParts(); }
    else toast.error('فشل');
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة قطع الغيار</h1>
              <p className="text-gray-500 text-sm">{parts.length} قطعة</p>
            </div>
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm">
            <option value="">الكل</option>
            <option value="PENDING">قيد المراجعة</option>
            <option value="APPROVED">مقبولة</option>
            <option value="REJECTED">مرفوضة</option>
            <option value="SOLD">مباعة</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-right p-3 font-medium text-gray-500">القطعة</th>
                  <th className="text-right p-3 font-medium text-gray-500">النوع</th>
                  <th className="text-right p-3 font-medium text-gray-500">السعر</th>
                  <th className="text-right p-3 font-medium text-gray-500">البائع</th>
                  <th className="text-right p-3 font-medium text-gray-500">الحالة</th>
                  <th className="text-left p-3 font-medium text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {parts.map(p => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="p-3 text-gray-900 dark:text-white font-medium">{p.title}</td>
                    <td className="p-3 text-gray-600">{PART_TYPES[p.partType] || p.partType}</td>
                    <td className="p-3 text-gray-900 dark:text-white">{formatPrice(p.price)}</td>
                    <td className="p-3 text-gray-600">{p.user?.name || p.user?.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                        p.status === 'APPROVED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        p.status === 'REJECTED' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                        p.status === 'SOLD' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {p.status === 'APPROVED' ? 'مقبولة' : p.status === 'REJECTED' ? 'مرفوضة' : p.status === 'SOLD' ? 'مباعة' : 'قيد المراجعة'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 justify-end">
                        {p.status === 'PENDING' && (
                          <>
                            <button onClick={() => updateStatus(p.id, 'APPROVED')}
                              className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => updateStatus(p.id, 'REJECTED')}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {p.status === 'APPROVED' && (
                          <button onClick={() => updateStatus(p.id, 'REJECTED')}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {p.status === 'REJECTED' && (
                          <button onClick={() => updateStatus(p.id, 'APPROVED')}
                            className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => deletePart(p.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
