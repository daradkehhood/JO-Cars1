import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Plate } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';
import LoadingScreen from '../../components/shared/Loading';

export default function PlateDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plate, setPlate] = useState<Plate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getPlate(id).then((res: any) => { setPlate(res.data || res); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!plate) return <View className="flex-1 items-center justify-center"><Text>اللوحة غير موجودة</Text></View>;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white flex-1">تفاصيل اللوحة</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-6">
          <View className="bg-blue-100 dark:bg-blue-500/20 rounded-2xl px-8 py-6 items-center">
            <Text className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">{plate.plateNumber}</Text>
            <Text className="text-sm text-gray-500 mt-2">{plate.type}</Text>
          </View>
        </View>
        <Text className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 text-center mb-4">{formatPrice(plate.price)}</Text>
        <View className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 mb-4">
          <Text className="text-sm font-bold text-gray-900 dark:text-white mb-1">المعلن</Text>
          <Text className="text-base text-gray-700 dark:text-gray-300">{plate.seller?.name || 'مستخدم'}</Text>
          {plate.phone && <Text className="text-sm text-gray-500 mt-1">{plate.phone}</Text>}
        </View>
        <Text className="text-xs text-gray-400 text-center">{formatDate(plate.createdAt)}</Text>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
