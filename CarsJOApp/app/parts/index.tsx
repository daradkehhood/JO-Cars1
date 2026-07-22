import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { UsedPart } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';

export default function PartsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [parts, setParts] = useState<UsedPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadParts = useCallback(async () => {
    try {
      const res = await api.getParts({ limit: 30 });
      setParts(res.data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadParts(); }, []);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">قطع الغيار</Text>
        </View>
        {isAuthenticated && (
          <TouchableOpacity onPress={() => router.push('/parts/add')} className="bg-blue-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
            <Ionicons name="add" size={16} color="#fff" />
            <Text className="text-white text-sm font-medium">إضافة</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadParts(); }} tintColor="#3B82F6" />}>
        {parts.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="construct-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 dark:text-gray-400 mt-4">لا توجد قطع غيار حالياً</Text>
          </View>
        ) : parts.map(part => (
          <TouchableOpacity key={part.id} onPress={() => router.push(`/parts/${part.id}`)} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm" activeOpacity={0.7}>
            <View className="flex-row">
              {part.images?.[0] ? (
                <Image source={{ uri: part.images[0] }} className="w-20 h-20 rounded-xl mr-3" resizeMode="cover" />
              ) : (
                <View className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 items-center justify-center mr-3"><Ionicons name="construct" size={24} color="#D1D5DB" /></View>
              )}
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>{part.title}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{part.partType}</Text>
                {part.price && <Text className="text-blue-600 dark:text-blue-400 font-bold mt-1">{formatPrice(part.price)}</Text>}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
