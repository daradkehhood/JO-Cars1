import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';

export default function AdminNewsScreen() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadArticles = async () => {
    try { const res = await api.request('/api/admin/news'); setArticles(res.data || res || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadArticles(); }, []);

  const deleteArticle = async (id: string) => {
    Alert.alert('تأكيد', 'هل تريد حذف هذا المقال؟', [
      { text: 'إلغاء' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try { await api.request(`/api/admin/news/${id}`, { method: 'DELETE' }); loadArticles(); }
        catch (error: any) { Alert.alert('خطأ', error.message); }
      }}
    ]);
  };

  const toggleFeatured = async (id: string) => {
    try { await api.request(`/api/admin/news/${id}/featured`, { method: 'POST' }); loadArticles(); }
    catch (error: any) { Alert.alert('خطأ', error.message); }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">الأخبار والمقالات</Text>
      </View>

      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadArticles(); }} tintColor="#3B82F6" />}>
        {articles.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="newspaper-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد مقالات</Text>
          </View>
        ) : articles.map(article => (
          <View key={article.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>{article.title}</Text>
              {article.featured && <View className="bg-amber-100 px-2 py-0.5 rounded-full"><Text className="text-amber-700 text-[10px] font-bold">مميز</Text></View>}
            </View>
            <Text className="text-xs text-gray-400 mb-2">{formatDate(article.createdAt)}</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => toggleFeatured(article.id)} className="flex-1 bg-amber-50 dark:bg-amber-500/10 py-2 rounded-xl items-center">
                <Text className="text-amber-600 text-xs font-medium">{article.featured ? 'إلغاء التمييز' : 'تمييز'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteArticle(article.id)} className="flex-1 bg-red-50 dark:bg-red-500/10 py-2 rounded-xl items-center">
                <Text className="text-red-600 text-xs font-medium">حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
