'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MapPin, Fuel, Cog, Calendar, Eye, Shield, Gauge, BadgeCheck,
  Settings2, Zap, Fuel as FuelIcon, Car as CarIcon,
} from 'lucide-react';
import { useInScrollView, scrollStyle } from '@/hooks/useInScrollView';
import type { Car } from '@/types';
import { formatPrice, formatDistance, getTransmissionLabel, getFuelTypeLabel } from '@/lib/utils';

interface CarCardProps {
  car: Car;
  index?: number;
}

export function CarCard({ car, index = 0 }: CarCardProps) {
  const { ref, isInView } = useInScrollView(0.1);
  const [imgLoaded, setImgLoaded] = useState(false);

  const thumbnail = useMemo(() => {
    if (car.coverImage) return car.coverImage;
    if (car.images && car.images.length > 0) {
      const cover = car.images.find((img) => img.isCover);
      return cover?.url || car.images[0]?.url || null;
    }
    return null;
  }, [car.coverImage, car.images]);

  const brandName = car.brand?.nameAr || '';
  const modelName = car.model?.nameAr || '';
  const cityName = car.city?.nameAr || '';

  const fuelLabel = getFuelTypeLabel(car.fuelType);
  const transLabel = getTransmissionLabel(car.transmission);

  return (
    <div ref={ref} style={scrollStyle(isInView, { delay: Math.min(index * 0.04, 0.3) })}>
      <Link
        href={`/cars/${car.id}`}
        className="group relative flex flex-col overflow-hidden rounded-xl bg-surface-800 border border-surface-700/50 transition-all duration-300 hover:border-gold-100/30 hover:shadow-card-hover hover:-translate-y-1"
      >
        {/* Image Section */}
        <div className="relative bg-surface-900 flex items-center justify-center min-h-[220px] sm:min-h-[260px]">
          {thumbnail ? (
            <>
              <img
                src={thumbnail}
                alt={`${car.year} ${brandName} ${modelName}`}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-full object-contain p-4 sm:p-6 transition-all duration-700 group-hover:scale-[1.03] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
              {!imgLoaded && (
                <div className="absolute inset-0 shimmer" />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-surface-700 py-16">
              <svg className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2" />
              </svg>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface-800 to-transparent pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
            {car.isNew && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-success-600/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                <BadgeCheck className="w-3 h-3" />
                تم التحقق
              </span>
            )}
            {car.featured && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-gold-100 px-2.5 py-1 text-[10px] font-extrabold text-gold-900 shadow-lg shadow-gold-100/20">
                <Shield className="w-3 h-3" strokeWidth={2.5} />
                مميزة
              </span>
            )}
          </div>

          {car.views !== undefined && car.views > 0 && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 rounded-lg bg-black/50 backdrop-blur-md px-2 py-1 text-[10px] font-medium text-white/80">
                <Eye className="w-3 h-3" />
                {car.views}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-3 p-4 sm:p-5">
          <h3 className="font-bold text-lg sm:text-xl text-gold-100 leading-snug text-center sm:text-right">
            {brandName} {modelName} {car.year}
          </h3>

          <div className="text-center sm:text-right">
            <p className="font-bold text-2xl sm:text-[1.75rem] text-surface-200 leading-none tracking-tight">
              {formatPrice(car.price)}
            </p>
            {car.isNegotiable && (
              <span className="text-[11px] font-semibold text-gold-200/70 mt-0.5 inline-block">
                قابل للتفاوض
              </span>
            )}
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-1">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-surface-500">
              <Gauge className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{formatDistance(car.kilometers)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-surface-500">
              <CarIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{car.bodyType || car.condition === 'USED' ? 'مستعمل' : 'جديد'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-surface-500">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{car.year}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-surface-500">
              <Gauge className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{car.kilometers === 0 ? '0 كم' : formatDistance(car.kilometers)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-surface-500">
              <Settings2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{transLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-surface-500">
              <FuelIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{fuelLabel}</span>
            </div>
          </div>

          {cityName && (
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] sm:text-xs text-surface-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-gold-200/70" />
              <span>الموقع: <span className="text-surface-300 font-medium">{cityName}</span></span>
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-2 pt-3 border-t border-surface-700/50">
            <span className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-surface-700/50 text-gold-100 font-bold text-sm group-hover:bg-gold-100 group-hover:text-gold-900 transition-all duration-300">
              عرض التفاصيل
              <svg className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-[-2px] rtl:group-hover:translate-x-[2px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
