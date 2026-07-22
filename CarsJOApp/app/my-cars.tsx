import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Car } from '../types';
import { formatPrice, getStatusLabel, getStatusColor } from '../lib/utils';
import LoadingScreen from '../components/shared/Loading';

export default function MyCarsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active' | 'sold'>('active');

  const loadCars = async () => {
    try {
      const res = await api.getMyCars({ status: tab === 'active' ? 'APPROVED' : 'SOLD' });
      setCars(res.data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadCars(); }, [tab]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">إعلاناتي</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-500 mb-4">سجّل دخولك لرؤية إعلاناتك</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')} className="bg-blue-600 px-6 py-3 rounded-xl">
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
        <Text className="text-xl font-bold text-gray-900 dark:text-white">إعلاناتي</Text>
      </View>
      <View className="flex-row px-4 gap-2 mb-3">
        {[{ key: 'active', label: 'النشطة' }, { key: 'sold', label: 'المباعة' }].map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key as any)} className={`flex-1 py-2 rounded-xl ${tab === t.key ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <Text className={`text-center text-sm font-medium ${tab === t.key ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCars(); }} tintColor="#3B82F6" />}>
        {loading ? <LoadingScreen /> : cars.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="car-sport-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 mb-4">لا توجد إعلانات</Text>
            <TouchableOpacity onPress={() => router.push('/cars/add')} className="bg-blue-600 px-6 py-3 rounded-xl">
              <Text className="text-white font-semibold">إضافة إعلان</Text>
            </TouchableOpacity>
          </View>
        ) : cars.map(car => (
          <TouchableOpacity key={car.id} onPress={() => router.push(`/cars/${car.id}`)} className="flex-row bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 mb-3 shadow-sm" activeOpacity={0.7}>
            <Image source={{ uri: car.coverImage || car.images?.[0]?.url || 'https://via.placeholder.com/80' }} className="w-20 h-20 rounded-xl" resizeMode="cover" />
            <View className="flex-1 mr-3">
              <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>{car.brand?.nameAr} {car.model?.nameAr} {car.year}</Text>
              <Text className="text-sm text-blue-600 dark:text-blue-400 font-bold mt-1">{formatPrice(car.price)}</Text>
              <View className="flex-row items-center gap-2 mt-1">
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: getStatusColor(car.status) + '20' }}>
                  <Text style={{ color: getStatusColor(car.status), fontSize: 10, fontWeight: '600' }}>{getStatusLabel(car.status)}</Text>
                </View>
                <Text className="text-xs text-gray-400">{car.views} مشاهدة</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
