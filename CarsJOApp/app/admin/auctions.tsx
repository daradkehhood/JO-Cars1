import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';

export default function AdminAuctionsScreen() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAuctions = async () => {
    try { const res = await api.request('/api/admin/auctions'); setAuctions(res.data || res || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadAuctions(); }, []);

  const toggleAuction = async (id: string, action: 'cancel' | 'complete') => {
    Alert.alert('تأكيد', `هل تريد ${action === 'cancel' ? 'إلغاء' : 'إنهاء'} المزاد؟`, [
      { text: 'إلغاء' },
      { text: 'تأكيد', style: 'destructive', onPress: async () => {
        try { await api.request(`/api/admin/auctions/${id}/${action}`, { method: 'POST' }); loadAuctions(); }
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
        <Text className="text-xl font-bold text-gray-900 dark:text-white">إدارة المزادات</Text>
      </View>

      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAuctions(); }} tintColor="#3B82F6" />}>
        {auctions.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="hammer-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد مزادات</Text>
          </View>
        ) : auctions.map(auction => (
          <View key={auction.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>{auction.car?.brand?.nameAr} {auction.car?.model?.nameAr}</Text>
              <View className={`px-2.5 py-1 rounded-full ${auction.status === 'ACTIVE' ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Text className={`text-[10px] font-bold ${auction.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-500'}`}>{auction.status === 'ACTIVE' ? 'نشط' : 'منتهي'}</Text>
              </View>
            </View>
            <Text className="text-sm text-blue-600 font-bold">السعر الحالي: {auction.currentPrice?.toLocaleString()} د.أ</Text>
            <Text className="text-xs text-gray-400 mt-1">{auction._count?.bids || 0} مزايدة | ينتهي: {formatDate(auction.endDate)}</Text>
            {auction.status === 'ACTIVE' && (
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity onPress={() => toggleAuction(auction.id, 'complete')} className="flex-1 bg-green-500 py-2 rounded-xl items-center"><Text className="text-white text-xs font-medium">إنهاء</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => toggleAuction(auction.id, 'cancel')} className="flex-1 bg-red-500 py-2 rounded-xl items-center"><Text className="text-white text-xs font-medium">إلغاء</Text></TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
