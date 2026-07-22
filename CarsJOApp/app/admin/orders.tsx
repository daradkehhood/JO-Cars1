import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { formatPrice, formatDate } from '../../lib/utils';

export default function AdminOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadOrders = async () => {
    try { const res = await api.request(`/api/admin/orders?status=${filter}`); setOrders(res.data || res || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadOrders(); }, [filter]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.request(`/api/admin/orders/${orderId}/status`, { method: 'POST', body: { status } });
      loadOrders();
    } catch (error: any) { Alert.alert('خطأ', error.message); }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PAID: 'bg-green-100 text-green-700',
    SHIPPED: 'bg-blue-100 text-blue-700',
    DELIVERED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'بانتظار الدفع', PAID: 'مدفوع', SHIPPED: 'تم الشحن', DELIVERED: 'تم التوصيل', CANCELLED: 'ملغي',
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">إدارة الطلبات</Text>
      </View>

      <View className="px-4 mb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} className={`px-3 py-1.5 rounded-full mr-2 ${filter === f ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <Text className={`text-xs font-medium ${filter === f ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{f === 'all' ? 'الكل' : statusLabels[f]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} tintColor="#3B82F6" />}>
        {orders.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد طلبات</Text>
          </View>
        ) : orders.map(order => (
          <View key={order.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-bold text-gray-900 dark:text-white">طلب #{order.id.slice(-6).toUpperCase()}</Text>
              <View className={`px-2 py-0.5 rounded-full ${(statusColors as any)[order.status] || ''}`}>
                <Text className="text-[10px] font-bold">{statusLabels[order.status] || order.status}</Text>
              </View>
            </View>
            <Text className="text-sm text-blue-600 font-bold mb-1">{formatPrice(order.totalPrice)}</Text>
            <Text className="text-xs text-gray-400">المشتري: {order.user?.name} | {formatDate(order.createdAt)}</Text>
            <View className="flex-row gap-2 mt-3">
              {order.status === 'PAID' && (
                <TouchableOpacity onPress={() => updateStatus(order.id, 'SHIPPED')} className="flex-1 bg-blue-500 py-2 rounded-xl items-center"><Text className="text-white text-xs font-medium">تم الشحن</Text></TouchableOpacity>
              )}
              {order.status === 'SHIPPED' && (
                <TouchableOpacity onPress={() => updateStatus(order.id, 'DELIVERED')} className="flex-1 bg-green-500 py-2 rounded-xl items-center"><Text className="text-white text-xs font-medium">تم التوصيل</Text></TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
