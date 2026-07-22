import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Car } from '../../types';
import { formatPrice, formatDistance, getFuelLabel, getTransmissionLabel, formatDate, getStatusLabel, getStatusColor } from '../../lib/utils';
import StarRating from '../shared/StarRating';

const { width } = Dimensions.get('window');

interface CarCardProps {
  car: Car;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

export default function CarCard({ car, onPress, onFavorite, isFavorited }: CarCardProps) {
  const title = car.brand?.nameAr && car.model?.nameAr
    ? `${car.brand.nameAr} ${car.model.nameAr} ${car.year}`
    : `${car.year}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-4 overflow-hidden"
    >
      <View className="relative">
        <Image
          source={{ uri: car.coverImage || (car.images?.[0]?.url) || 'https://via.placeholder.com/400x300' }}
          className="w-full h-52"
          resizeMode="cover"
        />

        {car.featured && (
          <View className="absolute top-3 right-3 bg-amber-500 flex-row items-center px-2 py-1 rounded-lg gap-1">
            <Ionicons name="star" size={12} color="#fff" />
            <Text className="text-white text-xs font-bold">مميز</Text>
          </View>
        )}

        {car.status === 'SOLD' && (
          <View className="absolute top-3 left-3 bg-green-500 px-2 py-1 rounded-lg">
            <Text className="text-white text-xs font-bold">مباع</Text>
          </View>
        )}

        {car.status === 'PENDING' && (
          <View className="absolute top-3 left-3 bg-amber-500 px-2 py-1 rounded-lg">
            <Text className="text-white text-xs font-bold">قيد المراجعة</Text>
          </View>
        )}

        {car.images && car.images.length > 1 && (
          <View className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm flex-row items-center px-2 py-1 rounded-lg gap-1">
            <Ionicons name="camera" size={12} color="#fff" />
            <Text className="text-white text-xs">{car.images.length}</Text>
          </View>
        )}

        <View className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
          <Text className="text-white text-xs font-mono">{car.refCode}</Text>
        </View>
      </View>

      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>
            {title}
          </Text>
          {onFavorite && (
            <TouchableOpacity onPress={onFavorite} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorited ? '#EF4444' : '#9CA3AF'}
              />
            </TouchableOpacity>
          )}
        </View>

        {car.city && (
          <View className="flex-row items-center gap-1 mb-2">
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text className="text-sm text-gray-500 dark:text-gray-400">{car.city.nameAr}</Text>
          </View>
        )}

        <View className="flex-row flex-wrap gap-2 mb-3">
          <SpecBadge icon="water" label={getFuelLabel(car.fuelType)} />
          <SpecBadge icon="speedometer" label={formatDistance(car.kilometers)} />
          <SpecBadge icon="calendar" label={car.year.toString()} />
          <SpecBadge icon="cog" label={getTransmissionLabel(car.transmission)} />
        </View>

        <View className="flex-row items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
          <Text className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(car.price)}
          </Text>

          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Ionicons name="eye-outline" size={14} color="#9CA3AF" />
              <Text className="text-xs text-gray-400">{car.views || 0}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="heart-outline" size={14} color="#9CA3AF" />
              <Text className="text-xs text-gray-400">{car._count?.favorites || car.saves || 0}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SpecBadge({ icon, label }: { icon: string; label: string }) {
  const iconMap: Record<string, any> = {
    water: 'water-outline',
    speedometer: 'speedometer-outline',
    calendar: 'calendar-outline',
    cog: 'cog-outline',
  };
  return (
    <View className="flex-row items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
      <Ionicons name={iconMap[icon] || icon} size={12} color="#6B7280" />
      <Text className="text-xs text-gray-600 dark:text-gray-400">{label}</Text>
    </View>
  );
}
