import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Conversation } from '../../types';
import { formatDate, getInitials } from '../../lib/utils';
import LoadingScreen from '../../components/shared/Loading';

export default function MessagesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const res = await api.getConversations();
      setConversations(res.data || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { loadConversations(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConversations();
  }, []);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
          <Text className="text-lg font-semibold text-gray-900 dark:text-white text-center mt-4 mb-2">سجل دخولك أولاً</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-4">سجّل دخولك لرؤية رسائلك</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')} className="bg-blue-600 px-6 py-3 rounded-xl">
            <Text className="text-white font-semibold">تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = item.buyer?.id === useAuthStore.getState().user?.id ? item.seller : item.buyer;
    const name = otherUser?.name || 'مستخدم';
    const hasUnread = (item.unreadCount || 0) > 0;

    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/messages/chat', params: { id: item.id } })}
        className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800"
        activeOpacity={0.7}
      >
        <View className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 items-center justify-center mr-3">
          {otherUser?.image ? (
            <Image source={{ uri: otherUser.image }} className="w-12 h-12 rounded-full" />
          ) : (
            <Text className="text-blue-600 font-bold">{getInitials(name)}</Text>
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className={`text-base ${hasUnread ? 'font-bold' : 'font-medium'} text-gray-900 dark:text-white`}>{name}</Text>
            <Text className="text-xs text-gray-400">{item.lastMessage ? formatDate(item.lastMessage.createdAt) : ''}</Text>
          </View>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={1}>
            {item.lastMessage?.content || 'لا توجد رسائل'}
          </Text>
        </View>
        {hasUnread && (
          <View className="w-5 h-5 rounded-full bg-blue-600 items-center justify-center ml-2">
            <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-gray-900 dark:text-white">الرسائل</Text>
      </View>
      {loading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 dark:text-gray-400 mt-4">لا توجد محادثات بعد</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
