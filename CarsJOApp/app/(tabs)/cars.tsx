import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Car, Brand } from '../../types';
import CarGrid from '../../components/cars/CarGrid';
import { useCompareStore } from '../../store/compareStore';

export default function CarsScreen() {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>();
  const { cars: compareCars } = useCompareStore();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadCars = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const params: any = { page: pageNum, limit: 20, status: 'APPROVED' };
      if (searchQuery) params.search = searchQuery;
      if (selectedBrand) params.brandId = selectedBrand;
      
      const res = await api.getCars(params);
      const newCars = res.data || [];
      
      if (reset) {
        setCars(newCars);
      } else {
        setCars(prev => [...prev, ...newCars]);
      }
      setHasMore(newCars.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load cars:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedBrand]);

  useEffect(() => {
    loadCars(1, true);
  }, [selectedBrand]);

  useEffect(() => {
    api.getBrands().then(res => setBrands(res.data || [])).catch(() => {});
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCars(1, true);
  }, [selectedBrand, searchQuery]);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadCars(page + 1);
    }
  };

  const handleSearch = () => {
    loadCars(1, true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-900 dark:text-white">السيارات</Text>
        <View className="flex-row items-center gap-2">
          {compareCars.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/cars/compare')} className="bg-blue-600 px-3 py-1.5 rounded-full flex-row items-center gap-1">
              <Ionicons name="git-compare" size={14} color="#fff" />
              <Text className="text-white text-xs font-bold">{compareCars.length}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.push('/cars/search')} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="search" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 pb-2">
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder="بحث..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 mr-2 text-base text-gray-900 dark:text-white"
            style={{ fontSize: 16 }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); loadCars(1, true); }}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-2" contentContainerStyle={{ gap: 8 }}>
        <TouchableOpacity
          onPress={() => setSelectedBrand(undefined)}
          className={`px-3 py-1.5 rounded-full ${!selectedBrand ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}
          activeOpacity={0.7}
        >
          <Text className={`text-xs font-medium ${!selectedBrand ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>الكل</Text>
        </TouchableOpacity>
        {brands.slice(0, 10).map(brand => (
          <TouchableOpacity
            key={brand.id}
            onPress={() => setSelectedBrand(brand.id)}
            className={`px-3 py-1.5 rounded-full ${selectedBrand === brand.id ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}
            activeOpacity={0.7}
          >
            <Text className={`text-xs font-medium ${selectedBrand === brand.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{brand.nameAr}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <CarGrid
        cars={cars}
        onCarPress={(car) => router.push(`/cars/${car.id}`)}
        loading={loading && cars.length === 0}
      />
    </SafeAreaView>
  );
}
