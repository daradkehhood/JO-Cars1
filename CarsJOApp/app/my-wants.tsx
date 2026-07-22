import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { WantedAd } from '../types';
import { formatPrice, formatDate } from '../lib/utils';

export default function MyWantsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [ads, setAds] = useState<WantedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAds = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try { const res = await api.getWantedAds({ my: true }); setAds(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadAds(); }, []);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">طلبات البحث</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="search-outline" size={64} color="#D1D5DB" />
          <Text className="text-gray-500 mt-4 mb-4">سجّل دخولك لرؤية طلباتك</Text>
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
          <Text className="text-xl font-bold text-gray-900 dark:text-white">طلبات البحث</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/wanted/add')} className="bg-blue-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
          <Ionicons name="add" size={16} color="#fff" />
          <Text className="text-white text-sm font-medium">إضافة</Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAds(); }} tintColor="#3B82F6" />}>
        {ads.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="search-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 mb-2">لا توجد طلبات بعد</Text>
            <TouchableOpacity onPress={() => router.push('/wanted/add')} className="bg-blue-600 px-6 py-3 rounded-xl mt-2">
              <Text className="text-white font-semibold">نشر طلب</Text>
            </TouchableOpacity>
          </View>
        ) : ads.map(ad => (
          <TouchableOpacity key={ad.id} onPress={() => router.push(`/wanted/${ad.id}`)} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm" activeOpacity={0.7}>
            <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>{ad.title}</Text>
            {ad.maxPrice && <Text className="text-sm text-blue-600 font-semibold mt-1">حتى {formatPrice(ad.maxPrice)}</Text>}
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-xs text-gray-400">{ad._count?.offers || 0} عرض</Text>
              <Text className="text-xs text-gray-400">{formatDate(ad.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
