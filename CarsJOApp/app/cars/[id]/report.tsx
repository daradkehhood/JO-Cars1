import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import Button from '../../../components/ui/Button';

const REPORT_REASONS = [
  { key: 'SPAM', label: 'رسالة مزعجة' },
  { key: 'FRAUD', label: 'احتيال' },
  { key: 'WRONG_INFO', label: 'معلومات خاطئة' },
  { key: 'SOLD', label: 'السيارة مباعة' },
  { key: 'DUPLICATE', label: 'إعلان مكرر' },
  { key: 'INAPPROPRIATE', label: 'محتوى غير لائق' },
  { key: 'OVERPRICED', label: 'سعر غير منطقي' },
  { key: 'OTHER', label: 'أخرى' },
];

export default function CarReportScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="arrow-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">الإبلاغ</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-500 mb-4">سجّل دخولك للإبلاغ</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')} className="bg-blue-600 px-6 py-3 rounded-xl"><Text className="text-white font-semibold">تسجيل الدخول</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    if (!reason) { Alert.alert('خطأ', 'اختر سبب الإبلاغ'); return; }
    setLoading(true);
    try {
      await api.reportCar(id!, reason, description);
      Alert.alert('شكراً', 'تم استلام البلاغ وسنراجعه', [{ text: 'حسناً', onPress: () => router.back() }]);
    } catch (error: any) { Alert.alert('خطأ', error.message || 'فشل الإبلاغ'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">الإبلاغ عن الإعلان</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">سبب الإبلاغ *</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {REPORT_REASONS.map(r => (
            <TouchableOpacity key={r.key} onPress={() => setReason(r.key)} className={`px-3 py-2 rounded-xl ${reason === r.key ? 'bg-red-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <Text className={`text-sm font-medium ${reason === r.key ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">تفاصيل إضافية</Text>
        <TextInput value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder="اكتب تفاصيل إضافية (اختياري)..." placeholderTextColor="#9CA3AF" className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white min-h-[120px] mb-6" style={{ fontSize: 16 }} />

        <Button title="إرسال البلاغ" onPress={handleSubmit} loading={loading} variant="danger" fullWidth size="lg" />
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
