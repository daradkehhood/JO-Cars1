import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { WantedAd } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';
import LoadingScreen from '../../components/shared/Loading';

export default function WantedDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const [ad, setAd] = useState<WantedAd | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getWantedAd(id).then((res: any) => { setAd(res.data || res); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!ad) return <View className="flex-1 items-center justify-center"><Text>الإعلان غير موجود</Text></View>;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>{ad.title}</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">{ad.title}</Text>
        {ad.description && <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-4">{ad.description}</Text>}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {ad.maxPrice && <View className="bg-green-100 dark:bg-green-500/20 px-3 py-1.5 rounded-full"><Text className="text-green-700 dark:text-green-400 text-sm font-medium">حتى {formatPrice(ad.maxPrice)}</Text></View>}
          {ad.yearFrom && <View className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"><Text className="text-sm text-gray-700 dark:text-gray-300">من {ad.yearFrom}</Text></View>}
          {ad.yearTo && <View className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"><Text className="text-sm text-gray-700 dark:text-gray-300">إلى {ad.yearTo}</Text></View>}
          {ad.brand && <View className="bg-blue-100 dark:bg-blue-500/20 px-3 py-1.5 rounded-full"><Text className="text-blue-700 dark:text-blue-400 text-sm">{ad.brand.nameAr}</Text></View>}
          {ad.city && <View className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"><Text className="text-sm text-gray-700 dark:text-gray-300">{ad.city.nameAr}</Text></View>}
        </View>
        <View className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 mb-4">
          <Text className="text-sm font-bold text-gray-900 dark:text-white mb-1">المعلن</Text>
          <Text className="text-base text-gray-700 dark:text-gray-300">{ad.user?.name || 'مستخدم'}</Text>
          {ad.phone && <Text className="text-sm text-gray-500 mt-1">{ad.phone}</Text>}
        </View>
        <Text className="text-xs text-gray-400 text-center">{formatDate(ad.createdAt)}</Text>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
