'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, MapPin, Eye, Calendar, ChevronLeft, ChevronRight, Loader2, Shield, CheckCircle, Trash2 } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { UsedPart } from '@/types';
import toast from 'react-hot-toast';

const PART_TYPES: Record<string, string> = {
  engine: 'محرك', transmission: 'جير', body: 'هيكل', electrical: 'كهرباء',
  suspension: 'تعليق', brake: 'فرامل', cooling: 'تبريد', exhaust: 'عادم',
  interior: 'داخلي', wheel: 'جنط', turbo: 'توربو', ac: 'مكيف', other: 'أخرى',
};

const CONDITIONS: Record<string, string> = {
  NEW: 'جديد', USED: 'مستعمل', REFURBISHED: 'مُجدد',
};

export default function PartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [part, setPart] = useState<UsedPart | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const id = params.id;
    fetch(`/api/parts/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) { setPart(data.data); document.title = `${data.data.title} | قطع غيار`; }
        else { toast.error('القطعة غير موجودة'); router.push('/parts'); }
      })
      .catch(() => { toast.error('فشل التحميل'); router.push('/parts'); })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const getImages = (): string[] => {
    if (!part) return [];
    try { return JSON.parse(part.images || '[]'); } catch { return []; }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!part) return null;

  const images = getImages();

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Images */}
          <div className="lg:col-span-3">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
              {images.length > 0 ? (
                <img src={images[currentImage]} alt={part.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Shield className="w-20 h-20" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setCurrentImage(i => Math.max(0, i - 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center hover:bg-white">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentImage(i => Math.min(images.length - 1, i + 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center hover:bg-white">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 ${i === currentImage ? 'border-blue-500' : 'border-transparent'}`}>
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {PART_TYPES[part.partType] || part.partType}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {CONDITIONS[part.condition] || part.condition}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{part.title}</h1>
              <p className="text-3xl font-bold text-blue-500 mt-3">{formatPrice(part.price)}</p>
              {part.isNegotiable && <p className="text-sm text-green-500 mt-1">قابل للتفاوض</p>}
            </div>

            {part.description && (
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{part.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {part.brand && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-gray-500">العلامة</p>
                  <p className="font-medium text-gray-900 dark:text-white">{part.brand.nameAr}</p>
                </div>
              )}
              {part.partNumber && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-gray-500">رقم القطعة</p>
                  <p className="font-medium text-gray-900 dark:text-white" dir="ltr">{part.partNumber}</p>
                </div>
              )}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-gray-500">الكمية</p>
                <p className="font-medium text-gray-900 dark:text-white">{part.quantity}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-gray-500">المشاهدات</p>
                <p className="font-medium text-gray-900 dark:text-white">{part.views}</p>
              </div>
            </div>

            {/* Seller Card */}
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  {part.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{part.user?.dealerName || part.user?.name}</p>
                </div>
              </div>
              <div className="space-y-2">
                <a href={`tel:${part.phone}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-all">
                  <Phone className="w-4 h-4" /> {part.phone}
                </a>
                {part.whatsapp && (
                  <a href={`https://wa.me/${part.whatsapp.replace(/^0/, '962')}`} target="_blank"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-all">
                    <MessageCircle className="w-4 h-4" /> واتساب
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>نُشر {formatDate(part.createdAt)}</span>
              {part.city && (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{part.city.nameAr}</span>
                </>
              )}
            </div>

            {user && user.id === part.user.id && (
              <button onClick={async () => {
                if (!confirm('حذف القطعة؟')) return;
                const res = await fetch(`/api/parts/${part.id}`, { method: 'DELETE' });
                const d = await res.json();
                if (d.success) { toast.success('تم الحذف'); router.push('/parts'); }
                else toast.error('فشل');
              }}
                className="w-full py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 text-sm font-medium hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> حذف
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
