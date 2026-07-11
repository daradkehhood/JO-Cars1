'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Hammer, Loader2, Clock, TrendingUp, Trophy, Eye, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AuctionItem {
  id: string;
  startingPrice: number;
  currentPrice: number;
  status: string;
  endDate: string;
  createdAt: string;
  winnerId: string | null;
  car: { id: string; slug: string; year: number; price: number; coverImage: string | null; brand: { nameAr: string }; model: { nameAr: string } };
  _count: { bids: number };
}

export default function MyAuctionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetch('/api/auctions?type=seller')
      .then(r => r.json())
      .then(data => { if (data.success) setAuctions(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Hammer className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold">مزاداتي</h1>
          </div>
          <Link href="/my-bids" className="text-sm text-blue-500 hover:text-blue-600">مشاركتي في المزادات</Link>
        </div>

        {auctions.length === 0 ? (
          <div className="text-center py-20">
            <Hammer className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-gray-500 mb-4">لا توجد مزادات</p>
          </div>
        ) : (
          <div className="space-y-4">
            {auctions.map((item, i) => {
              const isExpired = new Date(item.endDate) < new Date();
              const statusColor = item.status === 'ACTIVE' && !isExpired ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : item.status === 'ENDED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
              const statusLabel = item.status === 'ACTIVE' && !isExpired ? 'نشط' : item.status === 'ENDED' ? 'منتهي' : 'ملغي';

              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                  <div className="flex items-start gap-4">
                    <Link href={`/cars/${item.car.slug || item.car.id}`} className="w-24 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      {item.car.coverImage ? <img src={item.car.coverImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">لا توجد صورة</div>}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Link href={`/cars/${item.car.slug || item.car.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-500">{item.car.brand.nameAr} {item.car.model.nameAr} {item.car.year}</Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                            <span className="text-xs text-gray-500"><TrendingUp className="w-3 h-3 inline ml-1" />{item._count.bids} مزايدة</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-gray-500">الحالي</p>
                          <p className="text-lg font-bold text-amber-600">{formatPrice(item.currentPrice)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
