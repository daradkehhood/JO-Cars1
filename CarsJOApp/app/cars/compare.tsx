import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCompareStore } from '../../store/compareStore';
import { api } from '../../lib/api';
import { Car } from '../../types';
import { formatPrice, formatDistance, getFuelLabel, getTransmissionLabel, getBodyTypeLabel, getConditionLabel } from '../../lib/utils';

const { width } = Dimensions.get('window');

export default function CompareScreen() {
  const router = useRouter();
  const { cars: compareCarIds, removeCar, clearCars } = useCompareStore();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCars(); }, [compareCarIds]);

  const loadCars = async () => {
    if (compareCarIds.length === 0) { setLoading(false); return; }
    try {
      const results = await Promise.all(
        compareCarIds.map(c => api.getCar(c.id).then((r: any) => r.data || r).catch(() => null))
      );
      setCars(results.filter(Boolean));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const specRows = [
    { label: 'السعر', getValue: (c: Car) => formatPrice(c.price) },
    { label: 'الموديل', getValue: (c: Car) => c.year.toString() },
    { label: 'الكيلومترات', getValue: (c: Car) => formatDistance(c.kilometers) },
    { label: 'الوقود', getValue: (c: Car) => getFuelLabel(c.fuelType) },
    { label: 'ناقل الحركة', getValue: (c: Car) => getTransmissionLabel(c.transmission) },
    { label: 'نوع الهيكل', getValue: (c: Car) => getBodyTypeLabel(c.bodyType || '') },
    { label: 'الحالة', getValue: (c: Car) => getConditionLabel(c.condition || '') },
    { label: 'اللون', getValue: (c: Car) => c.color || '-' },
    { label: 'السعة', getValue: (c: Car) => c.engineCapacity ? `${c.engineCapacity} سي سي` : '-' },
    { label: 'الأسطوانات', getValue: (c: Car) => c.cylinders?.toString() || '-' },
    { label: 'المقاعد', getValue: (c: Car) => c.doors?.toString() || '-' },
    { label: 'الدفع', getValue: (c: Car) => c.drivetrain || '-' },
    { label: 'الضمان', getValue: (c: Car) => c.hasWarranty ? 'نعم' : 'لا' },
    { label: 'سجل الصيانة', getValue: (c: Car) => c.hasServiceHistory ? 'نعم' : 'لا' },
    { label: 'قابل للتفاوض', getValue: (c: Car) => c.isNegotiable ? 'نعم' : 'لا' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">مقارنة السيارات</Text>
        </View>
        {cars.length > 0 && (
          <TouchableOpacity onPress={clearCars} className="px-3 py-1.5 bg-red-100 dark:bg-red-500/20 rounded-lg">
            <Text className="text-red-600 dark:text-red-400 text-sm font-medium">مسح الكل</Text>
          </TouchableOpacity>
        )}
      </View>

      {cars.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="git-compare-outline" size={64} color="#D1D5DB" />
          <Text className="text-lg font-semibold text-gray-900 dark:text-white text-center mt-4 mb-2">لا توجد سيارات للمقارنة</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-4">أضف سيارات للمقارنة من صفحة التفاصيل</Text>
          <TouchableOpacity onPress={() => router.push('/cars')} className="bg-blue-600 px-6 py-3 rounded-xl">
            <Text className="text-white font-semibold">تصفح السيارات</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
          <View style={{ minWidth: width }}>
            <ScrollView>
              <View className="flex-row border-b border-gray-100 dark:border-gray-800 pb-3 px-4">
                <View className="w-32" />
                {cars.map((car) => (
                  <View key={car.id} className="items-center" style={{ width: (width - 128) / Math.min(cars.length, 3) }}>
                    <TouchableOpacity onPress={() => removeCar(car.id)} className="absolute -top-1 -left-1 z-10 w-6 h-6 rounded-full bg-red-500 items-center justify-center">
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                    <Image source={{ uri: car.coverImage || car.images?.[0]?.url || 'https://via.placeholder.com/100' }} className="w-20 h-16 rounded-lg mb-2" resizeMode="cover" />
                    <Text className="text-sm font-bold text-gray-900 dark:text-white text-center" numberOfLines={2}>{car.brand?.nameAr} {car.model?.nameAr}</Text>
                    <Text className="text-xs text-gray-500">{car.year}</Text>
                  </View>
                ))}
              </View>

              {specRows.map((row, i) => (
                <View key={i} className={`flex-row items-center px-4 py-3 ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                  <Text className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">{row.label}</Text>
                  {cars.map((car) => (
                    <Text key={car.id} className="text-sm text-gray-900 dark:text-white text-center" style={{ width: (width - 128) / Math.min(cars.length, 3) }}>
                      {row.getValue(car)}
                    </Text>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
