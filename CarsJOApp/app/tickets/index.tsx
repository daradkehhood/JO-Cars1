import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Ticket } from '../../types';
import { formatDate } from '../../lib/utils';

export default function TicketsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try { const res = await api.getTickets(); setTickets(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTickets(); }, []);

  const statusColors: Record<string, string> = { OPEN: '#3B82F6', IN_PROGRESS: '#F59E0B', RESOLVED: '#22C55E', CLOSED: '#64748B' };
  const statusLabels: Record<string, string> = { OPEN: 'مفتوح', IN_PROGRESS: 'قيد المعالجة', RESOLVED: 'تم الحل', CLOSED: 'مغلق' };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">تذاكر الدعم</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-500 mb-4">سجّل دخولك لرؤية تذاكرك</Text>
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
          <Text className="text-xl font-bold text-gray-900 dark:text-white">تذاكر الدعم</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/tickets/new')} className="bg-blue-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
          <Ionicons name="add" size={16} color="#fff" />
          <Text className="text-white text-sm font-medium">جديدة</Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTickets} tintColor="#3B82F6" />}>
        {tickets.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد تذاكر</Text>
          </View>
        ) : tickets.map(ticket => (
          <TouchableOpacity key={ticket.id} onPress={() => router.push(`/tickets/${ticket.id}`)} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm" activeOpacity={0.7}>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>{ticket.subject}</Text>
              <View className="px-2 py-0.5 rounded-full ml-2" style={{ backgroundColor: (statusColors[ticket.status] || '#64748B') + '20' }}>
                <Text style={{ color: statusColors[ticket.status] || '#64748B', fontSize: 10, fontWeight: '600' }}>{statusLabels[ticket.status] || ticket.status}</Text>
              </View>
            </View>
            <Text className="text-sm text-gray-500" numberOfLines={1}>{ticket.message}</Text>
            <Text className="text-xs text-gray-400 mt-2">{formatDate(ticket.createdAt)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
