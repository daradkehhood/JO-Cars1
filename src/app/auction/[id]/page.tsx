'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hammer, Clock, TrendingUp, Trophy, Gavel, ArrowLeft, Loader2,
  Fuel, Gauge, Calendar, Settings, Palette, DoorOpen, Cpu, Bike,
  MapPin, ChevronLeft, ChevronRight, Phone, MessageCircle, User,
  Zap, Award,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDistance, formatDate, getFuelTypeLabel, getTransmissionLabel, getDrivetrainLabel, getConditionLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  userId: string;
  user: { id: string; name: string; image?: string | null };
}

interface AuctionData {
  id: string;
  startingPrice: number;
  currentPrice: number;
  minBidIncrement: number;
  startDate: string;
  endDate: string;
  status: string;
  sellerId: string;
  winnerId: string | null;
  bids: Bid[];
  seller: { id: string; name: string };
  winner: { id: string; name: string } | null;
  myLastBid: Bid | null;
  car: {
    id: string; slug: string; year: number; price: number; coverImage: string | null;
    images: { url: string }[] | null;
    kilometers: number; fuelType: string; transmission: string; drivetrain: string | null;
    color: string | null; doors: number | null; engineCapacity: number | null;
    condition: string; description: string | null;
    brand: { nameAr: string; nameEn: string | null };
    model: { nameAr: string; nameEn: string | null };
    city: { nameAr: string };
    user: { id: string; name: string; dealerName: string | null; phone: string | null; whatsapp: string | null };
  };
}

export default function AuctionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [bidError, setBidError] = useState('');

  const loadAuction = useCallback(() => {
    fetch(`/api/auctions/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAuction(data.data);
          const minBid = data.data.currentPrice + data.data.minBidIncrement;
          setBidAmount(prev => prev || String(minBid));
          if (data.data.status === 'ACTIVE' && new Date(data.data.endDate) > new Date()) {
            setBidError('');
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadAuction(); }, [loadAuction]);

  useEffect(() => {
    if (!auction || auction.status !== 'ACTIVE' || new Date(auction.endDate) <= new Date()) return;
    const interval = setInterval(loadAuction, 5000);
    return () => clearInterval(interval);
  }, [auction?.id, auction?.status, auction?.endDate, loadAuction]);

  const placeBid = async () => {
    if (!auction || !bidAmount) return;
    const amount = parseFloat(bidAmount);
    const minBid = auction.currentPrice + auction.minBidIncrement;
    if (amount < minBid) { setBidError(`الحد الأدنى للمزايدة ${formatPrice(minBid)}`); return; }
    setBidError('');
    setBidding(true);
    try {
      const res = await fetch(`/api/auctions/${auction.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم تقديم المزايدة');
        setBidAmount('');
        loadAuction();
      } else toast.error(data.error || 'فشل');
    } catch { toast.error('فشل'); }
    setBidding(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل المزاد...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Hammer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">المزاد غير موجود</p>
          <Link href="/cars" className="text-blue-500 text-sm mt-2 inline-block">العودة للسيارات</Link>
        </div>
      </div>
    );
  }

  const car = auction.car;
  const allImages: { url: string }[] = Array.isArray(car?.images) && car.images.length > 0 ? car.images : (car?.coverImage ? [{ url: car.coverImage }] : []);
  const remaining = new Date(auction.endDate).getTime() - Date.now();
  const isExpired = remaining <= 0;
  const isSeller = user && user.id === auction.sellerId;
  const isWinner = auction.status === 'ENDED' && user && user.id === auction.winnerId;
  const minNextBid = auction.currentPrice + auction.minBidIncrement;

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  const specItems = [
    { icon: Calendar, label: 'سنة الصنع', value: car?.year },
    { icon: Gauge, label: 'كيلومترات', value: formatDistance(car?.kilometers) },
    { icon: Fuel, label: 'الوقود', value: getFuelTypeLabel(car?.fuelType) },
    { icon: Settings, label: 'القير', value: getTransmissionLabel(car?.transmission) },
    { icon: Palette, label: 'اللون', value: car?.color },
    { icon: DoorOpen, label: 'الأبواب', value: car?.doors },
    { icon: Cpu, label: 'المحرك', value: car?.engineCapacity ? `${car.engineCapacity} CC` : 'غير محدد' },
    { icon: Bike, label: 'الدفع', value: getDrivetrainLabel(car?.drivetrain || '') },
    { icon: MapPin, label: 'المحافظة', value: car?.city?.nameAr },
  ];

  return (
    <div className="min-h-screen pb-16">
      <div className="container-custom">
        {/* Back button */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm mt-4 mb-4">
          <ArrowLeft className="w-4 h-4" /> رجوع
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left side - Car Images + Specs */}
          <div className="lg:col-span-3 space-y-6">
            {/* Hero Image */}
            <div className="relative h-[50vh] min-h-[350px] rounded-3xl overflow-hidden group">
              {allImages.length > 0 ? (
                <>
                  <Image
                    src={allImages[currentImage]?.url || '/images/placeholder-car.svg'}
                    alt={`${car?.brand?.nameAr} ${car?.model?.nameAr}`}
                    fill
                    className="object-cover"
                    priority
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
                  {allImages.length > 1 && (
                    <>
                      <button onClick={() => setCurrentImage(prev => (prev - 1 + allImages.length) % allImages.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={() => setCurrentImage(prev => (prev + 1) % allImages.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    {allImages.slice(0, 5).map((_, i) => (
                      <button key={i} onClick={() => setCurrentImage(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === currentImage ? 'w-6 bg-white' : 'bg-white/50'}`} />
                    ))}
                    {allImages.length > 5 && (
                      <span className="text-white/70 text-xs">+{allImages.length - 5}</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                  <p className="text-gray-400">لا توجد صور</p>
                </div>
              )}
              {auction.status === 'ACTIVE' && !isExpired && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30 animate-pulse">
                    <Zap className="w-3.5 h-3.5" />
                    مزاد مباشر
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImage(i)}
                    className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      i === currentImage ? 'border-amber-500 shadow-lg' : 'border-transparent opacity-60 hover:opacity-80'
                    }`}>
                    <Image src={img.url || '/images/placeholder-car.svg'} alt="" width={80} height={56}
                      className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Car Title + Seller */}
            <div className="card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {car?.brand?.nameAr} {car?.model?.nameAr} {car?.year}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">{car?.brand?.nameEn} {car?.model?.nameEn}</p>
                  <p className="text-xs text-gray-400 mt-2">{getConditionLabel(car?.condition)}</p>
                </div>
                <div className="text-left">
                  <Link href={`/cars/${car?.id}`} className="text-sm text-blue-500 hover:text-blue-600">
                    فتح الإعلان كاملاً
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-sm">
                  {car?.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{car?.user?.dealerName || car?.user?.name}</p>
                  <p className="text-xs text-gray-500">صاحب الإعلان</p>
                </div>
              </div>

              {/* Specs grid */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {specItems.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                    <item.icon className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">{item.label}</p>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{item.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {car?.description && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">الوصف</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{car.description}</p>
              </div>
            )}
          </div>

          {/* Right side - Auction Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 sticky top-24">
              {/* Auction Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Hammer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">المزاد</h2>
                  <span className={`text-xs font-medium ${auction.status === 'ACTIVE' && !isExpired ? 'text-green-500' : 'text-red-500'}`}>
                    {auction.status === 'ACTIVE' && !isExpired ? 'مفتوح للمزايدة' : auction.status === 'ENDED' ? 'منتهي' : 'ملغي'}
                  </span>
                </div>
              </div>

              {/* Current Price */}
              <div className="text-center mb-6">
                <p className="text-xs text-gray-500 mb-1">السعر الحالي</p>
                <motion.p
                  key={auction.currentPrice}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-bold text-amber-600"
                >
                  {formatPrice(auction.currentPrice)}
                </motion.p>
                <p className="text-xs text-gray-400 mt-1">السعر المبدئي: {formatPrice(auction.startingPrice)}</p>
              </div>

              {/* Timer */}
              {auction.status === 'ACTIVE' && !isExpired && (
                <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300" dir="ltr">
                    {days > 0 && `${days} ي `}{hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
                  </span>
                </div>
              )}

              {/* Winner announcement */}
              {auction.status === 'ENDED' && auction.winner && (
                <div className="flex items-center justify-center gap-2 mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <Trophy className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">الفائز</p>
                    <p className="text-xs text-green-600 dark:text-green-500">{auction.winner.name}</p>
                  </div>
                </div>
              )}

              {isExpired && auction.status === 'ACTIVE' && (
                <div className="flex items-center justify-center gap-2 mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <Clock className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-600 dark:text-red-400">انتهى الوقت</span>
                </div>
              )}

              {/* Bid form */}
              {auction.status === 'ACTIVE' && !isExpired && !isSeller && (
                <div className="space-y-3 mb-6">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={e => { setBidAmount(e.target.value); setBidError(''); }}
                      placeholder={`الحد الأدنى ${formatPrice(minNextBid)}`}
                      min={minNextBid}
                      step={auction.minBidIncrement}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium text-center"
                    />
                    <button
                      onClick={placeBid}
                      disabled={bidding || !user}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      {bidding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Gavel className="w-5 h-5" />}
                      مزايدة
                    </button>
                  </div>
                  {bidError && <p className="text-xs text-red-500 text-center">{bidError}</p>}
                  {!user && (
                    <Link href="/login" className="block text-xs text-blue-500 text-center">سجل الدخول للمزايدة</Link>
                  )}
                  {user && (
                    <p className="text-xs text-gray-400 text-center">الحد الأدنى للمزايدة: {formatPrice(minNextBid)}</p>
                  )}
                </div>
              )}

              {/* Owner controls */}
              {isSeller && auction.status === 'ACTIVE' && !isExpired && (
                <button onClick={endAuction}
                  className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 mb-6">
                  <Gavel className="w-4 h-4" /> إنهاء المزاد
                </button>
              )}

              {isSeller && auction.status === 'ACTIVE' && isExpired && (
                <button onClick={endAuction}
                  className="w-full py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 mb-6">
                  <Award className="w-4 h-4" /> إعلان الفائز
                </button>
              )}

              {/* Quick Contact */}
              {auction.status === 'ACTIVE' && !isSeller && (
                <div className="flex gap-2 mb-6">
                  {car?.user?.phone && (
                    <a href={`tel:${car.user.phone}`} className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> اتصال
                    </a>
                  )}
                  {car?.user?.whatsapp && (
                    <a href={`https://wa.me/${(car.user.whatsapp || '').replace(/^0/, '962')}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-all flex items-center justify-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" /> واتساب
                    </a>
                  )}
                </div>
              )}

              {/* Bid History */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    سجل المزايدات
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{auction.bids.length}</span>
                </div>

                {auction.bids.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">لا توجد مزايدات بعد</p>
                ) : (
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                    <AnimatePresence>
                      {auction.bids.map((bid, i) => (
                        <motion.div
                          key={bid.id}
                          initial={{ opacity: 0, x: -20, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: 'auto' }}
                          transition={{ delay: i * 0.02 }}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm ${
                            i === 0 ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20' : 'bg-gray-50 dark:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              i === 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                            }`}>
                              {bid.user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-900 dark:text-white">
                                {bid.user.name}
                                {i === 0 && <span className="text-amber-500 mr-1">(أعلى)</span>}
                              </p>
                              <p className="text-[10px] text-gray-400">{formatDate(bid.createdAt)}</p>
                            </div>
                          </div>
                          <span className={`font-bold ${i === 0 ? 'text-amber-600 text-sm' : 'text-gray-700 dark:text-gray-300 text-xs'}`}>
                            {formatPrice(bid.amount)}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
