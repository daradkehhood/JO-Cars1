import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { PriceAlert } from '../types';
import { formatPrice, formatDate } from '../lib/utils';

export default function PriceAlertsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try { const res = await api.getPriceAlerts(); setAlerts(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadAlerts(); }, []);

  const handleDelete = (id: string) => {
    Alert.alert('حذف التنبيه', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => { await api.deletePriceAlert(id); setAlerts(prev => prev.filter(a => a.id !== id)); } },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">تنبيهات الأسعار</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-500 mb-4">سجّل دخولك لإدارة التنبيهات</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')} className="bg-blue-600 px-6 py-3 rounded-xl"><Text className="text-white font-semibold">تسجيل الدخول</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">تنبيهات الأسعار</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAlerts(); }} tintColor="#3B82F6" />}>
        {alerts.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 mb-2">لا توجد تنبيهات</Text>
            <Text className="text-gray-400 text-sm text-center">أنشئ تنبيهاً للحصول على إشعار عند ظهور سيارة مناسبة</Text>
          </View>
        ) : alerts.map(alert => (
          <View key={alert.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 items-center justify-center mr-3">
              <Ionicons name="notifications" size={18} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                {alert.brand?.nameAr || 'الكل'} {alert.model?.nameAr || ''}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {alert.minPrice ? `${formatPrice(alert.minPrice)} - ` : ''}{alert.maxPrice ? formatPrice(alert.maxPrice) : 'أي سعر'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(alert.id)} className="p-2">
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
