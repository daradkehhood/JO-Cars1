'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  Phone, MessageCircle, Share2, Eye, Clock, ChevronLeft,
  Loader2, Trash2, Pencil, CheckCircle, AlertTriangle
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Plate } from '@/types';
import toast from 'react-hot-toast';

const plateTypes: Record<string, string> = {
  STANDARD: 'عادي', THREE_DIGIT: '3 أرقام', FOUR_DIGIT: '4 أرقام',
  FIVE_DIGIT: '5 أرقام', SIX_DIGIT: '6 أرقام', CUSTOM: 'مميز',
};
const plateColors: Record<string, string> = {
  STANDARD: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  THREE_DIGIT: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  FOUR_DIGIT: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  FIVE_DIGIT: 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  SIX_DIGIT: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  CUSTOM: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-600 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-400',
};

export default function PlateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [plate, setPlate] = useState<Plate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/plates/${params.id}`)
      .then(r => r.json())
      .then(data => { if (data.success) setPlate(data.data); else router.push('/plates'); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id, router]);

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: `لوحة ${plate?.plateNumber}`, url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); toast.success('تم نسخ الرابط'); }
  };

  const handleDelete = async () => {
    if (!confirm('حذف اللوحة؟')) return;
    try {
      const res = await fetch(`/api/plates/${plate!.id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) { toast.success('تم الحذف'); router.push('/my-plates'); }
      else toast.error(d.error || 'فشل');
    } catch { toast.error('حدث خطأ'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  if (!plate) return null;

  const isOwner = user?.id === plate.sellerId;

  return (
    <div className="min-h-screen pb-16">
      <div className="container-custom py-8">
        <Link href="/plates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ChevronLeft className="w-4 h-4" /> العودة للوحات
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card p-8 text-center">
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold mb-4 ${plateColors[plate.type] || plateColors.STANDARD}`}>
                  {plateTypes[plate.type] || plate.type}
                </span>
                <div className="py-8 mb-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-2 border-amber-200 dark:border-amber-500/20">
                  <p className="text-6xl sm:text-7xl font-bold text-gray-900 dark:text-white tracking-[0.2em] font-mono">{plate.plateNumber}</p>
                </div>
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {plate.views} مشاهدة</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(plate.createdAt).toLocaleDateString('ar-JO')}</span>
                  {plate.isNegotiable && <span className="text-amber-500">قابل للتفاوض</span>}
                </div>
              </div>
            </motion.div>

            {plate.description && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                <div className="card p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">الوصف</h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{plate.description}</p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">السعر</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{formatPrice(plate.price)}</p>
              {plate.isNegotiable && <p className="text-xs text-amber-500 mt-1">قابل للتفاوض</p>}
            </div>

            <div className="card p-6">
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  {plate.seller?.name?.charAt(0) || '?'}
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{plate.seller?.dealerName || plate.seller?.name}</p>
              </div>
              <div className="space-y-2">
                <Button className="w-full" icon={<Phone className="w-4 h-4" />} onClick={() => window.location.href = `tel:${plate.phone}`}>
                  {plate.phone}
                </Button>
                {plate.whatsapp && (
                  <Button className="w-full" variant="secondary" icon={<MessageCircle className="w-4 h-4" />}
                    onClick={() => window.open(`https://wa.me/${(plate.whatsapp || '').replace(/^0/, '962')}`, '_blank')}>
                    واتساب
                  </Button>
                )}
                <Button className="w-full" variant="ghost" icon={<Share2 className="w-4 h-4" />} onClick={handleShare}>
                  مشاركة
                </Button>
              </div>
            </div>

            {isOwner && (
              <div className="card p-6 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">التحكم</h3>
                <Link href={`/my-plates`} className="w-full py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2">
                  <Pencil className="w-4 h-4" /> عرض لوحاتي
                </Link>
                <button onClick={handleDelete} className="w-full py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> حذف اللوحة
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
