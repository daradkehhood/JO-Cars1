import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { UserGarage } from '../types';

export default function MyGarageScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [garage, setGarage] = useState<UserGarage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGarage = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try { const res = await api.getGarage(); setGarage(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadGarage(); }, []);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">كراجي</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-500 mb-4">سجّل دخولك لإدارة كراجك</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')} className="bg-blue-600 px-6 py-3 rounded-xl"><Text className="text-white font-semibold">تسجيل الدخول</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">كراجي</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadGarage(); }} tintColor="#3B82F6" />}>
        {garage.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="car-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">أضف سيارتك الأولى لكراجك</Text>
          </View>
        ) : garage.map(g => (
          <View key={g.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3">
            <Text className="text-base font-bold text-gray-900 dark:text-white">{g.carBrand} {g.carModel} {g.carYear}</Text>
            {g.plateNumber && <Text className="text-sm text-gray-500 mt-1">لوحة: {g.plateNumber}</Text>}
            {g.currentKm && <Text className="text-sm text-gray-500">الكيلومترات: {g.currentKm.toLocaleString()}</Text>}
            <TouchableOpacity onPress={() => router.push(`/my-garage/${g.id}/expenses`)} className="mt-3 flex-row items-center gap-1">
              <Text className="text-sm text-blue-600 font-medium">المصروفات</Text>
              <Ionicons name="chevron-back" size={14} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
