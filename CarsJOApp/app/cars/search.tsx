import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Car, Brand, City } from '../../types';
import CarGrid from '../../components/cars/CarGrid';

export default function CarSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; brandId?: string; cityId?: string }>();
  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [cars, setCars] = useState<Car[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(params.brandId);
  const [selectedCity, setSelectedCity] = useState<string | undefined>(params.cityId);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [transmission, setTransmission] = useState('');

  const loadCars = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.getCars({
        search: searchQuery || undefined,
        brandId: selectedBrand || undefined,
        cityId: selectedCity || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minYear: minYear ? Number(minYear) : undefined,
        maxYear: maxYear ? Number(maxYear) : undefined,
        fuelType: fuelType || undefined,
        transmission: transmission || undefined,
        status: 'APPROVED',
        limit: 30,
      });
      setCars(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedBrand, selectedCity, minPrice, maxPrice, minYear, maxYear, fuelType, transmission]);

  useEffect(() => {
    loadCars();
    api.getBrands().then((r: any) => setBrands(r.data || []));
    api.getCities().then((r: any) => setCities(r.data || []));
  }, []);

  const handleSearch = () => loadCars();

  const clearFilters = () => {
    setSelectedBrand(undefined);
    setSelectedCity(undefined);
    setMinPrice('');
    setMaxPrice('');
    setMinYear('');
    setMaxYear('');
    setFuelType('');
    setTransmission('');
    setTimeout(loadCars, 0);
  };

  const hasFilters = selectedBrand || selectedCity || minPrice || maxPrice || minYear || maxYear || fuelType || transmission;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearch} placeholder="ابحث عن سيارة..." placeholderTextColor="#9CA3AF" className="flex-1 mr-2 text-base text-gray-900 dark:text-white" style={{ fontSize: 16 }} />
        </View>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} className={`w-9 h-9 rounded-full items-center justify-center ${showFilters || hasFilters ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
          <Ionicons name="options" size={18} color={showFilters || hasFilters ? '#fff' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <ScrollView className="px-4 pb-3" showsVerticalScrollIndicator={false}>
          <View className="mb-3">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">العلامة التجارية</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity onPress={() => setSelectedBrand(undefined)} className={`px-3 py-1.5 rounded-full mr-2 ${!selectedBrand ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Text className={`text-xs font-medium ${!selectedBrand ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>الكل</Text>
              </TouchableOpacity>
              {brands.map(brand => (
                <TouchableOpacity key={brand.id} onPress={() => setSelectedBrand(brand.id)} className={`px-3 py-1.5 rounded-full mr-2 ${selectedBrand === brand.id ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Text className={`text-xs font-medium ${selectedBrand === brand.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{brand.nameAr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر من</Text>
              <TextInput value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" placeholder="0" placeholderTextColor="#9CA3AF" className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-base text-gray-900 dark:text-white" style={{ fontSize: 16 }} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر إلى</Text>
              <TextInput value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" placeholder="..." placeholderTextColor="#9CA3AF" className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-base text-gray-900 dark:text-white" style={{ fontSize: 16 }} />
            </View>
          </View>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السنة من</Text>
              <TextInput value={minYear} onChangeText={setMinYear} keyboardType="numeric" placeholder="2010" placeholderTextColor="#9CA3AF" className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-base text-gray-900 dark:text-white" style={{ fontSize: 16 }} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السنة إلى</Text>
              <TextInput value={maxYear} onChangeText={setMaxYear} keyboardType="numeric" placeholder="2024" placeholderTextColor="#9CA3AF" className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-base text-gray-900 dark:text-white" style={{ fontSize: 16 }} />
            </View>
          </View>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الوقود</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['', 'BENZINE', 'DIESEL', 'HYBRID', 'ELECTRIC'].map(ft => (
                  <TouchableOpacity key={ft} onPress={() => setFuelType(ft)} className={`px-3 py-1.5 rounded-full mr-2 ${fuelType === ft ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Text className={`text-xs font-medium ${fuelType === ft ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{ft === '' ? 'الكل' : ft === 'BENZINE' ? 'بنزين' : ft === 'DIESEL' ? 'ديزل' : ft === 'HYBRID' ? 'هايبرد' : 'كهرباء'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View className="flex-row gap-3 mb-2">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ناقل الحركة</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['', 'MANUAL', 'AUTOMATIC'].map(t => (
                  <TouchableOpacity key={t} onPress={() => setTransmission(t)} className={`px-3 py-1.5 rounded-full mr-2 ${transmission === t ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Text className={`text-xs font-medium ${transmission === t ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{t === '' ? 'الكل' : t === 'MANUAL' ? 'يدوي' : 'أوتوماتيك'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity onPress={handleSearch} className="flex-1 bg-blue-600 py-3 rounded-xl items-center"><Text className="text-white font-semibold">بحث</Text></TouchableOpacity>
            {hasFilters && <TouchableOpacity onPress={clearFilters} className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl items-center"><Text className="text-gray-600 dark:text-gray-400 font-semibold">مسح الفلاتر</Text></TouchableOpacity>}
          </View>
        </ScrollView>
      )}

      <View className="flex-1">
        <Text className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{cars.length} نتيجة</Text>
        <CarGrid cars={cars} onCarPress={(car) => router.push(`/cars/${car.id}`)} loading={loading} />
      </View>
    </SafeAreaView>
  );
}
