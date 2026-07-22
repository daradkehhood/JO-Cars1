import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const CATEGORIES = [
  { key: 'OIL_CHANGE', label: 'تغيير زيت' }, { key: 'TIRES', label: 'إطارات' },
  { key: 'BRAKES', label: 'فرامل' }, { key: 'BATTERY', label: 'بطارية' },
  { key: 'ENGINE', label: 'محرك' }, { key: 'TRANSMISSION', label: 'ناقل حركة' },
  { key: 'ELECTRICAL', label: 'كهرباء' }, { key: 'BODYWORK', label: 'دهان/هيكل' },
  { key: 'AC', label: 'تكييف' }, { key: 'SUSPENSION', label: 'تعليق' },
  { key: 'GENERAL', label: 'صيانة عامة' }, { key: 'OTHER', label: 'أخرى' },
];

export default function AddMaintenanceScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!isAuthenticated) router.replace('/auth/login'); }, []);

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('خطأ', 'العنوان مطلوب'); return; }
    setLoading(true);
    try {
      await api.createMaintenance({ title: title.trim(), description: description.trim() || undefined, category, price: price ? Number(price) : undefined, phone: phone.trim() || undefined });
      Alert.alert('نجاح', 'تم إضافة الخدمة بنجاح', [{ text: 'حسناً', onPress: () => router.back() }]);
    } catch (error: any) { Alert.alert('خطأ', error.message || 'فشل الإضافة'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">إضافة خدمة صيانة</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Input label="عنوان الخدمة *" value={title} onChangeText={setTitle} placeholder="مثال: تغيير زيت شامل" />
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">التصنيف *</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.key} onPress={() => setCategory(c.key)} className={`px-3 py-1.5 rounded-full ${category === c.key ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <Text className={`text-xs font-medium ${category === c.key ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input label="السعر (د.أ)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="اختياري" />
        <Input label="رقم الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="07XXXXXXXX" />
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الوصف</Text>
          <TextInput value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder="اكتب وصفاً للخدمة..." placeholderTextColor="#9CA3AF" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white min-h-[120px]" style={{ fontSize: 16 }} />
        </View>
        <Button title="إضافة الخدمة" onPress={handleSubmit} loading={loading} fullWidth size="lg" />
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
