import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Article } from '../../types';
import { formatDate } from '../../lib/utils';

export default function NewsScreen() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadArticles = async () => {
    try { const res = await api.getArticles({ limit: 20 }); setArticles(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadArticles(); }, []);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">الأخبار</Text>
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadArticles(); }} tintColor="#3B82F6" />}>
        {articles.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="newspaper-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 dark:text-gray-400 mt-4">لا توجد أخبار حالياً</Text>
          </View>
        ) : articles.map(article => (
          <TouchableOpacity key={article.id} onPress={() => router.push(`/news/${article.slug}`)} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm" activeOpacity={0.7}>
            {article.image && <Image source={{ uri: article.image }} className="w-full h-40 rounded-xl mb-3" resizeMode="cover" />}
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-1" numberOfLines={2}>{article.title}</Text>
            {article.excerpt && <Text className="text-sm text-gray-500 dark:text-gray-400" numberOfLines={2}>{article.excerpt}</Text>}
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-xs text-blue-600 dark:text-blue-400 font-medium">{article.category}</Text>
              <Text className="text-xs text-gray-400">{formatDate(article.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
