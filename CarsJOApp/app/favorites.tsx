import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Car } from '../types';
import CarGrid from '../components/cars/CarGrid';
import LoadingScreen from '../components/shared/Loading';

export default function FavoritesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const res = await api.getFavorites();
      setCars(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { loadFavorites(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); loadFavorites(); }, []);

  const handleToggleFavorite = async (carId: string) => {
    try {
      await api.toggleFavorite(carId);
      setCars(prev => prev.filter(c => c.id !== carId));
    } catch (error) { console.error(error); }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">المفضلة</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
          <Text className="text-lg font-semibold text-gray-900 dark:text-white text-center mt-4 mb-2">سجّل دخولك أولاً</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')} className="bg-blue-600 px-6 py-3 rounded-xl mt-4">
            <Text className="text-white font-semibold">تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">المفضلة</Text>
        <Text className="text-sm text-gray-400 mr-auto">{cars.length} سيارة</Text>
      </View>
      <CarGrid
        cars={cars}
        onCarPress={(car) => router.push(`/cars/${car.id}`)}
        onFavorite={handleToggleFavorite}
        favorites={cars.map(c => c.id)}
        loading={loading && cars.length === 0}
      />
    </SafeAreaView>
  );
}
