'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Hammer, Clock, TrendingUp, Loader2, Trophy, Plus, XCircle, ExternalLink, Gavel } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  user: { id: string; name: string; image?: string | null };
}

interface Auction {
  id: string;
  startingPrice: number;
  currentPrice: number;
  minBidIncrement: number;
  startDate: string;
  endDate: string;
  status: string;
  bids: Bid[];
  seller: { id: string; name: string };
  winner: { id: string; name: string } | null;
  myLastBid: Bid | null;
}

export function AuctionSection({ carId, carUserId, isOwner }: { carId: string; carUserId: string; isOwner?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newStartPrice, setNewStartPrice] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [creating, setCreating] = useState(false);

  const loadAuction = () => {
    fetch(`/api/auctions/${carId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) { setAuction(data.data); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadAuction(); }, [carId]);

  const createAuction = async () => {
    if (!newStartPrice || !newEndDate) return;
    setCreating(true);
    try {
      const res = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId, startingPrice: parseFloat(newStartPrice), endDate: newEndDate }),
      });
      const data = await res.json();
      if (data.success) { toast.success('تم إنشاء المزاد'); setShowCreate(false); loadAuction(); }
      else toast.error(data.error || 'فشل');
    } catch { toast.error('فشل'); }
    setCreating(false);
  };

  const endAuction = async () => {
    if (!auction || !confirm('إنهاء المزاد؟')) return;
    const res = await fetch(`/api/auctions/${auction.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ENDED' }),
    });
    const data = await res.json();
    if (data.success) { toast.success('تم إنهاء المزاد'); loadAuction(); }
    else toast.error('فشل');
  };

  const remaining = auction ? new Date(auction.endDate).getTime() - Date.now() : 0;
  const isExpired = remaining <= 0;
  const isSeller = user && user.id === carUserId;

  if (loading) return <div className="card p-5"><Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500" /></div>;

  return (
    <div className={`${isOwner ? '' : 'card p-5'} overflow-hidden`}>
      {!isOwner && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Hammer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">المزاد</h3>
            {auction && (
              <p className={`text-xs ${isExpired ? 'text-red-500' : 'text-green-500'}`}>
                {auction.status === 'ACTIVE' && !isExpired ? 'مفتوح' : auction.status === 'ENDED' ? 'منتهي' : 'ملغي'}
              </p>
            )}
          </div>
        </div>
      )}

      {!auction ? (
        isOwner ? (
          <div>
            {showCreate ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">إنشاء مزاد</h4>
                <input type="number" value={newStartPrice} onChange={e => setNewStartPrice(e.target.value)} placeholder="السعر المبدئي" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                <input type="datetime-local" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                <div className="flex gap-2">
                  <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm">إلغاء</button>
                  <button onClick={createAuction} disabled={creating || !newStartPrice || !newEndDate} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'إنشاء'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowCreate(true)} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> إنشاء مزاد
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">لا يوجد مزاد نشط</p>
        )
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">السعر الحالي</p>
              <p className="text-xl font-bold text-amber-600">{formatPrice(auction.currentPrice)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">المزايدات</p>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{auction.bids.length}</p>
            </div>
          </div>

          {auction.status === 'ACTIVE' && !isExpired && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400" dir="ltr">
                ينتهي في {formatDate(auction.endDate)}
              </span>
            </div>
          )}

          {auction.status === 'ENDED' && auction.winner && (
            <div className="flex items-center justify-center gap-2 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <Trophy className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">الفائز: {auction.winner.name}</span>
            </div>
          )}

          {auction.status === 'ACTIVE' && !isExpired && !isSeller && (
            <button
              onClick={() => router.push(`/auction/${carId}`)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Gavel className="w-5 h-5" /> مشاركة في المزاد
            </button>
          )}

          {!user && auction.status === 'ACTIVE' && !isExpired && !isSeller && (
            <p className="text-xs text-gray-500 text-center -mt-2">سجل الدخول للمشاركة</p>
          )}

          {isOwner && auction.status === 'ACTIVE' && !isExpired && (
            <button onClick={endAuction} className="w-full py-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center gap-1">
              <XCircle className="w-3 h-3" /> إنهاء المزاد
            </button>
          )}

          {auction.bids.length > 0 && (
            <button
              onClick={() => router.push(`/auction/${carId}`)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 w-full justify-center py-2"
            >
              <ExternalLink className="w-3 h-3" />
              عرض كل المزايدات ({auction.bids.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
