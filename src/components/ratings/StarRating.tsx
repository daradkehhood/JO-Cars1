import { Star } from 'lucide-react';

export function StarRating({ rating, count, size = 'sm' }: { rating: number; count?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;

  return (
    <div className="inline-flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star}
          className={`${sizeClass} ${
            star <= fullStars
              ? 'text-amber-400 fill-amber-400'
              : star === fullStars + 1 && hasHalf
              ? 'text-amber-400 fill-amber-400/50'
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
      {count !== undefined && (
        <span className="text-xs text-gray-500 mr-1">({count})</span>
      )}
    </div>
  );
}
