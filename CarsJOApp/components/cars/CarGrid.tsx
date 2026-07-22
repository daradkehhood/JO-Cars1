import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Car } from '../../types';
import CarCard from './CarCard';

interface CarGridProps {
  cars: Car[];
  onCarPress: (car: Car) => void;
  onFavorite?: (carId: string) => void;
  favorites?: string[];
  loading?: boolean;
  numColumns?: number;
}

export default function CarGrid({ cars, onCarPress, onFavorite, favorites = [], loading }: CarGridProps) {
  if (loading) {
    return (
      <View className="flex-1 px-4">
        {[1, 2, 3].map((i) => (
          <View key={i} className="bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden mb-4 animate-pulse">
            <View className="h-52 bg-gray-300 dark:bg-gray-700" />
            <View className="p-4 space-y-3">
              <View className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
              <View className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (cars.length === 0) {
    return (
      <View className="items-center justify-center py-16 px-8">
        <Ionicons name="car-sport-outline" size={64} color="#D1D5DB" />
        <Text className="text-lg font-semibold text-gray-900 dark:text-white text-center mt-4 mb-2">
          لا توجد نتائج
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center">
          جرّب تعديل معايير البحث
        </Text>
      </View>
    );
  }

  return (
    <View className="px-4">
      {cars.map((car) => (
        <CarCard
          key={car.id}
          car={car}
          onPress={() => onCarPress(car)}
          onFavorite={onFavorite ? () => onFavorite(car.id) : undefined}
          isFavorited={favorites.includes(car.id)}
        />
      ))}
    </View>
  );
}
