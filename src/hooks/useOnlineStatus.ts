'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * useOnlineStatus — detects browser online/offline status and network quality.
 * Shows a banner when the user goes offline or has a very slow connection.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [lastChecked, setLastChecked] = useState(Date.now());

  useEffect(() => {
    // Set initial state from browser API
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setLastChecked(Date.now());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection quality periodically
    const checkConnection = async () => {
      try {
        // Use the Network Information API if available
        const nav = navigator as any;
        if (nav.connection) {
          const conn = nav.connection;
          // Consider "slow" if effectiveType is 'slow-2g' or '2g', or downlink < 0.5 Mbps
          setIsSlowConnection(
            conn.effectiveType === 'slow-2g' ||
            conn.effectiveType === '2g' ||
            (conn.downlink && conn.downlink < 0.5)
          );
        }
      } catch {
        // Network Information API not available — don't assume slow
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const checkNow = useCallback(async () => {
    setLastChecked(Date.now());
    try {
      // Quick probe to see if we can reach the server
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      await fetch('/api/health', { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(timer);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  return { isOnline, isSlowConnection, lastChecked, checkNow };
}
