import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Article } from '../../types';
import { formatDate } from '../../lib/utils';
import LoadingScreen from '../../components/shared/Loading';

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      api.getArticle(slug).then((res: any) => { setArticle(res.data || res); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [slug]);

  if (loading) return <LoadingScreen />;
  if (!article) return <View className="flex-1 items-center justify-center"><Text>المقال غير موجود</Text></View>;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>{article.title}</Text>
        <TouchableOpacity onPress={() => Share.share({ message: article.title })} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="share-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {article.image && <Image source={{ uri: article.image }} className="w-full h-56 rounded-2xl mb-4" resizeMode="cover" />}
        <View className="flex-row items-center gap-2 mb-3">
          <View className="bg-blue-100 dark:bg-blue-500/20 px-2.5 py-1 rounded-lg">
            <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">{article.category}</Text>
          </View>
          <Text className="text-xs text-gray-400">{formatDate(article.createdAt)}</Text>
        </View>
        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">{article.title}</Text>
        <Text className="text-base text-gray-600 dark:text-gray-400 leading-7 whitespace-pre-wrap">{article.content}</Text>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
