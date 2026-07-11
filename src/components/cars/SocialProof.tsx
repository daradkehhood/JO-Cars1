'use client';

import { useEffect, useState } from 'react';
import { Eye, Heart, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface SocialProofProps {
  carId: string;
  totalViews: number;
  totalSaves: number;
}

export function SocialProof({ carId, totalViews, totalSaves }: SocialProofProps) {
  const [viewerCount, setViewerCount] = useState(0);
  const [total, setTotal] = useState({ views: totalViews, saves: totalSaves });

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID();
    localStorage.setItem('sessionId', sessionId);

    fetch(`/api/cars/${carId}/viewers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setViewerCount(d.activeViewers);
          setTotal({ views: d.totalViews, saves: d.totalSaves });
        }
      })
      .catch(() => {});
  }, [carId]);

  const items = [
    { icon: Eye, label: 'مشاهدة', value: total.views, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: Heart, label: 'حفظ', value: total.saves, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    ...(viewerCount > 0
      ? [{ icon: Users, label: 'يعرض الآن', value: viewerCount, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' }]
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 mt-3"
    >
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${item.bg} ${item.color}`}
        >
          <item.icon className="w-3.5 h-3.5" />
          <span>{item.value} {item.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}
