import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { MaintenanceService } from '../../types';
import { formatPrice } from '../../lib/utils';
import { MAINTENANCE_CATEGORIES } from '../../lib/constants';

export default function MaintenanceScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [services, setServices] = useState<MaintenanceService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const loadServices = async () => {
    try { const res = await api.getMaintenance({ category: selectedCategory || undefined, limit: 30 }); setServices(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadServices(); }, [selectedCategory]);

  const categories = Object.entries(MAINTENANCE_CATEGORIES).slice(0, 8);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">الصيانة</Text>
        </View>
        {isAuthenticated && (
          <TouchableOpacity onPress={() => router.push('/maintenance/add')} className="bg-blue-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
            <Ionicons name="add" size={16} color="#fff" />
            <Text className="text-white text-sm font-medium">إضافة خدمة</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-3" contentContainerStyle={{ gap: 8 }}>
        <TouchableOpacity onPress={() => setSelectedCategory('')} className={`px-3 py-1.5 rounded-full ${!selectedCategory ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
          <Text className={`text-xs font-medium ${!selectedCategory ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>الكل</Text>
        </TouchableOpacity>
        {categories.map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setSelectedCategory(key)} className={`px-3 py-1.5 rounded-full ${selectedCategory === key ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <Text className={`text-xs font-medium ${selectedCategory === key ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadServices(); }} tintColor="#3B82F6" />}>
        {services.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="construct-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد خدمات صيانة حالياً</Text>
          </View>
        ) : services.map(s => (
          <TouchableOpacity key={s.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm" activeOpacity={0.7}>
            <Text className="text-base font-bold text-gray-900 dark:text-white">{s.title}</Text>
            <Text className="text-sm text-gray-500 mt-0.5">{MAINTENANCE_CATEGORIES[s.category] || s.category}</Text>
            {s.price && <Text className="text-blue-600 dark:text-blue-400 font-bold mt-1">{formatPrice(s.price)}</Text>}
            {s.city && <Text className="text-xs text-gray-400 mt-1">{s.city.nameAr}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
