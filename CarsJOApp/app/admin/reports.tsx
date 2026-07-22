import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';

export default function AdminReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const loadData = async () => {
    try {
      const [reportsRes, statsRes] = await Promise.all([
        api.request('/api/admin/reports'),
        api.request('/api/admin/dashboard'),
      ]);
      setReports(reportsRes.data || reportsRes || []);
      setStats(statsRes.data || statsRes);
    } catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadData(); }, []);

  const reportLabels: Record<string, string> = {
    SPAM: 'رسالة مزعجة', FRAUD: 'احتيال', WRONG_INFO: 'معلومات خاطئة',
    SOLD: 'السيارة مباعة', DUPLICATE: 'إعلان مكرر', INAPPROPRIATE: 'محتوى غير لائق',
    OVERPRICED: 'سعر غير منطقي', OTHER: 'أخرى',
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">التقارير</Text>
      </View>

      {stats && (
        <View className="flex-row px-4 gap-2 mb-4">
          <View className="flex-1 bg-blue-600 rounded-xl p-3">
            <Text className="text-white/70 text-xs">المستخدمون</Text>
            <Text className="text-white text-xl font-extrabold">{stats.totalUsers || 0}</Text>
          </View>
          <View className="flex-1 bg-emerald-600 rounded-xl p-3">
            <Text className="text-white/70 text-xs">الإعلانات</Text>
            <Text className="text-white text-xl font-extrabold">{stats.totalCars || 0}</Text>
          </View>
          <View className="flex-1 bg-purple-600 rounded-xl p-3">
            <Text className="text-white/70 text-xs">الطلبات</Text>
            <Text className="text-white text-xl font-extrabold">{stats.totalOrders || 0}</Text>
          </View>
        </View>
      )}

      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#3B82F6" />}>
        <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">البلاغات الأخيرة</Text>
        {reports.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="flag-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد بلاغات</Text>
          </View>
        ) : reports.map(report => (
          <View key={report.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Ionicons name="flag" size={14} color="#EF4444" />
              <Text className="text-sm font-semibold text-gray-900 dark:text-white">{reportLabels[report.reason] || report.reason}</Text>
            </View>
            {report.description && <Text className="text-xs text-gray-500 mb-1">{report.description}</Text>}
            <Text className="text-xs text-gray-400">بواسطة: {report.reporter?.name} | {formatDate(report.createdAt)}</Text>
          </View>
        ))}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
