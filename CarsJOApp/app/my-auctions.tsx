import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Auction } from '../types';
import { formatPrice, formatDate } from '../lib/utils';

export default function MyAuctionsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAuctions = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try { const res = await api.request('/api/auctions', { params: { my: true } }); setAuctions(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadAuctions(); }, []);

  const statusColors: Record<string, string> = { ACTIVE: '#22C55E', ENDED: '#64748B', PENDING: '#F59E0B' };
  const statusLabels: Record<string, string> = { ACTIVE: 'نشط', ENDED: 'منتهي', PENDING: 'قريبًا' };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">مزاداتي</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="hammer-outline" size={64} color="#D1D5DB" />
          <Text className="text-gray-500 mt-4 mb-4">سجّل دخولك لرؤية مزاداتك</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')} className="bg-blue-600 px-6 py-3 rounded-xl">
            <Text className="text-white font-semibold">تسجيل الدخول</Text>
          </TouchableOpacity>
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
        <Text className="text-xl font-bold text-gray-900 dark:text-white">مزاداتي</Text>
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAuctions(); }} tintColor="#3B82F6" />}>
        {auctions.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="hammer-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد مزادات بعد</Text>
          </View>
        ) : auctions.map(auction => (
          <TouchableOpacity key={auction.id} onPress={() => router.push(`/auction/${auction.id}`)} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm" activeOpacity={0.7}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-bold text-gray-900 dark:text-white flex-1">{auction.car?.brand?.nameAr} {auction.car?.model?.nameAr}</Text>
              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: (statusColors[auction.status] || '#64748B') + '20' }}>
                <Text style={{ color: statusColors[auction.status] || '#64748B', fontSize: 10, fontWeight: '600' }}>{statusLabels[auction.status] || auction.status}</Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <View><Text className="text-xs text-gray-400">السعر الحالي</Text><Text className="text-blue-600 dark:text-blue-400 font-bold">{formatPrice(auction.currentPrice)}</Text></View>
              <View><Text className="text-xs text-gray-400">المزايدات</Text><Text className="text-sm font-semibold text-gray-900 dark:text-white">{auction._count?.bids || 0}</Text></View>
              <View><Text className="text-xs text-gray-400">النهاية</Text><Text className="text-xs text-gray-500">{formatDate(auction.endDate)}</Text></View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
