import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Notification } from '../types';
import { formatDate } from '../lib/utils';
import LoadingScreen from '../components/shared/Loading';

export default function NotificationsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const res = await api.getNotifications();
      setNotifications(res.data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  }, [isAuthenticated]);

  useEffect(() => { loadNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) { console.error(error); }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE': return 'chatbubble';
      case 'FAVORITE': return 'heart';
      case 'VIEW': return 'eye';
      case 'OFFER': return 'cash';
      case 'SYSTEM': return 'information-circle';
      default: return 'notifications';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MESSAGE': return '#3B82F6';
      case 'FAVORITE': return '#EF4444';
      case 'VIEW': return '#10B981';
      case 'OFFER': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity className={`flex-row items-start px-4 py-3 border-b border-gray-100 dark:border-gray-800 ${!item.read ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`} activeOpacity={0.7}>
      <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: getTypeColor(item.type) + '15' }}>
        <Ionicons name={getTypeIcon(item.type) as any} size={18} color={getTypeColor(item.type)} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={2}>{item.message}</Text>
        <Text className="text-xs text-gray-400 mt-1">{formatDate(item.createdAt)}</Text>
      </View>
      {!item.read && <View className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-2 ml-2" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">الإشعارات</Text>
        </View>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={markAllRead} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
            <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">قراءة الكل</Text>
          </TouchableOpacity>
        )}
      </View>
      {loading ? <LoadingScreen /> : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} tintColor="#3B82F6" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 dark:text-gray-400 mt-4">لا توجد إشعارات</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
