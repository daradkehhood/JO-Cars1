import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { formatPrice, formatDate } from '../../lib/utils';

export default function AdminPendingScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPending = async () => {
    try { const res = await api.request('/api/admin/cars?status=PENDING'); setItems(res.data || res || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadPending(); }, []);

  const approve = async (id: string) => {
    try { await api.request(`/api/admin/cars/${id}/approve`, { method: 'POST' }); loadPending(); }
    catch (error: any) { Alert.alert('خطأ', error.message); }
  };

  const reject = async (id: string) => {
    Alert.alert('تأكيد', 'هل تريد رفض هذا الإعلان؟', [
      { text: 'إلغاء' },
      { text: 'رفض', style: 'destructive', onPress: async () => {
        try { await api.request(`/api/admin/cars/${id}/reject`, { method: 'POST' }); loadPending(); }
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
        <Text className="text-xl font-bold text-gray-900 dark:text-white">بانتظار المراجعة</Text>
        {items.length > 0 && <View className="bg-orange-100 dark:bg-orange-500/20 px-2.5 py-1 rounded-full ml-2"><Text className="text-orange-600 text-xs font-bold">{items.length}</Text></View>}
      </View>

      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPending(); }} tintColor="#3B82F6" />}>
        {items.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="checkmark-circle-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد إعلانات بانتظار المراجعة</Text>
          </View>
        ) : items.map(item => (
          <View key={item.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm">
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-1" numberOfLines={1}>{item.title || `${item.brand?.nameAr} ${item.model?.nameAr}`}</Text>
            <Text className="text-sm text-blue-600 font-bold mb-1">{formatPrice(item.price)}</Text>
            <Text className="text-xs text-gray-400 mb-3">من: {item.user?.name} | {formatDate(item.createdAt)}</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => approve(item.id)} className="flex-1 bg-green-500 py-2.5 rounded-xl items-center"><Text className="text-white font-semibold">موافقة</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => reject(item.id)} className="flex-1 bg-red-500 py-2.5 rounded-xl items-center"><Text className="text-white font-semibold">رفض</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
