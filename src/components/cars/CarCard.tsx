'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Eye, Fuel, Gauge, Calendar, Shield, Camera, Settings, Flag } from 'lucide-react';
import { cn, formatPrice, formatDistance, getFuelTypeLabel, getTransmissionLabel, formatDate } from '@/lib/utils';
import { useInScrollView } from '@/hooks/useInScrollView';
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
      className={cn(isInView ? 'scroll-visible' : 'scroll-hidden')}
      style={{ transitionDelay: `${index * 0.05}s` }}
    >
      <Link href={`/cars/${car.slug || car.id}`} className="group block">
        <div className={cn(
          'relative overflow-hidden rounded-[1.6rem] border bg-white dark:bg-surface-800 transition-all duration-300',
          featured 
            ? 'border-warning-200 dark:border-warning-800 hover:-translate-y-1 hover:shadow-soft-xl'
            : 'border-surface-200/80 dark:border-surface-700/80 hover:-translate-y-1 hover:shadow-soft-xl'
        )}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-950/5 dark:to-white/5 pointer-events-none" />

          {/* Featured badge */}
          {featured && (
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-soft-lg backdrop-blur">
                <Shield className="w-3 h-3" />
                مميزة
              </span>
            </div>
          )}

          {(car as any).auction?.status === 'ACTIVE' && new Date((car as any).auction.endDate) > new Date() && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-soft-lg backdrop-blur">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                مزاد
              </span>
            </div>
          )}
          {car.status === 'SOLD' && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-soft-lg backdrop-blur">
                تم البيع
              </span>
            </div>
          )}
          {isPending && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-soft-lg backdrop-blur">
                قيد المراجعة
              </span>
            </div>
          )}
          {car.refCode && (
            <div className="absolute bottom-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-950/75 px-2.5 py-1 text-[10px] font-mono font-bold text-white backdrop-blur-md">
                {car.refCode}
              </span>
            </div>
          )}

          {car.fairPriceEstimate && car.status === 'ACTIVE' && (
            <div className="absolute top-3 left-3 z-10">
              <PriceFairnessBadge price={car.price} fairPriceEstimate={car.fairPriceEstimate} />
            </div>
          )}

          {/* Image */}
          {car.images && car.images.length > 0 && car.images[0] ? (
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={car.images[0].url || car.coverImage || '/images/placeholder-car.svg'}
                alt={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-950/55 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-950/40 to-transparent" />
              <div className="absolute bottom-3 left-3 opacity-0 translate-y-2 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-950/65 px-3 py-1.5 text-xs text-white backdrop-blur-md">
                  <Camera className="w-3 h-3" />
                  {car.images.length} صورة
                </span>
              </div>
            </div>
          ) : car.coverImage ? (
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={car.coverImage}
                alt={`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-950/55 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="relative aspect-[4/3] bg-gradient-to-br from-surface-100 via-white to-surface-50 dark:from-surface-800 dark:via-surface-900 dark:to-surface-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/80 dark:bg-surface-700/80 shadow-soft flex items-center justify-center mx-auto mb-2">
                  <Settings className="w-7 h-7 text-surface-400" />
                </div>
                <p className="text-surface-400 text-sm">لا توجد صور</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="max-h-14 overflow-hidden text-[15px] font-extrabold leading-7 text-surface-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-300">
                {car.brand?.nameAr || ''} {car.model?.nameAr || ''} {car.year}
              </h3>
              {car.isNew && (
                <span className="shrink-0 rounded-full bg-success-50 px-2.5 py-1 text-[10px] font-semibold text-success-600 dark:bg-success-500/10 dark:text-success-400">
                  جديد
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
              <MapPin className="w-3 h-3" />
              {car.city?.nameAr || 'الاردن'}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-surface-500 dark:text-surface-400 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
              <span className="flex items-center gap-1 rounded-full bg-surface-50 px-2.5 py-1.5 dark:bg-surface-900/70">
                <Fuel className="w-3.5 h-3.5" />
                {getFuelTypeLabel(car.fuelType)}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-surface-50 px-2.5 py-1.5 dark:bg-surface-900/70">
                <Gauge className="w-3.5 h-3.5" />
                {formatDistance(car.kilometers)}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-surface-50 px-2.5 py-1.5 dark:bg-surface-900/70">
                <Calendar className="w-3.5 h-3.5" />
                {car.year}
              </span>
              {car.transmission && (
                <span className="flex items-center gap-1 rounded-full bg-surface-50 px-2.5 py-1.5 dark:bg-surface-900/70">
                  <Settings className="w-3.5 h-3.5" />
                  {getTransmissionLabel(car.transmission)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-surface-100 pt-3 dark:border-surface-700">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black tracking-tight text-surface-900 dark:text-white">
                    {formatPrice(car.price)}
                  </span>
                  {car.isNegotiable && (
                    <span className="text-xs font-medium text-primary-500">قابل للتفاوض</span>
                  )}
                </div>
                {(car as any).auction?.status === 'ACTIVE' && new Date((car as any).auction.endDate) > new Date() && (
                  <span className="text-xs text-warning-600 font-medium">مزاد: {formatPrice((car as any).auction.currentPrice)}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-surface-400">
                <span className="flex items-center gap-1 rounded-full bg-surface-50 px-2.5 py-1.5 dark:bg-surface-900/70">
                  <Eye className="w-3 h-3" />
                  {car.views || 0}
                </span>
                {isAuthenticated && (
                  <button
                    onClick={toggleFavorite}
                    className={cn(
                      'rounded-full p-2 transition-all duration-200',
                      isSaved ? 'bg-accent-50 text-accent-500 dark:bg-accent-500/10' : 'text-surface-400 hover:bg-accent-50 hover:text-accent-500 dark:hover:bg-accent-500/10'
                    )}
                  >
                    <Heart className={cn('w-4 h-4', isSaved && 'fill-accent-500')} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReportOpen(true); }}
                  className="rounded-full p-2 text-surface-400 transition-all duration-200 hover:bg-accent-50 hover:text-accent-500 dark:hover:bg-accent-500/10"
                  title="الإبلاغ"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] text-surface-400">
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
