'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  carId: string;
  carName: string;
  onRated?: () => void;
}

export function RatingModal({ isOpen, onClose, targetUserId, carId, carName, onRated }: Props) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const submit = async () => {
    if (score === 0) { toast.error('اختر تقييماً'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, carId, score, comment: comment || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('تم إرسال التقييم');
        onClose();
        onRated?.();
      } else toast.error(data.error || 'فشل');
    } catch { toast.error('فشل'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">تقييم البائع</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{carName}</p>

        <div className="flex items-center justify-center gap-1 mb-4" dir="ltr">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => setScore(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
              className="p-1 transition-all hover:scale-110"
            >
              <Star className={`w-8 h-8 ${star <= (hover || score) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
            </button>
          ))}
        </div>

        <textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder="أضف تعليقاً (اختياري)"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none h-24 text-sm"
        />

        <button onClick={submit} disabled={loading || score === 0}
          className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          إرسال التقييم
        </button>
      </motion.div>
    </div>
  );
}
