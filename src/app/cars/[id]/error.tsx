'use client';

import { Button } from '@/components/ui/Button';
import { RefreshCw, Car as CarIcon } from 'lucide-react';

/**
 * Error boundary for the car detail segment. Renders a friendly fallback
 * instead of a blank page whenever the car fetch retries exhaust or a render
 * error is thrown — common on slow mobile networks.
 */
export default function CarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto mt-16 mb-24 p-6 text-center">
      <div className="text-6xl mb-4">🚗</div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        حدث خطأ في تحميل السيارة
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">
        قد تكون الشبكة بطيئة أو السيارة لم تعد متاحة. حاول مرة أخرى أو تصفّح
        بقية السيارات.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={reset} icon={<RefreshCw className="w-4 h-4" />}>
          إعادة المحاولة
        </Button>
        <Button
          variant="ghost"
          icon={<CarIcon className="w-4 h-4" />}
          onClick={() => (window.location.href = '/cars')}
        >
          تصفّح السيارات
        </Button>
      </div>
    </div>
  );
}
