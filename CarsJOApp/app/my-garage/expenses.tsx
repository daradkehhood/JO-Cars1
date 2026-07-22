import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { formatPrice } from '../../lib/utils';

export default function GarageExpensesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  const loadExpenses = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const res = await api.getGarageExpenses('');
      const data = res.data || [];
      setExpenses(data);
      setTotal(data.reduce((sum: number, e: any) => sum + (e.cost || 0), 0));
    } catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadExpenses(); }, []);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">المصروفات</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-500 mb-4">سجّل دخولك لرؤية مصروفاتك</Text>
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
        <Text className="text-xl font-bold text-gray-900 dark:text-white">المصروفات</Text>
      </View>

      {total > 0 && (
        <View className="mx-4 mb-4 bg-blue-600 rounded-2xl p-4">
          <Text className="text-white/70 text-sm">إجمالي المصروفات</Text>
          <Text className="text-white text-2xl font-extrabold">{formatPrice(total)}</Text>
          <Text className="text-white/70 text-xs mt-1">{expenses.length} مصروف</Text>
        </View>
      )}

      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadExpenses(); }} tintColor="#3B82F6" />}>
        {expenses.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد مصروفات بعد</Text>
          </View>
        ) : expenses.map(exp => (
          <View key={exp.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white flex-1">{exp.title}</Text>
              <Text className="text-blue-600 dark:text-blue-400 font-bold">{formatPrice(exp.cost)}</Text>
            </View>
            <Text className="text-sm text-gray-500">{exp.type}</Text>
            {exp.shopName && <Text className="text-xs text-gray-400 mt-1">المحل: {exp.shopName}</Text>}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
