import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Car } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';

export default function AdminCarsScreen() {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadCars = async () => {
    try {
      const res = await api.request(`/api/admin/cars?status=${statusFilter}&search=${search}`);
      setCars(res.data || res || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadCars(); }, [statusFilter]);

  const handleSearch = () => loadCars();

  const approveCar = async (carId: string) => {
    try {
      await api.request(`/api/admin/cars/${carId}/approve`, { method: 'POST' });
      loadCars();
    } catch (error: any) { Alert.alert('خطأ', error.message); }
  };

  const rejectCar = async (carId: string) => {
    Alert.alert('تأكيد', 'هل أنت متأكد من رفض هذا الإعلان؟', [
      { text: 'إلغاء' },
      { text: 'رفض', style: 'destructive', onPress: async () => {
        try { await api.request(`/api/admin/cars/${carId}/reject`, { method: 'POST' }); loadCars(); }
        catch (error: any) { Alert.alert('خطأ', error.message); }
      }}
    ]);
  };

  const deleteCar = async (carId: string) => {
    Alert.alert('تأكيد', 'هل أنت متأكد من حذف هذا الإعلان؟', [
      { text: 'إلغاء' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try { await api.request(`/api/admin/cars/${carId}`, { method: 'DELETE' }); loadCars(); }
        catch (error: any) { Alert.alert('خطأ', error.message); }
      }}
    ]);
  };

  const filters = [
    { key: 'all', label: 'الكل' },
    { key: 'PENDING', label: 'بانتظار المراجعة' },
    { key: 'APPROVED', label: 'الموافق عليها' },
    { key: 'REJECTED', label: 'المرفوضة' },
    { key: 'SOLD', label: 'المباعة' },
  ];

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    SOLD: 'bg-blue-100 text-blue-700',
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">إدارة الإعلانات</Text>
      </View>

      <View className="px-4 mb-3">
        <View className="flex-row gap-2 mb-2">
          <TextInput value={search} onChangeText={setSearch} onSubmitEditing={handleSearch} placeholder="بحث في الإعلانات..." placeholderTextColor="#9CA3AF" className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white" />
          <TouchableOpacity onPress={handleSearch} className="bg-blue-600 px-4 rounded-xl items-center justify-center">
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map(f => (
            <TouchableOpacity key={f.key} onPress={() => setStatusFilter(f.key)} className={`px-3 py-1.5 rounded-full mr-2 ${statusFilter === f.key ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <Text className={`text-xs font-medium ${statusFilter === f.key ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCars(); }} tintColor="#3B82F6" />}>
        {cars.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="car-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">لا توجد إعلانات</Text>
          </View>
        ) : cars.map(car => (
          <View key={car.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>{`${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year || ''}`}</Text>
              <View className={`px-2 py-0.5 rounded-full ${(statusColors as any)[car.status] || 'bg-gray-100'}`}>
                <Text className="text-[10px] font-bold">{car.status}</Text>
              </View>
            </View>
            <Text className="text-sm text-blue-600 font-bold mb-1">{formatPrice(car.price)}</Text>
            <Text className="text-xs text-gray-400">{car.user?.name} | {formatDate(car.createdAt)}</Text>
            <View className="flex-row gap-2 mt-3">
              {car.status === 'PENDING' && (
                <>
                  <TouchableOpacity onPress={() => approveCar(car.id)} className="flex-1 bg-green-500 py-2 rounded-xl items-center"><Text className="text-white text-xs font-medium">موافقة</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => rejectCar(car.id)} className="flex-1 bg-red-500 py-2 rounded-xl items-center"><Text className="text-white text-xs font-medium">رفض</Text></TouchableOpacity>
                </>
              )}
              <TouchableOpacity onPress={() => deleteCar(car.id)} className="flex-1 bg-gray-100 dark:bg-gray-800 py-2 rounded-xl items-center">
                <Text className="text-red-600 text-xs font-medium">حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
