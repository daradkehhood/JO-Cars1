import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Bid } from '../types';
import { formatPrice, formatDate } from '../lib/utils';

export default function MyBidsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBids = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try { const res = await api.request('/api/bids', { params: { my: true } }); setBids(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadBids(); }, []);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">مزايدي</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cash-outline" size={64} color="#D1D5DB" />
          <Text className="text-gray-500 mt-4 mb-4">سجّل دخولك لرؤية مزايديك</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')} className="bg-blue-600 px-6 py-3 rounded-xl"><Text className="text-white font-semibold">تسجيل الدخول</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">مزايدي</Text>
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBids(); }} tintColor="#3B82F6" />}>
        {bids.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="cash-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لم تقدم أي مزايدة بعد</Text>
          </View>
        ) : bids.map(bid => (
          <View key={bid.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-gray-900 dark:text-white">مزايدة</Text>
              <Text className="text-blue-600 dark:text-blue-400 font-bold">{formatPrice(bid.amount)}</Text>
            </View>
            <Text className="text-xs text-gray-400 mt-1">{formatDate(bid.createdAt)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
