'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Hammer, Loader2, TrendingUp, Trophy, Gavel, Clock, Users, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDate } from '@/lib/utils';

interface AuctionItem {
  id: string;
  startingPrice: number;
  currentPrice: number;
  status: string;
  endDate: string;
  winnerId: string | null;
  car: { id: string; slug: string; year: number; price: number; coverImage: string | null; brand: { nameAr: string }; model: { nameAr: string } };
  bids?: { amount: number; createdAt: string }[];
  _count: { bids: number };
}

export default function MyBidsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const endpoint = tab === 'all' ? '/api/auctions?type=all' : '/api/auctions?type=bidder';
    fetch(endpoint)
      .then(r => r.json())
      .then(data => { if (data.success) setAuctions(data.data); else setAuctions([]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tab, user]);

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Hammer className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold">المزادات</h1>
          </div>
          <Link href="/my-auctions" className="text-sm text-blue-500 hover:text-blue-600">مزاداتي</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit">
          <button onClick={() => setTab('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <Hammer className="w-4 h-4 inline ml-1.5" />جميع المزادات
          </button>
          {user && (
            <button onClick={() => setTab('mine')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'mine' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <Users className="w-4 h-4 inline ml-1.5" />مشاركتي
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-20">
            <Gavel className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-gray-500">{tab === 'all' ? 'لا توجد مزادات نشطة حالياً' : 'لم تشارك في أي مزاد'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {auctions.map((item, i) => {
              const isExpired = new Date(item.endDate) < new Date();
              const isWinner = item.status === 'ENDED' && item.winnerId === user?.id;
              const myLastBid = item.bids?.[0];

              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className="card p-4 flex items-center gap-4">
                    <Link href={`/cars/${item.car.slug || item.car.id}`} className="w-24 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      {item.car.coverImage ? <img src={item.car.coverImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">لا توجد صورة</div>}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/cars/${item.car.slug || item.car.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-500 text-sm">
                        {item.car.brand.nameAr} {item.car.model.nameAr} {item.car.year}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        {isWinner && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><Trophy className="w-3 h-3 inline ml-0.5" />فائز</span>}
                        {item.status === 'ACTIVE' && !isExpired && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3 h-3 inline ml-0.5" />نشط</span>}
                        {item.status === 'ENDED' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">منتهي</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{item._count.bids} مزايدة</span>
                        <span className="flex items-center gap-1">{formatPrice(item.currentPrice)}</span>
                      </div>
                      {myLastBid && (
                        <p className="text-[11px] text-gray-500 mt-1">مزايدتك: <span className="font-semibold text-amber-600">{formatPrice(myLastBid.amount)}</span></p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {item.status === 'ACTIVE' && !isExpired ? (
                        <Link href={`/auction/${item.car.id}`} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold hover:opacity-90 transition-all shadow-lg shadow-amber-500/20">
                          <Gavel className="w-4 h-4" /> مشاركة
                        </Link>
                      ) : (
                        <Link href={`/auction/${item.car.id}`} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                          <ExternalLink className="w-3.5 h-3.5" /> النتيجة
                        </Link>
                      )}
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