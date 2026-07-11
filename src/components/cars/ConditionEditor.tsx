'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { defaultConditionParts } from './ConditionDetails';
import type { ConditionItem } from '@/types';

interface Props {
  value: ConditionItem[];
  onChange: (items: ConditionItem[]) => void;
}

const ratingLabels = ['', 'سيء', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'];

export function ConditionEditor({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ConditionItem[]>(value.length > 0 ? value : defaultConditionParts.map(p => ({ ...p, rating: 3 })));

  useEffect(() => { onChange(items); }, [items]);

  const setRating = (key: string, rating: number) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, rating } : i));
  };

  const avg = Math.round(items.reduce((a, b) => a + b.rating, 0) / items.length * 10) / 10;

  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-lg">📋</div>
          <div className="text-right">
            <p className="font-semibold text-gray-900 dark:text-white">حالة السيارة التفصيلية</p>
            <p className="text-xs text-gray-500">التقييم العام: {avg} / 5  {open ? '(اختياري)' : '(اضغط للتوسيع)'}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3">
          {items.map(item => (
            <div key={item.key} className="flex items-center gap-3">
              <span className="text-sm text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">{item.label}</span>
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} type="button" onClick={() => setRating(item.key, s)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      s <= item.rating
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-500 w-12 text-left">{ratingLabels[item.rating]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
