import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { User } from '../types';
import { getInitials } from '../lib/utils';

export default function DealersScreen() {
  const router = useRouter();
  const [dealers, setDealers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadDealers = async () => {
    try { const res = await api.getDealers({ search: search || undefined, limit: 30 }); setDealers(res.data || []); }
    catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadDealers(); }, []);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">الوكلاء</Text>
      </View>
      <View className="px-4 mb-2">
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput value={search} onChangeText={setSearch} onSubmitEditing={loadDealers} placeholder="بحث عن وكيل..." placeholderTextColor="#9CA3AF" className="flex-1 mr-2 text-base text-gray-900 dark:text-white" style={{ fontSize: 16 }} />
        </View>
      </View>
      <FlatList
        data={dealers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDealers(); }} tintColor="#3B82F6" />}
        renderItem={({ item: dealer }) => (
          <TouchableOpacity onPress={() => router.push(`/profile/${dealer.id}`)} className="flex-row items-center bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm" activeOpacity={0.7}>
            <View className="w-14 h-14 rounded-full bg-blue-600 items-center justify-center mr-3">
              <Text className="text-white font-bold text-lg">{getInitials(dealer.dealerName || dealer.name)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white">{dealer.dealerName || dealer.name}</Text>
              {dealer.dealerDescription && <Text className="text-sm text-gray-500" numberOfLines={1}>{dealer.dealerDescription}</Text>}
              <View className="flex-row items-center gap-1 mt-1">
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text className="text-xs text-gray-400">{dealer.rating?.toFixed(1) || '0.0'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-16">
            <Ionicons name="storefront-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا يوجد وكلاء حالياً</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
