import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'جاري التحميل...' }: LoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-950">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="text-gray-500 dark:text-gray-400 mt-4 text-base">{message}</Text>
    </View>
  );
}

export function LoadingSpinner({ size = 'small' }: { size?: 'small' | 'large' }) {
  return <ActivityIndicator size={size} color="#3B82F6" />;
}

export function SkeletonCard() {
  return (
    <View className="bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden animate-pulse">
      <View className="h-52 bg-gray-300 dark:bg-gray-700" />
      <View className="p-4 space-y-3">
        <View className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
        <View className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
        <View className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
      </View>
    </View>
  );
}
