import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Plate } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export default function PlatesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [plates, setPlates] = useState<Plate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlates = async () => {
    try { const res = await api.getPlates({ limit: 30 }); setPlates(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadPlates(); }, []);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">اللوحات</Text>
        </View>
        {isAuthenticated && (
          <TouchableOpacity onPress={() => router.push('/plates/add')} className="bg-blue-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
            <Ionicons name="add" size={16} color="#fff" />
            <Text className="text-white text-sm font-medium">إضافة</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPlates(); }} tintColor="#3B82F6" />}>
        {plates.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="car-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 dark:text-gray-400 mt-4">لا توجد لوحات حالياً</Text>
          </View>
        ) : plates.map(plate => (
          <TouchableOpacity key={plate.id} onPress={() => router.push(`/plates/${plate.id}`)} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm flex-row items-center" activeOpacity={0.7}>
            <View className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-500/20 items-center justify-center mr-3">
              <Text className="text-blue-600 dark:text-blue-400 font-bold text-lg">{plate.plateNumber}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white">{plate.plateNumber}</Text>
              <Text className="text-sm text-gray-500">{plate.type}</Text>
            </View>
            <Text className="text-blue-600 dark:text-blue-400 font-bold">{formatPrice(plate.price)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
