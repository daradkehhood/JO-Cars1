'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, Eye, Calendar, Tag, MapPin, DollarSign, Loader2, ArrowLeft, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDate } from '@/lib/utils';
import type { WantedAd } from '@/types';
import toast from 'react-hot-toast';

export default function WantedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [ad, setAd] = useState<WantedAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOffer, setShowOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({ name: user?.name || '', phone: user?.phone || '', carDetails: '', price: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/wanted/${params.id}`).then(r => r.json()).then(d => {
      if (d.success) setAd(d.data);
      setLoading(false);
    });
  }, [params.id]);

  const handleOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch(`/api/wanted/${params.id}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offerForm),
    });
    const d = await res.json();
    if (d.success) { toast.success('تم إرسال العرض'); setShowOffer(false); setOfferForm({ name: '', phone: '', carDetails: '', price: '', description: '' }); }
    else toast.error('فشل إرسال العرض');
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!confirm('حذف الإعلان؟')) return;
    const res = await fetch(`/api/wanted/${params.id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { toast.success('تم الحذف'); router.push('/wanted'); }
    else toast.error('فشل');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!ad) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">غير موجود</p></div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-3xl">
        <Link href="/wanted" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> إعلانات الطلب
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold">{ad.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ad.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
              {ad.status === 'ACTIVE' ? 'نشط' : ad.status === 'FOUND' ? 'تم العثور' : 'مغلق'}
            </span>
          </div>

          {ad.description && <p className="text-gray-600 dark:text-gray-400 mb-6 whitespace-pre-wrap">{ad.description}</p>}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {ad.brand && <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl"><span className="block text-xs text-gray-500 mb-1">الماركة</span><span className="font-medium text-sm">{ad.brand.nameAr}</span></div>}
            {ad.model && <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl"><span className="block text-xs text-gray-500 mb-1">الموديل</span><span className="font-medium text-sm">{ad.model.nameAr}</span></div>}
            {ad.yearFrom && <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl"><span className="block text-xs text-gray-500 mb-1">سنة</span><span className="font-medium text-sm">{ad.yearFrom}{ad.yearTo ? ` - ${ad.yearTo}` : ' فأقل'}</span></div>}
            {ad.maxPrice && <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl"><span className="block text-xs text-gray-500 mb-1">السعر</span><span className="font-medium text-sm text-blue-600">{formatPrice(ad.maxPrice)}</span></div>}
            {ad.city && <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl"><span className="block text-xs text-gray-500 mb-1">المدينة</span><span className="font-medium text-sm">{ad.city.nameAr}</span></div>}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl"><span className="block text-xs text-gray-500 mb-1">المشاهدات</span><span className="font-medium text-sm">{ad.views}</span></div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl"><span className="block text-xs text-gray-500 mb-1">العروض</span><span className="font-medium text-sm">{ad._count?.offers || 0}</span></div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl"><span className="block text-xs text-gray-500 mb-1">تاريخ النشر</span><span className="font-medium text-sm">{formatDate(ad.createdAt)}</span></div>
          </div>

          <div className="flex flex-wrap gap-3">
            {ad.phone && (
              <a href={`tel:${ad.phone}`} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
                <Phone className="w-4 h-4" /> اتصال
              </a>
            )}
            {ad.whatsapp && (
              <a href={`https://wa.me/${ad.whatsapp.replace(/^0|\D/g, '')}`} target="_blank" className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600">
                <MessageCircle className="w-4 h-4" /> واتساب
              </a>
            )}
            {ad.status === 'ACTIVE' && (
              <button onClick={() => setShowOffer(!showOffer)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                <Send className="w-4 h-4" /> لدي سيارة
              </button>
            )}
            {user && (user.id === ad.userId || user.role === 'ADMIN') && (
              <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-600 rounded-xl text-sm font-medium hover:bg-red-500/20">
                <Trash2 className="w-4 h-4" /> حذف
              </button>
            )}
          </div>
        </motion.div>

        {showOffer && (
          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleOffer} className="card p-6 mt-4">
            <h2 className="font-bold text-lg mb-4">تقديم عرض</h2>
            <div className="space-y-3">
              <input type="text" required value={offerForm.name} onChange={e => setOfferForm(p => ({ ...p, name: e.target.value }))} placeholder="اسمك" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
              <input type="text" required value={offerForm.phone} onChange={e => setOfferForm(p => ({ ...p, phone: e.target.value }))} placeholder="رقم الهاتف" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
              <input type="text" required value={offerForm.carDetails} onChange={e => setOfferForm(p => ({ ...p, carDetails: e.target.value }))} placeholder="تفاصيل السيارة (ماركة - موديل - سنة)" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
              <input type="number" value={offerForm.price} onChange={e => setOfferForm(p => ({ ...p, price: e.target.value }))} placeholder="السعر المطلوب (اختياري)" className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
              <textarea value={offerForm.description} onChange={e => setOfferForm(p => ({ ...p, description: e.target.value }))} placeholder="ملاحظات إضافية (اختياري)" rows={3} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-500" />
              <button type="submit" disabled={submitting} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'جاري الإرسال...' : 'إرسال العرض'}
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}
