'use client';

import { useEffect, useState } from 'react';

const CACHE = new Map<string, { icon: string; nameAr: string }>();
let cacheLoaded = false;
let loading = false;
const waiters: (() => void)[] = [];

function loadCache() {
  if (cacheLoaded || loading) return;
  loading = true;
  fetch('/api/badges')
    .then(r => r.json())
    .then(data => {
      if (data.data) {
        for (const b of data.data) {
          CACHE.set(b.id, { icon: b.icon, nameAr: b.nameAr });
        }
      }
      cacheLoaded = true;
      const list = waiters.slice();
      waiters.length = 0;
      list.forEach(fn => fn());
    })
    .catch(() => {
      cacheLoaded = true;
      const list = waiters.slice();
      waiters.length = 0;
      list.forEach(fn => fn());
    });
}

export function BadgeDisplay({ badges }: { badges?: string[] | string | null }) {
  const [, setTick] = useState(0);
  const arr: string[] = !badges ? [] : Array.isArray(badges) ? badges : (() => { try { return JSON.parse(badges); } catch { return []; } })();
  if (arr.length === 0) return null;

  useEffect(() => {
    if (!cacheLoaded) {
      if (!loading) loadCache();
      const waiter = () => setTick(t => t + 1);
      waiters.push(waiter);
      return () => { const idx = waiters.indexOf(waiter); if (idx >= 0) waiters.splice(idx, 1); };
    }
    setTick(t => t + 1);
  }, []);

  const resolved = arr.map(id => CACHE.get(id) || { icon: '🏆', nameAr: id });

  return (
    <div className="flex items-center gap-0.5">
      {resolved.map((r, i) => (
        <span key={i} className="text-sm leading-none" title={r.nameAr}>{r.icon}</span>
      ))}
    </div>
  );
}
