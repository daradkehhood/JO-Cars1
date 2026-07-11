'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Crown, Star, Check, X, Loader2, Clock, Mail, Phone, Car, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface PremiumRequestItem {
  id: string;
  type: string;
  status: string;
  notes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  car: {
    id: string; slug: string; price: number; year: number;
    brand: { nameAr: string };
    model: { nameAr: string };
    images: { url: string }[];
  };
  user: { id: string; name: string; email: string; phone: string | null };
}

export default function AdminPremiumRequestsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<PremiumRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    loadRequests();
  }, [isAuthenticated, user, router, filter]);

  const loadRequests = () => {
    const params = filter ? `?status=${filter}` : '';
    fetch(`/api/admin/premium-requests${params}`)
      .then(r => r.json())
      .then(data => { setRequests(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !confirm('رفض الطلب؟')) return;
    try {
      const res = await fetch('/api/admin/premium-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(action === 'APPROVE' ? 'تم قبول الطلب' : 'تم رفض الطلب');
        loadRequests();
      } else {
        toast.error(d.error || 'فشل');
      }
    } catch { toast.error('حدث خطأ'); }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'FEATURE': return { icon: Star, label: 'تمييز', color: 'text-amber-500' };
      case 'PIN': return { icon: Crown, label: 'تثبيت', color: 'text-purple-500' };
      default: return { icon: Star, label: type, color: 'text-gray-500' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: 'معلق', color: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600' };
      case 'APPROVED': return { label: 'مقبول', color: 'bg-green-100 dark:bg-green-500/10 text-green-600' };
      case 'REJECTED': return { label: 'مرفوض', color: 'bg-red-100 dark:bg-red-500/10 text-red-600' };
      default: return { label: status, color: 'bg-gray-100 dark:bg-gray-800 text-gray-500' };
    }
  };

  const filters = [
    { value: 'PENDING', label: 'معلق' },
    { value: 'APPROVED', label: 'مقبول' },
    { value: 'REJECTED', label: 'مرفوض' },
    { value: '', label: 'الكل' },
  ];

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الطلبات المميزة</h1>
            <p className="text-sm text-gray-500">طلبات تمييز وتثبيت الإعلانات من المستخدمين</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {filters.map(f => (
          <button key={f.value} onClick={() => { setFilter(f.value); setLoading(true); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              filter === f.value
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16"><Star className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">لا توجد طلبات</p></div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const typeInfo = getTypeIcon(req.type);
            const TypeIcon = typeInfo.icon;
            const statusBadge = getStatusBadge(req.status);

            return (
              <div key={req.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {req.car.images[0]?.url ? (
                        <img src={req.car.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageOff className="w-5 h-5 text-gray-300" /></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Link href={`/cars/${req.car.slug}`} className="font-semibold text-gray-900 dark:text-white hover:text-amber-500 transition-colors">
                        {req.car.brand.nameAr} {req.car.model.nameAr} {req.car.year}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><TypeIcon className={`w-4 h-4 ${typeInfo.color}`} /> {typeInfo.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>{statusBadge.label}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(req.createdAt).toLocaleDateString('ar-JO')}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-gray-500"><Mail className="w-3.5 h-3.5" /> {req.user.name}</span>
                        {req.user.phone && <span className="flex items-center gap-1 text-gray-500"><Phone className="w-3.5 h-3.5" /> {req.user.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {req.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleAction(req.id, 'APPROVE')}
                          className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-all flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> قبول
                        </button>
                        <button onClick={() => handleAction(req.id, 'REJECT')}
                          className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all flex items-center gap-1.5">
                          <X className="w-4 h-4" /> رفض
                        </button>
                      </>
                    )}
                    {req.status !== 'PENDING' && (
                      <span className="text-xs text-gray-400">
                        {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString('ar-JO') : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
