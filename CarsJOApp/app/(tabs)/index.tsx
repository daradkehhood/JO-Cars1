import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Car, Brand, City } from '../../types';
import CarCard from '../../components/cars/CarCard';

const BRAND_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function HomeScreen() {
  const router = useRouter();
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [latestCars, setLatestCars] = useState<Car[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [featured, latest, brandsData, citiesData] = await Promise.all([
        api.getCars({ featured: true, limit: 5, status: 'APPROVED' }).catch(() => ({ data: [] })),
        api.getCars({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc', status: 'APPROVED' }).catch(() => ({ data: [] })),
        api.getBrands().catch(() => ({ data: [] })),
        api.getCities().catch(() => ({ data: [] })),
      ]);
      setFeaturedCars(featured.data || []);
      setLatestCars(latest.data || []);
      setBrands((brandsData.data || []).slice(0, 12));
      setCities((citiesData.data || []).slice(0, 8));
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-extrabold text-gray-900 dark:text-white">
              <Text style={{ color: '#3B82F6' }}>JO</Text> Cars
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">منصة السيارات الأردنية</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="notifications-outline" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View className="px-4 py-3">
          <TouchableOpacity onPress={() => router.push('/cars/search')} className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3.5" activeOpacity={0.7}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <Text className="text-gray-400 flex-1 text-base mr-3">ابحث عن سيارة...</Text>
            <View className="bg-blue-600 w-8 h-8 rounded-xl items-center justify-center">
              <Ionicons name="options" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-4">
          {[
            { icon: 'car-sport', label: 'بيع سيارتك', route: '/sell', color: '#3B82F6' },
            { icon: 'git-compare', label: 'مقارنة', route: '/cars/compare', color: '#8B5CF6' },
            { icon: 'calculator', label: 'التمويل', route: '/financing', color: '#10B981' },
            { icon: 'chatbubbles', label: 'AI مساعد', route: '/ai', color: '#F59E0B' },
            { icon: 'construct', label: 'الصيانة', route: '/maintenance', color: '#EF4444' },
          ].map((item, i) => (
            <TouchableOpacity key={i} onPress={() => router.push(item.route as any)} className="items-center mr-4" activeOpacity={0.7}>
              <View className="w-14 h-14 rounded-2xl items-center justify-center mb-1.5" style={{ backgroundColor: item.color + '15' }}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text className="text-xs text-gray-600 dark:text-gray-400 font-medium">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {featuredCars.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="bg-amber-100 dark:bg-amber-500/20 p-1.5 rounded-lg">
                  <Ionicons name="star" size={16} color="#F59E0B" />
                </View>
                <Text className="text-base font-bold text-gray-900 dark:text-white">سيارات مميزة</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/cars')} className="flex-row items-center gap-1">
                <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">عرض الكل</Text>
                <Ionicons name="chevron-back" size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4">
              {featuredCars.map((car) => (
                <View key={car.id} className="w-72 mr-4">
                  <CarCard car={car} onPress={() => router.push(`/cars/${car.id}`)} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="mb-6">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <View className="flex-row items-center gap-2">
              <View className="bg-blue-100 dark:bg-blue-500/20 p-1.5 rounded-lg">
                <Ionicons name="time" size={16} color="#3B82F6" />
              </View>
              <Text className="text-base font-bold text-gray-900 dark:text-white">أحدث الإعلانات</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/cars')} className="flex-row items-center gap-1">
              <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">عرض الكل</Text>
              <Ionicons name="chevron-back" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4">
            {latestCars.map((car) => (
              <View key={car.id} className="w-72 mr-4">
                <CarCard car={car} onPress={() => router.push(`/cars/${car.id}`)} />
              </View>
            ))}
          </ScrollView>
        </View>

        {brands.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <Text className="text-base font-bold text-gray-900 dark:text-white">تصفح حسب العلامة</Text>
            </View>
            <View className="flex-row flex-wrap px-4 gap-3">
              {brands.map((brand, i) => (
                <TouchableOpacity
                  key={brand.id}
                  onPress={() => router.push({ pathname: '/cars/search', params: { brandId: brand.id } })}
                  className="items-center w-16"
                  activeOpacity={0.7}
                >
                  <View className="w-14 h-14 rounded-2xl items-center justify-center mb-1" style={{ backgroundColor: BRAND_COLORS[i % BRAND_COLORS.length] + '15' }}>
                    <Text style={{ color: BRAND_COLORS[i % BRAND_COLORS.length], fontSize: 18, fontWeight: 'bold' }}>
                      {brand.nameAr.charAt(0)}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-600 dark:text-gray-400 text-center" numberOfLines={1}>{brand.nameAr}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {cities.length > 0 && (
          <View className="mb-8">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <Text className="text-base font-bold text-gray-900 dark:text-white">تصفح حسب المحافظة</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4">
              {cities.map((city) => (
                <TouchableOpacity
                  key={city.id}
                  onPress={() => router.push({ pathname: '/cars/search', params: { cityId: city.id } })}
                  className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 mr-3 flex-row items-center gap-2"
                  activeOpacity={0.7}
                >
                  <Ionicons name="location" size={16} color="#3B82F6" />
                  <Text className="text-sm text-gray-700 dark:text-gray-300 font-medium">{city.nameAr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
