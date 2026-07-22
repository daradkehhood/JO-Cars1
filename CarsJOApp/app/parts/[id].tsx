import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { UsedPart } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';
import LoadingScreen from '../../components/shared/Loading';

export default function PartDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [part, setPart] = useState<UsedPart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getPart(id).then((res: any) => { setPart(res.data || res); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!part) return <View className="flex-1 items-center justify-center"><Text>القطعة غير موجودة</Text></View>;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>{part.title}</Text>
      </View>
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {part.images && part.images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {part.images.map((uri, i) => (
              <Image key={i} source={{ uri }} className="w-72 h-52 rounded-2xl mr-3" resizeMode="cover" />
            ))}
          </ScrollView>
        )}
        <Text className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">{part.price ? formatPrice(part.price) : 'السعر غير محدد'}</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          <View className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"><Text className="text-sm text-gray-700 dark:text-gray-300">{part.partType}</Text></View>
          {part.condition && <View className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"><Text className="text-sm text-gray-700 dark:text-gray-300">{part.condition}</Text></View>}
          {part.brand && <View className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"><Text className="text-sm text-gray-700 dark:text-gray-300">{part.brand.nameAr}</Text></View>}
        </View>
        {part.description && <Text className="text-gray-600 dark:text-gray-400 leading-6 mb-4">{part.description}</Text>}
        {part.user && (
          <View className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 mb-4">
            <Text className="text-sm font-bold text-gray-900 dark:text-white mb-1">المعلن</Text>
            <Text className="text-base text-gray-700 dark:text-gray-300">{part.user.name}</Text>
            {part.phone && <Text className="text-sm text-gray-500 mt-1">{part.phone}</Text>}
          </View>
        )}
        <Text className="text-xs text-gray-400 text-center mb-4">{formatDate(part.createdAt)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
