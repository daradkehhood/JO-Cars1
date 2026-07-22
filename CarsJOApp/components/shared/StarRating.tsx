import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({
  rating,
  size = 16,
  showValue = false,
  interactive = false,
  onRate,
}: StarRatingProps) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;

  for (let i = 1; i <= 5; i++) {
    let name: any = 'star-outline';
    let color = '#D1D5DB';

    if (i <= fullStars) {
      name = 'star';
      color = '#F59E0B';
    } else if (i === fullStars + 1 && hasHalf) {
      name = 'star-half';
      color = '#F59E0B';
    }

    if (interactive) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => onRate?.(i)}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={name} size={size} color={color} />
        </TouchableOpacity>
      );
    } else {
      stars.push(
        <Ionicons key={i} name={name} size={size} color={color} />
      );
    }
  }

  return (
    <View className="flex-row items-center gap-0.5">
      {stars}
      {showValue && rating > 0 && (
        <View className="ml-1 bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.5 rounded">
          <View className="flex-row items-center gap-0.5">
            <Ionicons name="star" size={10} color="#F59E0B" />
            <View className="text-amber-700 dark:text-amber-400 text-xs font-medium">
              <Text style={{ color: '#D97706', fontSize: 12, fontWeight: '600' }}>{rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
