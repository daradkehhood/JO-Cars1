import { Loader2 } from 'lucide-react';

/**
 * Skeleton loader shown by Next.js while the car detail page is being
 * prefetched server-side or before client hydration completes. Provides
 * immediate visual feedback instead of a blank white screen on slow mobile
 * networks.
 */
export default function CarLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image gallery skeleton */}
        <div className="aspect-[4/3] rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        {/* Details skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-2/3 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-5 w-1/2 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-6 w-1/3 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-24 w-full rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-24 w-full rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>
      <div className="flex items-center justify-center mt-10 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">جارٍ تحميل تفاصيل السيارة…</span>
      </div>
    </div>
  );
}
