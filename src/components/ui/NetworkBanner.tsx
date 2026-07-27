'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * NetworkBanner — shows a persistent banner when the user is offline or on
 * a very slow connection. Prevents confusion when car listings fail to load.
 */
export function NetworkBanner() {
  const { isOnline, isSlowConnection, checkNow } = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg"
          dir="rtl"
        >
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">لا يوجد اتصال بالإنترنت</p>
              <p className="text-xs text-red-100">تحقق من اتصالك بالشبكة وحاول مرة أخرى</p>
            </div>
          </div>
          <button
            onClick={checkNow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة المحاولة
          </button>
        </motion.div>
      )}

      {isOnline && isSlowConnection && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-3 flex items-center gap-3 shadow-lg"
          dir="rtl"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">الشبكة بطيئة — قد يستغرق تحميل الصفحة وقتاً أطول</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
