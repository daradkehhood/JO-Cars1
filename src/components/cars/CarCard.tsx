'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, MapPin, Eye, Fuel, Gauge, Calendar, Shield, Camera, Settings, Flag } from 'lucide-react';
import { cn, formatPrice, formatDistance, getFuelTypeLabel, getTransmissionLabel, formatDate } from '@/lib/utils';
import type { Car } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { ReportModal } from '@/components/cars/ReportModal';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { PriceFairnessBadge } from '@/components/cars/PriceFairnessIndicator';
import { StarRating } from '@/components/ratings/StarRating';

interface CarCardProps {
  car: Car;
  featured?: boolean;
  index?: number;
}

export function CarCard({ car, featured, index = 0 }: CarCardProps) {
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(car.isFavorited || false);
  const [saving, setSaving] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const isPending = car.status === 'PENDING';

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || saving) return;
    setSaving(true);
    const prev = isSaved;
    setIsSaved(!isSaved);
    try {
      const res = await fetch('/api/cars/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId: car.id }),
      });
      const data = await res.json();
      if (!data.success) setIsSaved(prev);
    } catch {
      setIsSaved(prev);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/cars/${car.slug || car.id}`} className="group block">
        <div className={cn(
          'relative rounded-2xl overflow-hidden bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 transition-all duration-500',
          featured 
            ? 'shadow-xl shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1'
            : 'shadow-sm hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/30 hover:-translate-y-1'
        )}>
          {featured && (
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[11px] font-bold shadow-lg shadow-amber-500/30">
                <Shield className="w-3 h-3" />
                مميزة
              </span>
            </div>
          )}

          {(car as any).auction?.status === 'ACTIVE' && new Date((car as any).auction.endDate) > new Date() && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/90 text-white text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                مزاد
              </span>
            </div>
          )}
          {car.status === 'SOLD' && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/90 text-white text-[11px] font-bold">
                تم البيع
              </span>
            </div>
          )}
          {isPending && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/90 text-white text-[11px] font-bold">
                قيد المراجعة
              </span>
            </div>
          )}
          {car.refCode && (
            <div className="absolute bottom-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono font-bold backdrop-blur-sm">
                {car.refCode}
              </span>
            </div>
          )}

          {car.fairPriceEstimate && car.status === 'ACTIVE' && (
            <div className="absolute top-3 left-3 z-10">
              <PriceFairnessBadge price={car.price} fairPriceEstimate={car.fairPriceEstimate} />
            </div>
          )}

          {car.images && car.images.length > 0 && car.images[0] ? (
            <div className="relative h-56 overflow-hidden">
              <Image
                src={car.images[0].url || car.coverImage || '/images/placeholder-car.svg'}
                alt={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''}`}
                fill
                className="object-cover transition-all duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                <span className="inline-flex items-center gap-1.5 text-white text-xs bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                  <Camera className="w-3 h-3" />
                  {car.images.length} صورة
                </span>
              </div>
              {car.coverImage && !car.images[0] && (
                <Image
                  src={car.coverImage}
                  alt={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''}`}
                  fill
                  className="object-cover transition-all duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              )}
            </div>
          ) : car.coverImage ? (
            <div className="relative h-56 overflow-hidden">
              <Image
                src={car.coverImage}
                alt={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''}`}
                fill
                className="object-cover transition-all duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto mb-2">
                  <Settings className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">لا توجد صور</p>
              </div>
            </div>
          )}

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight group-hover:text-blue-500 transition-colors">
                {car.brand?.nameAr || ''} {car.model?.nameAr || ''} {car.year}
              </h3>
              <div className="flex items-center gap-1.5">
                {car.isNew && (
                  <span className="px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-[10px] font-semibold">
                    جديد
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs">
              <MapPin className="w-3 h-3" />
              {car.city?.nameAr || 'الاردن'}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5" />
                {getFuelTypeLabel(car.fuelType)}
              </span>
              <span className="flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5" />
                {formatDistance(car.kilometers)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {car.year}
              </span>
              {car.transmission && (
                <span className="flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5" />
                  {getTransmissionLabel(car.transmission)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(car.price)}
                  </span>
                  {car.isNegotiable && (
                    <span className="text-xs text-blue-500 font-medium">قابل للتفاوض</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {(car as any).auction?.status === 'ACTIVE' && new Date((car as any).auction.endDate) > new Date() && (
                    <span className="text-xs text-amber-600 font-medium">مزاد: {formatPrice((car as any).auction.currentPrice)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {car.views || 0}
                </span>
                {isAuthenticated && (
                  <button
                    onClick={toggleFavorite}
                    className={`p-1.5 rounded-lg transition-colors ${isSaved ? 'bg-red-50 dark:bg-red-500/10' : 'hover:bg-red-50 dark:hover:bg-red-500/10'}`}
                  >
                    <Heart className={cn('w-3.5 h-3.5', isSaved ? 'text-red-500 fill-red-500' : '')} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReportOpen(true); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="الإبلاغ"
                >
                  <Flag className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 transition-colors" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>{formatDate(car.createdAt)}</span>
              <div className="flex items-center gap-1">
                {car.user?.dealerName && (
                  <span className="text-blue-500 font-medium">{car.user.dealerName}</span>
                )}
                <BadgeDisplay badges={(car.user as any)?.badges} />
                {car.user?.rating > 0 && <StarRating rating={car.user.rating} size="sm" />}
              </div>
            </div>
          </div>
        </div>
      </Link>
      <ReportModal carId={car.id} carTitle={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}`}
        isOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </motion.div>
  );
}
