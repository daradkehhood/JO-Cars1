import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { CarReminder } from '../types';
import { formatDate } from '../lib/utils';

export default function MyRemindersScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [reminders, setReminders] = useState<CarReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReminders = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try { const res = await api.getReminders(); setReminders(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadReminders(); }, []);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">التذكيرات</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alarm-outline" size={64} color="#D1D5DB" />
          <Text className="text-gray-500 mt-4 mb-4">سجّل دخولك لرؤية تذكيراتك</Text>
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
          <Text className="text-xl font-bold text-gray-900 dark:text-white">التذكيرات</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/reminders/add')} className="bg-blue-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
          <Ionicons name="add" size={16} color="#fff" />
          <Text className="text-white text-sm font-medium">إضافة</Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReminders(); }} tintColor="#3B82F6" />}>
        {reminders.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="alarm-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 mb-2">لا توجد تذكيرات</Text>
            <Text className="text-gray-400 text-sm text-center">أضف تذكيرًا للصيانة أو الفحص</Text>
          </View>
        ) : reminders.map(r => (
          <View key={r.id} className={`bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm ${r.isCompleted ? 'opacity-50' : ''}`}>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white flex-1">{r.title}</Text>
              {r.isCompleted && <Ionicons name="checkmark-circle" size={20} color="#22C55E" />}
            </View>
            <Text className="text-sm text-gray-500">{r.type}</Text>
            {r.dueDate && <Text className="text-xs text-gray-400 mt-1">الموعد: {formatDate(r.dueDate)}</Text>}
            {r.lastOdometer && <Text className="text-xs text-gray-400">الكيلومتر: {r.lastOdometer.toLocaleString()}</Text>}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
