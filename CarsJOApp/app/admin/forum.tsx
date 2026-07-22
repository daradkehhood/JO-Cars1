import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';

export default function AdminForumScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTopics = async () => {
    try { const res = await api.request('/api/admin/forum'); setTopics(res.data || res || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadTopics(); }, []);

  const deleteTopic = async (id: string) => {
    Alert.alert('تأكيد', 'هل تريد حذف هذا الموضوع؟', [
      { text: 'إلغاء' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try { await api.request(`/api/admin/forum/${id}`, { method: 'DELETE' }); loadTopics(); }
        catch (error: any) { Alert.alert('خطأ', error.message); }
      }}
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">إدارة المنتدى</Text>
      </View>

      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTopics(); }} tintColor="#3B82F6" />}>
        {topics.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد مواضيع</Text>
          </View>
        ) : topics.map(topic => (
          <View key={topic.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm">
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-1" numberOfLines={1}>{topic.title}</Text>
            <Text className="text-xs text-gray-400 mb-2">بواسطة: {topic.user?.name} | {formatDate(topic.createdAt)} | {topic._count?.replies || 0} ردود</Text>
            <TouchableOpacity onPress={() => deleteTopic(topic.id)} className="bg-red-50 dark:bg-red-500/10 py-2 rounded-xl items-center">
              <Text className="text-red-600 text-xs font-medium">حذف الموضوع</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
