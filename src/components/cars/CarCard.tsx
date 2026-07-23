'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Eye, Fuel, Gauge, Calendar, Shield, Camera, Settings, Flag } from 'lucide-react';
import { cn, formatPrice, formatDistance, getFuelTypeLabel, getTransmissionLabel, formatDate } from '@/lib/utils';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';
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
  const { ref, isInView } = useInScrollView(0.1);

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
    <div
      ref={ref}
      style={scrollStyle(isInView, { delay: index * 0.05 })}
    >
      <Link href={`/cars/${car.slug || car.id}`} className="group block">
        <div className={cn(
          'relative rounded-2xl overflow-hidden bg-white dark:bg-surface-800 border transition-all duration-200',
          featured
            ? 'border-warning-200 dark:border-warning-800 hover:shadow-soft-lg hover:-translate-y-0.5'
            : 'border-surface-200/80 dark:border-surface-700/80 hover:shadow-soft-md hover:-translate-y-0.5'
        )}>
          {featured && (
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warning-500 text-white text-[11px] font-semibold shadow-soft">
                <Shield className="w-3 h-3" />
                مميزة
              </span>
            </div>
          )}

          {(car as any).auction?.status === 'ACTIVE' && new Date((car as any).auction.endDate) > new Date() && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warning-500 text-white text-[11px] font-semibold shadow-soft">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                مزاد
              </span>
            </div>
          )}
          {car.status === 'SOLD' && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success-500 text-white text-[11px] font-semibold shadow-soft">
                تم البيع
              </span>
            </div>
          )}
          {isPending && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warning-500 text-white text-[11px] font-semibold shadow-soft">
                قيد المراجعة
              </span>
            </div>
          )}
          {car.refCode && (
            <div className="absolute bottom-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-900/70 text-white text-[10px] font-mono font-bold backdrop-blur-sm">
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
            <div className="relative h-52 overflow-hidden">
              <img
                src={car.images[0].url || car.coverImage || '/images/placeholder-car.svg'}
                alt={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-900/40 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                <span className="inline-flex items-center gap-1.5 text-white text-xs bg-surface-900/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                  <Camera className="w-3 h-3" />
                  {car.images.length} صورة
                </span>
              </div>
            </div>
          ) : car.coverImage ? (
            <div className="relative h-52 overflow-hidden">
              <img
                src={car.coverImage}
                alt={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-900/40 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="relative h-52 bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-xl bg-surface-200 dark:bg-surface-600 flex items-center justify-center mx-auto mb-2">
                  <Settings className="w-7 h-7 text-surface-400" />
                </div>
                <p className="text-surface-400 text-sm">لا توجد صور</p>
              </div>
            </div>
          )}

          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-surface-900 dark:text-white text-sm leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {car.brand?.nameAr || ''} {car.model?.nameAr || ''} {car.year}
              </h3>
              {car.isNew && (
                <span className="px-2 py-0.5 rounded-md bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-400 text-[10px] font-semibold">
                  جديد
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-surface-500 text-xs">
              <MapPin className="w-3 h-3" />
              {car.city?.nameAr || 'الاردن'}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-surface-500">
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

            <div className="flex items-center justify-between pt-2.5 border-t border-surface-100 dark:border-surface-700">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-surface-900 dark:text-white">
                    {formatPrice(car.price)}
                  </span>
                  {car.isNegotiable && (
                    <span className="text-xs text-primary-500 font-medium">قابل للتفاوض</span>
                  )}
                </div>
                {(car as any).auction?.status === 'ACTIVE' && new Date((car as any).auction.endDate) > new Date() && (
                  <span className="text-xs text-warning-600 font-medium">مزاد: {formatPrice((car as any).auction.currentPrice)}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-surface-400 text-xs">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {car.views || 0}
                </span>
                {isAuthenticated && (
                  <button
                    onClick={toggleFavorite}
                    className={cn(
                      'p-1.5 rounded-lg transition-all duration-200',
                      isSaved ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-500' : 'hover:bg-accent-50 dark:hover:bg-accent-500/10 text-surface-400 hover:text-accent-500'
                    )}
                  >
                    <Heart className={cn('w-3.5 h-3.5', isSaved && 'fill-accent-500')} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReportOpen(true); }}
                  className="p-1.5 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-500/10 text-surface-400 hover:text-accent-500 transition-all duration-200"
                  title="الإبلاغ"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-surface-400">
              <span>{formatDate(car.createdAt)}</span>
              <div className="flex items-center gap-1">
                {car.user?.dealerName && (
                  <span className="text-primary-500 font-medium">{car.user.dealerName}</span>
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
    </div>
  );
}
