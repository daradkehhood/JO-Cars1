import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { formatPrice } from '../lib/utils';
import Button from '../components/ui/Button';

export default function ResaleValueScreen() {
  const router = useRouter();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [km, setKm] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
    if (!brand || !model || !year || !price) return;
    setLoading(true);
    try {
      const res = await api.resaleValue({ brand, model, year: Number(year), kilometers: Number(km) || 0, originalPrice: Number(price) });
      setResult(res.data || res);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">قيمة إعادة البيع</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">العلامة التجارية</Text>
          <TextInput value={brand} onChangeText={setBrand} placeholder="Toyota" placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white mb-3" style={{ fontSize: 16 }} />
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الموديل</Text>
          <TextInput value={model} onChangeText={setModel} placeholder="Corolla" placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white mb-3" style={{ fontSize: 16 }} />
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">السنة</Text>
          <TextInput value={year} onChangeText={setYear} keyboardType="numeric" placeholder="2020" placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white mb-3" style={{ fontSize: 16 }} />
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الكيلومترات</Text>
          <TextInput value={km} onChangeText={setKm} keyboardType="numeric" placeholder="50000" placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white mb-3" style={{ fontSize: 16 }} />
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">السعر الأصلي (د.أ)</Text>
          <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="15000" placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white" style={{ fontSize: 16 }} />
        </View>
        <Button title={loading ? 'جاري الحساب...' : 'احسب القيمة'} onPress={calculate} loading={loading} fullWidth size="lg" />

        {result && (
          <View className="mt-6 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-2xl p-5">
            <Text className="text-white/70 text-sm mb-1">القيمة الحالية المقدرة</Text>
            <Text className="text-white text-3xl font-extrabold mb-4">{formatPrice(result.estimatedValue || result.value || 0)}</Text>
            <View className="flex-row justify-between">
              <View><Text className="text-white/70 text-xs">نسبة الاهتلاك</Text><Text className="text-white font-bold">{result.depreciationRate || '-'}%</Text></View>
              <View><Text className="text-white/70 text-xs">القيمة بعد سنة</Text><Text className="text-white font-bold">{formatPrice(result.afterOneYear || 0)}</Text></View>
            </View>
          </View>
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
