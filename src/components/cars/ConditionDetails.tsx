'use client';

import { motion } from 'framer-motion';
import { Wrench, Cog, Thermometer, Car, Gauge, Zap, Shirt, Hammer, Droplet, Shield } from 'lucide-react';
import type { ConditionItem } from '@/types';

const iconMap: Record<string, React.ReactNode> = {
  chassis: <Car className="w-4 h-4" />,
  engine: <Cog className="w-4 h-4" />,
  transmission: <Gauge className="w-4 h-4" />,
  ac: <Thermometer className="w-4 h-4" />,
  interior: <Shirt className="w-4 h-4" />,
  electrical: <Zap className="w-4 h-4" />,
  suspension: <Wrench className="w-4 h-4" />,
  brakes: <Shield className="w-4 h-4" />,
  tires: <Droplet className="w-4 h-4" />,
  paint: <Hammer className="w-4 h-4" />,
};

const ratingLabels = ['', 'سيء', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'];
const ratingColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-500'];
const ratingBg = ['', 'bg-red-50 dark:bg-red-500/10', 'bg-orange-50 dark:bg-orange-500/10', 'bg-amber-50 dark:bg-amber-500/10', 'bg-lime-50 dark:bg-lime-500/10', 'bg-green-50 dark:bg-green-500/10'];
const ratingText = ['', 'text-red-600 dark:text-red-400', 'text-orange-600 dark:text-orange-400', 'text-amber-600 dark:text-amber-400', 'text-lime-600 dark:text-lime-400', 'text-green-600 dark:text-green-400'];

export const defaultConditionParts: { key: string; label: string; icon: string }[] = [
  { key: 'chassis', label: 'الشاصي والبدن', icon: 'chassis' },
  { key: 'engine', label: 'المحرك', icon: 'engine' },
  { key: 'transmission', label: 'القير', icon: 'transmission' },
  { key: 'ac', label: 'المكيف', icon: 'ac' },
  { key: 'interior', label: 'الداخلي', icon: 'interior' },
  { key: 'electrical', label: 'الكهرباء', icon: 'electrical' },
  { key: 'suspension', label: 'العلبة والمساعدات', icon: 'suspension' },
  { key: 'brakes', label: 'الفرامل', icon: 'brakes' },
  { key: 'tires', label: 'الإطارات', icon: 'tires' },
  { key: 'paint', label: 'الدهان', icon: 'paint' },
];

const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

export function ConditionDetails({ items }: { items: ConditionItem[] }) {
  const average = Math.round(avg(items.map(i => i.rating)) * 10) / 10;
  const colorIdx = Math.round(average);

  if (!items.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">حالة السيارة التفصيلية</h2>
          <div className={`px-3 py-1.5 rounded-xl text-sm font-bold ${ratingBg[colorIdx]} ${ratingText[colorIdx]}`}>
            {ratingLabels[colorIdx] || 'غير محدد'} ({average})
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.key} className={`flex items-center gap-3 p-3 rounded-xl ${ratingBg[item.rating] || 'bg-gray-50 dark:bg-gray-800/50'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ratingBg[item.rating]} ${ratingText[item.rating]}`}>
                {iconMap[item.icon] || <Wrench className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                <p className={`text-xs ${ratingText[item.rating] || 'text-gray-500'}`}>{ratingLabels[item.rating] || 'غير محدد'}</p>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <div key={s} className={`w-2 h-2 rounded-full ${s <= item.rating ? ratingColors[item.rating] : 'bg-gray-200 dark:bg-gray-700'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
