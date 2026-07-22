import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { ForumTopic } from '../../types';
import { formatDate } from '../../lib/utils';

export default function ForumCategoryScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTopics = async () => {
    try { const res = await api.getForumTopics({ categorySlug: slug, limit: 30 }); setTopics(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadTopics(); }, [slug]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">{slug}</Text>
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTopics(); }} tintColor="#3B82F6" />}>
        {topics.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد مواضيع بعد</Text>
          </View>
        ) : topics.map(topic => (
          <TouchableOpacity key={topic.id} onPress={() => router.push(`/forum/topic/${topic.slug}`)} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm" activeOpacity={0.7}>
            <View className="flex-row items-center gap-2 mb-1">
              {topic.isPinned && <Ionicons name="pin" size={12} color="#F59E0B" />}
              <Text className="text-base font-bold text-gray-900 dark:text-white flex-1" numberOfLines={2}>{topic.title}</Text>
            </View>
            <Text className="text-sm text-gray-500" numberOfLines={2}>{topic.content}</Text>
            <View className="flex-row items-center justify-between mt-2">
              <View className="flex-row items-center gap-3">
                <Text className="text-xs text-gray-400">{topic._count?.posts || 0} رد</Text>
                <Text className="text-xs text-gray-400">{topic.views} مشاهدة</Text>
              </View>
              <Text className="text-xs text-gray-400">{formatDate(topic.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
