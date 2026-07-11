'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Car, CheckCircle, XCircle, Eye, Star, Sparkles, Trash2, Tag, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Car as CarType } from '@/types';

export default function AdminCarsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [plans, setPlans] = useState<{ id: string; nameAr: string; durationDays: number; price: number; isActive: boolean }[]>([]);
  const [featureModal, setFeatureModal] = useState<{ carId: string; open: boolean }>({ carId: '', open: false });
  const [selectedPlan, setSelectedPlan] = useState('');
  const [availableTags, setAvailableTags] = useState<{ id: string; nameAr: string; slug: string; color: string }[]>([]);
  const [tagModal, setTagModal] = useState<{ carId: string; open: boolean }>({ carId: '', open: false });
  const [carTagsMap, setCarTagsMap] = useState<Record<string, string[]>>({});

  const loadCars = (q: string) => {
    setLoading(true);
    const params = q ? `?search=${encodeURIComponent(q)}` : '';
    Promise.all([
      fetch(`/api/admin/cars${params}`).then(r => r.json()),
      fetch('/api/admin/plans').then(r => r.json()),
      fetch('/api/admin/tags').then(r => r.json()),
    ]).then(([carsData, plansData, tagsData]) => {
      setCars(carsData.data || []);
      setPlans(plansData.data || []);
      setAvailableTags((tagsData.data || []).filter((t: any) => t.isActive));
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/'); return; }
    loadCars('');
  }, [isAuthenticated, user, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    loadCars(searchInput);
  };

  const updateStatus = async (carId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/cars/${carId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setCars(cars.map(c => c.id === carId ? { ...c, status } as CarType : c));
        toast.success(`تم ${status === 'APPROVED' ? 'قبول' : status === 'REJECTED' ? 'رفض' : 'تحديث'} الإعلان`);
      }
    } catch { toast.error('فشل التحديث'); }
  };

  const handleFeature = async () => {
    if (!selectedPlan) { toast.error('اختر باقة أولاً'); return; }
    try {
      const res = await fetch(`/api/admin/cars/${featureModal.carId}/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan }),
      });
      if (res.ok) {
        toast.success('تم تمييز الإعلان');
        setFeatureModal({ carId: '', open: false });
        setSelectedPlan('');
        const carsRes = await fetch('/api/admin/cars');
        const data = await carsRes.json();
        setCars(data.data || []);
      } else { toast.error('فشل التمييز'); }
    } catch { toast.error('فشل التمييز'); }
  };

  const removeFeatured = async (carId: string) => {
    if (!confirm('إلغاء تمييز هذا الإعلان؟')) return;
    try {
      const res = await fetch(`/api/admin/cars/${carId}/feature`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم إلغاء التمييز');
        setCars(cars.map(c => c.id === carId ? { ...c, featured: false, featuredUntil: null } as CarType : c));
      }
    } catch { toast.error('فشل'); }
  };

  const deleteCar = async (carId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      const res = await fetch(`/api/admin/cars/${carId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف الإعلان');
        setCars(cars.filter(c => c.id !== carId));
      } else {
        const data = await res.json();
        toast.error(data.error || 'فشل الحذف');
      }
    } catch { toast.error('فشل حذف الإعلان'); }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        <div className="flex items-center gap-3 mb-6">
          <Car className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة السيارات</h1>
        </div>

        <form onSubmit={handleSearch} className="relative mb-4">
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="بحث برقم الإعلان (Ref Code) أو اسم البائع أو البريد..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 pr-10 pl-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" />
          <button type="submit" className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
            <Search className="w-4 h-4" />
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); loadCars(''); }}
              className="absolute left-12 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              إلغاء
            </button>
          )}
        </form>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="text-right p-4 text-sm text-gray-500">السيارة</th>
                    <th className="text-right p-4 text-sm text-gray-500">الرمز</th>
                    <th className="text-right p-4 text-sm text-gray-500">البائع</th>
                    <th className="text-right p-4 text-sm text-gray-500">السعر</th>
                    <th className="text-right p-4 text-sm text-gray-500">مميزة</th>
                    <th className="text-right p-4 text-sm text-gray-500">الحالة</th>
                    <th className="text-left p-4 text-sm text-gray-500">إجراءات</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {cars.map(car => (
                  <tr key={car.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{car.brand?.nameAr} {car.model?.nameAr} {car.year}</td>
                    <td className="p-4">
                      {car.refCode ? (
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">{car.refCode}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500 text-sm">{car.user?.dealerName || car.user?.name || 'غير معروف'}</td>
                    <td className="p-4 text-gray-500">{car.price?.toLocaleString()} د.أ</td>
                    <td className="p-4">
                      {car.featured ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 text-xs font-semibold">
                          <Star className="w-3 h-3" /> مميزة
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        car.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-500/10 text-green-600' :
                        car.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600' :
                        car.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-500/10 text-red-600' : ''
                      }`}>
                        {car.status === 'APPROVED' ? 'مقبول' : car.status === 'PENDING' ? 'قيد المراجعة' : 'مرفوض'}
                      </span>
                    </td>
                    <td className="p-4 text-left">
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/cars/${car.slug || car.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {car.status === 'APPROVED' && (
                          car.featured ? (
                            <Button variant="ghost" size="sm" onClick={() => removeFeatured(car.id)}>
                              <Sparkles className="w-4 h-4 text-gray-400" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => setFeatureModal({ carId: car.id, open: true })}>
                              <Star className="w-4 h-4 text-amber-400" />
                            </Button>
                          )
                        )}
                        <Button variant="ghost" size="sm" onClick={() => {
                          setTagModal({ carId: car.id, open: true });
                          fetch(`/api/car-tags?carId=${car.id}`)
                            .then(r => r.json())
                            .then(data => setCarTagsMap(prev => ({ ...prev, [car.id]: (data.data || []).map((t: any) => t.id) })));
                        }}>
                          <Tag className="w-4 h-4 text-purple-400" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteCar(car.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                        {car.status === 'PENDING' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => updateStatus(car.id, 'APPROVED')}>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => updateStatus(car.id, 'REJECTED')}>
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {featureModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setFeatureModal({ carId: '', open: false })}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">تمييز الإعلان</h2>
            <p className="text-sm text-gray-500 mb-4">اختر الباقة المناسبة لتمييز هذا الإعلان</p>
            <div className="space-y-3 mb-6">
              {plans.filter(p => p.isActive !== false).map(plan => (
                <label key={plan.id}
                  className={`block p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedPlan === plan.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-200'
                  }`}>
                  <input type="radio" name="plan" value={plan.id} checked={selectedPlan === plan.id}
                    onChange={e => setSelectedPlan(e.target.value)} className="sr-only" />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{plan.nameAr}</div>
                      <div className="text-sm text-gray-500">{plan.durationDays} يوم</div>
                    </div>
                    <div className="text-lg font-bold text-blue-500">{plan.price} د.أ</div>
                  </div>
                </label>
              ))}
              {plans.length === 0 && (
                <p className="text-center text-gray-400 py-4">لا توجد باقات متاحة. أضف باقات أولاً من صفحة الباقات.</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={handleFeature} disabled={!selectedPlan}>تأكيد التمييز</Button>
              <Button variant="ghost" onClick={() => setFeatureModal({ carId: '', open: false })}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}

      {tagModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setTagModal({ carId: '', open: false })}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Tag className="w-5 h-5 text-purple-500" /> إدارة الوسوم</h2>
            <p className="text-sm text-gray-500 mb-4">اختر الوسوم المناسبة لهذه السيارة</p>
            <div className="space-y-3 mb-6">
              {availableTags.length === 0 ? (
                <p className="text-center text-gray-400 py-4">لا توجد وسوم متاحة. أضف وسوماً أولاً من <a href="/admin/tags" className="text-purple-500 underline">صفحة الوسوم</a></p>
              ) : (
                availableTags.map(tag => {
                  const isAssigned = (carTagsMap[tagModal.carId] || []).includes(tag.id);
                  return (
                    <label key={tag.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isAssigned
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-200'
                      }`}>
                      <input type="checkbox" checked={isAssigned} onChange={async () => {
                        try {
                          if (isAssigned) {
                            const res = await fetch('/api/car-tags', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ carId: tagModal.carId, tagId: tag.id }),
                            });
                            if (res.ok) {
                              setCarTagsMap(prev => ({ ...prev, [tagModal.carId]: (prev[tagModal.carId] || []).filter(id => id !== tag.id) }));
                              toast.success('تم إزالة الوسم');
                            }
                          } else {
                            const res = await fetch('/api/car-tags', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ carId: tagModal.carId, tagId: tag.id }),
                            });
                            if (res.ok) {
                              setCarTagsMap(prev => ({ ...prev, [tagModal.carId]: [...(prev[tagModal.carId] || []), tag.id] }));
                              toast.success('تم إضافة الوسم');
                            }
                          }
                        } catch { toast.error('فشل'); }
                      }}
                        className="w-5 h-5 rounded border-gray-300 text-purple-500 focus:ring-purple-500" />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{tag.nameAr}</span>
                    </label>
                  );
                })
              )}
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setTagModal({ carId: '', open: false })}>إغلاق</Button>
          </div>
        </div>
      )}
    </div>
  );
}
