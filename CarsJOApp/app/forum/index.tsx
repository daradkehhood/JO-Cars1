import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { ForumCategory } from '../../types';

export default function ForumScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = async () => {
    try { const res = await api.getForumCategories(); setCategories(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadCategories(); }, []);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">المنتدى</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCategories(); }} tintColor="#3B82F6" />}>
        {categories.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 dark:text-gray-400 mt-4">لا توجد تصنيفات حالياً</Text>
          </View>
        ) : categories.map(cat => (
          <TouchableOpacity key={cat.id} onPress={() => router.push(`/forum/${cat.slug}`)} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm flex-row items-center" activeOpacity={0.7}>
            <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: (cat.color || '#3B82F6') + '15' }}>
              <Text style={{ fontSize: 20 }}>{cat.icon || '💬'}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white">{cat.nameAr}</Text>
              <Text className="text-sm text-gray-500">{cat._count?.topics || 0} موضوع</Text>
            </View>
            <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
