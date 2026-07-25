'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Fuel, Cog, Calendar, Eye, Shield, Gauge } from 'lucide-react';
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

  return (
    <div ref={ref} style={scrollStyle(isInView, { delay: Math.min(index * 0.04, 0.3) })}>
      <Link
        href={`/cars/${car.id}`}
        className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-surface-800/80 border border-surface-200/70 dark:border-surface-700/50 transition-all duration-300 hover:border-primary-400/60 dark:hover:border-primary-500/40 shadow-card hover:shadow-card-hover hover:-translate-y-1"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-100 dark:bg-surface-700/50">
          {thumbnail ? (
            <>
              <img
                src={thumbnail}
                alt={`${car.year} ${brandName} ${modelName}`}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
              {!imgLoaded && (
                <div className="absolute inset-0 shimmer" />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-surface-300 dark:text-surface-600">
              <svg className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2" />
              </svg>
            </div>
          )}

          {/* Featured gold accent top strip */}
          {car.featured && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-gold z-10" />
          )}

          {/* Badges — top corners */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
            {car.featured && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-gold px-2.5 py-1 text-[11px] font-bold text-primary-900 shadow-md backdrop-blur-sm">
                <Shield className="w-3 h-3" strokeWidth={2.5} />
                مميزة
              </span>
            )}
            {car.isNew && (
              <span className="inline-flex items-center rounded-lg bg-success-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-sm">
                جديد
              </span>
            )}
          </div>

          {/* Views counter — bottom left, glass */}
          {car.views !== undefined && car.views > 0 && (
            <div className="absolute bottom-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-white">
                <Eye className="w-3 h-3" />
                {car.views}
              </span>
            </div>
          )}

          {/* Gradient overlay at bottom for depth */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-surface-900 dark:text-white text-base leading-tight line-clamp-1 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                {car.year} {brandName} {modelName}
              </h3>
            </div>
            <div className="text-left shrink-0">
              <p className="font-extrabold text-lg text-primary-700 dark:text-primary-300 leading-tight">
                {formatPrice(car.price)}
              </p>
              {car.isNegotiable && (
                <span className="text-[10px] font-bold text-success-600 dark:text-success-400">قابل للتفاوض</span>
              )}
            </div>
          </div>

          {/* Specs — refined chips */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-surface-500 dark:text-surface-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {car.year}
            </span>
            <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
            <span className="flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5" />
              {getFuelTypeLabel(car.fuelType)}
            </span>
            <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
            <span className="flex items-center gap-1">
              <Cog className="w-3.5 h-3.5" />
              {getTransmissionLabel(car.transmission)}
            </span>
            {car.kilometers !== undefined && car.kilometers !== null && (
              <>
                <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5" />
                  {formatDistance(car.kilometers)}
                </span>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between border-t border-surface-100 dark:border-surface-700/50 pt-3">
            {cityName && (
              <span className="flex items-center gap-1 text-xs font-medium text-surface-600 dark:text-surface-400">
                <MapPin className="w-3.5 h-3.5 text-primary-500" />
                {cityName}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
              عرض التفاصيل
              <svg className="w-3.5 h-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
